import { useMemo, useState } from "react";
import { effectiveAsset, effectiveMessage } from "@ply/shared";
import { Icon } from "./ui.jsx";

const now = Math.floor(Date.now() / 1000);

export function previewVariables(config, server, type) {
  return {
    user: "@alex",
    username: "alex",
    userId: "123456789012345678",
    userAvatar: "https://cdn.discordapp.com/embed/avatars/3.png",
    type: type?.name || "General Support",
    ticket: "#ticket-alex",
    ticketName: "ticket-alex",
    ticketId: "7Hq2nA",
    staff: "@sam",
    staffName: "sam",
    answers: "#answers-ticket-alex",
    answersName: "answers-ticket-alex",
    number: 1,
    total: type?.questions?.length || 5,
    question:
      type?.questions?.[0]?.question || "What should we call you, and how old are you?",
    firstMessage: "Hey, I need a little help with my application.",
    claimLabel: config.labels.claim,
    sendLabel: config.labels.send,
    skipLabel: config.labels.skip,
    guild: server?.guild?.name || "Your Server",
    botName: config.identity.botName,
    date: `<t:${now}:D>`,
    time: `<t:${now}:t>`,
  };
}

export function fill(value, variables) {
  return String(value || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) =>
    variables[key] === undefined ? "" : String(variables[key]),
  );
}

function safeImage(value) {
  return /^https?:\/\//i.test(value || "") ? value : "";
}

export function DiscordEmbedPreview({
  config,
  message,
  variables,
  imageFallback = "",
  components = [],
  fields = [],
  compact = false,
}) {
  const image = safeImage(
    fill(message?.imageUrl || imageFallback, variables),
  );
  const thumbnail = safeImage(fill(message?.thumbnailUrl, variables));
  const title = fill(message?.title, variables);
  const description = fill(message?.description, variables);
  const footer = fill(
    message?.footerText || config.identity.footerText,
    variables,
  );
  const color = message?.color || config.identity.accentColor;

  return (
    <div className={`discord-message ${compact ? "is-compact" : ""}`}>
      <div className="discord-avatar">
        {config.identity.botName.slice(0, 1).toUpperCase()}
      </div>
      <div className="discord-body">
        <div className="discord-meta">
          <strong>{config.identity.botName}</strong>
          <span className="bot-tag">APP</span>
          <span className="discord-time">Today at 12:00</span>
        </div>
        <div className="discord-embed" style={{ borderColor: color }}>
          {(title || description) && (
            <div className="discord-embed-content">
              {title && <div className="discord-embed-title">{title}</div>}
              {description && (
                <div className="discord-embed-description">
                  {description.split("\n").map((line, index) => (
                    <p key={`${line}-${index}`}>{formatInline(line)}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          {fields.length > 0 && (
            <div className="discord-fields">
              {fields.map((field, index) => (
                <div key={`${field.name}-${index}`}>
                  <strong>{field.name}</strong>
                  <span>{field.value}</span>
                </div>
              ))}
            </div>
          )}
          {thumbnail && (
            <img className="discord-thumb" src={thumbnail} alt="" />
          )}
          {image && (
            <img className="discord-image" src={image} alt="Embed media" />
          )}
          {footer && <div className="discord-footer">{footer}</div>}
        </div>
        {components.length > 0 && (
          <div className="discord-components">
            {components.map((component, index) => {
              if (component.type === "select") {
                return (
                  <div className="discord-select" key={index}>
                    <span>{component.placeholder}</span>
                    <Icon name="chevron" size={14} />
                  </div>
                );
              }
              return (
                <div
                  className={`discord-button discord-button-${component.tone || "secondary"}`}
                  key={index}
                >
                  {component.emoji && !component.emoji.startsWith("<") && (
                    <span>{component.emoji}</span>
                  )}
                  {component.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}

function panelComponents(config, types) {
  if (!types.length) return [];
  const mode =
    config.panel.style === "select"
      ? "select"
      : config.panel.style === "buttons"
        ? types.length <= 5
          ? "buttons"
          : "select"
        : types.length === 1
          ? "buttons"
          : "select";
  if (mode === "select") {
    return [
      {
        type: "select",
        placeholder: config.labels.selectPlaceholder,
      },
    ];
  }
  return types.slice(0, 5).map((type) => ({
    type: "button",
    label: type.name,
    emoji: type.emoji,
    tone: types.length === 1 ? "primary" : "secondary",
  }));
}

export function PanelPreview({ config, server, types, selectedType }) {
  const variables = previewVariables(config, server, selectedType);
  const panelMessage = {
    ...config.panel,
    footerText: config.panel.footerText || config.identity.footerText,
  };
  return (
    <DiscordEmbedPreview
      config={config}
      message={panelMessage}
      variables={variables}
      components={panelComponents(config, types)}
    />
  );
}

function TypingPreview({ config, label }) {
  return (
    <div className="typing-preview">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span>{label}</span>
    </div>
  );
}

export function PreviewRail({ config, server, selectedType }) {
  const [tab, setTab] = useState("panel");
  const types = config.ticketTypes.filter((type) => type.enabled);
  const variables = previewVariables(config, server, selectedType);
  const type = selectedType || types[0] || config.ticketTypes[0];

  const preview = useMemo(() => {
    if (!type) return null;
    if (tab === "panel") {
      return (
        <PanelPreview
          config={config}
          server={server}
          types={types}
          selectedType={type}
        />
      );
    }
    if (tab === "classic") {
      const welcome = effectiveMessage(config, type, "welcome");
      const pending = effectiveMessage(config, type, "classicPending");
      return (
        <>
          <div className="preview-caption">First message</div>
          <DiscordEmbedPreview
            config={config}
            message={welcome}
            variables={variables}
            components={[
              { label: config.labels.close, tone: "danger" },
            ]}
          />
          <div className="preview-caption">After the user replies</div>
          <DiscordEmbedPreview
            config={config}
            message={pending}
            variables={variables}
            imageFallback={effectiveAsset(config, type, "pendulumGif")}
          />
        </>
      );
    }
    if (tab === "questions") {
      const preparing = effectiveMessage(config, type, "preparing");
      const question = effectiveMessage(config, type, "question");
      return (
        <>
          <div className="preview-caption">Opening animation · 5–10s</div>
          <DiscordEmbedPreview
            config={config}
            message={preparing}
            variables={variables}
            imageFallback={effectiveAsset(config, type, "preparingGif")}
          />
          <TypingPreview
            config={config}
            label="Loading the first question…"
          />
          <DiscordEmbedPreview
            config={config}
            message={{
              ...question,
              imageUrl:
                type.questions?.[0]?.imageUrl || question.imageUrl,
              thumbnailUrl:
                type.questions?.[0]?.thumbnailUrl || question.thumbnailUrl,
            }}
            variables={variables}
          />
        </>
      );
    }
    const support = effectiveMessage(config, type, "support");
    return (
      <>
        <div className="preview-caption">Staff notification</div>
        <DiscordEmbedPreview
          config={config}
          message={support}
          variables={variables}
          components={[{ label: config.labels.claim, tone: "success" }]}
        />
        <div className="preview-caption">After claiming</div>
        <DiscordEmbedPreview
          config={config}
          message={effectiveMessage(config, type, "waiting")}
          variables={variables}
          imageFallback={effectiveAsset(config, type, "spinnerGif")}
        />
      </>
    );
  }, [config, server, selectedType, tab, type, types, variables]);

  return (
    <aside className="preview-rail">
      <div className="preview-head">
        <div>
          <span className="eyebrow">Live preview</span>
          <h3>Discord view</h3>
        </div>
        <span className="preview-live">
          <span />
          live
        </span>
      </div>
      <div className="preview-tabs">
        {[
          ["panel", "Panel"],
          ["classic", "Classic"],
          ["questions", "Questions"],
          ["staff", "Staff"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={tab === value ? "is-active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="preview-canvas">
        <div className="preview-channel">
          <span>#</span> ticket-preview
        </div>
        {preview}
      </div>
      <div className="preview-foot">
        <Icon name="image" size={15} />
        Animations are external GIF URLs — no files stored.
      </div>
    </aside>
  );
}
