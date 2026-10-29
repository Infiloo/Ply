import {
  Callout,
  Card,
  ChannelSelect,
  ColorInput,
  Field,
  ImageField,
  Section,
  Segmented,
  TextArea,
  TextInput,
} from "../components/ui.jsx";

export function BrandSection({ config, update, server }) {
  return (
    <Section
      eyebrow="Identity"
      title="Brand & ticket panel"
      description="This is what members see first. Every title, subtitle, color and image is yours."
    >
      <div className="grid two">
        <Card
          title="Brand"
          description="Used in embed footers and previews. The actual bot username and avatar are set in the Discord Developer Portal."
        >
          <div className="form-grid">
            <Field label="Bot display name" hint="Use {botName} inside message templates.">
              <TextInput
                value={config.identity.botName}
                onChange={(value) => update(["identity", "botName"], value)}
                maxLength={60}
              />
            </Field>
            <Field label="Accent color">
              <ColorInput
                value={config.identity.accentColor}
                onChange={(value) => update(["identity", "accentColor"], value)}
              />
            </Field>
            <Field label="Success color">
              <ColorInput
                value={config.identity.successColor}
                onChange={(value) =>
                  update(["identity", "successColor"], value)
                }
              />
            </Field>
            <Field label="Danger color">
              <ColorInput
                value={config.identity.dangerColor}
                onChange={(value) => update(["identity", "dangerColor"], value)}
              />
            </Field>
            <Field
              label="Default footer"
              hint="Only used when a message has no footer of its own."
              wide
            >
              <TextInput
                value={config.identity.footerText}
                onChange={(value) => update(["identity", "footerText"], value)}
                maxLength={2048}
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Panel embed"
          description="Ply publishes this as a normal message. Re-run /panel after changing it."
        >
          <div className="form-grid">
            <Field label="Panel channel" wide>
              <ChannelSelect
                value={config.panel.channelId}
                onChange={(value) => update(["panel", "channelId"], value)}
                server={server}
              />
            </Field>
            <Field label="Title" wide>
              <TextInput
                value={config.panel.title}
                onChange={(value) => update(["panel", "title"], value)}
                maxLength={256}
              />
            </Field>
            <Field label="Description" wide>
              <TextArea
                value={config.panel.description}
                onChange={(value) => update(["panel", "description"], value)}
                rows={4}
                maxLength={4096}
              />
            </Field>
            <Field
              label="Component style"
              hint="Auto shows a button for one type and a dropdown for several."
              wide
            >
              <Segmented
                value={config.panel.style}
                onChange={(value) => update(["panel", "style"], value)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "select", label: "Dropdown" },
                  { value: "buttons", label: "Buttons" },
                ]}
              />
            </Field>
            <Field label="Image URL" wide>
              <ImageField
                value={config.panel.imageUrl}
                onChange={(value) => update(["panel", "imageUrl"], value)}
                placeholder="https://i.imgur.com/…gif"
              />
            </Field>
            <Field label="Thumbnail URL" wide>
              <ImageField
                value={config.panel.thumbnailUrl}
                onChange={(value) => update(["panel", "thumbnailUrl"], value)}
                placeholder="https://i.imgur.com/…png"
              />
            </Field>
            <Field label="Panel footer" wide>
              <TextInput
                value={config.panel.footerText}
                onChange={(value) => update(["panel", "footerText"], value)}
                placeholder="Leave empty to use the default footer"
                maxLength={2048}
              />
            </Field>
          </div>
        </Card>
      </div>

      <Callout tone="info" title="Slogan built in">
        Ply — Just apply, but customized. Keep the identity in your footer, add it
        to the panel, or replace it with your own words.
      </Callout>
    </Section>
  );
}
