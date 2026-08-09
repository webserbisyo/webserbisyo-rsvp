import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("event website content contract supports every built-in event type", () => {
  const types = source("src/lib/event-website/types.ts");
  const schema = source("src/lib/validations/event-website.schema.ts");
  assert.match(types, /"wedding",\s*"birthday",\s*"debut",\s*"baptism"/s);
  assert.match(schema, /z\.enum\(eventWebsiteContentEventTypes\)/);
  assert.match(schema, /z\.discriminatedUnion\("kind"/);
});

test("target presets are event-aware and avoid Wedding host fields", () => {
  const defaults = source("src/lib/event-website/defaults.ts");
  for (const builder of [
    "buildDefaultBirthdayEventWebsiteContent",
    "buildDefaultDebutEventWebsiteContent",
    "buildDefaultBaptismEventWebsiteContent",
  ])
    assert.match(defaults, new RegExp(`function ${builder}`));
  assert.match(defaults, /celebrantName: ""/);
  assert.match(defaults, /debutantName: ""/);
  assert.match(defaults, /childName: ""/);
  assert.match(defaults, /eighteen_roses_candles: \{ groups: \[\] \}/);
  assert.match(defaults, /godparents: \{ groups: \[\] \}/);
});

test("hydration and saving select defaults by event type", () => {
  const hydration = source("src/lib/event-website/hydration.ts");
  assert.match(
    hydration,
    /buildDefaultEventWebsiteContent\(context\.event\?\.eventType, context\)/,
  );
  assert.match(hydration, /buildDefaultEventWebsiteContent\(eventType\)/);
});

test("renderer has target host and special-section routes", () => {
  const renderer = source("src/components/event-website/event-website-renderer.tsx");
  assert.match(renderer, /hostInfo\.kind !== "wedding"/);
  assert.match(renderer, /eighteen_roses_candles/);
  assert.match(renderer, /debut_court/);
  assert.match(renderer, /godparents/);
});
