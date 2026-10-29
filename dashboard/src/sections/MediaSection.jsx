import {
  ASSET_KEYS,
  ASSET_META,
} from "@ply/shared";
import {
  Callout,
  Card,
  Field,
  ImageField,
  Section,
} from "../components/ui.jsx";

export function MediaSection({ config, update }) {
  return (
    <Section
      eyebrow="Animation kit"
      title="GIFs & media"
      description="Ply uses remote GIFs for its loading states. Paste a direct Imgur, Tenor, Giphy or any HTTPS media URL."
    >
      <Callout tone="warning" title="No uploads, no storage">
        Ply never downloads or stores media. Discord loads each animation from
        the URL you provide. Use direct <code>.gif</code> links for the best
        result, and keep files reasonably small.
      </Callout>

      <div className="media-grid">
        {ASSET_KEYS.map((key) => (
          <Card key={key} className="media-card">
            <div className="media-top">
              <div>
                <span className="eyebrow">Animation</span>
                <h3>{ASSET_META[key].label}</h3>
                <p>{ASSET_META[key].hint}</p>
              </div>
            </div>
            <div className="media-preview">
              {/^https?:\/\//i.test(config.assets[key] || "") ? (
                <img src={config.assets[key]} alt={ASSET_META[key].label} />
              ) : (
                <span>No GIF URL</span>
              )}
            </div>
            <Field label="GIF URL" wide>
              <ImageField
                value={config.assets[key]}
                onChange={(value) => update(["assets", key], value)}
                placeholder="https://media.giphy.com/…/giphy.gif"
              />
            </Field>
          </Card>
        ))}
      </div>

      <Card
        title="Other media"
        description="Panel images and per-message images are configured in their own sections."
      >
        <div className="quick-links">
          <div>
            <strong>Panel image / thumbnail</strong>
            <span>Brand & ticket panel</span>
          </div>
          <div>
            <strong>Message images</strong>
            <span>Message studio</span>
          </div>
          <div>
            <strong>Question images</strong>
            <span>Ticket types → Questions</span>
          </div>
        </div>
      </Card>
    </Section>
  );
}
