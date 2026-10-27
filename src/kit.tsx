// Plain-React stand-ins for the components the dashboard was first built with.
// Same names and props, so App.tsx reads the same; always rendered in the dark theme.
import { useEffect, isValidElement } from "react";
import type { CSSProperties, ReactNode } from "react";

type Tone = "success" | "warning" | "danger";

const palettes = {
  dark: {
    bg: "#0f1012",
    paper: "#16171a",
    text: { primary: "#f2f3f5", secondary: "#c2c5cc", tertiary: "#8b8f98", accent: "#6ea8ff", success: "#3fcf8e", warning: "#f2b84b", danger: "#ff6b6b", onColor: "#ffffff" },
    fill: { accent: "#2f6fe4", secondary: "#24262b", successSubtle: "rgba(63,207,142,.14)", warningSubtle: "rgba(242,184,75,.14)", dangerSubtle: "rgba(255,107,107,.14)", accentSubtle: "rgba(110,168,255,.12)" },
    border: { subtle: "#24262b", default: "#30333a", strong: "#454952" },
  },
};

const base = {
  radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  weight: { regular: 400, medium: 500, semibold: 600 },
  font: {
    heading1: { fontSize: "28px", lineHeight: "36px" },
    heading2: { fontSize: "20px", lineHeight: "28px" },
    heading3: { fontSize: "17px", lineHeight: "24px" },
    body1: { fontSize: "15px", lineHeight: "24px" },
    body2: { fontSize: "14px", lineHeight: "21px" },
    label: { fontSize: "12px", lineHeight: "18px" },
  },
};

export function useGrokTheme() {
  // Dark only: ignore OS/browser prefers-color-scheme.
  return { ...base, ...palettes.dark, kind: "dark" as const };
}

const toneColor = (t: ReturnType<typeof useGrokTheme>, tone?: Tone | "info" | "neutral" | "accent") =>
  tone === "success" ? t.text.success : tone === "warning" ? t.text.warning : tone === "danger" ? t.text.danger : t.text.primary;

export function Page(props: { title: string; summary?: string; width?: "column" | "wide" | "full"; children?: ReactNode }) {
  const t = useGrokTheme();
  const max = props.width === "full" ? "100%" : props.width === "wide" ? "1280px" : "700px";
  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.color = t.text.primary;
  }, [t.bg, t.text.primary]);
  return (
    <main style={{ maxWidth: max, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 style={{ ...base.font.heading1, fontWeight: 600, margin: 0, color: t.text.primary }}>{props.title}</h1>
      {props.summary && <p style={{ ...base.font.body1, color: t.text.secondary, margin: "10px 0 0" }}>{props.summary}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 32 }}>{props.children}</div>
    </main>
  );
}

export function Section(props: { heading?: string; children?: ReactNode }) {
  const t = useGrokTheme();
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {props.heading && <h2 style={{ ...base.font.heading2, fontWeight: 600, margin: 0, color: t.text.primary }}>{props.heading}</h2>}
      {props.children}
    </section>
  );
}

export function Text(props: { children?: ReactNode }) {
  const t = useGrokTheme();
  return <p style={{ ...base.font.body1, margin: 0, color: t.text.secondary }}>{props.children}</p>;
}

type Cell = string | { text: string; tone?: Tone } | ReactNode;

const isToneCell = (c: unknown): c is { text: string; tone?: Tone } =>
  typeof c === "object" && c !== null && !isValidElement(c) && "text" in (c as object);

export function Table(props: { columns: string[]; rows: Cell[][]; align?: ("auto" | "start" | "end")[] }) {
  const t = useGrokTheme();
  const cellStyle = (i: number): CSSProperties => ({
    textAlign: props.align?.[i] === "end" ? "right" : "left",
    padding: "10px 12px",
    borderBottom: `1px solid ${t.border.subtle}`,
    verticalAlign: "top",
    ...base.font.body2,
  });
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${t.border.default}`, borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {props.columns.map((c, i) => (
              <th key={i} style={{ ...cellStyle(i), color: t.text.tertiary, fontWeight: 500, ...base.font.label, whiteSpace: "nowrap" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} style={{ ...cellStyle(ci), color: ci === 0 ? t.text.primary : t.text.secondary, fontWeight: ci === 0 ? 500 : 400 }}>
                  {isToneCell(c) ? <span style={{ color: toneColor(t, c.tone) }}>{c.text}</span> : (c as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout(props: { lead?: string; tone?: Tone | "info"; children?: ReactNode }) {
  const t = useGrokTheme();
  const bg =
    props.tone === "success" ? t.fill.successSubtle : props.tone === "warning" ? t.fill.warningSubtle : props.tone === "danger" ? t.fill.dangerSubtle : props.tone === "info" ? t.fill.accentSubtle : t.fill.secondary;
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 16px", ...base.font.body1, color: t.text.primary }}>
      {props.lead && <strong style={{ fontWeight: 600 }}>{props.lead} </strong>}
      {props.children}
    </div>
  );
}

export function Button(props: { label: string; onClick: () => void; variant?: "primary" | "quiet"; disabled?: boolean }) {
  const t = useGrokTheme();
  const primary = props.variant === "primary";
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        ...base.font.body2,
        fontWeight: 500,
        padding: "6px 12px",
        borderRadius: 8,
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.45 : 1,
        border: `1px solid ${primary ? t.fill.accent : t.border.default}`,
        background: primary ? t.fill.accent : "transparent",
        color: primary ? t.text.onColor : t.text.primary,
      }}
    >
      {props.label}
    </button>
  );
}

export function Status(props: { tone?: Tone | "accent" | "neutral"; children: ReactNode }) {
  const t = useGrokTheme();
  const bg = props.tone === "success" ? t.fill.successSubtle : props.tone === "warning" ? t.fill.warningSubtle : props.tone === "danger" ? t.fill.dangerSubtle : t.fill.secondary;
  return (
    <span style={{ ...base.font.label, fontWeight: 500, padding: "2px 8px", borderRadius: 9999, background: bg, color: props.tone === "neutral" || !props.tone ? t.text.secondary : toneColor(t, props.tone) }}>
      {props.children}
    </span>
  );
}

type SegOpt<T extends string> = T | { value: T; label: string; count?: number };

export function Segmented<T extends string = string>(props: { options: SegOpt<T>[]; value: T; onChange: (v: T) => void }) {
  const t = useGrokTheme();
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 2, padding: 2, borderRadius: 10, background: t.fill.secondary }}>
      {props.options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const on = opt.value === props.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => props.onChange(opt.value)}
            style={{
              ...base.font.body2,
              fontWeight: 500,
              border: 0,
              borderRadius: 8,
              padding: "5px 12px",
              cursor: "pointer",
              background: on ? t.paper : "transparent",
              color: on ? t.text.primary : t.text.secondary,
              boxShadow: on ? `0 0 0 1px ${t.border.default}` : "none",
            }}
          >
            {opt.label}
            {"count" in opt && opt.count !== undefined && <span style={{ color: t.text.tertiary, marginLeft: 6 }}>{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}


/** "No Site" label: Super Star–style cycling rainbow text (see .no-site in styles.css). */
export function NoSite() {
  return (
    <span className="no-site" title="No website: none found, or only social/directory listings">
      No Site
    </span>
  );
}
