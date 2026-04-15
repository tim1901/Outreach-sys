import { useState, useRef, useEffect, useCallback } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

/* ── Fonts & Global CSS ─────────────────────────────────────────────────── */
const _fl = document.createElement("link");
_fl.rel = "stylesheet";
_fl.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap";
document.head.appendChild(_fl);

const _gs = document.createElement("style");
_gs.textContent = `
  :root {
    --bg: #0f0f10;
    --bg2: #161618;
    --bg3: #1c1c1f;
    --border: #27272a;
    --border2: #3f3f46;
    --text: #fafafa;
    --text2: #a1a1aa;
    --text3: #71717a;
    --green: #22c55e;
    --green-d: #16a34a;
    --blue: #3b82f6;
    --orange: #f97316;
    --purple: #a855f7;
    --red: #ef4444;
    --yellow: #eab308;
    --accent: #22c55e;
    --fd: 'Bricolage Grotesque', sans-serif;
    --fi: 'Inter', sans-serif;
    --r: 10px;
    --r2: 14px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--fi); font-size: 14px; line-height: 1.5; }
  ::placeholder { color: var(--text3); }
  select option { background: var(--bg2); }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  @keyframes shimmer { 0% { opacity:.5; } 50% { opacity:1; } 100% { opacity:.5; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } 50% { box-shadow: 0 0 20px 4px rgba(34,197,94,.2); } }

  .anim { animation: fadeIn .3s ease both; }
  .anim1 { animation: fadeIn .3s .05s ease both; }
  .anim2 { animation: fadeIn .3s .1s ease both; }
  .anim3 { animation: fadeIn .3s .15s ease both; }
  .anim4 { animation: fadeIn .3s .2s ease both; }
  .anim5 { animation: fadeIn .3s .25s ease both; }

  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    transition: border-color .15s;
  }
  .card:hover { border-color: var(--border2); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border: none; border-radius: 8px; cursor: pointer;
    font-family: var(--fi); font-weight: 500; font-size: 13px;
    padding: 8px 16px; transition: all .15s; white-space: nowrap;
  }
  .btn-primary { background: var(--green); color: #000; font-weight: 600; }
  .btn-primary:hover { background: var(--green-d); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,.3); }
  .btn-primary:active { transform: none; box-shadow: none; }
  .btn-primary:disabled { background: var(--border); color: var(--text3); cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-secondary { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--border2); color: var(--text); background: var(--border); }
  .btn-secondary:disabled { opacity: .4; cursor: not-allowed; }

  .btn-ghost { background: transparent; color: var(--text3); border: 1px solid transparent; }
  .btn-ghost:hover { background: var(--bg3); color: var(--text2); border-color: var(--border); }

  .inp {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-family: var(--fi); font-size: 14px;
    padding: 10px 14px; outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .inp:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(34,197,94,.12); }

  .inp-lg {
    width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--border);
    color: var(--text); font-family: var(--fd); font-size: 24px; font-weight: 700;
    padding: 8px 0; outline: none; transition: border-color .15s;
  }
  .inp-lg:focus { border-bottom-color: var(--green); }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 20px; font-size: 11px;
    font-weight: 500; letter-spacing: .3px;
  }

  .row { display: flex; align-items: center; gap: 10px; }
  .col { display: flex; flex-direction: column; gap: 12px; }
  .lbl { font-size: 11px; font-weight: 500; color: var(--text3); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 6px; }
  .section-title { font-family: var(--fd); font-weight: 700; font-size: 16px; margin-bottom: 16px; }

  .tab-bar { display: flex; gap: 2px; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 3px; }
  .tab { flex: 0 0 auto; padding: 7px 14px; border-radius: 7px; border: none; background: transparent; color: var(--text3); font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: var(--fi); }
  .tab.active { background: var(--bg3); color: var(--text); border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,.3); }

  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r2); padding: 20px; text-align: center; }
  .stat-val { font-family: var(--fd); font-weight: 800; font-size: 30px; line-height: 1; margin-bottom: 4px; }
  .stat-lbl { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: .8px; }

  .contact-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border-radius: 10px;
    background: var(--bg3); border: 1px solid var(--border);
    cursor: pointer; transition: all .15s; margin-bottom: 8px;
  }
  .contact-row:hover { border-color: var(--border2); background: var(--bg2); }
  .contact-row.selected { border-color: var(--green); background: rgba(34,197,94,.06); }

  .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; flex-shrink: 0;
    font-family: var(--fd);
  }

  .pain-card {
    padding: 14px 16px; border-radius: 10px;
    background: var(--bg3); border: 1px solid var(--border);
    margin-bottom: 10px; transition: border-color .15s;
  }
  .pain-card:hover { border-color: var(--border2); }

  .email-box {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px;
  }

  .tracker-row {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; margin-bottom: 8px;
    transition: border-color .15s;
  }
  .tracker-row:hover { border-color: var(--border2); }
  .tracker-row.expanded { border-color: rgba(34,197,94,.3); }

  .progress-bar { height: 5px; background: var(--bg3); border-radius: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 10px; transition: width .6s ease; }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .footer-link { color: var(--text3); text-decoration: none; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; transition: color .15s; }
  .footer-link:hover { color: var(--green); }

  .stage-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Clay-style input group */
  .input-group { position: relative; }
  .input-group .inp { padding-right: 40px; }
  .input-group .inp-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }

  /* Skeleton loader */
  .skeleton { background: linear-gradient(90deg, var(--bg3) 25%, var(--border) 50%, var(--bg3) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
`;
document.head.appendChild(_gs);

/* ── Utilities ──────────────────────────────────────────────────────────── */

// Strip all citation tags like text
const stripCitations = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/]*>([\s\S]*?)<\/antml:cite>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Recursively strip citations from any object/array
const deepStrip = (obj) => {
  if (typeof obj === "string") return stripCitations(obj);
  if (Array.isArray(obj)) return obj.map(deepStrip);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepStrip(obj[k]);
    return out;
  }
  return obj;
};

const catColor = (cat) => {
  if (!cat) return { c: "var(--blue)", bg: "rgba(59,130,246,.12)" };
  if (cat.includes("AI") || cat.includes("Tech")) return { c: "var(--green)", bg: "rgba(34,197,94,.1)" };
  if (cat.includes("Virtual")) return { c: "var(--orange)", bg: "rgba(249,115,22,.1)" };
  return { c: "var(--blue)", bg: "rgba(59,130,246,.1)" };
};

const confMeta = (c) => ({
  high: { c: "var(--green)", bg: "rgba(34,197,94,.1)", label: "High confidence" },
  medium: { c: "var(--yellow)", bg: "rgba(234,179,8,.1)", label: "Medium confidence" },
  low: { c: "var(--text3)", bg: "rgba(113,113,122,.1)", label: "Low confidence" },
}[c] || { c: "var(--text3)", bg: "rgba(113,113,122,.1)", label: "Unknown" });

const STATUS_META = {
  "Sent":        { c: "#f97316", bg: "rgba(249,115,22,.1)", dot: "#f97316" },
  "Opened":      { c: "#3b82f6", bg: "rgba(59,130,246,.1)", dot: "#3b82f6" },
  "Replied":     { c: "#22c55e", bg: "rgba(34,197,94,.1)", dot: "#22c55e" },
  "No Response": { c: "#71717a", bg: "rgba(113,113,122,.1)", dot: "#71717a" },
  "Converted":   { c: "#a855f7", bg: "rgba(168,85,247,.1)", dot: "#a855f7" },
};
const STATUS_OPTS = Object.keys(STATUS_META);

const avatarColors = ["#22c55e","#3b82f6","#f97316","#a855f7","#ec4899","#06b6d4","#eab308"];
const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

/* ── Prompts ────────────────────────────────────────────────────────────── */
const SYS_AGENT = `You are an expert B2B outreach specialist working for Timileyin Ajuwon — AI specialist, Virtual Assistant, and Operations expert based in Ibadan, Nigeria.

Your task: research the company and write a compelling, personalized outreach email.

Email formula:
1. Hook — one specific, researched observation about the company
2. Pain point — the problem this signals for them
3. Free value — 2-3 actionable steps they can take themselves
4. Soft CTA — naturally offer that Timileyin can handle this if they'd rather delegate

Tone: Warm, confident, peer-to-peer. Like a smart friend giving free advice, not a vendor pitching.

Timileyin's services: AI workflow automation, no-code tool implementation (Notion/Zapier/Make), virtual assistance, operations optimization, SOPs, process documentation.

IMPORTANT RULES:
- Do NOT include any citation markers, reference tags, or source annotations in your response
- Write all text as clean, natural prose with no special markup
- Return ONLY a valid JSON object with no markdown fences, no backticks, no preamble

Required JSON format:
{
  "companyOverview": "2-3 clean sentences about what the company does and their current state. No citations.",
  "painPoints": [
    {
      "category": "AI/Tech OR Virtual Assistant OR Operations",
      "point": "Specific pain point headline",
      "signal": "One clean sentence explaining what signals this pain point exists. No citations or source references."
    }
  ],
  "primaryPainPoint": "The single most compelling pain point to focus on",
  "emailSubject": "A compelling subject line",
  "emailBody": "Full email body, 150-200 words, signed off as Timileyin. No citations.",
  "contacts": [
    {
      "role": "Job title",
      "name": "Full name or Unknown",
      "email": "Best guess email or unknown",
      "confidence": "high or medium or low"
    }
  ]
}`;

const SYS_FOLLOWUP = `Write a brief follow-up email for Timileyin Ajuwon (AI specialist, VA, Ops expert). The prospect has not replied to the original outreach.

Rules:
- Max 100 words
- Warm and human, not desperate
- Add a fresh angle or new value point
- End with a simple yes/no question as CTA
- No citation markers, no special markup, clean text only

Return ONLY valid JSON, no backticks:
{"subject":"follow-up subject","body":"follow-up email body"}`;

const SYS_CONTACTS = `You are a B2B contact research specialist. Find the most relevant decision-makers at this company for AI automation, virtual assistance, or operations consulting outreach.

Target roles: CEO, Founder, COO, Head of Operations, Chief of Staff, Executive Assistant, Office Manager.

Rules:
- No citation markers, no reference tags in any field
- All text must be clean prose

Return ONLY valid JSON, no backticks:
{
  "contacts": [
    {
      "name": "Full name or Unknown",
      "role": "Job title",
      "email": "best-guess@domain.com or unknown",
      "linkedin": "https://linkedin.com/in/... or unknown",
      "confidence": "high or medium or low",
      "reasoning": "One sentence explaining why this person is the right contact."
    }
  ],
  "companyDomain": "company.com or unknown",
  "emailPattern": "firstname@domain.com or unknown"
}`;

/* ── API Layer ──────────────────────────────────────────────────────────── */
async function callClaude(apiKey, system, userMsg, useSearch = false) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userMsg }],
  };
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.content.filter(b => b.type === "text").map(b => b.text).join("");

  // Strip citations from raw text before parsing
  const cleanText = stripCitations(rawText);

  const match = cleanText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response. Please retry.");

  let parsed;
  try { parsed = JSON.parse(match[0]); }
  catch {
    const cleaned = match[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
      .replace(/,\s*([}\]])/g, "$1");
    parsed = JSON.parse(cleaned);
  }

  // Deep strip citations from all string fields
  return deepStrip(parsed);
}

async function sendViaGmail(to, subject, body) {
  if (!window.__GTOKEN__) throw new Error("Gmail not connected");
  const raw = btoa(unescape(encodeURIComponent(
    [`To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=utf-8`, ``, body].join("\r\n")
  ))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.__GTOKEN__}` },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) throw new Error("Gmail send failed");
}

/* ── Shared Components ───────────────────────────────────────────────────── */
const Spinner = ({ size = 16, color = "var(--green)" }) => (
  <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: color, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
);

const Badge = ({ label, color, bg }) => (
  <span className="badge" style={{ background: bg, color, border: `1px solid ${color}25` }}>{label}</span>
);

const ErrBanner = ({ msg, onRetry }) => (
  <div className="anim" style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 15 }}>⚠</span>
      <span style={{ fontSize: 13, color: "var(--red)", lineHeight: 1.5 }}>{msg}</span>
    </div>
    {onRetry && <button className="btn btn-ghost" onClick={onRetry} style={{ color: "var(--red)", borderColor: "rgba(239,68,68,.3)", fontSize: 12, padding: "5px 12px" }}>Retry</button>}
  </div>
);

const SectionCard = ({ children, className = "", style = {} }) => (
  <div className={`card ${className}`} style={{ padding: "20px 22px", ...style }}>{children}</div>
);

const Label = ({ children }) => <div className="lbl">{children}</div>;

/* ── API Key Gate ────────────────────────────────────────────────────────── */
function ApiKeyGate({ onKey }) {
  const [k, setK] = useState("");
  const valid = k.startsWith("sk-");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Subtle background */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(34,197,94,.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(59,130,246,.03) 0%, transparent 60%)", pointerEvents: "none" }} />

      <div className="anim" style={{ maxWidth: 440, width: "100%", position: "relative" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, background: "var(--green)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "glow 3s ease-in-out infinite", flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 20 }}>OutreachOS</div>
            <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: 1 }}>v1.0 · AI-Powered</div>
          </div>
        </div>

        <h1 style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 30, lineHeight: 1.15, marginBottom: 10, color: "var(--text)" }}>
          Your AI outreach<br />command center
        </h1>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 32 }}>
          Research companies, find contacts, write personalized emails, and track replies — all in one place.
        </p>

        <div className="card" style={{ padding: 24 }}>
          <Label>Anthropic API Key</Label>
          <input type="password" className="inp" value={k} onChange={e => setK(e.target.value)} onKeyDown={e => e.key === "Enter" && valid && onKey(k)} placeholder="sk-ant-api03-..." style={{ marginBottom: 14 }} autoFocus />
          <button className="btn btn-primary" onClick={() => valid && onKey(k)} disabled={!valid} style={{ width: "100%", padding: "11px 20px", fontSize: 14 }}>
            Get started →
          </button>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 14, lineHeight: 1.6 }}>
            Your key is stored only in your browser and sent directly to Anthropic. <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "none" }}>Get a key →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Research Stages ─────────────────────────────────────────────────────── */
const STAGES = [
  { label: "Searching the web", sub: "Finding recent news, job postings & signals" },
  { label: "Analyzing company", sub: "Identifying pain points and opportunities" },
  { label: "Writing email", sub: "Crafting personalized outreach copy" },
  { label: "Done", sub: "Review and send when ready" },
];

function ResearchProgress({ company, stageIdx }) {
  return (
    <div className="card" style={{ padding: 28, marginBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Researching</div>
        <div style={{ fontSize: 20, fontFamily: "var(--fd)", fontWeight: 800, color: "var(--green)" }}>{company}</div>
      </div>
      <div className="col" style={{ gap: 16 }}>
        {STAGES.map((s, i) => {
          const done = i < stageIdx;
          const active = i === stageIdx;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, opacity: i > stageIdx ? .3 : 1, transition: "opacity .4s" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "var(--green)" : active ? "rgba(34,197,94,.15)" : "var(--bg3)", border: `1px solid ${done ? "var(--green)" : active ? "rgba(34,197,94,.4)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "all .4s" }}>
                {done ? <span style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>✓</span> : active ? <Spinner size={12} /> : <span style={{ color: "var(--border2)", fontSize: 11 }}>{i + 1}</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : done ? "var(--text2)" : "var(--text3)", transition: "all .3s" }}>{s.label}</div>
                {active && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{s.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Agent Panel ─────────────────────────────────────────────────────────── */
function AgentPanel({ apiKey, onSent, templates }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [running, setRunning] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [selTemplate, setSelTemplate] = useState(null);
  const [selContact, setSelContact] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const run = useCallback(async () => {
    if (!company.trim()) return;
    setResult(null); setError(null); setSendStatus(null); setSelContact(null);
    setRunning(true); setStageIdx(0);
    try {
      const tick = (i) => new Promise(r => setTimeout(() => { setStageIdx(i); r(); }, 1600));
      await tick(0); await tick(1);
      const parsed = await callClaude(apiKey, SYS_AGENT, `Research this company and generate personalized outreach: "${company}". Be specific. Return only clean JSON with no citations or reference markers.`, true);
      await tick(2);
      let body = parsed.emailBody || "";
      if (selTemplate) {
        body = selTemplate.body.replace(/\[COMPANY\]/g, company).replace(/\[PAIN_POINT\]/g, parsed.primaryPainPoint || "");
      }
      setResult(parsed);
      setEditBody(body);
      setEditSubject(parsed.emailSubject || "");
      setStageIdx(3);
    } catch (e) { setError(e.message || "Something went wrong"); }
    setRunning(false);
  }, [company, apiKey, selTemplate]);

  const handleSend = async () => {
    if (!email.trim()) { alert("Please enter a recipient email address."); return; }
    setSendStatus("sending");
    try {
      await sendViaGmail(email, editSubject, editBody);
      setSendStatus("sent");
      onSent({
        id: Date.now(), company, recipient: email, subject: editSubject,
        emailBody: editBody, overview: result?.companyOverview || "",
        painPoints: result?.painPoints || [], contacts: result?.contacts || [],
        status: "Sent", sentAt: new Date().toISOString(), notes: "", followUps: [],
      });
    } catch { setSendStatus("error"); }
  };

  const reset = () => {
    setCompany(""); setEmail(""); setRunning(false); setStageIdx(-1);
    setResult(null); setError(null); setEditing(false); setSendStatus(null);
    setSelContact(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div>
      {/* Input form */}
      {!running && !result && (
        <div className="card anim" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ marginBottom: 22 }}>
            <Label>Company to research</Label>
            <input ref={inputRef} className="inp-lg" value={company} onChange={e => setCompany(e.target.value)} onKeyDown={e => e.key === "Enter" && run()} placeholder="e.g. Flutterwave, Paystack, Andela..." />
          </div>
          <div style={{ marginBottom: 22 }}>
            <Label>Recipient email <span style={{ color: "var(--border2)", textTransform: "none", letterSpacing: 0 }}>(optional — add after)</span></Label>
            <input className="inp" value={email} onChange={e => setEmail(e.target.value)} placeholder="ceo@company.com" />
          </div>
          {templates.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <Label>Apply template</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {templates.map(t => (
                  <button key={t.id} className="btn btn-secondary" onClick={() => setSelTemplate(selTemplate?.id === t.id ? null : t)} style={{ borderColor: selTemplate?.id === t.id ? "var(--green)" : "var(--border)", color: selTemplate?.id === t.id ? "var(--green)" : "var(--text2)", fontSize: 12 }}>
                    {selTemplate?.id === t.id && "✓ "}{t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={run} disabled={!company.trim()} style={{ padding: "11px 24px", fontSize: 14 }}>
            Research & write email →
          </button>
        </div>
      )}

      {/* Progress */}
      {running && <ResearchProgress company={company} stageIdx={stageIdx} />}

      {/* Error */}
      {error && <ErrBanner msg={error} onRetry={run} />}

      {/* Results */}
      {result && (
        <div className="col">
          {/* Company overview */}
          <SectionCard className="anim1">
            <div className="section-title">Company Overview</div>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.75 }}>{result.companyOverview}</p>
          </SectionCard>

          {/* Contacts */}
          {result.contacts?.length > 0 && (
            <SectionCard className="anim2">
              <div className="section-title">Decision Makers</div>
              {result.contacts.map((c, i) => {
                const cm = confMeta(c.confidence);
                const col = getAvatarColor(c.name);
                return (
                  <div key={i} className={`contact-row ${selContact === c ? "selected" : ""}`} onClick={() => { setSelContact(c); if (c.email && c.email !== "unknown") setEmail(c.email); }}>
                    <div className="avatar" style={{ background: `${col}20`, color: col, border: `1px solid ${col}30` }}>
                      {c.name && c.name !== "Unknown" ? c.name[0].toUpperCase() : "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.role}</div>
                    </div>
                    {c.email && c.email !== "unknown" && (
                      <div style={{ fontSize: 12, color: "var(--text2)", display: "none" }}>{c.email}</div>
                    )}
                    <Badge label={cm.label} color={cm.c} bg={cm.bg} />
                    {selContact === c && <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Pain points */}
          <SectionCard className="anim3">
            <div className="section-title">Pain Points Identified</div>
            {result.painPoints?.map((p, i) => {
              const col = catColor(p.category);
              return (
                <div key={i} className="pain-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Badge label={p.category} color={col.c} bg={col.bg} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>{p.point}</div>
                  <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 500, color: "var(--text2)" }}>Why this matters: </span>
                    {p.signal || p.evidence}
                  </div>
                </div>
              );
            })}
          </SectionCard>

          {/* Email */}
          <SectionCard className="anim4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Outreach Email</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setEditing(!e => !editing)} style={{ fontSize: 12, padding: "6px 14px" }}>{editing ? "Preview" : "Edit"}</button>
                <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(`Subject: ${editSubject}\n\n${editBody}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 12, padding: "6px 14px", borderColor: copied ? "var(--green)" : "var(--border)", color: copied ? "var(--green)" : "var(--text2)" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div style={{ background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginRight: 10, textTransform: "uppercase", letterSpacing: .8 }}>Subject</span>
              {editing
                ? <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--green)", fontSize: 13, fontFamily: "var(--fi)", width: "calc(100% - 70px)" }} />
                : <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{editSubject}</span>}
            </div>
            <div className="email-box">
              {editing
                ? <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{ width: "100%", minHeight: 220, background: "transparent", border: "none", color: "var(--text2)", fontSize: 13, lineHeight: 1.8, padding: 0, fontFamily: "var(--fi)", outline: "none", resize: "vertical" }} />
                : <div style={{ fontSize: 13, lineHeight: 1.85, color: "var(--text2)", whiteSpace: "pre-wrap" }}>{editBody}</div>}
            </div>
          </SectionCard>

          {/* Send */}
          <SectionCard className="anim5">
            <div className="section-title">Send via Gmail</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input className="inp" value={email} onChange={e => setEmail(e.target.value)} placeholder="Recipient email address..." style={{ flex: 1, minWidth: 200 }} />
              <button className="btn btn-primary" onClick={handleSend} disabled={sendStatus === "sending" || sendStatus === "sent"} style={{ padding: "11px 20px", opacity: sendStatus === "sending" ? .7 : 1 }}>
                {sendStatus === "sending" ? <><Spinner size={14} color="#000" /> Sending...</> : sendStatus === "sent" ? "✓ Sent & logged!" : "Send + log →"}
              </button>
            </div>
            {sendStatus === "sent" && (
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                <div className="stage-dot" style={{ background: "var(--green)", animation: "pulse 2s infinite" }} />
                Email sent and logged to your tracker
              </div>
            )}
            {sendStatus === "error" && <div style={{ marginTop: 12, fontSize: 13, color: "var(--red)" }}>Send failed. Use "Copy" to send manually from Gmail.</div>}
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={reset} style={{ fontSize: 13 }}>← Research another company</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Batch Panel ─────────────────────────────────────────────────────────── */
function BatchPanel({ apiKey, onBatchDone }) {
  const [input, setInput] = useState("");
  const [jobs, setJobs] = useState([]);
  const [running, setRunning] = useState(false);
  const companies = input.split("\n").map(s => s.trim()).filter(Boolean);

  const runBatch = async () => {
    if (!companies.length) return;
    setRunning(true);
    setJobs(companies.map(c => ({ company: c, status: "queued", result: null, error: null })));
    for (let i = 0; i < companies.length; i++) {
      setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "running" } : j));
      try {
        const r = await callClaude(apiKey, SYS_AGENT, `Research and generate outreach for: "${companies[i]}". Keep it concise. Return only clean JSON.`, true);
        setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "done", result: r } : j));
      } catch (e) {
        setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "error", error: e.message } : j));
      }
    }
    setRunning(false);
  };

  const logAll = () => {
    const entries = jobs.filter(j => j.status === "done" && j.result).map(j => ({
      id: Date.now() + Math.random(), company: j.company, recipient: "",
      subject: j.result.emailSubject || "", emailBody: j.result.emailBody || "",
      overview: j.result.companyOverview || "", painPoints: j.result.painPoints || [],
      contacts: j.result.contacts || [], status: "Sent",
      sentAt: new Date().toISOString(), notes: "", followUps: [],
    }));
    onBatchDone(entries);
  };

  const statusMeta = { queued: { icon: "—", color: "var(--text3)" }, running: { icon: null, color: "var(--yellow)" }, done: { icon: "✓", color: "var(--green)" }, error: { icon: "✕", color: "var(--red)" } };

  return (
    <div>
      <SectionCard className="anim" style={{ marginBottom: 16 }}>
        <div className="section-title">Batch Research</div>
        <Label>Companies — one per line</Label>
        <textarea className="inp" value={input} onChange={e => setInput(e.target.value)} placeholder={"Flutterwave\nPaystack\nPiggyVest\nChowdeck\nAndela"} disabled={running} style={{ minHeight: 140, resize: "vertical", lineHeight: 1.8, marginBottom: 16 }} />
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={runBatch} disabled={running || !input.trim()} style={{ padding: "11px 20px" }}>
            {running ? <><Spinner size={14} color="#000" /> Running ({jobs.filter(j => j.status === "done").length}/{companies.length})</> : `Run batch (${companies.length} companies) →`}
          </button>
          {jobs.some(j => j.status === "done") && !running && (
            <button className="btn btn-secondary" onClick={logAll} style={{ borderColor: "rgba(34,197,94,.3)", color: "var(--green)" }}>
              Log all to tracker →
            </button>
          )}
        </div>
      </SectionCard>

      <div className="col" style={{ gap: 8 }}>
        {jobs.map((j, i) => {
          const m = statusMeta[j.status];
          return (
            <div key={i} className="card" style={{ padding: "14px 18px", borderColor: j.status === "done" ? "rgba(34,197,94,.2)" : "var(--border)" }}>
              <div className="row">
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg3)", border: `1px solid var(--border)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {j.status === "running" ? <Spinner size={12} /> : <span style={{ color: m.color, fontSize: 12, fontWeight: 700 }}>{m.icon}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: j.result ? 4 : 0 }}>{j.company}</div>
                  {j.result && <div style={{ fontSize: 12, color: "var(--green)" }}>📧 {j.result.emailSubject}</div>}
                  {j.error && <div style={{ fontSize: 12, color: "var(--red)" }}>{j.error}</div>}
                  {j.result?.companyOverview && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2, lineHeight: 1.5 }}>{j.result.companyOverview.slice(0, 120)}...</div>}
                </div>
                <Badge label={j.status} color={m.color} bg={`${m.color}15`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Contacts Panel ──────────────────────────────────────────────────────── */
function ContactsPanel({ apiKey }) {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const find = async () => {
    if (!company.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try { setResult(await callClaude(apiKey, SYS_CONTACTS, `Find decision-makers at: "${company}". Return only clean JSON.`, true)); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <SectionCard className="anim" style={{ marginBottom: 16 }}>
        <div className="section-title">Contact Finder</div>
        <Label>Company name</Label>
        <input className="inp-lg" value={company} onChange={e => setCompany(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} placeholder="e.g. Andela, Interswitch..." style={{ marginBottom: 20 }} />
        <button className="btn btn-primary" onClick={find} disabled={loading || !company.trim()} style={{ padding: "11px 20px" }}>
          {loading ? <><Spinner size={14} color="#000" /> Searching...</> : "Find decision makers →"}
        </button>
      </SectionCard>

      {error && <ErrBanner msg={error} />}

      {result && (
        <div className="col">
          {(result.companyDomain && result.companyDomain !== "unknown") && (
            <SectionCard className="anim1">
              <div className="row" style={{ flexWrap: "wrap", gap: 24 }}>
                <div>
                  <Label>Company domain</Label>
                  <div style={{ fontWeight: 600, color: "var(--blue)", fontSize: 15 }}>{result.companyDomain}</div>
                </div>
                {result.emailPattern && result.emailPattern !== "unknown" && (
                  <div>
                    <Label>Email pattern</Label>
                    <div style={{ fontWeight: 600, color: "var(--orange)", fontSize: 14, fontFamily: "monospace" }}>{result.emailPattern}</div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard className="anim2">
            <div className="section-title">Decision Makers</div>
            {result.contacts?.map((c, i) => {
              const cm = confMeta(c.confidence);
              const col = getAvatarColor(c.name);
              return (
                <div key={i} className="card" style={{ padding: "16px 18px", marginBottom: 10, borderColor: `${cm.c}20` }}>
                  <div className="row" style={{ marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                    <div className="avatar" style={{ background: `${col}20`, color: col, border: `1px solid ${col}25`, width: 42, height: 42, fontSize: 16 }}>
                      {c.name && c.name !== "Unknown" ? c.name[0].toUpperCase() : "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text3)" }}>{c.role}</div>
                    </div>
                    <Badge label={cm.label} color={cm.c} bg={cm.bg} />
                  </div>
                  <div className="row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    {c.email && c.email !== "unknown" && (
                      <>
                        <span style={{ fontSize: 13, color: "var(--blue)", fontFamily: "monospace" }}>{c.email}</span>
                        <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(c.email); setCopied(i); setTimeout(() => setCopied(null), 2000); }} style={{ padding: "3px 10px", fontSize: 11 }}>
                          {copied === i ? "✓ Copied" : "Copy"}
                        </button>
                      </>
                    )}
                    {c.linkedin && c.linkedin !== "unknown" && (
                      <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--text3)", textDecoration: "none" }}>LinkedIn →</a>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6, fontStyle: "italic" }}>{c.reasoning}</div>
                </div>
              );
            })}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

/* ── Templates Panel ─────────────────────────────────────────────────────── */
function TemplatesPanel({ templates, setTemplates }) {
  const [name, setName] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [editId, setEditId] = useState(null);
  const save = () => {
    if (!name.trim() || !body.trim()) return;
    if (editId) { setTemplates(p => p.map(t => t.id === editId ? { ...t, name, subject, body } : t)); setEditId(null); }
    else setTemplates(p => [...p, { id: Date.now(), name, subject, body }]);
    setName(""); setSubject(""); setBody("");
  };
  const edit = t => { setEditId(t.id); setName(t.name); setSubject(t.subject || ""); setBody(t.body); };

  return (
    <div className="col">
      <SectionCard className="anim">
        <div className="section-title">{editId ? "Edit Template" : "New Template"}</div>
        <div style={{ marginBottom: 14 }}><Label>Template name</Label><input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AI Automation Pitch" /></div>
        <div style={{ marginBottom: 14 }}><Label>Subject line</Label><input className="inp" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Use [COMPANY] as a placeholder" /></div>
        <div style={{ marginBottom: 20 }}>
          <Label>Email body — use [COMPANY] and [PAIN_POINT]</Label>
          <textarea className="inp" value={body} onChange={e => setBody(e.target.value)} placeholder={"Hi there,\n\nI came across [COMPANY] recently..."} style={{ minHeight: 160, resize: "vertical", lineHeight: 1.8 }} />
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={save} disabled={!name.trim() || !body.trim()} style={{ padding: "11px 20px" }}>{editId ? "Update template" : "Save template"}</button>
          {editId && <button className="btn btn-ghost" onClick={() => { setEditId(null); setName(""); setSubject(""); setBody(""); }}>Cancel</button>}
        </div>
      </SectionCard>

      {templates.length === 0
        ? <SectionCard><div style={{ textAlign: "center", color: "var(--text3)", padding: "32px 0" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📝</div><div style={{ fontSize: 14 }}>No templates yet. Create one above.</div></div></SectionCard>
        : templates.map((t, i) => (
          <SectionCard key={t.id} className={`anim${Math.min(i + 1, 5)}`}>
            <div className="row" style={{ marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <button className="btn btn-secondary" onClick={() => edit(t)} style={{ fontSize: 12, padding: "5px 12px" }}>Edit</button>
              <button className="btn btn-ghost" onClick={() => setTemplates(p => p.filter(x => x.id !== t.id))} style={{ fontSize: 12, padding: "5px 12px", color: "var(--red)" }}>Delete</button>
            </div>
            {t.subject && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 6 }}>📧 {t.subject}</div>}
            <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6, maxHeight: 56, overflow: "hidden" }}>{t.body.slice(0, 200)}{t.body.length > 200 ? "..." : ""}</div>
          </SectionCard>
        ))}
    </div>
  );
}

/* ── Tracker Panel ───────────────────────────────────────────────────────── */
function TrackerPanel({ apiKey, log, setLog, onGoAgent }) {
  const [expandedId, setExpandedId] = useState(null);
  const [generatingFU, setGeneratingFU] = useState(null);
  const [checking, setChecking] = useState(false);
  const [replyMsg, setReplyMsg] = useState(null);

  const updateStatus = (id, s) => setLog(p => p.map(e => e.id === id ? { ...e, status: s } : e));
  const updateNotes = (id, n) => setLog(p => p.map(e => e.id === id ? { ...e, notes: n } : e));
  const del = (id) => { setLog(p => p.filter(e => e.id !== id)); if (expandedId === id) setExpandedId(null); };

  const genFU = async (entry) => {
    setGeneratingFU(entry.id);
    try {
      const r = await callClaude(apiKey, SYS_FOLLOWUP, `Company: ${entry.company}\nOriginal subject: ${entry.subject}\nOriginal email:\n${entry.emailBody}\n\nReturn only clean JSON.`);
      setLog(p => p.map(e => e.id === entry.id ? { ...e, followUps: [...(e.followUps || []), { ...r, generatedAt: new Date().toISOString(), sent: false }] } : e));
    } catch { alert("Failed to generate follow-up. Please retry."); }
    setGeneratingFU(null);
  };

  const sendFU = async (entry, fuIdx) => {
    if (!entry.recipient) { alert("No recipient email on this entry."); return; }
    const fu = entry.followUps[fuIdx];
    try {
      await sendViaGmail(entry.recipient, fu.subject, fu.body);
      setLog(p => p.map(e => e.id === entry.id ? { ...e, followUps: e.followUps.map((f, i) => i === fuIdx ? { ...f, sent: true, sentAt: new Date().toISOString() } : f) } : e));
    } catch { alert("Failed to send follow-up."); }
  };

  const checkReplies = async () => {
    setChecking(true); setReplyMsg(null);
    let found = 0;
    try {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread&maxResults=20`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
      const d = await r.json();
      for (const msg of (d.messages || [])) {
        const mr = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
        const md = await mr.json();
        const from = md.payload?.headers?.find(h => h.name === "From")?.value || "";
        setLog(p => {
          let ch = false;
          const nx = p.map(e => {
            if (e.status !== "Replied" && e.recipient && from.includes(e.recipient.split("@")[1] || "NOOP")) {
              ch = true; return { ...e, status: "Replied", replyDetectedAt: new Date().toISOString() };
            }
            return e;
          });
          if (ch) found++;
          return nx;
        });
      }
      setReplyMsg(found > 0 ? `✓ ${found} new reply detected!` : "No new replies found.");
    } catch { setReplyMsg("Could not check inbox. Make sure Gmail is connected."); }
    setChecking(false);
  };

  const bookCall = (entry) => {
    const s = encodeURIComponent(`Discovery Call — ${entry.company}`);
    const d = encodeURIComponent(`Follow-up call. Outreach: ${entry.subject}`);
    const st = new Date(Date.now() + 2 * 86400000); st.setHours(10, 0, 0, 0);
    const en = new Date(st.getTime() + 1800000);
    const fmt = x => x.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    window.open(`https://calendar.google.com/calendar/r/eventedit?text=${s}&details=${d}&dates=${fmt(st)}/${fmt(en)}&add=${encodeURIComponent(entry.recipient || "")}`, "_blank");
  };

  const exportCSV = () => {
    const rows = [["Company","Recipient","Subject","Status","Sent At","Notes","Follow-ups"]];
    log.forEach(e => rows.push([e.company, e.recipient, e.subject, e.status, new Date(e.sentAt).toLocaleDateString(), (e.notes||"").replace(/,/g,";"), (e.followUps||[]).filter(f=>f.sent).length]));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n")],{type:"text/csv"})); a.download=`outreach-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const stats = {
    total: log.length, sent: log.filter(e=>e.status==="Sent").length,
    replied: log.filter(e=>e.status==="Replied").length,
    converted: log.filter(e=>e.status==="Converted").length,
    noReply: log.filter(e=>e.status==="No Response").length,
  };

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {[["Total",stats.total,"var(--text)"],["Sent",stats.sent,"var(--orange)"],["Replied",stats.replied,"var(--green)"],["Converted",stats.converted,"var(--purple)"],["No Reply",stats.noReply,"var(--text3)"]].map(([l,v,c])=>(
          <div key={l} className="stat-card">
            <div className="stat-val" style={{ color: c }}>{v}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="row" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={checkReplies} disabled={checking} style={{ fontSize: 12 }}>
          {checking ? <><Spinner size={12} /> Checking...</> : "🔄 Check replies"}
        </button>
        {log.length > 0 && <button className="btn btn-secondary" onClick={exportCSV} style={{ fontSize: 12 }}>↓ Export CSV</button>}
        {replyMsg && <span style={{ fontSize: 13, color: replyMsg.includes("✓") ? "var(--green)" : "var(--text3)" }}>{replyMsg}</span>}
      </div>

      {log.length === 0 ? (
        <SectionCard>
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 8 }}>No outreach logged yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Send your first email from the Agent tab to start tracking</div>
            <button className="btn btn-primary" onClick={onGoAgent} style={{ padding: "11px 24px" }}>Go to Agent →</button>
          </div>
        </SectionCard>
      ) : log.map(entry => {
        const sm = STATUS_META[entry.status] || STATUS_META["Sent"];
        const isExp = expandedId === entry.id;
        return (
          <div key={entry.id} className={`tracker-row ${isExp ? "expanded" : ""}`}>
            {/* Row header */}
            <div className="row" style={{ padding: "14px 18px", flexWrap: "wrap", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.dot, flexShrink: 0, animation: entry.status === "Replied" ? "pulse 2s infinite" : "none" }} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{entry.company}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{entry.recipient || "No recipient"}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(entry.sentAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</div>
              {(entry.followUps||[]).length > 0 && <Badge label={`${(entry.followUps||[]).filter(f=>f.sent).length}/${(entry.followUps||[]).length} follow-ups`} color="var(--orange)" bg="rgba(249,115,22,.1)" />}
              {entry.replyDetectedAt && <Badge label="Auto-detected" color="var(--green)" bg="rgba(34,197,94,.1)" />}
              <select value={entry.status} onChange={e => updateStatus(entry.id, e.target.value)} style={{ background: sm.bg, border:`1px solid ${sm.c}30`, color: sm.c, padding:"5px 10px", fontSize:11, fontFamily:"var(--fi)", cursor:"pointer", outline:"none", borderRadius:6, fontWeight:500 }}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-secondary" onClick={() => setExpandedId(isExp ? null : entry.id)} style={{ fontSize: 12, padding: "5px 12px" }}>{isExp ? "Close" : "View"}</button>
              <button onClick={() => del(entry.id)} style={{ background:"transparent", border:"none", color:"var(--border2)", fontSize:18, cursor:"pointer", padding:"2px 6px", lineHeight:1, transition:"color .15s" }} onMouseEnter={e=>e.target.style.color="var(--red)"} onMouseLeave={e=>e.target.style.color="var(--border2)"}>×</button>
            </div>

            {/* Expanded content */}
            {isExp && (
              <div style={{ borderTop:"1px solid var(--border)", padding:"20px 18px 24px", background:"var(--bg)" }}>
                <div style={{ marginBottom: 18 }}>
                  <Label>Subject</Label>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--green)" }}>{entry.subject}</div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <Label>Email sent</Label>
                  <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.85, whiteSpace: "pre-wrap", background: "var(--bg2)", borderRadius: 10, padding: 16, maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)" }}>{entry.emailBody}</div>
                </div>
                {(entry.status === "Replied" || entry.status === "Converted") && (
                  <div style={{ marginBottom: 18 }}>
                    <button className="btn btn-secondary" onClick={() => bookCall(entry)} style={{ fontSize: 12, borderColor: "rgba(34,197,94,.3)", color: "var(--green)" }}>📅 Book discovery call →</button>
                  </div>
                )}

                {/* Follow-ups */}
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <Label>Follow-ups</Label>
                  <button className="btn btn-secondary" onClick={() => genFU(entry)} disabled={generatingFU === entry.id} style={{ fontSize: 11, borderColor: "rgba(249,115,22,.3)", color: "var(--orange)", padding: "5px 12px" }}>
                    {generatingFU === entry.id ? <><Spinner size={11} color="var(--orange)" /> Generating...</> : "+ Generate follow-up"}
                  </button>
                </div>
                {(entry.followUps||[]).length === 0 && <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>No follow-ups yet. Generate one above.</div>}
                {(entry.followUps||[]).map((fu, fi) => (
                  <div key={fi} style={{ border:`1px solid ${fu.sent?"rgba(34,197,94,.2)":"rgba(249,115,22,.2)"}`, borderRadius:10, padding:"14px 16px", marginBottom:10, background:"var(--bg2)" }}>
                    <div className="row" style={{ marginBottom:10, flexWrap:"wrap", gap:8 }}>
                      <span style={{ fontSize:12, color: fu.sent?"var(--green)":"var(--orange)", fontWeight:500 }}>{fu.sent ? `✓ Sent ${new Date(fu.sentAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : "● Draft"}</span>
                      {!fu.sent && <button className="btn btn-primary" onClick={() => sendFU(entry,fi)} style={{ padding:"5px 14px", fontSize:11 }}>Send →</button>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--green)", marginBottom:8, fontWeight:500 }}>📧 {fu.subject}</div>
                    <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{fu.body}</div>
                  </div>
                ))}

                <div style={{ marginTop: 16 }}>
                  <Label>Notes</Label>
                  <textarea className="inp" value={entry.notes} onChange={e => updateNotes(entry.id, e.target.value)} placeholder="Add notes about this prospect..." style={{ minHeight:70, resize:"vertical", fontSize:13 }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Analytics Panel ─────────────────────────────────────────────────────── */
function AnalyticsPanel({ log }) {
  const total = log.length;
  const replied = log.filter(e=>e.status==="Replied"||e.status==="Converted").length;
  const converted = log.filter(e=>e.status==="Converted").length;
  const withFU = log.filter(e=>(e.followUps||[]).some(f=>f.sent)).length;
  const rr = total ? Math.round(replied/total*100) : 0;
  const cr = total ? Math.round(converted/total*100) : 0;
  const fr = total ? Math.round(withFU/total*100) : 0;
  const byMonth = {}; log.forEach(e=>{const m=new Date(e.sentAt).toLocaleDateString("en-GB",{month:"short",year:"2-digit"});byMonth[m]=(byMonth[m]||0)+1;});
  const months = Object.entries(byMonth).slice(-6); const maxM = Math.max(...months.map(([,v])=>v),1);
  const byCat = {}; log.forEach(e=>(e.painPoints||[]).forEach(p=>{const c=p.category?.split("/")[0]?.trim()||"Other";byCat[c]=(byCat[c]||0)+1;}));

  if (total === 0) return (
    <SectionCard>
      <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text3)" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
        <div style={{ fontFamily:"var(--fd)", fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:8 }}>No data yet</div>
        <div style={{ fontSize:14 }}>Start sending outreach to see analytics</div>
      </div>
    </SectionCard>
  );

  return (
    <div className="col">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[["Reply rate",`${rr}%`,`${replied} of ${total}`,"var(--green)"],["Conversion",`${cr}%`,`${converted} closed`,"var(--purple)"],["Follow-up rate",`${fr}%`,`${withFU} sent`,"var(--orange)"]].map(([l,v,s,c])=>(
          <div key={l} className="stat-card" style={{ borderColor:`${c}20` }}>
            <div className="stat-val" style={{ color:c, fontSize:36 }}>{v}</div>
            <div className="stat-lbl">{l}</div>
            <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>{s}</div>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <SectionCard>
          <div className="section-title">Outreach by Month</div>
          <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:100 }}>
            {months.map(([m,v])=>(
              <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:11, color:"var(--green)", fontWeight:600 }}>{v}</div>
                <div style={{ width:"100%", background:"linear-gradient(180deg,var(--green),rgba(34,197,94,.3))", height:`${v/maxM*70}px`, minHeight:4, borderRadius:"4px 4px 0 0", transition:"height .5s" }} />
                <div style={{ fontSize:10, color:"var(--text3)" }}>{m}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {Object.keys(byCat).length > 0 && (
        <SectionCard>
          <div className="section-title">Pain Points Targeted</div>
          {Object.entries(byCat).map(([cat,count])=>{
            const col = catColor(cat);
            return (
              <div key={cat} style={{ marginBottom:14 }}>
                <div className="row" style={{ justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:col.c, fontWeight:500 }}>{cat}</span>
                  <span style={{ fontSize:13, color:"var(--text3)" }}>{count}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ background:col.c, width:`${count/total*100}%` }} /></div>
              </div>
            );
          })}
        </SectionCard>
      )}

      <SectionCard>
        <div className="section-title">Pipeline Breakdown</div>
        {STATUS_OPTS.map(s=>{
          const count = log.filter(e=>e.status===s).length;
          const m = STATUS_META[s];
          return (
            <div key={s} className="row" style={{ marginBottom:14 }}>
              <div style={{ width:96, fontSize:12, color:m.c, fontWeight:500 }}>{s}</div>
              <div style={{ flex:1 }}><div className="progress-bar"><div className="progress-fill" style={{ background:m.c, width:`${total?(count/total*100):0}%` }} /></div></div>
              <div style={{ fontSize:14, color:"var(--text2)", minWidth:24, textAlign:"right", fontWeight:600 }}>{count}</div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

/* ── Root App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("oos-key") || "");
  const [view, setView] = useState("agent");
  const [log, setLog] = useState(() => { try { return JSON.parse(localStorage.getItem("oos-log") || "[]"); } catch { return []; } });
  const [templates, setTemplates] = useState(() => { try { return JSON.parse(localStorage.getItem("oos-tpls") || "[]"); } catch { return []; } });

  useEffect(() => { if (apiKey) localStorage.setItem("oos-key", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("oos-log", JSON.stringify(log)); }, [log]);
  useEffect(() => { localStorage.setItem("oos-tpls", JSON.stringify(templates)); }, [templates]);

  if (!apiKey) return <ApiKeyGate onKey={k => { localStorage.setItem("oos-key", k); setApiKey(k); }} />;

  const noReply = log.filter(e => e.status === "No Response").length;
  const tabs = [
    { id: "agent", label: "⚡ Agent" },
    { id: "batch", label: "⚡⚡ Batch" },
    { id: "contacts", label: "👤 Contacts" },
    { id: "templates", label: `📝 Templates${templates.length ? ` (${templates.length})` : ""}` },
    { id: "tracker", label: `📋 Tracker${log.length ? ` (${log.length})` : ""}${noReply ? ` · ${noReply} ⚠` : ""}` },
    { id: "analytics", label: "📊 Analytics" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Ambient bg */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse at 15% 15%, rgba(34,197,94,.04) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(59,130,246,.03) 0%, transparent 55%)" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 38, height: 38, background: "var(--green)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "glow 3s ease-in-out infinite", flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>OutreachOS</div>
              <div style={{ fontSize: 11, color: "var(--text3)", letterSpacing: 1, marginTop: 3 }}>v1.0 · AI-Powered</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem("oos-key"); setApiKey(""); }} style={{ fontSize: 12 }}>Reset API key</button>
        </div>

        {/* Tab bar */}
        <div style={{ overflowX: "auto", paddingBottom: 4, marginBottom: 24 }}>
          <div className="tab-bar" style={{ width: "max-content", minWidth: "100%" }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab ${view === t.id ? "active" : ""}`} onClick={() => setView(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ minHeight: 400 }}>
          {view === "agent" && <AgentPanel apiKey={apiKey} onSent={e => setLog(p => [e, ...p])} templates={templates} />}
          {view === "batch" && <BatchPanel apiKey={apiKey} onBatchDone={entries => setLog(p => [...entries, ...p])} />}
          {view === "contacts" && <ContactsPanel apiKey={apiKey} />}
          {view === "templates" && <TemplatesPanel templates={templates} setTemplates={setTemplates} />}
          {view === "tracker" && <TrackerPanel apiKey={apiKey} log={log} setLog={setLog} onGoAgent={() => setView("agent")} />}
          {view === "analytics" && <AnalyticsPanel log={log} />}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div className="row" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "var(--green)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  Built by{" "}
                  <a href="https://www.linkedin.com/in/timileyin-ajuwon-53075aa8/" target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 700 }}>Timileyin Ajuwon</a>
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>AI Specialist · Virtual Assistant · Operations Expert</div>
              </div>
            </div>
            <div className="row" style={{ gap: 20 }}>
              <a href="https://www.linkedin.com/in/timileyin-ajuwon-53075aa8/" target="_blank" rel="noreferrer" className="footer-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <span style={{ fontSize: 11, color: "var(--text3)", letterSpacing: 1 }}>OutreachOS v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
