import test from "node:test";
import assert from "node:assert/strict";
import { emberfall } from "../src/lib/data/emberfall.ts";
import { genshin } from "../src/lib/data/genshin.ts";
import { connectionLayout, fitCamera, project, streamLayout } from "../src/lib/spatial.ts";
import { evidenceUrl, previewKind } from "../src/lib/evidence.ts";

test("the story spine follows step order and places connected lore in depth", () => {
  for (const universe of [emberfall, genshin]) {
    const layout = streamLayout(universe, "story");
    const spine = universe.story.map((step) => layout.get(step.entityId));
    for (const [index, point] of spine.entries()) {
      assert.equal(point.y, 0);
      assert.equal(point.z, 0);
      if (index) assert.ok(point.x > spine[index - 1].x);
    }
    assert.ok([...layout.values()].some(({ z }) => z !== 0));
  }
});

test("both layouts fit points on a phone and orbit changes the perspective", () => {
  const size = { width: 390, height: 608 };
  const layouts = [streamLayout(genshin, "story"), connectionLayout(genshin)];
  for (const [index, layout] of layouts.entries()) {
    const points = [...layout.values()];
    const camera = fitCamera(points, index === 0, size);
    for (const point of points) {
      const projected = project(point, camera, size);
      assert.ok(projected.x > 0 && projected.x < size.width && projected.y > 0 && projected.y < size.height);
    }
    const point = points[0];
    assert.notDeepEqual(project(point, camera, size), project(point, { ...camera, yaw: camera.yaw + 0.5 }, size));
  }
});

test("links reject non-web schemes and embedded passwords", () => {
  assert.equal(evidenceUrl(" https://example.org/clip "), "https://example.org/clip");
  for (const url of ["javascript:alert(1)", "data:text/html,input", "file:///local", "https://user:pass@example.org"]) {
    assert.throws(() => evidenceUrl(url));
  }
});

test("only approved media types preview and active formats get download treatment", () => {
  assert.equal(previewKind("image/png"), "image");
  assert.equal(previewKind("video/webm"), "video");
  assert.equal(previewKind("audio/mpeg"), "audio");
  for (const mime of ["image/svg+xml", "text/html", "application/pdf", ""]) {
    assert.equal(previewKind(mime), "download");
  }
});
