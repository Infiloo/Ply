import { useState } from "react";
import { decodeConfig, encodeConfig } from "@ply/shared";
import {
  Callout,
  Card,
  Field,
  Icon,
  Section,
  TextArea,
} from "../components/ui.jsx";
import {
  copyText,
  downloadText,
} from "../lib/storage.js";

const LIMIT = 4000;

export function ExportSection({
  config,
  setConfig,
  configCode,
  encoding,
  warnings,
  notify,
  onReset,
}) {
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);
  const codeSize = new TextEncoder().encode(configCode || "").length;
  const tooLong = codeSize > LIMIT;

  async function copy() {
    if (tooLong) {
      notify("The config is over the 4000 character modal limit.", "error");
      return;
    }
    try {
      await copyText(configCode);
      notify("Config code copied.");
    } catch {
      notify("Could not access the clipboard.", "error");
    }
  }

  async function importConfig() {
    if (!importCode.trim()) {
      notify("Paste a config code first.", "error");
      return;
    }
    setImporting(true);
    try {
      const next = await decodeConfig(importCode);
      setConfig(next);
      setImportCode("");
      notify("Config loaded into the dashboard.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setImporting(false);
    }
  }

  async function downloadJson() {
    const json = JSON.stringify(config, null, 2);
    downloadText("ply-config.json", json, "application/json");
  }

  async function makeCodeSnapshot() {
    const code = await encodeConfig(config);
    downloadText("ply-config.txt", code);
  }

  return (
    <Section
      eyebrow="Ship it"
      title="Export & apply"
      description="Copy one compact code. Paste it into Discord. Ply stores it per server."
    >
      <div className="grid two">
        <Card
          title="Your config code"
          description="The code is compressed JSON with short keys. Only changes from defaults are included."
          actions={
            <span className={`size-pill ${tooLong ? "is-over" : ""}`}>
              {encoding ? "…" : `${codeSize} / ${LIMIT}`}
            </span>
          }
        >
          {tooLong && (
            <Callout tone="warning" title="Over Discord's modal limit">
              Remove unused ticket types, questions, images or per-type overrides
              to get below 4,000 characters. Discord modals cannot accept more.
            </Callout>
          )}
          <textarea
            className="export-code"
            readOnly
            value={encoding ? "Packing…" : configCode}
            rows={10}
            onFocus={(event) => event.target.select()}
          />
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={copy}
              disabled={encoding || tooLong}
            >
              <Icon name="copy" size={16} />
              Copy config
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={makeCodeSnapshot}
              disabled={encoding}
            >
              <Icon name="download" size={16} />
              Download code
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={downloadJson}
            >
              <Icon name="code" size={16} />
              JSON backup
            </button>
          </div>

          <div className="steps">
            <div className="step">
              <span>1</span>
              <div>
                <strong>Copy the code</strong>
                <small>Keep the PLY1: prefix.</small>
              </div>
            </div>
            <div className="step">
              <span>2</span>
              <div>
                <strong>Run /config_import</strong>
                <small>The server owner pastes it into the modal.</small>
              </div>
            </div>
            <div className="step">
              <span>3</span>
              <div>
                <strong>Run /panel</strong>
                <small>Or use the Publish panel button in Discord.</small>
              </div>
            </div>
          </div>
        </Card>

        <div className="stack">
          <Card
            title="Readiness"
            description="Warnings are not blockers, but they usually matter."
          >
            {warnings.length === 0 ? (
              <Callout tone="success" title="Everything essential is set">
                Panel, permissions, categories and support channels look ready.
              </Callout>
            ) : (
              <div className="warning-list">
                {warnings.map((warning) => (
                  <div key={warning} className="warning-row">
                    <Icon name="warning" size={16} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Import an existing config"
            description="Paste the output of /config_export to continue editing here."
          >
            <Field label="Config code" wide>
              <TextArea
                value={importCode}
                onChange={setImportCode}
                rows={6}
                placeholder="PLY1:…"
                className="textarea mono"
              />
            </Field>
            <div className="button-row">
              <button
                type="button"
                className="button button-primary"
                onClick={importConfig}
                disabled={importing}
              >
                <Icon name="upload" size={16} />
                {importing ? "Loading…" : "Load config"}
              </button>
              <button
                type="button"
                className="button button-danger button-small"
                onClick={() => {
                  if (window.confirm("Reset all dashboard settings and the server snapshot?")) {
                    onReset();
                  }
                }}
              >
                <Icon name="reset" size={15} />
                Reset everything
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}
