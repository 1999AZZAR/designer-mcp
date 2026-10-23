import assert from "node:assert/strict";
import {
  SERVER_NAME,
  TOOL_SIDE_EFFECTS,
  isEnvelopeEnabled,
  wrapResult,
  wrapError,
  textResult,
  errorResult,
  appendWarning,
} from "../src/envelope.ts";

const KEYS = [
  "ok",
  "summary",
  "data",
  "artifacts",
  "provenance",
  "warnings",
  "sideEffects",
  "execution",
  "redaction",
];
let n = 0;
const t = (name, fn) => {
  fn();
  n++;
  console.log(`ok ${n} - ${name}`);
};

delete process.env["HELA_ENVELOPE"];
t("flag off by default", () => assert.equal(isEnvelopeEnabled(), false));
t("off-mode textResult passes text through byte-identical", () => {
  const r = textResult("generate_rules", "RULES...");
  assert.equal(r.content[0].text, "RULES...");
});
t("off-mode errorResult preserves legacy Error: text", () => {
  const r = errorResult("generate_rules", "boom");
  assert.equal(r.isError, true);
  assert.equal(r.content[0].text, "Error: boom");
});

process.env["HELA_ENVELOPE"] = "true";
t("on-mode envelope has all 9 keys", () => {
  const env = JSON.parse(
    textResult("generate_rules", "RULES...").content[0].text,
  );
  for (const k of KEYS) assert.ok(k in env, `missing ${k}`);
  assert.equal(env.ok, true);
  assert.equal(env.data, "RULES...");
  assert.equal(env.execution.serverName, SERVER_NAME);
  assert.equal(env.execution.toolName, "generate_rules");
});
t("on-mode error envelope", () => {
  const r = errorResult("generate_rules", "boom");
  assert.equal(r.isError, true);
  const env = JSON.parse(r.content[0].text);
  assert.equal(env.ok, false);
  assert.equal(env.error, "boom");
});
const LOGO_TOOLS = Object.entries(TOOL_SIDE_EFFECTS).filter(([t]) =>
  t.startsWith("logo_"),
);
const PURE_TOOLS = Object.entries(TOOL_SIDE_EFFECTS).filter(
  ([t]) => !t.startsWith("logo_") && !t.startsWith("stitch_"),
);
const STITCH_TOOLS = Object.entries(TOOL_SIDE_EFFECTS).filter(([t]) =>
  t.startsWith("stitch_"),
);
t("design tools declare no side effects (pure generation)", () => {
  assert.equal(PURE_TOOLS.length, 21);
  for (const [tool, se] of PURE_TOOLS) assert.deepEqual(se, [], tool);
});
t("logo_workflow declares process:exec and file:write", () => {
  assert.equal(LOGO_TOOLS.length, 1);
  assert.deepEqual(TOOL_SIDE_EFFECTS["logo_workflow"], [
    "process:exec",
    "file:write",
  ]);
});
t("run/step ids propagate", () => {
  process.env["HELA_RUN_ID"] = "r1";
  process.env["HELA_STEP_ID"] = "s2";
  const env = wrapResult("list_options", "x");
  assert.equal(env.execution.run_id, "r1");
  assert.equal(env.execution.step_id, "s2");
  assert.equal(wrapError("list_options", "e").execution.run_id, "r1");
});

t("all 6 stitch_* tools declare side-effects correctly", () => {
  assert.equal(STITCH_TOOLS.length, 6);
  assert.deepEqual(TOOL_SIDE_EFFECTS["stitch_screen_audit"], []);
  assert.ok(TOOL_SIDE_EFFECTS["stitch_sync_design_system"].includes("file:write"));
  assert.ok(TOOL_SIDE_EFFECTS["stitch_create"].includes("process:exec"));
  assert.ok(TOOL_SIDE_EFFECTS["stitch_create"].includes("file:write"));
  assert.ok(TOOL_SIDE_EFFECTS["stitch_resource"].includes("process:exec"));
  assert.ok(TOOL_SIDE_EFFECTS["stitch_resource"].includes("file:write"));
});
t("raw-mode appendWarning preserves payload and appends a warning block", () => {
  process.env["HELA_ENVELOPE"] = "false";
  const r = appendWarning(textResult("palette", "DATA"), "legacy alias");
  assert.equal(r.content[0].text, "DATA");
  assert.equal(r.content[1].text, "Warning: legacy alias");
});
t("envelope-mode appendWarning populates warnings[]", () => {
  process.env["HELA_ENVELOPE"] = "true";
  const r = appendWarning(textResult("palette", "DATA"), "legacy alias");
  const env = JSON.parse(r.content[0].text);
  assert.deepEqual(env.warnings, ["legacy alias"]);
});
t("appendWarning is a no-op without a warning", () => {
  process.env["HELA_ENVELOPE"] = "false";
  const r = textResult("palette", "DATA");
  assert.equal(appendWarning(r).content.length, 1);
});

console.log(`\n${n} tests passed`);
