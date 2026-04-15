import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const STAGES = [
  { id: "research", label: "Researching Company", icon: "🔍" },
  { id: "analyze", label: "Identifying Pain Points", icon: "🧠" },
  { id: "draft", label: "Crafting Email", icon: "✍️" },
  { id: "done", label: "Ready to Send", icon: "📬" },
];

const systemPrompt = `You are an elite business intelligence and outreach specialist working for Timileyin Ajuwon — an AI specialist, Virtual Assistant, and Operations expert.

Research the company and write a personalized outreach email.

Email structure:
- Hook: specific observation about the company
- Pain point: what problem they likely face
- Free value: concrete steps they could take themselves
- Soft offer: mention Timileyin can handle it if they'd rather delegate

Tone: Warm, knowledgeable, helpful — NOT salesy.

Timileyin's services: AI workflow automation, virtual assistance (email/calendar/admin), operations optimization, process documentation, Notion/Zapier implementation.

Respond ONLY in this JSON:
{
  "companyOverview": "2-3 sentence summary",
  "painPoints": [{ "category": "AI/Tech | Virtual Assistant | Operations", "point": "pain point", "evidence": "signal" }],
  "primaryPainPoint": "most compelling pain point",
  "emailSubject": "subject line",
  "emailBody": "full email body signed off as Timileyin",
  "contacts": [{ "role": "CEO/Founder/Ops Lead/etc", "name": "likely name or Unknown", "email": "likely email format or unknown", "confidence": "high|medium|low" }]
}`;

const followUpPrompt = `Write a follow-up email for Timileyin Ajuwon (AI specialist, VA, Ops expert). Prospect hasn't replied. Be concise, warm, add a new angle. Low-friction CTA.
Respond ONLY in JSON: { "subject": "subject", "body": "email body" }`;

const contactFinderPrompt = `You are a B2B contact research specialist. Find decision-makers at this company who would benefit from AI automation, virtual assistance, or operations support. Search for: CEO, Founder, COO, Head of Operations.
Respond ONLY in JSON:
{
  "contacts": [{ "name": "full name or Unknown", "role": "job title", "email": "best guess or unknown", "linkedin": "url or unknown", "confidence": "high|medium|low", "reasoning": "why this person" }],
  "companyDomain": "company.com or unknown",
  "emailPattern": "pattern or unknown"
}`;

const STATUS_COLORS = {
  Sent: "#FFB800", Opened: "#00BFFF", Replied: "#00FFB2",
  "No Response": "#555", Converted: "#FF6B6B",
};
const STATUS_OPTIONS = ["Sent", "Opened", "Replied", "No Response", "Converted"];
const categoryColor = (cat) =>
  cat?.includes("AI") ? "#00FFB2" : cat?.includes("Virtual") ? "#FFB800" : "#FF6B6B";

// ── Shared styles ─────────────────────────────────────────────────────────────
const lbl = { fontSize: 11, letterSpacing: 4, color: "#555", display: "block", marginBottom: 10 };
const secLbl = { fontSize: 10, letterSpacing: 5, color: "#555", marginBottom: 12 };
const inp = (fs = 15) => ({
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid #333", color: "#E8E8E8", fontSize: fs,
  padding: "8px 0", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
});
const ghostBtn = {
  background: "transparent", border: "1px solid #333", color: "#666",
  padding: "5px 12px", fontSize: 9, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit",
};
const greenBtn = {
  background: "#00FFB2", color: "#000", border: "none",
  padding: "10px 24px", fontSize: 11, letterSpacing: 3,
  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

// ── API Key Gate ──────────────────────────────────────────────────────────────
function ApiKeyGate({ onKey }) {
  const [key, setKey] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Courier New', monospace" }}>
      <div style={{ maxWidth: 460, width: "100%", border: "1px solid #1E1E2E", background: "#0D0D18", padding: 36 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#00FFB2", marginBottom: 20 }}>OUTREACH OS // SETUP</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#E8E8E8", fontFamily: "'Georgia', serif", marginBottom: 8, marginTop: 0 }}>Enter your Anthropic API Key</h2>
        <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>
          Your key is stored only in your browser (localStorage) and never sent anywhere except directly to Anthropic's API.
          Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "#00FFB2" }}>console.anthropic.com</a>.
        </p>
        <label style={lbl}>ANTHROPIC API KEY</label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && key.startsWith("sk-") && onKey(key)}
          placeholder="sk-ant-..."
          style={{ ...inp(14), marginBottom: 20 }}
        />
        <button
          onClick={() => key.startsWith("sk-") && onKey(key)}
          disabled={!key.startsWith("sk-")}
          style={{ ...greenBtn, opacity: key.startsWith("sk-") ? 1 : 0.4, cursor: key.startsWith("sk-") ? "pointer" : "not-allowed" }}
        >
          START →
        </button>
        <p style={{ fontSize: 10, color: "#333", marginTop: 16, lineHeight: 1.6 }}>
          Your key is saved in your browser. Clear it anytime by clicking "Reset Key" in the app.
        </p>
      </div>
    </div>
  );
}

// ── Claude API call (FIXED) ───────────────────────────────────────────────────
async function callClaude(apiKey, system, userMsg, useSearch = false) {
  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
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
      "anthropic-dangerous-direct-browser-access": "true" 
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  
  // Collect ALL text from response (handles web search tool results)
  let fullText = "";
  if (data.content && Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === "text") {
        fullText += block.text + "\n";
      } else if (block.type === "tool_result" && block.content) {
        // Web search results are in tool_result blocks
        if (Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text") {
              fullText += item.text + "\n";
            }
          }
        } else if (typeof block.content === "string") {
          fullText += block.content + "\n";
        }
      }
    }
  }

  console.log("DEBUG: Full text from API:", fullText);

  // Extract and parse JSON
  try {
    // Look for JSON object in the response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    
    const jsonStr = jsonMatch[0];
    console.log("DEBUG: Extracted JSON string:", jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    console.log("DEBUG: Successfully parsed JSON:", parsed);
    return parsed;
  } catch (e) {
    console.error("ERROR: Failed to parse JSON. Full response was:", fullText);
    throw new Error(`Failed to parse JSON response: ${e.message}`);
  }
}

// ── Gmail send ────────────────────────────────────────────────────────────────
async function sendGmail(to, subject, body) {
  const token = window.__GTOKEN__;
  if (!token) throw new Error("Gmail not connected");
  const raw = btoa(unescape(encodeURIComponent(
    [`To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=utf-8`, ``, body].join("\r\n")
  ))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) throw new Error("Gmail send failed");
}

// ── Agent Panel ───────────────────────────────────────────────────────────────
function AgentPanel({ apiKey, onSent, templates }) {
  const [company, setCompany] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [stage, setStage] = useState(null);
  const [stageIdx, setStageIdx] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const run = async () => {
    if (!company.trim()) return;
    setResult(null); setError(null); setSendStatus(null); setSelectedContact(null);
    setStage("running"); setStageIdx(0);
    try {
      const tick = (i) => new Promise(r => setTimeout(() => { setStageIdx(i); r(); }, 1600));
      await tick(0); await tick(1);
      const parsed = await callClaude(apiKey, systemPrompt, `Research and generate outreach for: "${company}". Return only JSON.`, true);
      await tick(2);
      setResult(parsed);
      let body = parsed.emailBody;
      if (selectedTemplate) body = selectedTemplate.body.replace(/\[COMPANY\]/g, company).replace(/\[PAIN_POINT\]/g, parsed.primaryPainPoint || "");
      setEditBody(body); setEditSubject(parsed.emailSubject);
      setStageIdx(3); setStage("done");
    } catch (e) { setError(e.message || "Error"); setStage(null); setStageIdx(-1); }
  };

  const send = async () => {
    if (!recipientEmail.trim()) { alert("Enter recipient email."); return; }
    setSendStatus("sending");
    try {
      await sendGmail(recipientEmail, editSubject, editBody);
      setSendStatus("sent");
      onSent({ id: Date.now(), company, recipient: recipientEmail, subject: editSubject, emailBody: editBody, overview: result?.companyOverview || "", painPoints: result?.painPoints || [], contacts: result?.contacts || [], status: "Sent", sentAt: new Date().toISOString(), notes: "", followUps: [] });
    } catch (e) {
      setSendStatus("error");
      console.error(e);
    }
  };

  const reset = () => { setCompany(""); setRecipientEmail(""); setStage(null); setStageIdx(-1); setResult(null); setError(null); setEditing(false); setSendStatus(null); setSelectedContact(null); };

  return (
    <div>
      {!stage && !result && (
        <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: 28, marginBottom: 20 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>TARGET COMPANY</label>
            <input ref={inputRef} value={company} onChange={e => setCompany(e.target.value)} onKeyDown={e => e.key === "Enter" && run()} placeholder="e.g. Flutterwave, Paystack..." style={inp(18)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>RECIPIENT EMAIL <span style={{ color: "#333" }}>(optional)</span></label>
            <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="contact@company.com" style={inp(15)} />
          </div>
          {templates.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>APPLY TEMPLATE</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {templates.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                    style={{ ...ghostBtn, borderColor: selectedTemplate?.id === t.id ? "#00FFB2" : "#333", color: selectedTemplate?.id === t.id ? "#00FFB2" : "#666" }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={run} disabled={!company.trim()} style={{ background: company.trim() ? "#00FFB2" : "#1A1A2E", color: company.trim() ? "#000" : "#444", border: "none", padding: "11px 28px", fontSize: 11, letterSpacing: 3, fontWeight: 700, cursor: company.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            RUN AGENT →
          </button>
        </div>
      )}

      {stage === "running" && (
        <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "36px 28px", marginBottom: 20 }}>
          <div style={{ ...secLbl, marginBottom: 24 }}>RUNNING // {company.toUpperCase()}</div>
          {STAGES.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, opacity: i <= stageIdx ? 1 : 0.2, transition: "opacity 0.5s" }}>
              <div style={{ width: 30, height: 30, border: `1px solid ${i === stageIdx ? "#00FFB2" : i < stageIdx ? "#00FFB240" : "#222"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: i < stageIdx ? "#00FFB210" : "transparent", flexShrink: 0 }}>
                {i < stageIdx ? "✓" : s.icon}
              </div>
              <div style={{ fontSize: 13, color: i === stageIdx ? "#00FFB2" : "#888" }}>{s.label}{i === stageIdx && "..."}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ border: "1px solid #FF6B6B40", background: "#FF6B6B10", padding: 16, marginBottom: 16, color: "#FF6B6B", fontSize: 12 }}>
          ⚠ {error}
          <button onClick={reset} style={{ marginLeft: 12, color: "#00FFB2", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Retry →</button>
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "20px 24px" }}>
            <div style={secLbl}>COMPANY INTEL</div>
            <div style={{ fontSize: 13, color: "#AAA", lineHeight: 1.7 }}>{result.companyOverview}</div>
          </div>

          {result.contacts?.length > 0 && (
            <div style={{ border: "1px solid #00BFFF20", background: "#0D0D18", padding: "20px 24px" }}>
              <div style={secLbl}>CONTACTS FOUND</div>
              {result.contacts.map((c, i) => (
                <div key={i} onClick={() => { setSelectedContact(c); if (c.email && c.email !== "unknown") setRecipientEmail(c.email); }}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 12px", border: `1px solid ${selectedContact === c ? "#00BFFF50" : "#1E1E2E"}`, cursor: "pointer", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{c.role}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#00BFFF" }}>{c.email !== "unknown" ? c.email : "email unknown"}</div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: c.confidence === "high" ? "#00FFB2" : c.confidence === "medium" ? "#FFB800" : "#555", border: "1px solid #33333340", padding: "2px 6px" }}>
                    {c.confidence?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "20px 24px" }}>
            <div style={secLbl}>PAIN POINTS</div>
            {result.painPoints?.map((p, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${categoryColor(p.category)}`, paddingLeft: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 9, letterSpacing: 3, color: categoryColor(p.category), border: `1px solid ${categoryColor(p.category)}40`, padding: "2px 7px" }}>{p.category?.toUpperCase()}</span>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 2 }}>{p.point}</div>
                <div style={{ fontSize: 11, color: "#555" }}>Signal: {p.evidence}</div>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid #00FFB220", background: "#0D0D18", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={secLbl}>OUTREACH EMAIL</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(!editing)} style={ghostBtn}>{editing ? "PREVIEW" : "EDIT"}</button>
                <button onClick={() => { navigator.clipboard.writeText(`Subject: ${editSubject}\n\n${editBody}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ ...ghostBtn, borderColor: "#00FFB240", color: "#00FFB2" }}>{copied ? "✓ COPIED" : "COPY"}</button>
              </div>
            </div>
            <div style={{ background: "#00FFB208", border: "1px solid #00FFB215", padding: "9px 13px", marginBottom: 12 }}>
              <span style={{ fontSize: 10, letterSpacing: 3, color: "#555", marginRight: 10 }}>SUBJECT</span>
              {editing
                ? <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ background: "transparent", border: "none", borderBottom: "1px solid #00FFB240", color: "#00FFB2", fontSize: 13, outline: "none", fontFamily: "inherit", width: "calc(100% - 80px)" }} />
                : <span style={{ fontSize: 13, color: "#00FFB2" }}>{editSubject}</span>}
            </div>
            {editing
              ? <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{ width: "100%", minHeight: 220, background: "#0A0A12", border: "1px solid #333", color: "#DDD", fontSize: 13, lineHeight: 1.8, padding: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              : <div style={{ fontSize: 13, lineHeight: 1.9, color: "#CCC", whiteSpace: "pre-wrap" }}>{editBody}</div>}
          </div>

          <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "18px 24px" }}>
            <div style={secLbl}>SEND VIA GMAIL</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="Recipient email..."
                style={{ flex: 1, minWidth: 180, background: "transparent", border: "1px solid #333", color: "#E8E8E8", fontSize: 14, padding: "9px 12px", outline: "none", fontFamily: "inherit" }} />
              <button onClick={send} disabled={sendStatus === "sending" || sendStatus === "sent"} style={{ ...greenBtn, opacity: sendStatus === "sending" ? 0.5 : 1 }}>
                {sendStatus === "sending" ? "SENDING..." : sendStatus === "sent" ? "✓ SENT!" : "SEND + LOG →"}
              </button>
            </div>
            {sendStatus === "sent" && <div style={{ marginTop: 10, fontSize: 12, color: "#00FFB2" }}>✓ Sent & logged to tracker</div>}
            {sendStatus === "error" && <div style={{ marginTop: 10, fontSize: 12, color: "#FF6B6B" }}>⚠ Send failed — check Gmail connection or copy email manually.</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={reset} style={ghostBtn}>← NEW COMPANY</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Batch Panel ───────────────────────────────────────────────────────────────
function BatchPanel({ apiKey, onBatchSent }) {
  const [input, setInput] = useState("");
  const [jobs, setJobs] = useState([]);
  const [running, setRunning] = useState(false);
  const companies = input.split("\n").map(s => s.trim()).filter(Boolean);

  const runBatch = async () => {
    if (!companies.length) return;
    setRunning(true);
    setJobs(companies.map(c => ({ company: c, status: "queued", result: null, error: null })));
    for (let i = 0; i < companies.length; i++) {
      setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "running" } : j));
      try {
        const parsed = await callClaude(apiKey, systemPrompt, `Research and generate outreach for: "${companies[i]}". Return only JSON.`, true);
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "done", result: parsed } : j));
      } catch (e) {
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "error", error: e.message } : j));
      }
    }
    setRunning(false);
  };

  const logAll = () => {
    const entries = jobs.filter(j => j.status === "done" && j.result).map(j => ({
      id: Date.now() + Math.random(), company: j.company, recipient: "",
      subject: j.result.emailSubject, emailBody: j.result.emailBody,
      overview: j.result.companyOverview || "", painPoints: j.result.painPoints || [],
      contacts: j.result.contacts || [], status: "Sent",
      sentAt: new Date().toISOString(), notes: "", followUps: [],
    }));
    onBatchSent(entries);
  };

  const sIcon = s => ({ queued: "○", running: "◌", done: "✓", error: "✕" }[s]);
  const sColor = s => ({ queued: "#444", running: "#FFB800", done: "#00FFB2", error: "#FF6B6B" }[s]);

  return (
    <div>
      <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: 26, marginBottom: 20 }}>
        <div style={secLbl}>COMPANIES (one per line)</div>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={"Flutterwave\nPaystack\nPiggyVest\nChowdeck"} disabled={running}
          style={{ width: "100%", minHeight: 120, background: "#0A0A12", border: "1px solid #222", color: "#DDD", fontSize: 13, padding: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={runBatch} disabled={running || !input.trim()} style={{ background: !running && input.trim() ? "#00FFB2" : "#1A1A2E", color: !running && input.trim() ? "#000" : "#444", border: "none", padding: "10px 22px", fontSize: 11, letterSpacing: 3, fontWeight: 700, cursor: !running && input.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {running ? "RUNNING..." : `RUN BATCH (${companies.length}) →`}
          </button>
          {jobs.some(j => j.status === "done") && !running && (
            <button onClick={logAll} style={{ ...ghostBtn, borderColor: "#00FFB240", color: "#00FFB2" }}>LOG ALL →</button>
          )}
        </div>
      </div>
      {jobs.map((j, i) => (
        <div key={i} style={{ border: `1px solid ${j.status === "done" ? "#00FFB220" : "#1E1E2E"}`, background: "#0D0D18", padding: "13px 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 14, color: sColor(j.status), minWidth: 16, marginTop: 2 }}>{sIcon(j.status)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: j.result ? 6 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{j.company}</div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: sColor(j.status) }}>{j.status.toUpperCase()}</div>
              </div>
              {j.result && <><div style={{ fontSize: 11, color: "#00FFB2", marginBottom: 3 }}>📧 {j.result.emailSubject}</div><div style={{ fontSize: 11, color: "#555" }}>{j.result.companyOverview}</div></>}
              {j.error && <div style={{ fontSize: 11, color: "#FF6B6B" }}>Error: {j.error}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Contact Finder ────────────────────────────────────────────────────────────
function ContactFinderPanel({ apiKey }) {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const confColor = c => c === "high" ? "#00FFB2" : c === "medium" ? "#FFB800" : "#555";

  const find = async () => {
    if (!company.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const parsed = await callClaude(apiKey, contactFinderPrompt, `Find decision-makers at: "${company}". Return only JSON.`, true);
      setResult(parsed);
    } catch (e) { setError(e.message || "Error"); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: 26, marginBottom: 20 }}>
        <label style={lbl}>COMPANY NAME</label>
        <input value={company} onChange={e => setCompany(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} placeholder="e.g. Andela, Interswitch..." style={{ ...inp(17), marginBottom: 18 }} />
        <button onClick={find} disabled={loading || !company.trim()} style={{ background: !loading && company.trim() ? "#00BFFF" : "#1A1A2E", color: !loading && company.trim() ? "#000" : "#444", border: "none", padding: "10px 22px", fontSize: 11, letterSpacing: 3, fontWeight: 700, cursor: !loading && company.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          {loading ? "SEARCHING..." : "FIND CONTACTS →"}
        </button>
      </div>
      {error && <div style={{ border: "1px solid #FF6B6B40", background: "#FF6B6B10", padding: 14, color: "#FF6B6B", fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result.companyDomain !== "unknown" && (
            <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "14px 20px", display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 9, letterSpacing: 3, color: "#555", marginBottom: 4 }}>DOMAIN</div><div style={{ fontSize: 13, color: "#00BFFF" }}>{result.companyDomain}</div></div>
              {result.emailPattern !== "unknown" && <div><div style={{ fontSize: 9, letterSpacing: 3, color: "#555", marginBottom: 4 }}>EMAIL PATTERN</div><div style={{ fontSize: 13, color: "#FFB800" }}>{result.emailPattern}</div></div>}
            </div>
          )}
          {result.contacts?.map((c, i) => (
            <div key={i} style={{ border: `1px solid ${confColor(c.confidence)}30`, background: "#0D0D18", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.name}</div><div style={{ fontSize: 11, color: "#888" }}>{c.role}</div></div>
                <span style={{ fontSize: 9, letterSpacing: 3, color: confColor(c.confidence), border: `1px solid ${confColor(c.confidence)}40`, padding: "3px 8px", alignSelf: "flex-start" }}>{c.confidence?.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                {c.email !== "unknown" && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#00BFFF" }}>{c.email}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.email); setCopied(i); setTimeout(() => setCopied(null), 2000); }} style={{ ...ghostBtn, fontSize: 8, padding: "2px 8px" }}>{copied === i ? "✓" : "COPY"}</button>
                  </div>
                )}
                {c.linkedin !== "unknown" && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#555", textDecoration: "none" }}>LinkedIn →</a>}
              </div>
              <div style={{ fontSize: 11, color: "#444", fontStyle: "italic" }}>{c.reasoning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Templates Panel ───────────────────────────────────────────────────────────
function TemplatesPanel({ templates, setTemplates }) {
  const [name, setName] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [editing, setEditing] = useState(null);
  const save = () => {
    if (!name.trim() || !body.trim()) return;
    if (editing) { setTemplates(prev => prev.map(t => t.id === editing ? { ...t, name, subject, body } : t)); setEditing(null); }
    else setTemplates(prev => [...prev, { id: Date.now(), name, subject, body }]);
    setName(""); setSubject(""); setBody("");
  };
  const edit = t => { setEditing(t.id); setName(t.name); setSubject(t.subject); setBody(t.body); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: 24 }}>
        <div style={secLbl}>{editing ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>NAME</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AI Automation Pitch" style={inp(14)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>SUBJECT</label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Use [COMPANY] as placeholder" style={inp(14)} /></div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>BODY — use [COMPANY] and [PAIN_POINT]</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={"Hi there,\n\nI came across [COMPANY]..."} style={{ width: "100%", minHeight: 140, background: "#0A0A12", border: "1px solid #222", color: "#DDD", fontSize: 13, padding: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={save} disabled={!name.trim() || !body.trim()} style={{ background: name.trim() && body.trim() ? "#00FFB2" : "#1A1A2E", color: name.trim() && body.trim() ? "#000" : "#444", border: "none", padding: "10px 22px", fontSize: 11, letterSpacing: 3, fontWeight: 700, cursor: name.trim() && body.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {editing ? "UPDATE →" : "SAVE →"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setName(""); setSubject(""); setBody(""); }} style={ghostBtn}>CANCEL</button>}
        </div>
      </div>
      {templates.length === 0
        ? <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "40px 24px", textAlign: "center", color: "#444", fontSize: 12, letterSpacing: 2 }}>NO TEMPLATES YET</div>
        : templates.map(t => (
          <div key={t.id} style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => edit(t)} style={ghostBtn}>EDIT</button>
                <button onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))} style={{ ...ghostBtn, color: "#FF6B6B44", borderColor: "#FF6B6B22" }}>DEL</button>
              </div>
            </div>
            {t.subject && <div style={{ fontSize: 11, color: "#00FFB2", marginBottom: 4 }}>📧 {t.subject}</div>}
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6, maxHeight: 60, overflow: "hidden" }}>{t.body.slice(0, 180)}{t.body.length > 180 ? "..." : ""}</div>
          </div>
        ))}
    </div>
  );
}

// ── Tracker Panel ─────────────────────────────────────────────────────────────
function TrackerPanel({ apiKey, log, setLog, onGoAgent }) {
  const [expandedId, setExpandedId] = useState(null);
  const [generatingFU, setGeneratingFU] = useState(null);
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [replyMsg, setReplyMsg] = useState(null);

  const updateStatus = (id, s) => setLog(prev => prev.map(e => e.id === id ? { ...e, status: s } : e));
  const updateNotes = (id, n) => setLog(prev => prev.map(e => e.id === id ? { ...e, notes: n } : e));
  const del = (id) => { setLog(prev => prev.filter(e => e.id !== id)); if (expandedId === id) setExpandedId(null); };

  const genFU = async (entry) => {
    setGeneratingFU(entry.id);
    try {
      const parsed = await callClaude(apiKey, followUpPrompt, `Company: ${entry.company}\nOriginal subject: ${entry.subject}\nOriginal email:\n${entry.emailBody}\n\nReturn only JSON.`);
      setLog(prev => prev.map(e => e.id === entry.id ? { ...e, followUps: [...(e.followUps || []), { ...parsed, generatedAt: new Date().toISOString(), sent: false }] } : e));
    } catch { alert("Failed to generate follow-up."); }
    setGeneratingFU(null);
  };

  const sendFU = async (entry, fuIdx) => {
    if (!entry.recipient) { alert("No recipient email."); return; }
    const fu = entry.followUps[fuIdx];
    try {
      await sendGmail(entry.recipient, fu.subject, fu.body);
      setLog(prev => prev.map(e => e.id === entry.id ? { ...e, followUps: e.followUps.map((f, i) => i === fuIdx ? { ...f, sent: true, sentAt: new Date().toISOString() } : f) } : e));
    } catch { alert("Failed to send."); }
  };

  const checkReplies = async () => {
    setCheckingReplies(true); setReplyMsg(null);
    let updated = 0;
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread&maxResults=20`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
      const data = await res.json();
      for (const msg of (data.messages || [])) {
        const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From`, { headers: { Authorization: `Bearer ${window.__GTOKEN__}` } });
        const mData = await mRes.json();
        const from = mData.payload?.headers?.find(h => h.name === "From")?.value || "";
        setLog(prev => {
          let changed = false;
          const next = prev.map(e => {
            if (e.status !== "Replied" && e.recipient && from.includes(e.recipient.split("@")[1] || "NOOP")) {
              changed = true; return { ...e, status: "Replied", replyDetectedAt: new Date().toISOString() };
            }
            return e;
          });
          if (changed) updated++;
          return next;
        });
      }
      setReplyMsg(updated > 0 ? `✓ ${updated} new reply detected!` : "No new replies found.");
    } catch { setReplyMsg("⚠ Could not check inbox."); }
    setCheckingReplies(false);
  };

  const bookCall = (entry) => {
    const summary = encodeURIComponent(`Discovery Call - ${entry.company}`);
    const desc = encodeURIComponent(`Follow-up call. Original outreach: ${entry.subject}`);
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    window.open(`https://calendar.google.com/calendar/r/eventedit?text=${summary}&details=${desc}&dates=${fmt(start)}/${fmt(end)}&add=${encodeURIComponent(entry.recipient || "")}`, "_blank");
  };

  const exportCSV = () => {
    const rows = [["Company", "Recipient", "Subject", "Status", "Sent At", "Notes", "Follow-ups"]];
    log.forEach(e => rows.push([e.company, e.recipient, e.subject, e.status, new Date(e.sentAt).toLocaleDateString(), (e.notes || "").replace(/,/g, ";"), (e.followUps || []).filter(f => f.sent).length]));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `outreach-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const stats = {
    total: log.length, sent: log.filter(e => e.status === "Sent").length,
    replied: log.filter(e => e.status === "Replied").length,
    converted: log.filter(e => e.status === "Converted").length,
    noReply: log.filter(e => e.status === "No Response").length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 18 }}>
        {[["TOTAL", stats.total, "#E8E8E8"], ["SENT", stats.sent, "#FFB800"], ["REPLIED", stats.replied, "#00FFB2"], ["CONVERTED", stats.converted, "#FF6B6B"], ["NO REPLY", stats.noReply, "#555"]].map(([l, v, c]) => (
          <div key={l} style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: c, fontFamily: "'Georgia', serif" }}>{v}</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: "#444", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={checkReplies} disabled={checkingReplies} style={{ ...ghostBtn, borderColor: "#00BFFF40", color: "#00BFFF", padding: "7px 14px", fontSize: 9 }}>{checkingReplies ? "CHECKING..." : "🔄 CHECK REPLIES"}</button>
        {log.length > 0 && <button onClick={exportCSV} style={{ ...ghostBtn, padding: "7px 14px", fontSize: 9 }}>↓ EXPORT CSV</button>}
        {replyMsg && <span style={{ fontSize: 11, color: replyMsg.includes("✓") ? "#00FFB2" : "#FF6B6B" }}>{replyMsg}</span>}
      </div>
      {log.length === 0 ? (
        <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "50px 24px", textAlign: "center", color: "#444" }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>NO OUTREACH LOGGED YET</div>
          <button onClick={onGoAgent} style={greenBtn}>GO TO AGENT →</button>
        </div>
      ) : log.map(entry => (
        <div key={entry.id} style={{ border: `1px solid ${expandedId === entry.id ? "#00FFB230" : "#1E1E2E"}`, background: "#0D0D18", marginBottom: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>{entry.company}</div>
              <div style={{ fontSize: 10, color: "#555" }}>{entry.recipient || "No recipient"}</div>
            </div>
            <div style={{ fontSize: 10, color: "#444" }}>{new Date(entry.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            {(entry.followUps || []).length > 0 && <div style={{ fontSize: 8, letterSpacing: 2, color: "#FFB800", border: "1px solid #FFB80030", padding: "2px 6px" }}>{(entry.followUps || []).filter(f => f.sent).length}/{(entry.followUps || []).length} FU</div>}
            {entry.replyDetectedAt && <div style={{ fontSize: 8, letterSpacing: 2, color: "#00FFB2", border: "1px solid #00FFB230", padding: "2px 6px" }}>AUTO ✓</div>}
            <select value={entry.status} onChange={e => updateStatus(entry.id, e.target.value)} style={{ background: "#0A0A0F", border: `1px solid ${STATUS_COLORS[entry.status]}50`, color: STATUS_COLORS[entry.status], padding: "4px 6px", fontSize: 8, letterSpacing: 2, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} style={ghostBtn}>{expandedId === entry.id ? "CLOSE" : "VIEW"}</button>
            <button onClick={() => del(entry.id)} style={{ background: "transparent", border: "none", color: "#333", fontSize: 12, cursor: "pointer", padding: "2px 4px" }}>✕</button>
          </div>
          {expandedId === entry.id && (
            <div style={{ borderTop: "1px solid #1A1A2A", padding: "16px 14px 20px" }}>
              <div style={secLbl}>SUBJECT</div>
              <div style={{ fontSize: 13, color: "#00FFB2", marginBottom: 14 }}>{entry.subject}</div>
              <div style={secLbl}>EMAIL SENT</div>
              <div style={{ fontSize: 11, color: "#777", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "#0A0A12", padding: 12, marginBottom: 14, maxHeight: 150, overflowY: "auto" }}>{entry.emailBody}</div>
              {(entry.status === "Replied" || entry.status === "Converted") && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={() => bookCall(entry)} style={{ ...ghostBtn, borderColor: "#00FFB240", color: "#00FFB2", padding: "7px 14px", fontSize: 9 }}>📅 BOOK DISCOVERY CALL →</button>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={secLbl}>FOLLOW-UPS</div>
                <button onClick={() => genFU(entry)} disabled={generatingFU === entry.id} style={{ ...ghostBtn, borderColor: "#FFB80050", color: "#FFB800", fontSize: 9 }}>
                  {generatingFU === entry.id ? "GENERATING..." : "+ GENERATE"}
                </button>
              </div>
              {(entry.followUps || []).length === 0 && <div style={{ fontSize: 11, color: "#333", marginBottom: 12 }}>No follow-ups yet.</div>}
              {(entry.followUps || []).map((fu, fuIdx) => (
                <div key={fuIdx} style={{ border: `1px solid ${fu.sent ? "#00FFB230" : "#FFB80030"}`, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 6 }}>
                    <div style={{ fontSize: 11, color: fu.sent ? "#00FFB2" : "#FFB800" }}>{fu.sent ? "✓ Sent" : "● Draft"}</div>
                    {!fu.sent && <button onClick={() => sendFU(entry, fuIdx)} style={{ background: "#FFB800", color: "#000", border: "none", padding: "4px 10px", fontSize: 9, letterSpacing: 2, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>SEND →</button>}
                  </div>
                  <div style={{ fontSize: 11, color: "#00FFB2", marginBottom: 5 }}>📧 {fu.subject}</div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{fu.body}</div>
                </div>
              ))}
              <div style={secLbl}>NOTES</div>
              <textarea value={entry.notes} onChange={e => updateNotes(entry.id, e.target.value)} placeholder="Add notes..." style={{ width: "100%", minHeight: 60, background: "#0A0A12", border: "1px solid #222", color: "#CCC", fontSize: 12, padding: 10, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ log }) {
  const total = log.length;
  const replied = log.filter(e => e.status === "Replied" || e.status === "Converted").length;
  const converted = log.filter(e => e.status === "Converted").length;
  const withFU = log.filter(e => (e.followUps || []).some(f => f.sent)).length;
  const replyRate = total ? Math.round((replied / total) * 100) : 0;
  const convRate = total ? Math.round((converted / total) * 100) : 0;
  const byMonth = {};
  log.forEach(e => { const m = new Date(e.sentAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }); byMonth[m] = (byMonth[m] || 0) + 1; });
  const months = Object.entries(byMonth).slice(-6);
  const maxM = Math.max(...months.map(([, v]) => v), 1);
  const byCategory = {};
  log.forEach(e => (e.painPoints || []).forEach(p => { const cat = p.category?.split("/")[0]?.trim() || "Other"; byCategory[cat] = (byCategory[cat] || 0) + 1; }));

  if (total === 0) return (
    <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "50px 24px", textAlign: "center", color: "#444" }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>📊</div>
      <div style={{ fontSize: 11, letterSpacing: 2 }}>NO DATA YET — START SENDING OUTREACH</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[["REPLY RATE", `${replyRate}%`, `${replied} of ${total}`, "#00FFB2"], ["CONVERSION", `${convRate}%`, `${converted} closed`, "#FF6B6B"], ["FOLLOW-UP RATE", `${total ? Math.round((withFU / total) * 100) : 0}%`, `${withFU} sent`, "#FFB800"]].map(([l, v, s, c]) => (
          <div key={l} style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "18px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: c, fontFamily: "'Georgia', serif" }}>{v}</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: "#555", marginTop: 4 }}>{l}</div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>
      {months.length > 0 && (
        <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "18px 20px" }}>
          <div style={secLbl}>OUTREACH BY MONTH</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
            {months.map(([m, v]) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 10, color: "#00FFB2" }}>{v}</div>
                <div style={{ width: "100%", background: "#00FFB2", height: `${(v / maxM) * 60}px`, minHeight: 4 }} />
                <div style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(byCategory).length > 0 && (
        <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "18px 20px" }}>
          <div style={secLbl}>PAIN POINTS TARGETED</div>
          {Object.entries(byCategory).map(([cat, count]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: categoryColor(cat) }}>{cat}</span>
                <span style={{ fontSize: 11, color: "#555" }}>{count}</span>
              </div>
              <div style={{ height: 4, background: "#111" }}><div style={{ height: "100%", background: categoryColor(cat), width: `${(count / total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div style={{ border: "1px solid #1E1E2E", background: "#0D0D18", padding: "18px 20px" }}>
        <div style={secLbl}>PIPELINE</div>
        {STATUS_OPTIONS.map(s => {
          const count = log.filter(e => e.status === s).length;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 80, fontSize: 8, letterSpacing: 2, color: STATUS_COLORS[s] }}>{s.toUpperCase()}</div>
              <div style={{ flex: 1, height: 5, background: "#111" }}><div style={{ height: "100%", background: STATUS_COLORS[s], width: `${total ? (count / total) * 100 : 0}%` }} /></div>
              <div style={{ fontSize: 11, color: "#555", minWidth: 24, textAlign: "right" }}>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("outreach-os-key") || "");
  const [view, setView] = useState("agent");
  const [log, setLog] = useState(() => { try { return JSON.parse(localStorage.getItem("outreach-log") || "[]"); } catch { return []; } });
  const [templates, setTemplates] = useState(() => { try { return JSON.parse(localStorage.getItem("outreach-templates") || "[]"); } catch { return []; } });

  useEffect(() => { if (apiKey) localStorage.setItem("outreach-os-key", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("outreach-log", JSON.stringify(log)); }, [log]);
  useEffect(() => { localStorage.setItem("outreach-templates", JSON.stringify(templates)); }, [templates]);

  if (!apiKey) return <ApiKeyGate onKey={k => { localStorage.setItem("outreach-os-key", k); setApiKey(k); }} />;

  const noReply = log.filter(e => e.status === "No Response").length;
  const tabs = [
    { id: "agent", label: "⚡ AGENT" },
    { id: "batch", label: "⚡⚡ BATCH" },
    { id: "contacts", label: "👤 CONTACTS" },
    { id: "templates", label: `📝 TEMPLATES${templates.length ? ` (${templates.length})` : ""}` },
    { id: "tracker", label: `📋 TRACKER${log.length ? ` (${log.length})` : ""}${noReply ? ` ⚠${noReply}` : ""}` },
    { id: "analytics", label: "📊 ANALYTICS" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", fontFamily: "'Courier New', monospace", color: "#E8E8E8", padding: "28px 16px" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(0,255,178,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,178,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 6, color: "#00FFB2", marginBottom: 6 }}>AI OUTREACH OS // v5.1 FIXED</div>
            <h1 style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 900, margin: 0, fontFamily: "'Georgia', serif" }}>
              The Complete <span style={{ color: "#00FFB2" }}>Outreach OS</span>
            </h1>
          </div>
          <button onClick={() => { localStorage.removeItem("outreach-os-key"); setApiKey(""); }} style={{ ...ghostBtn, fontSize: 8 }}>RESET API KEY</button>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 22, border: "1px solid #1E1E2E", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ flex: "0 0 auto", background: view === tab.id ? "#00FFB2" : "transparent", color: view === tab.id ? "#000" : "#555", border: "none", padding: "9px 10px", fontSize: 8, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", fontWeight: view === tab.id ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {view === "agent" && <AgentPanel apiKey={apiKey} onSent={e => setLog(prev => [e, ...prev])} templates={templates} />}
        {view === "batch" && <BatchPanel apiKey={apiKey} onBatchSent={entries => setLog(prev => [...entries, ...prev])} />}
        {view === "contacts" && <ContactFinderPanel apiKey={apiKey} />}
        {view === "templates" && <TemplatesPanel templates={templates} setTemplates={setTemplates} />}
        {view === "tracker" && <TrackerPanel apiKey={apiKey} log={log} setLog={setLog} onGoAgent={() => setView("agent")} />}
        {view === "analytics" && <AnalyticsPanel log={log} />}
      </div>
      <style>{`* { box-sizing: border-box; } ::placeholder { color: #333; } select option { background: #0D0D18; }`}</style>
    </div>
  );
}
