import { useEffect, useMemo, useRef, useState } from "react";
import { createDefaultConfig, encodeConfig } from "@ply/shared";
import { PreviewRail } from "./components/Preview.jsx";
import { Icon } from "./components/ui.jsx";
import { deleteAtPath, updateAtPath } from "./lib/setPath.js";
import {
  clearLocalState,
  loadConfig,
  loadServer,
  saveConfig,
  saveServer,
} from "./lib/storage.js";
import { validateConfig } from "./lib/validate.js";
import { AccessSection } from "./sections/AccessSection.jsx";
import { BrandSection } from "./sections/BrandSection.jsx";
import { ExportSection } from "./sections/ExportSection.jsx";
import { MediaSection } from "./sections/MediaSection.jsx";
import { MessagesSection } from "./sections/MessagesSection.jsx";
import { ServerSection } from "./sections/ServerSection.jsx";
import { TypesSection } from "./sections/TypesSection.jsx";

const NAV = [
  { id: "brand", label: "Brand & panel", icon: "palette", hint: "Identity" },
  { id: "types", label: "Ticket types", icon: "ticket", hint: "Flows" },
  { id: "messages", label: "Message studio", icon: "message", hint: "Embeds" },
  { id: "media", label: "GIFs & media", icon: "image", hint: "Animation" },
  { id: "access", label: "Access & timing", icon: "shield", hint: "Rules" },
  { id: "server", label: "Server", icon: "server", hint: "Channels" },
  { id: "export", label: "Export & apply", icon: "download", hint: "Ship" },
];

export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [server, setServer] = useState(loadServer);
  const [section, setSection] = useState("brand");
  const [selectedTypeId, setSelectedTypeId] = useState(
    () => loadConfig().ticketTypes[0]?.id || "",
  );
  const [toast, setToast] = useState(null);
  const [saveState, setSaveState] = useState("saved");
  const [configCode, setConfigCode] = useState("");
  const [encoding, setEncoding] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const toastTimer = useRef(null);
  const mainRef = useRef(null);

  const selectedType = useMemo(
    () =>
      config.ticketTypes.find((type) => type.id === selectedTypeId) ||
      config.ticketTypes[0] ||
      null,
    [config.ticketTypes, selectedTypeId],
  );
  const warnings = useMemo(
    () => validateConfig(config, server),
    [config, server],
  );

  useEffect(() => {
    setSaveState("saving");
    const timer = setTimeout(() => {
      saveConfig(config);
      setSaveState("saved");
    }, 300);
    return () => clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    saveServer(server);
  }, [server]);

  useEffect(() => {
    if (
      config.ticketTypes.length &&
      !config.ticketTypes.some((type) => type.id === selectedTypeId)
    ) {
      setSelectedTypeId(config.ticketTypes[0].id);
    }
  }, [config.ticketTypes, selectedTypeId]);

  useEffect(() => {
    let cancelled = false;
    setEncoding(true);
    const timer = setTimeout(async () => {
      try {
        const code = await encodeConfig(config);
        if (!cancelled) setConfigCode(code);
      } catch {
        if (!cancelled) setConfigCode("");
      } finally {
        if (!cancelled) setEncoding(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [config]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function notify(message, tone = "success") {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }

  function update(path, value) {
    setConfig((previous) => updateAtPath(previous, path, value));
  }

  function remove(path) {
    setConfig((previous) => deleteAtPath(previous, path));
  }

  function navigate(id) {
    setSection(id);
    setMobileNav(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    clearLocalState();
    const next = createDefaultConfig();
    setConfig(next);
    setServer(null);
    setSelectedTypeId(next.ticketTypes[0]?.id || "");
    notify("Dashboard reset to defaults.");
  }

  const content = {
    brand: (
      <BrandSection config={config} update={update} server={server} />
    ),
    types: (
      <TypesSection
        config={config}
        update={update}
        remove={remove}
        server={server}
        selectedTypeId={selectedType?.id || ""}
        setSelectedTypeId={setSelectedTypeId}
      />
    ),
    messages: (
      <MessagesSection
        config={config}
        update={update}
        server={server}
        selectedType={selectedType}
      />
    ),
    media: <MediaSection config={config} update={update} />,
    access: (
      <AccessSection config={config} update={update} server={server} />
    ),
    server: (
      <ServerSection server={server} setServer={setServer} notify={notify} />
    ),
    export: (
      <ExportSection
        config={config}
        setConfig={setConfig}
        configCode={configCode}
        encoding={encoding}
        warnings={warnings}
        notify={notify}
        onReset={resetAll}
      />
    ),
  }[section];

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <button
          type="button"
          className="brand"
          onClick={() => navigate("brand")}
          aria-label="Ply home"
        >
          <span className="brand-mark">P</span>
          <span className="brand-text">
            <strong>Ply</strong>
            <small>Just apply, but customized.</small>
          </span>
        </button>

        <nav className="nav">
          {NAV.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${section === item.id ? "is-active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={17} />
              </span>
              <span className="nav-label">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {item.id === "export" && warnings.length > 0 && (
                <span className="nav-dot" title={`${warnings.length} warnings`} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="save-state">
            <span className={`save-dot ${saveState}`} />
            {saveState === "saving" ? "Saving…" : "Saved locally"}
          </div>
          <div className="sidebar-slogan">
            <span>Ply</span>
            <p>Just apply, but customized.</p>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setMobileNav((current) => !current)}
            aria-label="Toggle navigation"
          >
            <Icon name="sliders" size={19} />
          </button>
          <div className="topbar-title">
            <span className="eyebrow">{NAV.find((item) => item.id === section)?.hint}</span>
            <strong>{NAV.find((item) => item.id === section)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`status-pill ${warnings.length ? "has-warning" : ""}`}>
              <span />
              {warnings.length
                ? `${warnings.length} check${warnings.length === 1 ? "" : "s"}`
                : "Ready"}
            </span>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => navigate("server")}
            >
              <Icon name="server" size={15} />
              Server
            </button>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={() => navigate("export")}
            >
              <Icon name="download" size={15} />
              Export
            </button>
          </div>
        </header>

        <main className="main" ref={mainRef}>
          <div className="main-inner">
            <div className="content-column">{content}</div>
            <PreviewRail
              config={config}
              server={server}
              selectedType={selectedType}
            />
          </div>
          <footer className="page-footer">
            <span>Ply · Just apply, but customized.</span>
            <span>Static dashboard · external media only · no bot token required.</span>
          </footer>
        </main>
      </div>

      {mobileNav && (
        <button
          type="button"
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.tone}`} role="status">
          <Icon name={toast.tone === "error" ? "warning" : "check"} size={18} />
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
