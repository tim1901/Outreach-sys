import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

/* ── Google Fonts ───────────────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

/* ── Global Styles ──────────────────────────────────────────────────────── */
const gs = document.createElement("style");
gs.textContent = `
  :root {
    --bg:#080810;--surface:#0e0e1a;--surface2:#13131f;
    --border:#1e1e30;--border2:#2a2a40;--text:#e8e8f0;
    --muted:#5a5a78;--accent:#00f5a0;--accent2:#00c8ff;
    --warn:#ffb800;--danger:#ff5f6d;
    --fd:'Syne',sans-serif;--fm:'DM Mono',monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:var(--fm);}
  ::placeholder{color:var(--muted);opacity:.6;}
  select option{background:var(--surface);}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,245,160,.15)}50%{box-shadow:0 0 40px rgba(0,245,160,.4)}}
  .fu{animation:fadeUp .4s ease both}
  .fu1{animation:fadeUp .4s .06s ease both}
  .fu2{animation:fadeUp .4s .12s ease both}
  .fu3{animation:fadeUp .4s .18s ease both}
  .fu4{animation:fadeUp .4s .24s ease both}
  .fu5{animation:fadeUp .4s .30s ease both}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;transition:border-color .2s}
  .card:hover{border-color:var(--border2)}
  .card-g{background:var(--surface);border:1px solid rgba(0,245,160,.18);border-radius:12px}
  .card-b{background:var(--surface);border:1px solid rgba(0,200,255,.18);border-radius:12px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:8px;cursor:pointer;font-family:var(--fd);font-weight:700;font-size:13px;padding:11px 24px;transition:all .2s}
  .btn-p{background:var(--accent);color:#000}
  .btn-p:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,245,160,.3)}
  .btn-p:disabled{background:var(--border2);color:var(--muted);cursor:not-allowed;transform:none;box-shadow:none}
  .btn-c{background:var(--accent2);color:#000}
  .btn-c:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,200,255,.3)}
  .btn-c:disabled{background:var(--border2);color:var(--muted);cursor:not-allowed;transform:none;box-shadow:none}
  .btn-g{background:transparent;border:1px solid var(--border2);color:var(--muted);border-radius:7px;padding:7px 14px;font-family:var(--fm);font-size:11px;cursor:pointer;transition:all .2s}
  .btn-g:hover{border-color:var(--accent);color:var(--accent)}
  .btn-g:disabled{opacity:.4;cursor:not-allowed}
  .inp{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--fm);font-size:14px;padding:11px 15px;outline:none;transition:border-color .2s,box-shadow .2s}
  .inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,245,160,.08)}
  .inp-ul{width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--text);font-family:var(--fd);font-size:22px;font-weight:700;padding:10px 0;outline:none;transition:border-color .2s}
  .inp-ul:focus{border-bottom-color:var(--accent)}
  .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;letter-spacing:1px;font-family:var(--fm)}
  .hl{transition:transform .2s,box-shadow .2s}
  .hl:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.4)}
  .gt{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
`;
document.head.appendChild(gs);

/* ── Prompts ────────────────────────────────────────────────────────────── */
const STAGES = ["Researching company", "Identifying pain points", "Crafting outreach email", "Finalizing"];

const SYS = `You are an elite outreach specialist for Timileyin Ajuwon — AI specialist, Virtual Assistant, Operations expert.
Research the company and write a personalized outreach email.
Email: Hook (specific observation) → Pain point → Free value (steps they can do) → Soft offer (Timileyin can handle it).
Tone: Warm, knowledgeable, helpful. NOT salesy.
Services: AI workflow automation, virtual assistance, operations optimization, Notion/Zapier implementation.
CRITICAL: Return ONLY a single valid JSON object. No markdown, no backticks, no preamble.
{"companyOverview":"2-3 sentences","painPoints":[{"category":"AI/Tech|Virtual Assistant|Operations","point":"pain","evidence":"signal"}],"primaryPainPoint":"top pain","emailSubject":"subject","emailBody":"full email signed as Timileyin","contacts":[{"role":"title","name":"name or Unknown","email":"email or unknown","confidence":"high|medium|low"}]}`;

const FU_SYS = `Write a follow-up email for Timileyin Ajuwon. Prospect hasn't replied. Concise, warm, new angle, low-friction CTA.
CRITICAL: Return ONLY raw JSON. No backticks.
{"subject":"subject","body":"body"}`;

const CF_SYS = `B2B contact research for Timileyin Ajuwon. Find decision-makers (CEO/Founder/COO/Head of Ops) who'd benefit from AI automation, VA, or operations support.
CRITICAL: Return ONLY raw JSON. No backticks.
{"contacts":[{"name":"name or Unknown","role":"title","email":"email or unknown","linkedin":"url or unknown","confidence":"high|medium|low","reasoning":"why"}],"companyDomain":"domain or unknown","emailPattern":"pattern or unknown"}`;

/* ── Constants ──────────────────────────────────────────────────────────── */
const SM = {
  "Sent":{"color":"#ffb800","bg":"rgba(255,184,0,.1)"},
  "Opened":{"color":"#00c8ff","bg":"rgba(0,200,255,.1)"},
  "Replied":{"color":"#00f5a0","bg":"rgba(0,245,160,.1)"},
  "No Response":{"color":"#5a5a78","bg":"rgba(90,90,120,.1)"},
  "Converted":{"color":"#ff5f6d","bg":"rgba(255,95,109,.1)"},
};
const SO = Object.keys(SM);
const cc = c => c?.includes("AI") ? "#00f5a0" : c?.includes("Virtual") ? "#ffb800" : "#00c8ff";

/* ── API ────────────────────────────────────────────────────────────────── */
async function ai(apiKey, system, msg, search = false) {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: msg }] };
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || `API ${r.status}`); }
  const d = await r.json();
  const t = d.content.filter(b => b.type === "text").map(b => b.text).join("");
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON returned. Please retry.");
  try { return JSON.parse(m[0]); }
  catch { return JSON.parse(m[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/,\s*([}\]])/g, "$1")); }
}

async function gmail(to, subject, body) {
  if (!window.__GTOKEN__) throw new Error("Gmail not connected");
  const raw = btoa(unescape(encodeURIComponent([`To:${to}`, `Subject:${subject}`, `Content-Type:text/plain;charset=utf-8`, ``, body].join("\r\n")))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.__GTOKEN__}` }, body: JSON.stringify({ raw }) });
  if (!r.ok) throw new Error("Gmail failed");
}

/* ── Mini Components ─────────────────────────────────────────────────────── */
const Lbl = ({ c }) => <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase" }}>{c}</div>;
const SLbl = ({ c, s = {} }) => <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--muted)", marginBottom: 14, textTransform: "uppercase", ...s }}>{c}</div>;
const Tag = ({ color, c }) => <span className="tag" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{c}</span>;
const Spin = () => <div style={{ width: 16, height: 16, border: "2px solid var(--border2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />;
const Err = ({ msg, onR }) => (
  <div className="fu" style={{ background: "rgba(255,95,109,.08)", border: "1px solid rgba(255,95,109,.25)", borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span>⚠</span><span style={{ fontSize: 12, color: "var(--danger)", lineHeight: 1.5 }}>{msg}</span></div>
    {onR && <button className="btn-g" onClick={onR} style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Retry →</button>}
  </div>
);

/* ── API Key Gate ────────────────────────────────────────────────────────── */
function Gate({ onKey }) {
  const [k, setK] = useState("");
  const ok = k.startsWith("sk-");
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,160,.05) 0%,transparent 70%)", top: "-10%", right: "-10%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,255,.04) 0%,transparent 70%)", bottom: "5%", left: "-5%", pointerEvents: "none" }} />
      <div className="fu card" style={{ maxWidth: 480, width: "100%", padding: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,var(--accent),var(--accent2))", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "glow 3s ease-in-out infinite" }}>⚡</div>
          <div>
            <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 18 }}>Outreach<span className="gt">OS</span></div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 3 }}>VERSION 1.0 · AI-POWERED</div>
          </div>
        </div>
        <h1 style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 26, lineHeight: 1.2, marginBottom: 12 }}>Connect your <span className="gt">Anthropic</span> account</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, marginBottom: 28 }}>Your API key stays in your browser. Sent only to Anthropic's API — never to anyone else.</p>
        <Lbl c="Anthropic API Key" />
        <input type="password" className="inp" value={k} onChange={e => setK(e.target.value)} onKeyDown={e => e.key === "Enter" && ok && onKey(k)} placeholder="sk-ant-api03-..." style={{ marginBottom: 18 }} />
        <button className="btn btn-p" onClick={() => ok && onKey(k)} disabled={!ok} style={{ width: "100%", padding: 14, fontSize: 14 }}>Launch OutreachOS →</button>
        <div style={{ marginTop: 18, padding: "12px 16px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
          Don't have a key? <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>Get one at console.anthropic.com →</a>
        </div>
      </div>
    </div>
  );
}

/* ── Agent Panel ─────────────────────────────────────────────────────────── */
function Agent({ apiKey, onSent, templates }) {
  const [co, setCo] = useState(""); const [em, setEm] = useState("");
  const [stage, setStage] = useState(null); const [si, setSi] = useState(-1);
  const [res, setRes] = useState(null); const [err, setErr] = useState(null);
  const [body, setBody] = useState(""); const [subj, setSubj] = useState("");
  const [editing, setEditing] = useState(false); const [copied, setCopied] = useState(false);
  const [ss, setSs] = useState(null); const [selT, setSelT] = useState(null); const [selC, setSelC] = useState(null);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 150); }, []);

  const run = async () => {
    if (!co.trim()) return;
    setRes(null); setErr(null); setSs(null); setSelC(null); setStage("run"); setSi(0);
    try {
      const tick = i => new Promise(r => setTimeout(() => { setSi(i); r(); }, 1500));
      await tick(0); await tick(1);
      const p = await ai(apiKey, SYS, `Research and generate outreach for: "${co}". Keep concise. Return only JSON.`, true);
      await tick(2);
      let b = p.emailBody;
      if (selT) b = selT.body.replace(/\[COMPANY\]/g, co).replace(/\[PAIN_POINT\]/g, p.primaryPainPoint || "");
      setRes(p); setBody(b); setSubj(p.emailSubject); setSi(3); setStage("done");
    } catch (e) { setErr(e.message); setStage(null); setSi(-1); }
  };

  const send = async () => {
    if (!em.trim()) { alert("Enter recipient email."); return; }
    setSs("sending");
    try {
      await gmail(em, subj, body);
      setSs("sent");
      onSent({ id: Date.now(), company: co, recipient: em, subject: subj, emailBody: body, overview: res?.companyOverview || "", painPoints: res?.painPoints || [], contacts: res?.contacts || [], status: "Sent", sentAt: new Date().toISOString(), notes: "", followUps: [] });
    } catch { setSs("error"); }
  };

  const reset = () => { setCo(""); setEm(""); setStage(null); setSi(-1); setRes(null); setErr(null); setEditing(false); setSs(null); setSelC(null); };

  return (
    <div>
      {!stage && !res && (
        <div className="card fu" style={{ padding: 32, marginBottom: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <Lbl c="Target Company" />
            <input ref={ref} className="inp-ul" value={co} onChange={e => setCo(e.target.value)} onKeyDown={e => e.key === "Enter" && run()} placeholder="e.g. Flutterwave, Paystack, Andela..." />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Lbl c="Recipient Email" /><Lbl c="(optional — add after)" />
            <input className="inp" value={em} onChange={e => setEm(e.target.value)} placeholder="ceo@company.com" />
          </div>
          {templates.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Lbl c="Apply Template" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {templates.map(t => <button key={t.id} className="btn-g" onClick={() => setSelT(selT?.id === t.id ? null : t)} style={{ borderColor: selT?.id === t.id ? "var(--accent)" : "var(--border2)", color: selT?.id === t.id ? "var(--accent)" : "var(--muted)" }}>{selT?.id === t.id ? "✓ " : ""}{t.name}</button>)}
              </div>
            </div>
          )}
          <button className="btn btn-p" onClick={run} disabled={!co.trim()} style={{ padding: "13px 32px", fontSize: 14 }}>Run Agent →</button>
        </div>
      )}

      {stage === "run" && (
        <div className="card" style={{ padding: 36, marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 20, marginBottom: 32 }}>Researching <span className="gt">{co}</span></div>
          {STAGES.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, opacity: i > si ? .2 : 1, transition: "opacity .5s" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: i < si ? "rgba(0,245,160,.12)" : "var(--surface2)", border: `1px solid ${i <= si ? "rgba(0,245,160,.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .4s" }}>
                {i < si ? <span style={{ color: "var(--accent)", fontSize: 14 }}>✓</span> : i === si ? <Spin /> : <span style={{ color: "var(--border2)" }}>○</span>}
              </div>
              <span style={{ fontSize: 14, color: i === si ? "var(--text)" : "var(--muted)", fontFamily: i === si ? "var(--fd)" : "var(--fm)", fontWeight: i === si ? 600 : 400 }}>{s}</span>
              {i === si && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.2s infinite" }} />}
            </div>
          ))}
        </div>
      )}

      {err && <Err msg={err} onR={run} />}

      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card fu1" style={{ padding: "22px 26px" }}>
            <SLbl c="Company Intel" />
            <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 1.8 }}>{res.companyOverview}</p>
          </div>

          {res.contacts?.length > 0 && (
            <div className="card-b fu2" style={{ padding: "22px 26px" }}>
              <SLbl c="Decision Makers Found" />
              {res.contacts.map((c, i) => (
                <div key={i} onClick={() => { setSelC(c); if (c.email !== "unknown") setEm(c.email); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: selC === c ? "rgba(0,200,255,.08)" : "var(--surface2)", border: `1px solid ${selC === c ? "rgba(0,200,255,.3)" : "var(--border)"}`, cursor: "pointer", transition: "all .2s", marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,rgba(0,200,255,.2),rgba(0,245,160,.2))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{c.name !== "Unknown" ? c.name[0] : "?"}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--fd)" }}>{c.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{c.role}</div></div>
                  <Tag color={c.confidence === "high" ? "#00f5a0" : c.confidence === "medium" ? "#ffb800" : "#5a5a78"} c={c.confidence} />
                  {selC === c && <span style={{ color: "var(--accent2)" }}>✓</span>}
                </div>
              ))}
            </div>
          )}

          <div className="card fu3" style={{ padding: "22px 26px" }}>
            <SLbl c="Pain Points Identified" />
            {res.painPoints?.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 10, background: "var(--surface2)", borderLeft: `3px solid ${cc(p.category)}`, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <Tag color={cc(p.category)} c={p.category?.toUpperCase()} />
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--fd)", marginTop: 8, marginBottom: 4 }}>{p.point}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Signal: {p.evidence}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-g fu4" style={{ padding: "22px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <SLbl c="Outreach Email" s={{ marginBottom: 0 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-g" onClick={() => setEditing(!editing)}>{editing ? "Preview" : "Edit"}</button>
                <button className="btn-g" onClick={() => { navigator.clipboard.writeText(`Subject: ${subj}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ borderColor: copied ? "var(--accent)" : "var(--border2)", color: copied ? "var(--accent)" : "var(--muted)" }}>{copied ? "✓ Copied!" : "Copy"}</button>
              </div>
            </div>
            <div style={{ background: "rgba(0,245,160,.06)", border: "1px solid rgba(0,245,160,.15)", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
              <span style={{ fontSize: 10, letterSpacing: 3, color: "var(--muted)", marginRight: 12 }}>SUBJECT</span>
              {editing ? <input value={subj} onChange={e => setSubj(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--accent)", fontSize: 13, fontFamily: "var(--fm)", width: "calc(100% - 80px)" }} /> : <span style={{ fontSize: 13, color: "var(--accent)" }}>{subj}</span>}
            </div>
            {editing ? <textarea value={body} onChange={e => setBody(e.target.value)} style={{ width: "100%", minHeight: 240, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "#c8c8e0", fontSize: 13, lineHeight: 1.8, padding: 16, fontFamily: "var(--fm)", outline: "none", resize: "vertical" }} />
              : <div style={{ fontSize: 13, lineHeight: 1.9, color: "#b0b0cc", whiteSpace: "pre-wrap" }}>{body}</div>}
          </div>

          <div className="card fu5" style={{ padding: "22px 26px" }}>
            <SLbl c="Send via Gmail" />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input className="inp" value={em} onChange={e => setEm(e.target.value)} placeholder="recipient@company.com" style={{ flex: 1, minWidth: 200 }} />
              <button className="btn btn-p" onClick={send} disabled={ss === "sending" || ss === "sent"} style={{ opacity: ss === "sending" ? .6 : 1, whiteSpace: "nowrap" }}>
                {ss === "sending" ? "Sending..." : ss === "sent" ? "✓ Sent & Logged!" : "Send + Log →"}
              </button>
            </div>
            {ss === "sent" && <div style={{ marginTop: 12, fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />Sent from Gmail and logged to tracker</div>}
            {ss === "error" && <div style={{ marginTop: 12, fontSize: 12, color: "var(--danger)" }}>⚠ Send failed — use Copy to send manually.</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn-g" onClick={reset}>← New Company</button></div>
        </div>
      )}
    </div>
  );
}

/* ── Batch Panel ─────────────────────────────────────────────────────────── */
function Batch({ apiKey, onDone }) {
  const [input, setInput] = useState(""); const [jobs, setJobs] = useState([]); const [running, setRunning] = useState(false);
  const cos = input.split("\n").map(s => s.trim()).filter(Boolean);

  const run = async () => {
    if (!cos.length) return;
    setRunning(true); setJobs(cos.map(c => ({ company: c, status: "queued", result: null, error: null })));
    for (let i = 0; i < cos.length; i++) {
      setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "running" } : j));
      try {
        const r = await ai(apiKey, SYS, `Research and generate outreach for: "${cos[i]}". Keep concise. Return only JSON.`, true);
        setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "done", result: r } : j));
      } catch (e) { setJobs(p => p.map((j, idx) => idx === i ? { ...j, status: "error", error: e.message } : j)); }
    }
    setRunning(false);
  };

  const logAll = () => onDone(jobs.filter(j => j.status === "done" && j.result).map(j => ({ id: Date.now() + Math.random(), company: j.company, recipient: "", subject: j.result.emailSubject, emailBody: j.result.emailBody, overview: j.result.companyOverview || "", painPoints: j.result.painPoints || [], contacts: j.result.contacts || [], status: "Sent", sentAt: new Date().toISOString(), notes: "", followUps: [] })));

  const jm = { queued: { i: "○", c: "var(--muted)" }, running: { i: null, c: "var(--warn)" }, done: { i: "✓", c: "var(--accent)" }, error: { i: "✕", c: "var(--danger)" } };

  return (
    <div>
      <div className="card fu" style={{ padding: 28, marginBottom: 20 }}>
        <Lbl c="Companies — one per line" />
        <textarea className="inp" value={input} onChange={e => setInput(e.target.value)} placeholder={"Flutterwave\nPaystack\nPiggyVest\nChowdeck\nAndela"} disabled={running} style={{ minHeight: 140, marginBottom: 16, resize: "vertical", lineHeight: 1.8 }} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-p" onClick={run} disabled={running || !input.trim()}>{running ? `Running... (${jobs.filter(j => j.status === "done").length}/${cos.length})` : `Run Batch (${cos.length}) →`}</button>
          {jobs.some(j => j.status === "done") && !running && <button className="btn-g" onClick={logAll} style={{ borderColor: "rgba(0,245,160,.3)", color: "var(--accent)" }}>Log All to Tracker →</button>}
        </div>
      </div>
      {jobs.map((j, i) => {
        const m = jm[j.status];
        return (
          <div key={i} className="card" style={{ padding: "16px 20px", marginBottom: 10, borderColor: j.status === "done" ? "rgba(0,245,160,.2)" : "var(--border)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {j.status === "running" ? <Spin /> : <span style={{ color: m.c, fontSize: 14 }}>{m.i}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: j.result ? 8 : 0 }}>
                  <span style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 14 }}>{j.company}</span>
                  <Tag color={m.c} c={j.status.toUpperCase()} />
                </div>
                {j.result && <><div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 4 }}>📧 {j.result.emailSubject}</div><div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>{j.result.companyOverview}</div></>}
                {j.error && <div style={{ fontSize: 11, color: "var(--danger)" }}>{j.error}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Contact Finder ──────────────────────────────────────────────────────── */
function Contacts({ apiKey }) {
  const [co, setCo] = useState(""); const [loading, setLoading] = useState(false); const [res, setRes] = useState(null); const [err, setErr] = useState(null); const [cp, setCp] = useState(null);
  const cfc = c => ({ high: "var(--accent)", medium: "var(--warn)", low: "var(--muted)" }[c] || "var(--muted)");
  const find = async () => {
    if (!co.trim()) return; setLoading(true); setRes(null); setErr(null);
    try { setRes(await ai(apiKey, CF_SYS, `Find decision-makers at: "${co}". Return only JSON.`, true)); }
    catch (e) { setErr(e.message); } setLoading(false);
  };
  return (
    <div>
      <div className="card fu" style={{ padding: 28, marginBottom: 20 }}>
        <Lbl c="Company Name" />
        <input className="inp-ul" value={co} onChange={e => setCo(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} placeholder="e.g. Andela, Interswitch..." style={{ marginBottom: 20 }} />
        <button className="btn btn-c" onClick={find} disabled={loading || !co.trim()}>{loading ? "Searching..." : "Find Decision Makers →"}</button>
      </div>
      {err && <Err msg={err} />}
      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {res.companyDomain !== "unknown" && (
            <div className="card fu1" style={{ padding: "16px 22px", display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div><Lbl c="Domain" /><div style={{ fontSize: 14, color: "var(--accent2)", fontFamily: "var(--fd)", fontWeight: 600 }}>{res.companyDomain}</div></div>
              {res.emailPattern !== "unknown" && <div><Lbl c="Email Pattern" /><div style={{ fontSize: 13, color: "var(--warn)", fontFamily: "var(--fm)" }}>{res.emailPattern}</div></div>}
            </div>
          )}
          {res.contacts?.map((c, i) => (
            <div key={i} className="card hl fu2" style={{ padding: "20px 24px", borderColor: `${cfc(c.confidence)}25` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${cfc(c.confidence)}20,${cfc(c.confidence)}40)`, border: `1px solid ${cfc(c.confidence)}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontWeight: 700, fontSize: 17, color: cfc(c.confidence) }}>
                    {c.name !== "Unknown" ? c.name[0] : "?"}
                  </div>
                  <div><div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{c.role}</div></div>
                </div>
                <Tag color={cfc(c.confidence)} c={`${c.confidence?.toUpperCase()} CONFIDENCE`} />
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                {c.email !== "unknown" && <><span style={{ fontSize: 13, color: "var(--accent2)", fontFamily: "var(--fm)" }}>{c.email}</span><button className="btn-g" onClick={() => { navigator.clipboard.writeText(c.email); setCp(i); setTimeout(() => setCp(null), 2000); }} style={{ padding: "3px 10px", fontSize: 10 }}>{cp === i ? "✓ Copied" : "Copy"}</button></>}
                {c.linkedin !== "unknown" && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>LinkedIn →</a>}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.6 }}>{c.reasoning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Templates Panel ─────────────────────────────────────────────────────── */
function Templates({ templates, setTemplates }) {
  const [n, setN] = useState(""); const [s, setS] = useState(""); const [b, setB] = useState(""); const [ed, setEd] = useState(null);
  const save = () => {
    if (!n.trim() || !b.trim()) return;
    if (ed) { setTemplates(p => p.map(t => t.id === ed ? { ...t, name: n, subject: s, body: b } : t)); setEd(null); }
    else setTemplates(p => [...p, { id: Date.now(), name: n, subject: s, body: b }]);
    setN(""); setS(""); setB("");
  };
  const edit = t => { setEd(t.id); setN(t.name); setS(t.subject); setB(t.body); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card fu" style={{ padding: 28 }}>
        <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{ed ? "Edit Template" : "New Template"}</div>
        <div style={{ marginBottom: 16 }}><Lbl c="Template Name" /><input className="inp" value={n} onChange={e => setN(e.target.value)} placeholder="e.g. AI Automation Pitch" /></div>
        <div style={{ marginBottom: 16 }}><Lbl c="Subject Line" /><input className="inp" value={s} onChange={e => setS(e.target.value)} placeholder="Use [COMPANY] as placeholder" /></div>
        <div style={{ marginBottom: 20 }}><Lbl c="Body — use [COMPANY] and [PAIN_POINT]" /><textarea className="inp" value={b} onChange={e => setB(e.target.value)} placeholder={"Hi there,\n\nI came across [COMPANY]..."} style={{ minHeight: 160, resize: "vertical", lineHeight: 1.8 }} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-p" onClick={save} disabled={!n.trim() || !b.trim()}>{ed ? "Update Template" : "Save Template"}</button>
          {ed && <button className="btn-g" onClick={() => { setEd(null); setN(""); setS(""); setB(""); }}>Cancel</button>}
        </div>
      </div>
      {templates.length === 0
        ? <div className="card" style={{ padding: "50px 24px", textAlign: "center", color: "var(--muted)" }}><div style={{ fontSize: 36, marginBottom: 12 }}>📝</div><div style={{ fontSize: 13 }}>No templates yet</div></div>
        : templates.map((t, i) => (
          <div key={t.id} className={`card hl fu${Math.min(i + 1, 5)}`} style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-g" onClick={() => edit(t)}>Edit</button>
                <button className="btn-g" onClick={() => setTemplates(p => p.filter(x => x.id !== t.id))} style={{ borderColor: "rgba(255,95,109,.3)", color: "var(--danger)" }}>Delete</button>
              </div>
            </div>
            {t.subject && <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>📧 {t.subject}</div>}
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, maxHeight: 56, overflow: "hidden" }}>{t.body.slice(0, 200)}{t.body.length > 200 ? "..." : ""}</div>
          </div>
        ))}
    </div>
  );
}

/* ── Tracker Panel ───────────────────────────────────────────────────────── */
function Tracker({ apiKey, log, setLog, onGoAgent }) {
  const [exp, setExp] = useState(null); const [genId, setGenId] = useState(null); const [chk, setChk] = useState(false); const [rm, setRm] = useState(null);

  const upd = (id, s) => setLog(p => p.map(e => e.id === id ? { ...e, status: s } : e));
  const updN = (id, n) => setLog(p => p.map(e => e.id === id ? { ...e, notes: n } : e));
  const del = id => { setLog(p => p.filter(e => e.id !== id)); if (exp === id) setExp(null); };

  const genFU = async entry => {
    setGenId(entry.id);
    try {
      const p = await ai(apiKey, FU_SYS, `Company:${entry.company}\nSubject:${entry.subject}\nEmail:\n${entry.emailBody}\nReturn only JSON.`);
      setLog(prev => prev.map(e => e.id === entry.id ? { ...e, followUps: [...(e.followUps || []), { ...p, generatedAt: new Date().toISOString(), sent: false }] } : e));
    } catch { alert("Failed. Retry."); }
    setGenId(null);
  };

  const sendFU = async (entry, fi) => {
    if (!entry.recipient) { alert("No recipient."); return; }
    const fu = entry.followUps[fi];
    try { await gmail(entry.recipient, fu.subject, fu.body); setLog(p => p.map(e => e.id === entry.id ? { ...e, followUps: e.followUps.map((f, i) => i === fi ? { ...f, sent: true, sentAt: new Date().toISOString() } : f) } : e)); }
    catch { alert("Failed to send."); }
  };

  const checkR = async () => {
    setChk(true); setRm(null); let upd2 = 0;
    try {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread&maxResults=20`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
      const d = await r.json();
      for (const msg of (d.messages || [])) {
        const mr = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
        const md = await mr.json();
        const from = md.payload?.headers?.find(h => h.name === "From")?.value || "";
        setLog(prev => { let ch = false; const nx = prev.map(e => { if (e.status !== "Replied" && e.recipient && from.includes(e.recipient.split("@")[1] || "NOOP")) { ch = true; return { ...e, status: "Replied", replyDetectedAt: new Date().toISOString() }; } return e; }); if (ch) upd2++; return nx; });
      }
      setRm(upd2 > 0 ? `✓ ${upd2} new reply!` : "No new replies.");
    } catch { setRm("⚠ Could not check inbox."); }
    setChk(false);
  };

  const book = entry => {
    const s2 = encodeURIComponent(`Discovery Call — ${entry.company}`);
    const d2 = encodeURIComponent(`Follow-up. Outreach: ${entry.subject}`);
    const st = new Date(Date.now() + 2 * 86400000); st.setHours(10, 0, 0, 0);
    const en = new Date(st.getTime() + 1800000);
    const f = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    window.open(`https://calendar.google.com/calendar/r/eventedit?text=${s2}&details=${d2}&dates=${f(st)}/${f(en)}&add=${encodeURIComponent(entry.recipient || "")}`, "_blank");
  };

  const csv = () => {
    const rows = [["Company", "Recipient", "Subject", "Status", "Sent At", "Notes", "Follow-ups"]];
    log.forEach(e => rows.push([e.company, e.recipient, e.subject, e.status, new Date(e.sentAt).toLocaleDateString(), (e.notes || "").replace(/,/g, ";"), (e.followUps || []).filter(f => f.sent).length]));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = `outreach-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const st = { total: log.length, sent: log.filter(e => e.status === "Sent").length, replied: log.filter(e => e.status === "Replied").length, converted: log.filter(e => e.status === "Converted").length, noReply: log.filter(e => e.status === "No Response").length };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {[["Total", st.total, "var(--text)"], ["Sent", st.sent, "var(--warn)"], ["Replied", st.replied, "var(--accent)"], ["Converted", st.converted, "var(--danger)"], ["No Reply", st.noReply, "var(--muted)"]].map(([l, v, c]) => (
          <div key={l} className="card" style={{ padding: "16px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c, fontFamily: "var(--fd)", marginBottom: 4 }}>{v}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn-g" onClick={checkR} disabled={chk} style={{ borderColor: "rgba(0,200,255,.3)", color: "var(--accent2)" }}>{chk ? "Checking..." : "🔄 Check Replies"}</button>
        {log.length > 0 && <button className="btn-g" onClick={csv}>↓ Export CSV</button>}
        {rm && <span style={{ fontSize: 12, color: rm.includes("✓") ? "var(--accent)" : "var(--danger)" }}>{rm}</span>}
      </div>

      {log.length === 0 ? (
        <div className="card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--muted)" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📭</div>
          <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>No outreach logged yet</div>
          <div style={{ fontSize: 13, marginBottom: 24 }}>Send your first email from the Agent tab</div>
          <button className="btn btn-p" onClick={onGoAgent}>Go to Agent →</button>
        </div>
      ) : log.map(entry => {
        const sm = SM[entry.status] || SM["Sent"];
        return (
          <div key={entry.id} className="card" style={{ marginBottom: 10, overflow: "hidden", borderColor: exp === entry.id ? "rgba(0,245,160,.2)" : "var(--border)", transition: "border-color .2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{entry.company}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{entry.recipient || "No recipient"}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(entry.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              {(entry.followUps || []).length > 0 && <Tag color="var(--warn)" c={`${(entry.followUps || []).filter(f => f.sent).length}/${(entry.followUps || []).length} FU`} />}
              {entry.replyDetectedAt && <Tag color="var(--accent)" c="Auto ✓" />}
              <select value={entry.status} onChange={e => upd(entry.id, e.target.value)} style={{ background: sm.bg, border: `1px solid ${sm.color}40`, color: sm.color, padding: "5px 10px", fontSize: 10, letterSpacing: 1, fontFamily: "var(--fm)", cursor: "pointer", outline: "none", borderRadius: 6 }}>
                {SO.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn-g" onClick={() => setExp(exp === entry.id ? null : entry.id)} style={{ padding: "5px 12px" }}>{exp === entry.id ? "Close" : "View"}</button>
              <button onClick={() => del(entry.id)} style={{ background: "transparent", border: "none", color: "var(--border2)", fontSize: 16, cursor: "pointer", padding: "4px 6px", lineHeight: 1, transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "var(--danger)"} onMouseLeave={e => e.target.style.color = "var(--border2)"}>✕</button>
            </div>

            {exp === entry.id && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "20px 18px 24px", background: "var(--surface2)" }}>
                <SLbl c="Subject" />
                <div style={{ fontSize: 14, color: "var(--accent)", fontFamily: "var(--fd)", fontWeight: 600, marginBottom: 20 }}>{entry.subject}</div>
                <SLbl c="Email Sent" />
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.9, whiteSpace: "pre-wrap", background: "var(--surface)", borderRadius: 8, padding: 16, marginBottom: 20, maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)" }}>{entry.emailBody}</div>
                {(entry.status === "Replied" || entry.status === "Converted") && <div style={{ marginBottom: 20 }}><button className="btn-g" onClick={() => book(entry)} style={{ borderColor: "rgba(0,245,160,.3)", color: "var(--accent)" }}>📅 Book Discovery Call →</button></div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SLbl c="Follow-ups" s={{ marginBottom: 0 }} />
                  <button className="btn-g" onClick={() => genFU(entry)} disabled={genId === entry.id} style={{ borderColor: "rgba(255,184,0,.3)", color: "var(--warn)", fontSize: 10 }}>{genId === entry.id ? "Generating..." : "+ Generate Follow-up"}</button>
                </div>
                {(entry.followUps || []).length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>No follow-ups yet.</div>}
                {(entry.followUps || []).map((fu, fi) => (
                  <div key={fi} style={{ border: `1px solid ${fu.sent ? "rgba(0,245,160,.2)" : "rgba(255,184,0,.2)"}`, borderRadius: 8, padding: "14px 16px", marginBottom: 12, background: "var(--surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                      <span style={{ fontSize: 12, color: fu.sent ? "var(--accent)" : "var(--warn)" }}>{fu.sent ? `✓ Sent ${new Date(fu.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "● Draft"}</span>
                      {!fu.sent && <button className="btn btn-p" onClick={() => sendFU(entry, fi)} style={{ padding: "5px 14px", fontSize: 11 }}>Send →</button>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>📧 {fu.subject}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{fu.body}</div>
                  </div>
                ))}
                <SLbl c="Notes" />
                <textarea className="inp" value={entry.notes} onChange={e => updN(entry.id, e.target.value)} placeholder="Add notes about this outreach..." style={{ minHeight: 70, resize: "vertical", fontSize: 12 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Analytics Panel ─────────────────────────────────────────────────────── */
function Analytics({ log }) {
  const total = log.length;
  const replied = log.filter(e => e.status === "Replied" || e.status === "Converted").length;
  const converted = log.filter(e => e.status === "Converted").length;
  const withFU = log.filter(e => (e.followUps || []).some(f => f.sent)).length;
  const rr = total ? Math.round(replied / total * 100) : 0;
  const cr = total ? Math.round(converted / total * 100) : 0;
  const fr = total ? Math.round(withFU / total * 100) : 0;
  const bm = {}; log.forEach(e => { const m = new Date(e.sentAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }); bm[m] = (bm[m] || 0) + 1; });
  const months = Object.entries(bm).slice(-6); const maxM = Math.max(...months.map(([, v]) => v), 1);
  const bc = {}; log.forEach(e => (e.painPoints || []).forEach(p => { const cat = p.category?.split("/")[0]?.trim() || "Other"; bc[cat] = (bc[cat] || 0) + 1; }));

  if (total === 0) return <div className="card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--muted)" }}><div style={{ fontSize: 44, marginBottom: 16 }}>📊</div><div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>No data yet</div><div style={{ fontSize: 13 }}>Start sending outreach to see analytics</div></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[["Reply Rate", `${rr}%`, `${replied} of ${total}`, "var(--accent)"], ["Conversion", `${cr}%`, `${converted} closed`, "var(--danger)"], ["Follow-up Rate", `${fr}%`, `${withFU} sent`, "var(--warn)"]].map(([l, v, s, c]) => (
          <div key={l} className="card" style={{ padding: "24px 16px", textAlign: "center", borderColor: `${c}18` }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: c, fontFamily: "var(--fd)", lineHeight: 1, marginBottom: 6 }}>{v}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{l.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{s}</div>
          </div>
        ))}
      </div>
      {months.length > 0 && (
        <div className="card" style={{ padding: "22px 24px" }}>
          <SLbl c="Outreach by Month" />
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
            {months.map(([m, v]) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>{v}</div>
                <div style={{ width: "100%", background: "linear-gradient(180deg,var(--accent),rgba(0,245,160,.3))", height: `${v / maxM * 70}px`, minHeight: 4, borderRadius: "4px 4px 0 0" }} />
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1 }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(bc).length > 0 && (
        <div className="card" style={{ padding: "22px 24px" }}>
          <SLbl c="Pain Points Targeted" />
          {Object.entries(bc).map(([cat, count]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: cc(cat) }}>{cat}</span><span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span></div>
              <div style={{ height: 6, background: "var(--surface2)", borderRadius: 3 }}><div style={{ height: "100%", background: cc(cat), width: `${count / total * 100}%`, borderRadius: 3, transition: "width .5s" }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ padding: "22px 24px" }}>
        <SLbl c="Pipeline" />
        {SO.map(s => { const count = log.filter(e => e.status === s).length; const m = SM[s]; return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 96, fontSize: 10, color: m.color, letterSpacing: 1 }}>{s.toUpperCase()}</div>
            <div style={{ flex: 1, height: 6, background: "var(--surface2)", borderRadius: 3 }}><div style={{ height: "100%", background: m.color, width: `${total ? count / total * 100 : 0}%`, borderRadius: 3, transition: "width .5s" }} /></div>
            <div style={{ fontSize: 13, color: "var(--muted)", minWidth: 24, textAlign: "right", fontFamily: "var(--fd)", fontWeight: 600 }}>{count}</div>
          </div>
        );})}
      </div>
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [key, setKey] = useState(() => localStorage.getItem("oos-key") || "");
  const [view, setView] = useState("agent");
  const [log, setLog] = useState(() => { try { return JSON.parse(localStorage.getItem("oos-log") || "[]"); } catch { return []; } });
  const [tpls, setTpls] = useState(() => { try { return JSON.parse(localStorage.getItem("oos-tpls") || "[]"); } catch { return []; } });

  useEffect(() => { if (key) localStorage.setItem("oos-key", key); }, [key]);
  useEffect(() => { localStorage.setItem("oos-log", JSON.stringify(log)); }, [log]);
  useEffect(() => { localStorage.setItem("oos-tpls", JSON.stringify(tpls)); }, [tpls]);

  if (!key) return <Gate onKey={k => { localStorage.setItem("oos-key", k); setKey(k); }} />;

  const nr = log.filter(e => e.status === "No Response").length;
  const tabs = [
    { id: "agent", label: "⚡ Agent" },
    { id: "batch", label: "⚡⚡ Batch" },
    { id: "contacts", label: "👤 Contacts" },
    { id: "templates", label: `📝 Templates${tpls.length ? ` (${tpls.length})` : ""}` },
    { id: "tracker", label: `📋 Tracker${log.length ? ` (${log.length})` : ""}${nr ? ` ·${nr}⚠` : ""}` },
    { id: "analytics", label: "📊 Analytics" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,160,.035) 0%,transparent 70%)", top: -200, right: -200 }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,255,.03) 0%,transparent 70%)", bottom: 0, left: -150 }} />
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "28px 20px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,var(--accent),var(--accent2))", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, animation: "glow 3s ease-in-out infinite", flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 24, lineHeight: 1 }}>Outreach<span className="gt">OS</span></div>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 3, marginTop: 4 }}>VERSION 1.0 · AI-POWERED OUTREACH</div>
            </div>
          </div>
          <button className="btn-g" onClick={() => { localStorage.removeItem("oos-key"); setKey(""); }} style={{ fontSize: 10 }}>Reset API Key</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ flex: "0 0 auto", background: view === t.id ? "var(--accent)" : "var(--surface)", color: view === t.id ? "#000" : "var(--muted)", border: `1px solid ${view === t.id ? "var(--accent)" : "var(--border)"}`, padding: "10px 16px", fontSize: 12, fontFamily: view === t.id ? "var(--fd)" : "var(--fm)", fontWeight: view === t.id ? 700 : 400, borderRadius: 10, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: 400 }}>
          {view === "agent" && <Agent apiKey={key} onSent={e => setLog(p => [e, ...p])} templates={tpls} />}
          {view === "batch" && <Batch apiKey={key} onDone={entries => setLog(p => [...entries, ...p])} />}
          {view === "contacts" && <Contacts apiKey={key} />}
          {view === "templates" && <Templates templates={tpls} setTemplates={setTpls} />}
          {view === "tracker" && <Tracker apiKey={key} log={log} setLog={setLog} onGoAgent={() => setView("agent")} />}
          {view === "analytics" && <Analytics log={log} />}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,var(--accent),var(--accent2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  Built by{" "}
                  <a href="https://www.linkedin.com/in/timileyin-ajuwon-53075aa8/" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>Timileyin Ajuwon</a>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>AI Specialist · Virtual Assistant · Operations Expert</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <a href="https://www.linkedin.com/in/timileyin-ajuwon-53075aa8/" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", textDecoration: "none", transition: "color .2s", fontFamily: "var(--fm)" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent2)"} onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Connect on LinkedIn
              </a>
              <div style={{ fontSize: 10, color: "var(--border2)", letterSpacing: 2 }}>OutreachOS v1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
