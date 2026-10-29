import { useRef, useState } from "react";
import { decodeServerMap } from "@ply/shared";
import {
  Callout,
  Card,
  EmptyState,
  Icon,
  Section,
  TextArea,
} from "../components/ui.jsx";

export function ServerSection({ server, setServer, notify }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function importServer(value = code) {
    if (!value.trim()) {
      notify("Paste a server export first.", "error");
      return;
    }
    setBusy(true);
    try {
      const map = await decodeServerMap(value);
      setServer(map);
      setCode("");
      notify(`Imported ${map.channels.length} channels and ${map.roles.length} roles.`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCode(text);
    await importServer(text);
    event.target.value = "";
  }

  return (
    <Section
      eyebrow="Server map"
      title="Channels & roles"
      description="Import a snapshot from your server so every channel and role becomes a visual dropdown."
    >
      <div className="grid two">
        <Card
          title="Import server export"
          description="Run /export_server in Discord, then paste the code or upload the file."
        >
          <TextArea
            value={code}
            onChange={setCode}
            rows={8}
            placeholder="PLYSRV1:…"
            className="textarea mono"
          />
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => importServer()}
              disabled={busy}
            >
              <Icon name="download" size={16} />
              {busy ? "Reading…" : "Import server"}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" size={16} />
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.json"
              hidden
              onChange={onFile}
            />
          </div>
          <Callout tone="info" title="Why a snapshot?">
            The dashboard is static and never asks for a bot token. The export
            command gives the website exactly the IDs it needs.
          </Callout>
        </Card>

        <Card title="Current server" description="Used by every channel and role picker.">
          {!server?.guild?.id ? (
            <EmptyState icon="server" title="No server imported yet">
              You can still paste IDs manually, but the visual pickers are much
              faster after an import.
            </EmptyState>
          ) : (
            <>
              <div className="server-card">
                <div className="server-icon">
                  {server.guild.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${server.guild.id}/${server.guild.icon}.png?size=96`}
                      alt=""
                    />
                  ) : (
                    <Icon name="server" size={26} />
                  )}
                </div>
                <div>
                  <h3>{server.guild.name || "Imported server"}</h3>
                  <span className="mono muted">{server.guild.id}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat">
                  <strong>{server.channels.length}</strong>
                  <span>channels</span>
                </div>
                <div className="stat">
                  <strong>{server.roles.length}</strong>
                  <span>roles</span>
                </div>
                <div className="stat">
                  <strong>
                    {
                      server.channels.filter(
                        (channel) => channel.type === "category",
                      ).length
                    }
                  </strong>
                  <span>categories</span>
                </div>
              </div>
              <details className="accordion">
                <summary>
                  <span className="accordion-chevron">
                    <Icon name="chevron" size={16} />
                  </span>
                  <span className="accordion-title">
                    <strong>View imported channels</strong>
                    <small>Grouped by category</small>
                  </span>
                </summary>
                <div className="accordion-body server-list">
                  {server.channels.map((channel) => (
                    <div key={channel.id} className="server-list-row">
                      <span>
                        {channel.type === "category" ? "▾" : "#"}{" "}
                        {channel.name}
                      </span>
                      <code>{channel.id}</code>
                    </div>
                  ))}
                </div>
              </details>
              <button
                type="button"
                className="button button-danger button-small"
                onClick={() => {
                  setServer(null);
                  notify("Server snapshot cleared.");
                }}
              >
                <Icon name="trash" size={15} />
                Clear snapshot
              </button>
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
