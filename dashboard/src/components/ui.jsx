import { useId, useMemo, useState } from "react";
import {
  categoryOptions,
  channelsGrouped,
  roleOptions,
  serverIsImported,
} from "../lib/server.js";

const paths = {
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  sliders: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4M14 4v4M6 10v4M18 16v4",
  ticket: "M4 7a2 2 0 012-2h12a2 2 0 012 2v2a3 3 0 000 6v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a3 3 0 000-6V7z M14 5v14",
  message: "M4 5h16v11H8l-4 4V5z",
  image: "M4 5h16v14H4V5zm3 9l3-3 2 2 3-4 3 5M8 8h.01",
  server: "M4 5h16v5H4V5zm0 9h16v5H4v-5zM8 7.5h.01M8 16.5h.01",
  download: "M12 4v10m0 0l4-4m-4 4l-4-4M5 19h14",
  plus: "M12 5v14M5 12h14",
  trash: "M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9 7V4h6v3",
  copy: "M8 8h11v11H8V8zm-3 0V4h3M5 8v11h3",
  check: "M5 12l4 4L19 6",
  warning: "M12 4l9 16H3L12 4zm0 5v5m0 3h.01",
  chevron: "M8 10l4 4 4-4",
  palette: "M12 3a9 9 0 100 18h1a2 2 0 001-3.7 2 2 0 011.7-3.3H18A3 3 0 0021 12a9 9 0 00-9-9zM7.5 11h.01M9 7.5h.01M14 7h.01",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16zm0 4v4l3 2",
  shield: "M12 3l8 3v5c0 5-3.5 8.3-8 10-4.5-1.7-8-5-8-10V6l8-3z",
  eye: "M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6zm9 2a2 2 0 100-4 2 2 0 000 4z",
  reset: "M5 8a8 8 0 111-4M5 4v4h4",
  upload: "M12 20V9m0 0l-4 4m4-4l4 4M5 5h14",
  external: "M14 5h5v5M19 5l-8 8M18 14v5H5V6h5",
  lock: "M6 10h12v10H6V10zm3 0V7a3 3 0 016 0v3",
  code: "M9 6l-5 6 5 6M15 6l5 6-5 6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
  arrow: "M5 12h14m0 0l-5-5m5 5l-5 5",
  play: "M8 5l11 7-11 7V5z",
  info: "M12 4a8 8 0 100 16 8 8 0 000-16zm0 7v5m0-8h.01",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
};

export function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.sparkle} />
    </svg>
  );
}

export function Field({ label, hint, children, wide = false, error }) {
  const id = useId();
  return (
    <div className={`field ${wide ? "field-wide" : ""} ${error ? "field-error" : ""}`}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-hint field-hint-error">{error}</span>}
    </div>
  );
}

export function TextInput({ value = "", onChange, ...props }) {
  return (
    <input
      className="input"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  );
}

export function TextArea({ value = "", onChange, rows = 3, ...props }) {
  return (
    <textarea
      className="textarea"
      rows={rows}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  );
}

export function NumberInput({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <div className="number-wrap">
      <input
        className="input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
      {suffix && <span className="number-suffix">{suffix}</span>}
    </div>
  );
}

export function ColorInput({ value = "", onChange, allowEmpty = false }) {
  const display = /^#[0-9a-f]{6}$/i.test(value) ? value : "#7c5cfc";
  return (
    <div className="color-wrap">
      <input
        className="color-swatch"
        type="color"
        value={display}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label="Pick a color"
      />
      <input
        className="input mono"
        value={value}
        placeholder={allowEmpty ? "Accent color" : "#7C5CFC"}
        onChange={(event) => onChange?.(event.target.value)}
        maxLength={7}
      />
      {allowEmpty && value && (
        <button type="button" className="mini-button" onClick={() => onChange?.("")}>
          Clear
        </button>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span>
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <button
        type="button"
        className={`switch ${checked ? "is-on" : ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
      >
        <span />
      </button>
    </label>
  );
}

export function Select({ value, onChange, options = [], groups = [], placeholder, ...props }) {
  return (
    <select
      className="input select"
      value={value || ""}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    >
      {placeholder !== false && <option value="">{placeholder || "Not set"}</option>}
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ChannelSelect({ value, onChange, server, categoriesOnly = false }) {
  const imported = serverIsImported(server);
  const groups = categoriesOnly
    ? [{ label: "Categories", options: categoryOptions(server) }]
    : channelsGrouped(server);
  const known = useMemo(() => {
    if (!server) return false;
    return server.channels.some((channel) => channel.id === value);
  }, [server, value]);

  if (!imported) {
    return (
      <div>
        <TextInput
          value={value}
          onChange={onChange}
          placeholder="Paste the channel ID"
          className="input mono"
        />
        <span className="field-hint">
          Import a server export to pick channels visually.
        </span>
      </div>
    );
  }

  return (
    <div>
      <Select
        value={value}
        onChange={onChange}
        groups={groups}
        placeholder={categoriesOnly ? "Select a category" : "Select a channel"}
      />
      {value && !known && (
        <span className="field-hint field-hint-error">
          This ID is not in the current server export.
        </span>
      )}
    </div>
  );
}

export function RoleMultiSelect({ values = [], onChange, server }) {
  const options = roleOptions(server);
  const [open, setOpen] = useState(false);
  const imported = serverIsImported(server);

  function toggle(id) {
    if (values.includes(id)) onChange(values.filter((value) => value !== id));
    else onChange([...values, id]);
  }

  if (!imported || !options.length) {
    return (
      <div>
        <TextInput
          value={values.join(", ")}
          onChange={(value) =>
            onChange(
              value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
            )
          }
          placeholder="Role IDs separated by commas"
        />
        {!imported && (
          <span className="field-hint">
            Import a server export to pick roles visually.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="role-picker">
      <div className="role-picker-summary">
        <div className="chips">
          {values.length === 0 && <span className="muted">No roles selected</span>}
          {values.map((id) => {
            const role = options.find((entry) => entry.value === id);
            return (
              <button
                type="button"
                key={id}
                className="chip chip-removable"
                onClick={() => toggle(id)}
              >
                @{role?.label || id}
                <span>×</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mini-button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Done" : "Edit roles"}
        </button>
      </div>
      {open && (
        <div className="role-picker-list">
          {options.map((role) => (
            <label key={role.value} className="check-row">
              <input
                type="checkbox"
                checked={values.includes(role.value)}
                onChange={() => toggle(role.value)}
              />
              <span>@{role.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImageField({ value, onChange, placeholder = "https://…" }) {
  return (
    <div className="image-field">
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input"
      />
      {/^https?:\/\//i.test(value) && (
        <div className="image-preview">
          <img src={value} alt="" loading="lazy" />
        </div>
      )}
      <span className="field-hint">
        External URL only. Ply never stores or uploads images.
      </span>
    </div>
  );
}

export function Section({ title, eyebrow, description, actions, children }) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, description, actions, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-heading">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Callout({ tone = "info", title, children }) {
  const icons = { info: "info", warning: "warning", success: "check" };
  return (
    <div className={`callout callout-${tone}`}>
      <Icon name={icons[tone]} size={18} />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({ icon = "sparkle", title, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={24} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Accordion({ title, description, badge, open = false, children }) {
  return (
    <details className="accordion" open={open}>
      <summary>
        <span className="accordion-chevron">
          <Icon name="chevron" size={16} />
        </span>
        <span className="accordion-title">
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        {badge && <Badge>{badge}</Badge>}
      </summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
