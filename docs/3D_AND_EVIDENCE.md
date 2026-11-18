# 3D views and claim evidence

## Explore lore

- **Time stream** follows the main story in the order shown on the left.
  **Release order** groups story milestones by when they became available.
  The orange line guides navigation. Select a milestone or use **Next story
  step** and **Previous story step** to follow the story. **Side lore** appears
  when the current release includes curated side claims. Emberfall's
  `1.2 · Lanterns` is an example.
- **Connection map** shows the same unlocked claims as 3D points and links.
  Select a point to inspect its incoming and outgoing claims. Select an arrow
  to open the corresponding claim if it is canon. Use **Focus connections**
  to see one or two links around the selected entity.
- Drag an empty area to orbit. Shift-drag pans. Scroll, pinch, or use the
  zoom buttons. **Reset** fits the visible points. With the scene focused,
  the arrow keys orbit, plus and minus zoom, and Home resets the camera.
  Tab reaches visible points and their buttons open the trace.

Both views respect the active universe, spoiler shield, and filters. Search
and story navigation jump to the selected point. When using a phone, switch
between the board, main story, and trace with the bottom tabs.

## Attach evidence

1. Select an entity and find a canon claim under **Came from** or **Leads to**.
2. Select **View or attach evidence** and choose **File** or **Link**.
3. Add an optional title and a note or timestamp, then choose **Attach
   evidence**. You can download or remove saved files from the same claim.

Files can be up to 50 MiB each. Common images, videos, and audio preview
where the browser supports their codecs. Documents, transcripts, and other
files are available for download. Web links accept HTTP and HTTPS and open
when clicked. Use links for long videos or clips beyond the file limit.

Attachments persist in the current browser and site address. They have no
cross-device sync or shared access. Clearing the browser's site data can
remove them. The spoiler shield controls where attachments appear based on
their claim. A user-provided attachment can still contain later spoilers.

## Maintain the feature

Mark a sourced canon branch with `track: "side"` on its claim. Existing
claims default to main story. A main story milestone belongs in
`Universe.story`. A branch can share a main-story entity, and its own
entities are hidden when the branch is switched off unless another visible
claim or milestone references them.

`src/lib/spatial.ts` sets the 3D positions and camera projection. The
connection map runs a force layout for up to 180 entities and uses a stable
sphere above that threshold. The full graph still needs grouping or
rendering limits for very large datasets. The map displays authored claims.

`src/lib/evidence.ts` opens IndexedDB database `histhoria-evidence`, version
1. `attachments` uses an ID key and an index on `[universeId, claimId]`.
Each record stores a URL or Blob, title, optional locator text, and creation
time. Previews use object URLs released when their preview closes. Existing
progress and theories keep their previous localStorage keys and format.
