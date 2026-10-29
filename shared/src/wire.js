import {
  ASSET_KEYS,
  createDefaultConfig,
  DEFAULT_ASSETS,
  DEFAULT_BEHAVIOR,
  DEFAULT_DEFAULTS,
  DEFAULT_IDENTITY,
  DEFAULT_LABELS,
  DEFAULT_MESSAGES,
  DEFAULT_PANEL,
  DEFAULT_TIMING,
  MESSAGE_KEYS,
} from "./defaults.js";
import { normalizeConfig } from "./normalize.js";

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function compact(value) {
  if (Array.isArray(value)) {
    const array = value.map(compact).filter((item) => item !== undefined);
    return array.length ? array : undefined;
  }
  if (isObject(value)) {
    const object = {};
    for (const [key, item] of Object.entries(value)) {
      const cleaned = compact(item);
      if (cleaned !== undefined) object[key] = cleaned;
    }
    return Object.keys(object).length ? object : undefined;
  }
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mapObject(source, mapping) {
  const output = {};
  for (const [from, to] of Object.entries(mapping)) {
    if (source[from] !== undefined) output[to] = source[from];
  }
  return output;
}

function unmapObject(source, mapping) {
  if (!isObject(source)) return undefined;
  const output = {};
  for (const [full, short] of Object.entries(mapping)) {
    if (source[short] !== undefined) output[full] = source[short];
  }
  return Object.keys(output).length ? output : undefined;
}

function writeSection(source, defaults, mapping) {
  return mapObject(writeComparable(source, defaults), mapping);
}

const IDENTITY = {
  botName: "n",
  accentColor: "c",
  successColor: "s",
  dangerColor: "d",
  footerText: "f",
};

const PANEL = {
  channelId: "c",
  title: "t",
  description: "d",
  imageUrl: "i",
  thumbnailUrl: "h",
  footerText: "f",
  style: "y",
};

const DEFAULTS = {
  categoryId: "c",
  supportChannelId: "u",
  ticketNameFormat: "n",
  answersNameFormat: "a",
};

const TIMING = {
  prepMinSeconds: "a",
  prepMaxSeconds: "b",
  saveMinSeconds: "c",
  saveMaxSeconds: "d",
  claimedToSpinnerMs: "e",
  nextQuestionMs: "f",
  closeDelaySeconds: "g",
};

const BEHAVIOR = {
  oneOpenPerType: "o",
  allowUserClose: "c",
  deleteOnClose: "d",
  pingOwnerOnClaim: "p",
  notifyStaff: "n",
  maxAnswerLength: "m",
};

const ASSETS = {
  pendulumGif: "p",
  spinnerGif: "s",
  preparingGif: "r",
  savingGif: "v",
  successGif: "o",
};

const LABELS = {
  claim: "c",
  claimed: "d",
  close: "x",
  confirmClose: "f",
  cancel: "n",
  send: "s",
  skip: "k",
  selectPlaceholder: "p",
};

const MESSAGE = {
  title: "t",
  description: "d",
  imageUrl: "i",
  thumbnailUrl: "h",
  footerText: "f",
  color: "c",
};

const TYPE = {
  id: "i",
  name: "n",
  description: "d",
  emoji: "e",
  mode: "m",
  enabled: "x",
  categoryId: "c",
  supportChannelId: "u",
  ticketNameFormat: "f",
  answersNameFormat: "a",
  staffRoleIds: "s",
  adminRoleIds: "r",
  questions: "q",
  messageOverrides: "o",
  assetOverrides: "g",
  timingOverrides: "t",
};

const QUESTION = {
  id: "i",
  label: "l",
  question: "q",
  imageUrl: "m",
  thumbnailUrl: "h",
  required: "r",
};

function writeComparable(source, defaults) {
  const output = {};
  for (const [key, value] of Object.entries(source)) {
    if (!equal(value, defaults[key])) output[key] = value;
  }
  return output;
}

function writeMessage(message, fallback = {}) {
  if (!isObject(message)) return undefined;
  const output = {};
  for (const [full, short] of Object.entries(MESSAGE)) {
    if (message[full] === undefined) continue;
    if (!equal(message[full], fallback[full])) output[short] = message[full];
  }
  return compact(output);
}

function readMessage(source) {
  if (!isObject(source)) return undefined;
  const output = {};
  for (const [full, short] of Object.entries(MESSAGE)) {
    if (source[short] !== undefined) output[full] = source[short];
  }
  return Object.keys(output).length ? output : undefined;
}

function writeQuestion(question, mode) {
  const output = mapObject(question, QUESTION);
  if (question.required === true) delete output.r;
  if (mode === "classic" || question.required === true) delete output.r;
  return compact(output);
}

function readQuestion(source) {
  if (!isObject(source)) return undefined;
  const output = {};
  for (const [full, short] of Object.entries(QUESTION)) {
    if (source[short] !== undefined) output[full] = source[short];
  }
  return Object.keys(output).length ? output : undefined;
}

function writeType(type, config) {
  const output = mapObject(type, TYPE);
  if (type.mode === "classic") delete output.m;
  if (type.enabled === true) delete output.x;
  if (!type.questions.length) delete output.q;
  else output.q = type.questions.map((question) => writeQuestion(question));

  if (Object.keys(type.messageOverrides).length) {
    const overrides = {};
    for (const key of MESSAGE_KEYS) {
      const message = writeMessage(type.messageOverrides[key], {});
      if (message) overrides[key] = message;
    }
    if (Object.keys(overrides).length) output.o = overrides;
    else delete output.o;
  }

  if (Object.keys(type.assetOverrides).length) {
    const assets = {};
    for (const key of ASSET_KEYS) {
      if (
        type.assetOverrides[key] &&
        type.assetOverrides[key] !== config.assets[key]
      ) {
        assets[ASSETS[key]] = type.assetOverrides[key];
      }
    }
    if (Object.keys(assets).length) output.g = assets;
    else delete output.g;
  }

  if (Object.keys(type.timingOverrides).length) {
    const timing = {};
    for (const key of Object.keys(DEFAULT_TIMING)) {
      if (
        type.timingOverrides[key] !== undefined &&
        type.timingOverrides[key] !== config.timing[key]
      ) {
        timing[TIMING[key]] = type.timingOverrides[key];
      }
    }
    if (Object.keys(timing).length) output.t = timing;
    else delete output.t;
  }

  return compact(output);
}

function readType(source, config) {
  if (!isObject(source)) return undefined;
  const output = {};
  for (const [full, short] of Object.entries(TYPE)) {
    if (source[short] !== undefined) output[full] = source[short];
  }
  if (Array.isArray(source.q)) output.questions = source.q.map(readQuestion);
  if (isObject(source.o)) {
    const overrides = {};
    for (const key of MESSAGE_KEYS) {
      const message = readMessage(source.o[key]);
      if (message) overrides[key] = message;
    }
    output.messageOverrides = overrides;
  }
  if (isObject(source.g)) {
    const assets = {};
    for (const [full, short] of Object.entries(ASSETS)) {
      if (source.g[short] !== undefined) assets[full] = source.g[short];
    }
    output.assetOverrides = assets;
  }
  if (isObject(source.t)) {
    const timing = {};
    for (const [full, short] of Object.entries(TIMING)) {
      if (source.t[short] !== undefined) timing[full] = source.t[short];
    }
    output.timingOverrides = timing;
  }
  return output;
}

export function toWire(config) {
  const normalized = normalizeConfig(config);
  const defaults = createDefaultConfig();
  const wire = {};

  const identity = writeSection(normalized.identity, DEFAULT_IDENTITY, IDENTITY);
  if (Object.keys(identity).length) wire.i = identity;

  const panel = writeSection(normalized.panel, DEFAULT_PANEL, PANEL);
  if (Object.keys(panel).length) wire.p = panel;

  const permissions = compact({
    a: normalized.permissions.adminRoleIds,
    s: normalized.permissions.staffRoleIds,
  });
  if (permissions) wire.r = permissions;

  const ticketDefaults = writeSection(
    normalized.defaults,
    DEFAULT_DEFAULTS,
    DEFAULTS,
  );
  if (Object.keys(ticketDefaults).length) wire.d = ticketDefaults;

  const timing = writeSection(normalized.timing, DEFAULT_TIMING, TIMING);
  if (Object.keys(timing).length) wire.t = timing;

  const behavior = writeSection(normalized.behavior, DEFAULT_BEHAVIOR, BEHAVIOR);
  if (Object.keys(behavior).length) wire.b = behavior;

  const assets = writeSection(normalized.assets, DEFAULT_ASSETS, ASSETS);
  if (Object.keys(assets).length) wire.a = assets;

  const labels = writeSection(normalized.labels, DEFAULT_LABELS, LABELS);
  if (Object.keys(labels).length) wire.l = labels;

  const messages = {};
  for (const key of MESSAGE_KEYS) {
    const message = writeMessage(normalized.messages[key], DEFAULT_MESSAGES[key]);
    if (message) messages[key] = message;
  }
  if (Object.keys(messages).length) wire.m = messages;

  if (!equal(normalized.ticketTypes, defaults.ticketTypes)) {
    wire.y = normalized.ticketTypes.map((type) => writeType(type, normalized));
  }

  return wire;
}

export function fromWire(input) {
  if (!isObject(input)) return normalizeConfig({});
  const raw = {};

  const identity = unmapObject(input.i, IDENTITY);
  if (identity) raw.identity = identity;

  const panel = unmapObject(input.p, PANEL);
  if (panel) raw.panel = panel;

  if (isObject(input.r)) {
    raw.permissions = {
      adminRoleIds: input.r.a,
      staffRoleIds: input.r.s,
    };
  }

  const ticketDefaults = unmapObject(input.d, DEFAULTS);
  if (ticketDefaults) raw.defaults = ticketDefaults;

  const timing = unmapObject(input.t, TIMING);
  if (timing) raw.timing = timing;

  const behavior = unmapObject(input.b, BEHAVIOR);
  if (behavior) raw.behavior = behavior;

  const assets = unmapObject(input.a, ASSETS);
  if (assets) raw.assets = assets;

  const labels = unmapObject(input.l, LABELS);
  if (labels) raw.labels = labels;

  if (isObject(input.m)) {
    raw.messages = {};
    for (const key of MESSAGE_KEYS) {
      const message = readMessage(input.m[key]);
      if (message) raw.messages[key] = message;
    }
  }

  if (Array.isArray(input.y)) {
    raw.ticketTypes = input.y.map((type) => readType(type, raw));
  }

  return normalizeConfig(raw);
}

export function isWireConfig(input) {
  return isObject(input) && !("identity" in input) && !("ticketTypes" in input);
}

export function toServerWire(server) {
  const wire = {
    g: compact({ i: server.guild?.id, n: server.guild?.name, c: server.guild?.icon }),
    c: server.channels?.map((channel) =>
      compact({
        i: channel.id,
        n: channel.name,
        y: channel.type,
        p: channel.parentId,
        pn: channel.parentName,
        o: channel.position,
      }),
    ),
    r: server.roles?.map((role) =>
      compact({
        i: role.id,
        n: role.name,
        c: role.color,
        p: role.position,
        m: role.managed,
      }),
    ),
  };
  return compact(wire);
}

export function fromServerWire(input) {
  if (!isObject(input)) return { guild: {}, channels: [], roles: [] };
  return {
    guild: {
      id: input.g?.i,
      name: input.g?.n,
      icon: input.g?.c,
    },
    channels: (input.c || []).map((channel) => ({
      id: channel.i,
      name: channel.n,
      type: channel.y,
      parentId: channel.p,
      parentName: channel.pn,
      position: channel.o,
    })),
    roles: (input.r || []).map((role) => ({
      id: role.i,
      name: role.n,
      color: role.c,
      position: role.p,
      managed: role.m,
    })),
  };
}
