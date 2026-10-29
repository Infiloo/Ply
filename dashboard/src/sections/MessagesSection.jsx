import { useState } from "react";
import {
  DEFAULT_MESSAGES,
  MESSAGE_KEYS,
  MESSAGE_META,
  PLACEHOLDERS,
  effectiveAsset,
} from "@ply/shared";
import {
  DiscordEmbedPreview,
  previewVariables,
} from "../components/Preview.jsx";
import {
  Callout,
  Card,
  ColorInput,
  Field,
  ImageField,
  Section,
  TextArea,
  TextInput,
} from "../components/ui.jsx";

const ASSET_FOR_MESSAGE = {
  classicPending: "pendulumGif",
  waiting: "spinnerGif",
  preparing: "preparingGif",
  saving: "savingGif",
  saved: "successGif",
};

const groups = [...new Set(MESSAGE_KEYS.map((key) => MESSAGE_META[key].group))];

export function MessagesSection({ config, update, server, selectedType }) {
  const [selected, setSelected] = useState("welcome");
  const message = config.messages[selected];
  const variables = previewVariables(config, server, selectedType);
  const assetKey = ASSET_FOR_MESSAGE[selected];
  const imageFallback = assetKey
    ? effectiveAsset(config, selectedType, assetKey)
    : "";
  const fields =
    selected === "summary"
      ? [
          {
            name: "About you",
            value: "Alex, 22, from Berlin. I love this community.",
          },
          {
            name: "Experience",
            value: "Two years as a moderator on a 20k member server.",
          },
          {
            name: "Availability",
            value: "Around 15 hours per week, CET.",
          },
        ]
      : [];

  function updateField(field, value) {
    update(["messages", selected, field], value);
  }

  return (
    <Section
      eyebrow="Embeds"
      title="Message studio"
      description="Every embed is editable: title, subtitle, body, images, footer and color."
    >
      <div className="studio">
        <aside className="message-list">
          {groups.map((group) => (
            <div key={group} className="message-group">
              <span className="message-group-label">{group}</span>
              {MESSAGE_KEYS.filter(
                (key) => MESSAGE_META[key].group === group,
              ).map((key) => (
                <button
                  type="button"
                  key={key}
                  className={`message-item ${selected === key ? "is-active" : ""}`}
                  onClick={() => setSelected(key)}
                >
                  <span>{MESSAGE_META[key].label}</span>
                  <small>{key}</small>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="studio-editor">
          <Card
            title={MESSAGE_META[selected].label}
            description={`Template key: ${selected}`}
            actions={
              <button
                type="button"
                className="mini-button"
                onClick={() =>
                  update(
                    ["messages", selected],
                    structuredClone(DEFAULT_MESSAGES[selected]),
                  )
                }
              >
                Reset
              </button>
            }
          >
            <div className="form-grid">
              <Field label="Title">
                <TextInput
                  value={message.title}
                  onChange={(value) => updateField("title", value)}
                  maxLength={256}
                />
              </Field>
              <Field label="Text color" hint="Leave empty for the accent color.">
                <ColorInput
                  value={message.color}
                  onChange={(value) => updateField("color", value)}
                  allowEmpty
                />
              </Field>
              <Field label="Description / subtitle" wide>
                <TextArea
                  value={message.description}
                  onChange={(value) => updateField("description", value)}
                  rows={5}
                  maxLength={4096}
                />
              </Field>
              <Field label="Image URL" wide>
                <ImageField
                  value={message.imageUrl}
                  onChange={(value) => updateField("imageUrl", value)}
                  placeholder={
                    assetKey
                      ? "Leave empty to use the assigned animation"
                      : "https://…"
                  }
                />
              </Field>
              <Field label="Thumbnail URL" wide>
                <ImageField
                  value={message.thumbnailUrl}
                  onChange={(value) => updateField("thumbnailUrl", value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Footer" wide>
                <TextInput
                  value={message.footerText}
                  onChange={(value) => updateField("footerText", value)}
                  placeholder="Leave empty to use the default footer"
                  maxLength={2048}
                />
              </Field>
            </div>
          </Card>

          <Card title="Preview" description="Sample values shown for placeholders.">
            <DiscordEmbedPreview
              config={config}
              message={message}
              variables={variables}
              imageFallback={imageFallback}
              fields={fields}
            />
          </Card>

          <Callout tone="info" title="Placeholders">
            You can use these inside any title, description or footer:
            <div className="placeholder-list">
              {PLACEHOLDERS.map((placeholder) => (
                <code key={placeholder}>{placeholder}</code>
              ))}
            </div>
          </Callout>
        </div>
      </div>
    </Section>
  );
}
