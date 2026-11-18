import { test } from "node:test";
import assert from "node:assert/strict";
import { genshin } from "../src/lib/data/genshin.ts";
import { emberfall } from "../src/lib/data/emberfall.ts";
import { neighborhoodFrom, traceFrom, visibleClaims, visibleEntityIds, verdictOf } from "../src/lib/lore.ts";

test("every universe has a sourced, spoiler-gated main-story path", () => {
  for (const universe of [genshin, emberfall]) {
    assert.ok(universe.story.length > 0);
    const entities = new Set(universe.entities.map((entity) => entity.id));
    const sources = new Map(universe.sources.map((source) => [source.id, source]));
    const stages = new Set(universe.stages.map((stage) => stage.order));
    for (const step of universe.story) {
      assert.ok(entities.has(step.entityId), step.id);
      assert.ok(stages.has(step.stage), step.id);
      assert.ok(visibleEntityIds(universe, step.stage).has(step.entityId), step.id);
      assert.ok(step.sourceIds.length > 0);
      for (const sourceId of step.sourceIds) assert.ok(sources.get(sourceId)?.stage <= step.stage);
    }
    for (const claim of universe.claims) {
      assert.ok(entities.has(claim.subject) && entities.has(claim.object), claim.id);
      assert.ok(stages.has(claim.stage), claim.id);
      assert.ok(claim.sourceIds.length > 0, claim.id);
      for (const sourceId of claim.sourceIds) assert.ok(sources.get(sourceId)?.stage <= claim.stage, claim.id);
    }
    for (const collection of [universe.entities, universe.claims, universe.sources, universe.story]) {
      assert.equal(new Set(collection.map((item) => item.id)).size, collection.length);
    }
  }
});

test("Genshin starts with no visible claims or entity names", () => {
  assert.equal(visibleClaims(genshin, genshin.initialProgress).length, 0);
  assert.equal(visibleEntityIds(genshin, genshin.initialProgress).size, 0);
});

test("Mondstadt acts preserve their real shared release, not invented patch dates", () => {
  assert.ok(genshin.story.every((step) => step.stage === 0));
  assert.ok(genshin.claims.every((claim) => claim.stage === 0 && claim.when === undefined));
  assert.equal(visibleClaims(genshin, 0).length, genshin.claims.length);
  assert.equal(genshin.storyComplete, false);
  assert.equal(genshin.theories.length, 0);
});

test("a neighborhood includes arrows in both directions and bounds its depth", () => {
  const arrows = [{ subject: "a", object: "b" }, { subject: "c", object: "a" }, { subject: "b", object: "d" }];
  assert.deepEqual([...neighborhoodFrom(arrows, "a", 1)].sort(), ["a", "b", "c"]);
  assert.deepEqual([...neighborhoodFrom(arrows, "a", 2)].sort(), ["a", "b", "c", "d"]);
});

test("cycles and parallel claims cannot expand a neighborhood forever", () => {
  const arrows = [{ subject: "a", object: "b" }, { subject: "b", object: "a" }, { subject: "a", object: "b" }];
  assert.deepEqual([...neighborhoodFrom(arrows, "a", 5)].sort(), ["a", "b"]);
  assert.deepEqual([...neighborhoodFrom([], "isolated", 2)], ["isolated"]);
});

test("locked claims cannot bring a hidden entity into a neighborhood", () => {
  const launch = neighborhoodFrom(visibleClaims(emberfall, 0), "crown", 2);
  assert.ok(!launch.has("ilen"));
  assert.ok(!launch.has("wick"));
  assert.ok(neighborhoodFrom(visibleClaims(emberfall, 3), "crown", 1).has("wick"));
});

test("directional trace keeps upstream and downstream separate", () => {
  const arrows = [{ id: "1", subject: "a", object: "b" }, { id: "2", subject: "b", object: "c" }, { id: "3", subject: "c", object: "d" }];
  const trace = traceFrom(arrows, "b", 1);
  assert.deepEqual([...trace.upstream], ["a"]);
  assert.deepEqual([...trace.downstream], ["c"]);
  assert.deepEqual([...trace.claimIds].sort(), ["1", "2"]);
});

test("a verdict stays open until its evidence release is unlocked", () => {
  const claim = emberfall.theories[0].claims[0];
  assert.equal(verdictOf(emberfall, claim, 1), "open");
  assert.equal(verdictOf(emberfall, claim, 2), "partial");
});
