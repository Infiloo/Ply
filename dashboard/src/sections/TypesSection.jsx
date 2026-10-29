import { useState } from "react";
import {
  ASSET_KEYS,
  ASSET_META,
  DEFAULT_TIMING,
  MESSAGE_KEYS,
  MESSAGE_META,
  effectiveAsset,
  effectiveMessage,
  effectiveTiming,
  slugify,
} from "@ply/shared";
import {
  DiscordEmbedPreview,
  previewVariables,
} from "../components/Preview.jsx";
import {
  Accordion,
  Badge,
  Callout,
  Card,
  ChannelSelect,
  ColorInput,
  Field,
  Icon,
  ImageField,
  RoleMultiSelect,
  Segmented,
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui.jsx";

const FALLBACKS = {
  classicPending: "pendulumGif",
  waiting: "spinnerGif",
  preparing: "preparingGif",
  saving: "savingGif",
  saved: "successGif",
};

function newType(existing) {
  const used = new Set(existing.map((type) => type.id));
  let base = "new-ticket";
  let id = base;
  let index = 2;
  while (used.has(id)) id = `${base}-${index++}`;
  let name = "New ticket";
  index = 2;
  while (existing.some((type) => type.name === name)) {
    name = `New ticket ${index++}`;
  }
  return {
    id,
    name,
    description: "Tell members what this ticket is for.",
    emoji: "🎫",
    mode: "classic",
    enabled: true,
    categoryId: "",
    supportChannelId: "",
    ticketNameFormat: "",
    answersNameFormat: "",
    staffRoleIds: [],
    adminRoleIds: [],
    questions: [],
    messageOverrides: {},
    assetOverrides: {},
    timingOverrides: {},
  };
}

function uniqueQuestionId(questions) {
  const used = new Set(questions.map((question) => question.id));
  let index = questions.length + 1;
  let id = `question-${index}`;
  while (used.has(id)) id = `question-${++index}`;
  return id;
}

function MessageOverrideEditor({ config, type, typeIndex, update, remove, server }) {
  const [key, setKey] = useState("welcome");
  const overridePath = ["ticketTypes", typeIndex, "messageOverrides", key];
  const effective = effectiveMessage(config, type, key);
  const override = type.messageOverrides?.[key];
  const message = override ? { ...effective, ...override } : null;
  const variables = previewVariables(config, server, type);
  const assetKey = FALLBACKS[key];

  function change(field, value) {
    update(overridePath, { ...message, [field]: value });
  }

  return (
    <Card
      title="Message overrides"
      description="Keep the global template, or give this type its own voice."
    >
      <div className="override-toolbar">
        <select
          className="input select"
          value={key}
          onChange={(event) => setKey(event.target.value)}
        >
          {MESSAGE_KEYS.map((messageKey) => (
            <option key={messageKey} value={messageKey}>
              {MESSAGE_META[messageKey].label}
            </option>
          ))}
        </select>
        {override ? (
          <>
            <Badge tone="success">Custom</Badge>
            <button
              type="button"
              className="mini-button"
              onClick={() => remove(overridePath)}
            >
              Use global
            </button>
          </>
        ) : (
          <>
            <Badge>Global</Badge>
            <button
              type="button"
              className="mini-button"
              onClick={() => update(overridePath, structuredClone(effective))}
            >
              Override this message
            </button>
          </>
        )}
      </div>

      {!override ? (
        <Callout tone="info" title="Using the global template">
          Edit it once in <strong>Message studio</strong> to update every ticket
          type. Create an override only when this type needs different wording.
        </Callout>
      ) : (
        <>
          <div className="form-grid">
            <Field label="Title">
              <TextInput
                value={message.title}
                onChange={(value) => change("title", value)}
                maxLength={256}
              />
            </Field>
            <Field label="Color" hint="Empty = accent color.">
              <ColorInput
                value={message.color}
                onChange={(value) => change("color", value)}
                allowEmpty
              />
            </Field>
            <Field label="Description" wide>
              <TextArea
                value={message.description}
                onChange={(value) => change("description", value)}
                rows={4}
                maxLength={4096}
              />
            </Field>
            <Field label="Image URL" wide>
              <ImageField
                value={message.imageUrl}
                onChange={(value) => change("imageUrl", value)}
                placeholder="Leave empty for the assigned animation"
              />
            </Field>
            <Field label="Thumbnail URL" wide>
              <ImageField
                value={message.thumbnailUrl}
                onChange={(value) => change("thumbnailUrl", value)}
              />
            </Field>
            <Field label="Footer" wide>
              <TextInput
                value={message.footerText}
                onChange={(value) => change("footerText", value)}
                maxLength={2048}
              />
            </Field>
          </div>
          <DiscordEmbedPreview
            config={config}
            message={message}
            variables={variables}
            imageFallback={
              assetKey ? effectiveAsset(config, type, assetKey) : ""
            }
            compact
          />
        </>
      )}
    </Card>
  );
}

function AssetOverrideEditor({ config, type, typeIndex, update, remove }) {
  return (
    <Card
      title="Animation overrides"
      description="Leave a field empty to inherit the global GIF."
    >
      <div className="form-grid">
        {ASSET_KEYS.map((key) => {
          const path = ["ticketTypes", typeIndex, "assetOverrides", key];
          const value = type.assetOverrides?.[key] || "";
          const fallback = effectiveAsset(config, type, key);
          return (
            <Field
              key={key}
              label={ASSET_META[key].label}
              hint={fallback ? `Global: ${fallback}` : "No global URL"}
              wide
            >
              <div className="inline-input">
                <input
                  className="input"
                  value={value}
                  placeholder="Inherit global"
                  onChange={(event) => {
                    if (event.target.value) update(path, event.target.value);
                    else remove(path);
                  }}
                />
                {value && (
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => remove(path)}
                  >
                    Clear
                  </button>
                )}
              </div>
            </Field>
          );
        })}
      </div>
    </Card>
  );
}

function TimingOverrideEditor({ config, type, typeIndex, update, remove }) {
  return (
    <Card
      title="Timing overrides"
      description="Leave a field empty to inherit the global timing."
    >
      <div className="form-grid">
        {Object.keys(DEFAULT_TIMING).map((key) => {
          const path = ["ticketTypes", typeIndex, "timingOverrides", key];
          const value = type.timingOverrides?.[key];
          return (
            <Field
              key={key}
              label={key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}
              hint={`Global: ${effectiveTiming(config, type, key)}`}
            >
              <input
                className="input"
                type="number"
                min={0}
                value={value ?? ""}
                placeholder={String(config.timing[key])}
                onChange={(event) => {
                  if (event.target.value === "") remove(path);
                  else update(path, Number(event.target.value));
                }}
              />
            </Field>
          );
        })}
      </div>
    </Card>
  );
}

export function TypesSection({
  config,
  update,
  remove,
  server,
  selectedTypeId,
  setSelectedTypeId,
}) {
  const types = config.ticketTypes;
  const selectedIndex = Math.max(
    0,
    types.findIndex((type) => type.id === selectedTypeId),
  );
  const type = types[selectedIndex] || types[0];

  if (!type) {
    return (
      <Card title="No ticket types">
        <p className="muted">Add a ticket type to begin.</p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            const created = newType([]);
            update(["ticketTypes"], [created]);
            setSelectedTypeId(created.id);
          }}
        >
          <Icon name="plus" size={16} />
          Add ticket type
        </button>
      </Card>
    );
  }

  const typePath = ["ticketTypes", selectedIndex];

  function change(field, value) {
    update([...typePath, field], value);
  }

  function addType() {
    const created = newType(types);
    update(["ticketTypes"], [...types, created]);
    setSelectedTypeId(created.id);
  }

  function duplicateType() {
    const clone = structuredClone(type);
    clone.id = `${type.id}-copy`;
    let suffix = 2;
    while (types.some((entry) => entry.id === clone.id)) {
      clone.id = `${type.id}-copy-${suffix++}`;
    }
    clone.name = `${type.name} copy`;
    update(["ticketTypes"], [...types, clone]);
    setSelectedTypeId(clone.id);
  }

  function deleteType() {
    if (!window.confirm(`Delete “${type.name}”?`)) return;
    const next = types.filter((entry) => entry.id !== type.id);
    update(["ticketTypes"], next);
    setSelectedTypeId(next[0]?.id || "");
  }

  function moveType(direction) {
    const target = selectedIndex + direction;
    if (target < 0 || target >= types.length) return;
    const next = [...types];
    [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]];
    update(["ticketTypes"], next);
  }

  function addQuestion() {
    const question = {
      id: uniqueQuestionId(type.questions),
      label: `Question ${type.questions.length + 1}`,
      question: "Write the question members should answer.",
      imageUrl: "",
      thumbnailUrl: "",
      required: true,
    };
    update([...typePath, "questions"], [...type.questions, question]);
  }

  function changeQuestion(index, field, value) {
    update([...typePath, "questions", index, field], value);
  }

  function removeQuestion(index) {
    update(
      [...typePath, "questions"],
      type.questions.filter((_question, questionIndex) => questionIndex !== index),
    );
  }

  function moveQuestion(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= type.questions.length) return;
    const next = [...type.questions];
    [next[index], next[target]] = [next[target], next[index]];
    update([...typePath, "questions"], next);
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Ticket types</span>
          <h2>What can members open?</h2>
          <p>
            Build classic conversations, guided question flows, or both. One type
            gets a button; several become a dropdown.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="button button-primary" onClick={addType}>
            <Icon name="plus" size={16} />
            Add type
          </button>
        </div>
      </div>

      <div className="type-strip">
        {types.map((entry, index) => (
          <button
            type="button"
            key={entry.id}
            className={`type-pill ${entry.id === type.id ? "is-active" : ""} ${!entry.enabled ? "is-disabled" : ""}`}
            onClick={() => setSelectedTypeId(entry.id)}
          >
            <span className="type-pill-emoji">
              {entry.emoji && !entry.emoji.startsWith("<") ? entry.emoji : "🎫"}
            </span>
            <span>
              <strong>{entry.name}</strong>
              <small>
                {entry.mode === "questions"
                  ? `${entry.questions.length} questions`
                  : "Classic chat"}
              </small>
            </span>
            {!entry.enabled && <Badge>Off</Badge>}
            <span className="type-index">{index + 1}</span>
          </button>
        ))}
      </div>

      <div className="type-editor-head">
        <div>
          <Badge tone={type.enabled ? "success" : "neutral"}>
            {type.enabled ? "Enabled" : "Disabled"}
          </Badge>
          <h3>{type.name}</h3>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="mini-button"
            onClick={() => moveType(-1)}
            disabled={selectedIndex === 0}
          >
            ↑
          </button>
          <button
            type="button"
            className="mini-button"
            onClick={() => moveType(1)}
            disabled={selectedIndex === types.length - 1}
          >
            ↓
          </button>
          <button type="button" className="mini-button" onClick={duplicateType}>
            Duplicate
          </button>
          <button
            type="button"
            className="button button-danger button-small"
            onClick={deleteType}
          >
            <Icon name="trash" size={15} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid two">
        <Card title="Basics" description="The public face of this ticket type.">
          <Toggle
            label="Enabled"
            hint="Disabled types disappear from the panel."
            checked={type.enabled}
            onChange={(value) => change("enabled", value)}
          />
          <div className="form-grid">
            <Field label="Name">
              <TextInput
                value={type.name}
                onChange={(value) => change("name", value)}
                maxLength={100}
              />
            </Field>
            <Field label="Emoji" hint="Unicode emoji or a custom emoji mention.">
              <TextInput
                value={type.emoji}
                onChange={(value) => change("emoji", value)}
                maxLength={100}
              />
            </Field>
            <Field label="Short description" wide>
              <TextArea
                value={type.description}
                onChange={(value) => change("description", value)}
                rows={2}
                maxLength={200}
              />
            </Field>
            <Field label="Ticket mode" wide>
              <Segmented
                value={type.mode}
                onChange={(value) => change("mode", value)}
                options={[
                  { value: "classic", label: "Classic chat" },
                  { value: "questions", label: "Guided questions" },
                ]}
              />
            </Field>
            <Field label="Type ID" hint="Internal slug used by panel buttons." wide>
              <TextInput
                value={type.id}
                onChange={(value) => change("id", slugify(value, type.id))}
                maxLength={24}
                className="input mono"
              />
            </Field>
          </div>
        </Card>

        <Card title="Access" description="Empty fields inherit the global defaults.">
          <div className="form-grid">
            <Field
              label="Category"
              hint={`Global: ${config.defaults.categoryId || "not set"}`}
              wide
            >
              <ChannelSelect
                value={type.categoryId}
                onChange={(value) => change("categoryId", value)}
                server={server}
                categoriesOnly
              />
            </Field>
            <Field
              label="Support channel"
              hint={`Global: ${config.defaults.supportChannelId || "not set"}`}
              wide
            >
              <ChannelSelect
                value={type.supportChannelId}
                onChange={(value) => change("supportChannelId", value)}
                server={server}
              />
            </Field>
            <Field label="Extra admin roles" wide>
              <RoleMultiSelect
                values={type.adminRoleIds}
                onChange={(value) => change("adminRoleIds", value)}
                server={server}
              />
            </Field>
            <Field label="Extra staff roles" wide>
              <RoleMultiSelect
                values={type.staffRoleIds}
                onChange={(value) => change("staffRoleIds", value)}
                server={server}
              />
            </Field>
            <Field
              label="Ticket channel name"
              hint="Empty = global {ticketNameFormat}."
              wide
            >
              <TextInput
                value={type.ticketNameFormat}
                onChange={(value) => change("ticketNameFormat", value)}
                placeholder="ticket-{username}"
              />
            </Field>
            <Field
              label="Answers channel name"
              hint="Empty = global answers-{ticket}."
              wide
            >
              <TextInput
                value={type.answersNameFormat}
                onChange={(value) => change("answersNameFormat", value)}
                placeholder="answers-{ticket}"
              />
            </Field>
          </div>
        </Card>
      </div>

      {type.mode === "questions" && (
        <Card
          title={`Questions · ${type.questions.length}`}
          description="Each answer gets a saving animation, then a green check."
          actions={
            <button type="button" className="button button-primary button-small" onClick={addQuestion}>
              <Icon name="plus" size={15} />
              Add question
            </button>
          }
        >
          {type.questions.length === 0 && (
            <Callout tone="warning" title="No questions yet">
              A guided ticket cannot open until it has at least one question.
            </Callout>
          )}
          <div className="question-list">
            {type.questions.map((question, index) => (
              <div className="question-card" key={question.id}>
                <div className="question-head">
                  <span className="question-number">{index + 1}</span>
                  <div>
                    <strong>{question.label}</strong>
                    <small>{question.id}</small>
                  </div>
                  <div className="question-actions">
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => moveQuestion(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => moveQuestion(index, 1)}
                      disabled={index === type.questions.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="mini-button danger-text"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  <Field label="Summary label">
                    <TextInput
                      value={question.label}
                      onChange={(value) =>
                        changeQuestion(index, "label", value)
                      }
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Question ID">
                    <TextInput
                      value={question.id}
                      onChange={(value) =>
                        changeQuestion(index, "id", slugify(value, question.id))
                      }
                      maxLength={24}
                      className="input mono"
                    />
                  </Field>
                  <Field label="Question text" wide>
                    <TextArea
                      value={question.question}
                      onChange={(value) =>
                        changeQuestion(index, "question", value)
                      }
                      rows={2}
                      maxLength={1500}
                    />
                  </Field>
                  <Field label="Question image URL" wide>
                    <ImageField
                      value={question.imageUrl}
                      onChange={(value) =>
                        changeQuestion(index, "imageUrl", value)
                      }
                    />
                  </Field>
                  <Field label="Thumbnail URL" wide>
                    <ImageField
                      value={question.thumbnailUrl}
                      onChange={(value) =>
                        changeQuestion(index, "thumbnailUrl", value)
                      }
                    />
                  </Field>
                </div>
                <Toggle
                  label="Required"
                  hint="Optional questions accept the skip word."
                  checked={question.required}
                  onChange={(value) =>
                    changeQuestion(index, "required", value)
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Accordion
        title="Advanced overrides"
        description="Per-type messages, animations and timing."
        badge="Optional"
      >
        <div className="stack">
          <MessageOverrideEditor
            config={config}
            type={type}
            typeIndex={selectedIndex}
            update={update}
            remove={remove}
            server={server}
          />
          <AssetOverrideEditor
            config={config}
            type={type}
            typeIndex={selectedIndex}
            update={update}
            remove={remove}
          />
          <TimingOverrideEditor
            config={config}
            type={type}
            typeIndex={selectedIndex}
            update={update}
            remove={remove}
          />
        </div>
      </Accordion>
    </section>
  );
}
