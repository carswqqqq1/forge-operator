import test from "node:test";
import assert from "node:assert/strict";

test("shared package smoke test", () => {
  assert.equal(typeof "forge", "string");
});
