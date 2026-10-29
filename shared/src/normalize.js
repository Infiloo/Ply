import {
  ASSET_KEYS,
  CONFIG_VERSION,
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

const clone = (value) => JSON.parse(JSON.stringify(value));

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function text(value, fallback = "", max = 4096) {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function pickText(value, fallback = "", max = 4096) {
  if (value === undefined) return fallback;
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function bool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function number(value, fallback, min, max) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function color(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function idText(value, max = 30) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value, maxItems = 25) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, maxItems);
}

function hexColorOrFallback(value, fallback) {
  return color(value, fallback) || fallback;
}

export function slugify(value, fallback = "ticket") {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || fallback;
}

function normalizeMessage(input, fallback) {
  const raw = isObject(input) ? input : {};
  return {
    title: pickText(raw.title, fallback.title, 256),
    description: pickText(raw.description, fallback.description, 4096),
    imageUrl: pickText(raw.imageUrl, fallback.imageUrl, 1000).trim(),
    thumbnailUrl: pickText(raw.thumbnailUrl, fallback.thumbnailUrl, 1000).trim(),
    footerText: pickText(raw.footerText, fallback.footerText, 2048),
    color: color(raw.color, fallback.color),
  };
}

function normalizePartialMessage(input) {
  if (!isObject(input)) return null;
  const output = {};
  if (typeof input.title === "string") output.title = input.title.slice(0, 256);
  if (typeof input.description === "string")
    output.description = input.description.slice(0, 4096);
  if (typeof input.imageUrl === "string")
    output.imageUrl = input.imageUrl.trim().slice(0, 1000);
  if (typeof input.thumbnailUrl === "string")
    output.thumbnailUrl = input.thumbnailUrl.trim().slice(0, 1000);
  if (typeof input.footerText === "string")
    output.footerText = input.footerText.slice(0, 2048);
  if (typeof input.color === "string")
    output.color = color(input.color, "");
  return Object.keys(output).length ? output : null;
}

function normalizeMessages(input) {
  const source = isObject(input) ? input : {};
  const output = {};
  for (const key of MESSAGE_KEYS) {
    output[key] = normalizeMessage(source[key], DEFAULT_MESSAGES[key]);
  }
  return output;
}

function normalizeQuestion(input, index) {
  const raw = isObject(input) ? input : {};
  const question = text(raw.question, "", 1500).trim();
  if (!question) return null;
  const label =
    text(raw.label, "", 100).trim() || `Question ${index + 1}`;
  return {
    id: slugify(raw.id || label, `q-${index + 1}`),
    label: label.slice(0, 100),
    question,
    imageUrl: text(raw.imageUrl, "", 1000).trim(),
    thumbnailUrl: text(raw.thumbnailUrl, "", 1000).trim(),
    required: bool(raw.required, true),
  };
}

function normalizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  const output = [];
  const usedIds = new Set();
  input.slice(0, 20).forEach((question, index) => {
    const normalized = normalizeQuestion(question, output.length || index);
    if (!normalized) return;
    let id = normalized.id;
    let n = 2;
    while (usedIds.has(id)) id = `${normalized.id.slice(0, 20)}-${n++}`;
    usedIds.add(id);
    normalized.id = id;
    output.push(normalized);
  });
  return output;
}

function normalizeType(input, index, usedIds) {
  const raw = isObject(input) ? input : {};
  const baseName = text(raw.name, "", 100).trim() || `Ticket ${index + 1}`;
  let id = slugify(raw.id || baseName, `ticket-${index + 1}`);
  let suffix = 2;
  while (usedIds.has(id)) id = `${id.slice(0, 21)}-${suffix++}`;
  usedIds.add(id);

  const rawOverrides = isObject(raw.messageOverrides)
    ? raw.messageOverrides
    : {};
  const messageOverrides = {};
  for (const key of MESSAGE_KEYS) {
    const normalized = normalizePartialMessage(rawOverrides[key]);
    if (normalized) messageOverrides[key] = normalized;
  }

  const assetOverrides = {};
  if (isObject(raw.assetOverrides)) {
    for (const key of ASSET_KEYS) {
      const value = raw.assetOverrides[key];
      if (typeof value === "string" && value.trim())
        assetOverrides[key] = value.trim().slice(0, 1000);
    }
  }

  const timingOverrides = {};
  if (isObject(raw.timingOverrides)) {
    for (const key of Object.keys(DEFAULT_TIMING)) {
      if (raw.timingOverrides[key] !== undefined) {
        timingOverrides[key] = number(
          raw.timingOverrides[key],
          DEFAULT_TIMING[key],
          0,
          120000,
        );
      }
    }
  }

  return {
    id,
    name: baseName,
    description: text(raw.description, "", 200).trim(),
    emoji: text(raw.emoji, "", 100).trim(),
    mode: raw.mode === "questions" ? "questions" : "classic",
    enabled: bool(raw.enabled, true),
    categoryId: idText(raw.categoryId),
    supportChannelId: idText(raw.supportChannelId),
    ticketNameFormat: text(raw.ticketNameFormat, "", 100).trim(),
    answersNameFormat: text(raw.answersNameFormat, "", 100).trim(),
    staffRoleIds: stringList(raw.staffRoleIds),
    adminRoleIds: stringList(raw.adminRoleIds),
    questions: normalizeQuestions(raw.questions),
    messageOverrides,
    assetOverrides,
    timingOverrides,
  };
}

function normalizeTicketTypes(input) {
  if (!Array.isArray(input)) return clone(createDefaultConfig().ticketTypes);
  const usedIds = new Set();
  return input
    .slice(0, 24)
    .map((type, index) => normalizeType(type, index, usedIds));
}

export function normalizeConfig(input) {
  const fallback = createDefaultConfig();
  const raw = isObject(input) ? input : {};
  const identity = isObject(raw.identity) ? raw.identity : {};
  const panel = isObject(raw.panel) ? raw.panel : {};
  const permissions = isObject(raw.permissions) ? raw.permissions : {};
  const defaults = isObject(raw.defaults) ? raw.defaults : {};
  const timing = isObject(raw.timing) ? raw.timing : {};
  const behavior = isObject(raw.behavior) ? raw.behavior : {};
  const assets = isObject(raw.assets) ? raw.assets : {};
  const labels = isObject(raw.labels) ? raw.labels : {};

  const timingMin = number(
    timing.prepMinSeconds,
    DEFAULT_TIMING.prepMinSeconds,
    0,
    120,
  );
  const timingMax = Math.max(
    timingMin,
    number(timing.prepMaxSeconds, DEFAULT_TIMING.prepMaxSeconds, 0, 120),
  );
  const saveMin = number(
    timing.saveMinSeconds,
    DEFAULT_TIMING.saveMinSeconds,
    0,
    30,
  );
  const saveMax = Math.max(
    saveMin,
    number(timing.saveMaxSeconds, DEFAULT_TIMING.saveMaxSeconds, 0, 30),
  );

  const normalized = {
    version: CONFIG_VERSION,
    identity: {
      botName:
        text(identity.botName, DEFAULT_IDENTITY.botName, 60).trim() ||
        DEFAULT_IDENTITY.botName,
      accentColor: hexColorOrFallback(
        identity.accentColor,
        DEFAULT_IDENTITY.accentColor,
      ),
      successColor: hexColorOrFallback(
        identity.successColor,
        DEFAULT_IDENTITY.successColor,
      ),
      dangerColor: hexColorOrFallback(
        identity.dangerColor,
        DEFAULT_IDENTITY.dangerColor,
      ),
      footerText: pickText(
        identity.footerText,
        DEFAULT_IDENTITY.footerText,
        2048,
      ),
    },
    panel: {
      channelId: idText(panel.channelId),
      title: pickText(panel.title, DEFAULT_PANEL.title, 256),
      description: pickText(panel.description, DEFAULT_PANEL.description, 4096),
      imageUrl: pickText(panel.imageUrl, DEFAULT_PANEL.imageUrl, 1000).trim(),
      thumbnailUrl: pickText(
        panel.thumbnailUrl,
        DEFAULT_PANEL.thumbnailUrl,
        1000,
      ).trim(),
      footerText: pickText(panel.footerText, DEFAULT_PANEL.footerText, 2048),
      style: ["auto", "buttons", "select"].includes(panel.style)
        ? panel.style
        : "auto",
    },
    permissions: {
      adminRoleIds: stringList(permissions.adminRoleIds),
      staffRoleIds: stringList(permissions.staffRoleIds),
    },
    defaults: {
      categoryId: idText(defaults.categoryId),
      supportChannelId: idText(defaults.supportChannelId),
      ticketNameFormat:
        text(
          defaults.ticketNameFormat,
          DEFAULT_DEFAULTS.ticketNameFormat,
          100,
        ).trim() || DEFAULT_DEFAULTS.ticketNameFormat,
      answersNameFormat:
        text(
          defaults.answersNameFormat,
          DEFAULT_DEFAULTS.answersNameFormat,
          100,
        ).trim() || DEFAULT_DEFAULTS.answersNameFormat,
    },
    timing: {
      prepMinSeconds: timingMin,
      prepMaxSeconds: timingMax,
      saveMinSeconds: saveMin,
      saveMaxSeconds: saveMax,
      claimedToSpinnerMs: number(
        timing.claimedToSpinnerMs,
        DEFAULT_TIMING.claimedToSpinnerMs,
        0,
        30000,
      ),
      nextQuestionMs: number(
        timing.nextQuestionMs,
        DEFAULT_TIMING.nextQuestionMs,
        0,
        10000,
      ),
      closeDelaySeconds: number(
        timing.closeDelaySeconds,
        DEFAULT_TIMING.closeDelaySeconds,
        0,
        60,
      ),
    },
    behavior: {
      oneOpenPerType: bool(
        behavior.oneOpenPerType,
        DEFAULT_BEHAVIOR.oneOpenPerType,
      ),
      allowUserClose: bool(
        behavior.allowUserClose,
        DEFAULT_BEHAVIOR.allowUserClose,
      ),
      deleteOnClose: bool(
        behavior.deleteOnClose,
        DEFAULT_BEHAVIOR.deleteOnClose,
      ),
      pingOwnerOnClaim: bool(
        behavior.pingOwnerOnClaim,
        DEFAULT_BEHAVIOR.pingOwnerOnClaim,
      ),
      notifyStaff: bool(behavior.notifyStaff, DEFAULT_BEHAVIOR.notifyStaff),
      maxAnswerLength: number(
        behavior.maxAnswerLength,
        DEFAULT_BEHAVIOR.maxAnswerLength,
        10,
        2000,
      ),
    },
    assets: {},
    labels: {
      claim: text(labels.claim, DEFAULT_LABELS.claim, 80).trim() || DEFAULT_LABELS.claim,
      claimed:
        text(labels.claimed, DEFAULT_LABELS.claimed, 80).trim() ||
        DEFAULT_LABELS.claimed,
      close: text(labels.close, DEFAULT_LABELS.close, 80).trim() || DEFAULT_LABELS.close,
      confirmClose:
        text(labels.confirmClose, DEFAULT_LABELS.confirmClose, 80).trim() ||
        DEFAULT_LABELS.confirmClose,
      cancel:
        text(labels.cancel, DEFAULT_LABELS.cancel, 80).trim() ||
        DEFAULT_LABELS.cancel,
      send: text(labels.send, DEFAULT_LABELS.send, 80).trim() || DEFAULT_LABELS.send,
      skip: text(labels.skip, DEFAULT_LABELS.skip, 80).trim() || DEFAULT_LABELS.skip,
      selectPlaceholder:
        text(
          labels.selectPlaceholder,
          DEFAULT_LABELS.selectPlaceholder,
          100,
        ).trim() || DEFAULT_LABELS.selectPlaceholder,
    },
    messages: normalizeMessages(raw.messages),
    ticketTypes: normalizeTicketTypes(raw.ticketTypes),
  };

  for (const key of ASSET_KEYS) {
    normalized.assets[key] = text(assets[key], DEFAULT_ASSETS[key], 1000).trim();
  }

  return normalized;
}

export function normalizeServerMap(input) {
  const raw = isObject(input) ? input : {};
  const guild = isObject(raw.guild) ? raw.guild : {};
  const channels = Array.isArray(raw.channels) ? raw.channels : [];
  const roles = Array.isArray(raw.roles) ? raw.roles : [];
  return {
    guild: {
      id: idText(guild.id),
      name: text(guild.name, "", 100),
      icon: text(guild.icon, "", 200),
    },
    channels: channels
      .filter(isObject)
      .slice(0, 500)
      .map((channel) => ({
        id: idText(channel.id),
        name: text(channel.name, "", 100),
        type: text(channel.type, "text", 30),
        parentId: idText(channel.parentId),
        parentName: text(channel.parentName, "", 100),
        position: number(channel.position, 0, -10000, 10000),
      }))
      .filter((channel) => channel.id),
    roles: roles
      .filter(isObject)
      .slice(0, 250)
      .map((role) => ({
        id: idText(role.id),
        name: text(role.name, "", 100),
        color: text(role.color, "", 20),
        position: number(role.position, 0, -10000, 10000),
        managed: bool(role.managed, false),
      }))
      .filter((role) => role.id),
  };
}

export function effectiveMessage(config, type, key) {
  const base = config.messages[key] || DEFAULT_MESSAGES[key];
  const override = type?.messageOverrides?.[key];
  return override ? { ...base, ...override } : base;
}

export function effectiveAsset(config, type, key) {
  return (
    type?.assetOverrides?.[key] ||
    config.assets?.[key] ||
    DEFAULT_ASSETS[key] ||
    ""
  );
}

export function effectiveTiming(config, type, key) {
  return (
    type?.timingOverrides?.[key] ??
    config.timing?.[key] ??
    DEFAULT_TIMING[key]
  );
}

export function clearTicketTypeOverrides(type) {
  return {
    ...type,
    messageOverrides: {},
    assetOverrides: {},
    timingOverrides: {},
  };
}
