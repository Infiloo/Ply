import test from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG_MAGIC,
  SERVER_MAGIC,
  configCodeSize,
  createDefaultConfig,
  decodeConfig,
  decodeServerMap,
  encodeConfig,
  encodeServerMap,
  fromWire,
  normalizeConfig,
  toWire,
} from "../src/index.js";

function configuredConfig() {
  const config = createDefaultConfig();
  config.identity.botName = "Acme Tickets";
  config.identity.accentColor = "#22C55E";
  config.panel.channelId = "111111111111111111";
  config.panel.title = "Need a hand?";
  config.permissions.adminRoleIds = ["222222222222222222"];
  config.permissions.staffRoleIds = ["333333333333333333"];
  config.defaults.categoryId = "444444444444444444";
  config.defaults.supportChannelId = "555555555555555555";
  config.behavior.notifyStaff = true;
  config.ticketTypes[0].messageOverrides.welcome = {
    title: "Welcome aboard",
    description: "Hey {user}, we'll be right with you.",
  };
  config.ticketTypes[1].questions.push({
    id: "extra",
    label: "Extra",
    question: "Anything else we should know?",
    imageUrl: "",
    thumbnailUrl: "",
    required: false,
  });
  return config;
}

test("an untouched config encodes to a tiny payload", async () => {
  const code = await encodeConfig(createDefaultConfig());
  assert.ok(code.startsWith(CONFIG_MAGIC));
  assert.ok(configCodeSize(code) < 80, `expected < 80 bytes, got ${configCodeSize(code)}`);
  assert.deepEqual(toWire(createDefaultConfig()), {});
});

test("config roundtrip keeps every customized value", async () => {
  const original = configuredConfig();
  const code = await encodeConfig(original);
  const decoded = await decodeConfig(code);

  assert.equal(decoded.identity.botName, "Acme Tickets");
  assert.equal(decoded.identity.accentColor, "#22C55E");
  assert.equal(decoded.panel.channelId, "111111111111111111");
  assert.deepEqual(decoded.permissions.adminRoleIds, ["222222222222222222"]);
  assert.deepEqual(decoded.permissions.staffRoleIds, ["333333333333333333"]);
  assert.equal(decoded.ticketTypes[0].messageOverrides.welcome.title, "Welcome aboard");
  assert.equal(decoded.ticketTypes[1].questions.at(-1).label, "Extra");
  assert.equal(decoded.ticketTypes[1].questions.at(-1).required, false);
});

test("a realistic customized config stays well below the modal limit", async () => {
  const code = await encodeConfig(configuredConfig());
  const size = configCodeSize(code);
  assert.ok(size < 1400, `expected < 1400 bytes, got ${size}`);
});

test("the codec accepts pasted fences and raw wire JSON", async () => {
  const code = await encodeConfig(configuredConfig());
  const fenced = `\`\`\`txt\n${code}\n\`\`\``;
  const fromFence = await decodeConfig(fenced);
  assert.equal(fromFence.identity.botName, "Acme Tickets");

  const wire = JSON.stringify(toWire(configuredConfig()));
  const fromJson = await decodeConfig(wire);
  assert.equal(fromJson.identity.botName, "Acme Tickets");
});

test("the codec rejects the wrong payload type and garbage", async () => {
  await assert.rejects(() => decodeConfig("PLYSRV1:abc"), /server export/i);
  await assert.rejects(() => decodeConfig("nonsense"), /format/i);
  await assert.rejects(() => decodeConfig(CONFIG_MAGIC + "not-gzip"), /unpack/i);
});

test("normalizeConfig fills defaults and clamps numbers", () => {
  const config = normalizeConfig({
    timing: { prepMinSeconds: -5, prepMaxSeconds: 400 },
    identity: { accentColor: "not-a-color" },
    ticketTypes: [
      { name: "Broken", mode: "questions", questions: [{ question: "" }] },
    ],
  });

  assert.equal(config.identity.accentColor, "#7C5CFC");
  assert.equal(config.timing.prepMinSeconds, 0);
  assert.equal(config.timing.prepMaxSeconds, 120);
  assert.equal(config.ticketTypes.length, 1);
  assert.equal(config.ticketTypes[0].questions.length, 0);
});

test("normalization deduplicates type and question IDs", () => {
  const config = normalizeConfig({
    ticketTypes: [
      { id: "same", name: "One" },
      { id: "same", name: "Two" },
      {
        id: "three",
        name: "Three",
        mode: "questions",
        questions: [
          { id: "dup", question: "First?" },
          { id: "dup", question: "Second?" },
        ],
      },
    ],
  });

  assert.deepEqual(
    config.ticketTypes.map((type) => type.id),
    ["same", "same-2", "three"],
  );
  assert.deepEqual(
    config.ticketTypes[2].questions.map((question) => question.id),
    ["dup", "dup-2"],
  );
});

test("server map roundtrip keeps channels and roles", async () => {
  const server = {
    guild: { id: "1", name: "Test Guild", icon: "abc" },
    channels: [
      { id: "10", name: "support", type: "text", parentId: "9", parentName: "Tickets", position: 3 },
      { id: "9", name: "Tickets", type: "category", parentId: "", parentName: "", position: 1 },
    ],
    roles: [
      { id: "20", name: "Staff", color: "#22C55E", position: 4, managed: false },
    ],
  };

  const code = await encodeServerMap(server);
  assert.ok(code.startsWith(SERVER_MAGIC));

  const decoded = await decodeServerMap(code);
  assert.equal(decoded.guild.name, "Test Guild");
  assert.equal(decoded.channels.length, 2);
  assert.equal(decoded.channels[0].parentName, "Tickets");
  assert.equal(decoded.roles[0].name, "Staff");
});

test("the wire format is reversible before compression", () => {
  const wire = toWire(configuredConfig());
  const restored = fromWire(wire);
  assert.equal(restored.panel.title, "Need a hand?");
  assert.equal(restored.behavior.notifyStaff, true);
  assert.equal(
    restored.ticketTypes[0].messageOverrides.welcome.description,
    "Hey {user}, we'll be right with you.",
  );
});
