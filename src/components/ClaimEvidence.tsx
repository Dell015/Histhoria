"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { evidenceUrl, listEvidence, maxEvidenceBytes, previewKind, removeEvidence, saveEvidence, type Evidence } from "@/lib/evidence";

const inputClass = "w-full border border-line bg-bg px-2 py-2 text-sm text-ink placeholder:text-muted";

function FilePreview({ entry }: { entry: Extract<Evidence, { kind: "file" }> }) {
  const media = useRef<HTMLImageElement | HTMLVideoElement | HTMLAudioElement | null>(null);
  const download = useRef<HTMLAnchorElement>(null);
  const kind = previewKind(entry.blob.type);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(kind === "download" ? entry.blob.slice(0, entry.blob.size, "application/octet-stream") : entry.blob);
    if (media.current) media.current.src = objectUrl;
    if (download.current) download.current.href = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [entry, kind]);
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element -- Browser-local Blob previews cannot use Next image optimization. */}
    {kind === "image" && <img ref={(element) => { media.current = element; }} alt={entry.title} loading="lazy" className="mt-2 max-h-48 w-full bg-black object-contain" />}
    {kind === "video" && <video ref={(element) => { media.current = element; }} controls playsInline preload="metadata" aria-label={entry.title} className="mt-2 max-h-48 w-full bg-black" />}
    {kind === "audio" && <audio ref={(element) => { media.current = element; }} controls preload="metadata" aria-label={entry.title} className="mt-2 w-full" />}
    <a ref={download} download={entry.filename} className="mt-2 inline-block text-[11px] text-ember underline underline-offset-2">Download file</a>
  </>;
}

export function ClaimEvidence({ universeId, claimId }: { universeId: string; claimId: string }) {
  const [entries, setEntries] = useState<Evidence[]>([]);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    listEvidence(universeId, claimId).then((saved) => {
      if (!active) return;
      setEntries(saved);
      setReady(true);
    }, () => {
      if (active) setError("Attachments are unavailable. Check this browser’s storage settings.");
    });
    return () => { active = false; };
  }, [claimId, universeId]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = String(fields.get("title") ?? "").trim();
    const note = String(fields.get("note") ?? "").trim();
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const common = { id, universeId, claimId, note, createdAt: Date.now() };
    let entry: Evidence;
    if (mode === "link") {
      try {
        const url = evidenceUrl(String(fields.get("url") ?? ""));
        entry = { ...common, kind: "link", url, title: title || new URL(url).hostname };
      } catch {
        setError("Enter an HTTP or HTTPS link without login credentials.");
        return;
      }
    } else {
      const file = fields.get("file");
      if (!(file instanceof File) || file.size === 0 || file.size > maxEvidenceBytes) {
        setError("Choose a nonempty file up to 50 MiB.");
        return;
      }
      entry = { ...common, kind: "file", blob: file, filename: file.name, title: title || file.name };
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await saveEvidence(entry);
      setEntries((current) => [...current, entry]);
      form.reset();
      setStatus("Attachment saved.");
    } catch {
      setError("Couldn’t save the attachment. Check available browser storage and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await removeEvidence(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
      setStatus("Attachment removed.");
    } catch {
      setError("Couldn’t remove the attachment. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="Claim evidence" className="mt-3 border-t border-line pt-3">
    <h3 className="eyebrow !text-ink">Your evidence · {entries.length}</h3>
    <p className="mt-1 text-[11px] text-muted">Saved in this browser. Any attachment may contain spoilers for this claim.</p>
    <ul className="mt-2 grid gap-2">
      {entries.map((entry) => <li key={entry.id} className="min-w-0 border border-line bg-bg p-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          {entry.kind === "link"
            ? <a href={entry.url} target="_blank" rel="noreferrer" className="break-all text-xs text-ember underline">{entry.title} ↗</a>
            : <span className="break-all text-xs text-ink">{entry.title}</span>}
          <button type="button" disabled={busy} onClick={() => void remove(entry.id)} aria-label={`Remove ${entry.title}`}
            className="shrink-0 text-[10px] text-muted hover:text-contra">Remove</button>
        </div>
        {entry.note && <p className="mt-1 break-words text-[11px] text-muted">{entry.note}</p>}
        {entry.kind === "file" && <FilePreview entry={entry} />}
      </li>)}
    </ul>
    <form onSubmit={add} className="mt-3 space-y-2">
      <div className="flex gap-2" role="group" aria-label="Attachment type">
        {(["file", "link"] as const).map((kind) => <button key={kind} type="button" disabled={busy}
          onClick={() => { setMode(kind); setError(""); }} aria-pressed={mode === kind}
          className={`min-h-8 border px-2 text-xs ${mode === kind ? "border-ember text-ember" : "border-line text-muted"}`}>
          {kind === "file" ? "File" : "Link"}
        </button>)}
      </div>
      {mode === "file"
        ? <input key="file" name="file" aria-label="Evidence file" type="file" required disabled={busy} className={inputClass} />
        : <input key="url" name="url" aria-label="Evidence URL" type="url" placeholder="https://…" required disabled={busy} className={inputClass} />}
      <input name="title" aria-label="Evidence title" placeholder="Title (optional)" maxLength={120} disabled={busy} className={inputClass} />
      <input name="note" aria-label="Evidence note" placeholder="Note or timestamp (optional)" maxLength={350} disabled={busy} className={inputClass} />
      {mode === "file" && <p className="text-[10px] text-muted">Images, short clips, audio, or other files up to 50 MiB.</p>}
      <button disabled={!ready || busy} type="submit" className="atlas-button atlas-primary w-full">
        {busy ? "Saving…" : "Attach evidence"}
      </button>
      {error && <p role="alert" className="text-xs text-contra">{error}</p>}
      {status && <p role="status" className="text-xs text-theory">{status}</p>}
    </form>
  </section>;
}
