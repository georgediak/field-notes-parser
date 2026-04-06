import { useState, useRef } from "react";

const SYSTEM_PROMPT = `Είσαι ο Field Notes Parser του George Diakanthou, κτηματομεσίτη και developer στη Ρόδο.

Αναλύεις ελεύθερο κείμενο και εξάγεις δομημένες καρτέλες για ενημέρωση CRM (Qobrix) και Apple Notes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ΑΝΑΓΝΩΡΙΣΗ ΤΥΠΟΥ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ΤΥΠΟΣ 1 — ΑΓΟΡΑΠΩΛΗΣΙΑ/ΜΕΣΙΤΕΙΑ
Signals: επίσκεψη, άρεσε/δεν άρεσε, τιμή, τμ, ιδιοκτήτης, αγοραστής, ραντεβού, προσφορά, αντιπροσφορά

ΤΥΠΟΣ 2 — DEAL SCENARIO / ΙΔΕΑ / ΣΥΝΔΥΑΣΜΟΣ
Signals: "σκέφτομαι", "αν", "θα μπορούσαμε", "συνδυάσουμε", πολλαπλές οντότητες + στρατηγική σκέψη
Αν υπάρχει αμφιβολία μεταξύ 1 και 2: επίλεξε Τύπο 2.

ΤΥΠΟΣ 3 — GENNADI / ΞΕΝΟΔΟΧΕΙΟ / ΕΠΕΝΔΥΤΙΚΟ
Signals: Gennadi, Neilson, TFG, DS1, NewCo, Solon, HMA, GOP, ξενοδοχείο, Gennadiou AE, ManageCo
Αν υπάρχει οτιδήποτε Gennadi-related: ΠΑΝΤΑ Τύπος 3, ανεξάρτητα από άλλα signals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ΕΞΑΓΩΓΗ ΟΝΤΟΤΗΤΩΝ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Εξάγεις πάντα:
- persons: ονόματα πελατών, ιδιοκτητών, επαφών
- properties: ακίνητα (με χαρακτηριστικά αν αναφέρονται)
- financials: τιμές, όρια, προσφορές
- dates: ημερομηνίες, ώρες, deadlines
- actions: ραντεβού, tasks, follow-ups
- contacts (Τύπος 3): επενδυτές, εταιρείες, σύμβουλοι

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — ΑΥΣΤΗΡΑ JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Απαντάς ΜΟΝΟ με έγκυρο JSON, χωρίς κείμενο πριν ή μετά, χωρίς markdown backticks.

Για ΤΥΠΟ 1:
{
  "type": 1,
  "type_label": "Αγοραπωλησία / Μεσιτεία",
  "entities": {
    "persons": [],
    "properties": [],
    "financials": [],
    "dates": [],
    "actions": []
  },
  "cards": [
    {
      "destination": "qobrix",
      "card_type": "contact | property",
      "title": "Όνομα καρτέλας",
      "content": "Έτοιμο κείμενο για paste στο Qobrix notes field"
    },
    {
      "destination": "apple_notes",
      "folder": "Clients | Properties",
      "title": "Όνομα note",
      "content": "Έτοιμο κείμενο για paste στο Apple Notes"
    }
  ],
  "reminders": [
    {
      "title": "Τίτλος reminder",
      "datetime": "YYYY-MM-DD HH:MM ή περιγραφή αν ασαφές",
      "notes": "Επιπλέον πλαίσιο"
    }
  ]
}

Για ΤΥΠΟ 2:
{
  "type": 2,
  "type_label": "Deal Scenario / Ιδέα",
  "scenario_title": "Σύντομος περιγραφικός τίτλος σεναρίου",
  "entities": {
    "persons": [],
    "properties": [],
    "financials": [],
    "contacts": [],
    "actions": []
  },
  "master_card": {
    "destination": "apple_notes",
    "folder": "Deal Scenarios",
    "title": "Scenario: [τίτλος]",
    "content": "Πλήρης Master καρτέλα"
  },
  "reference_cards": [
    {
      "destination": "apple_notes",
      "folder": "Clients | Properties",
      "title": "Όνομα υπάρχουσας καρτέλας",
      "append": ">> SCENARIO: [τίτλος] [ημερομηνία] — βλ. Deal Scenarios"
    },
    {
      "destination": "qobrix",
      "card_type": "contact | property",
      "title": "Όνομα καρτέλας",
      "append": "REF: Scenario [τίτλος] — [ημερομηνία] — βλ. Apple Notes/Deal Scenarios"
    }
  ],
  "reminders": []
}

Για ΤΥΠΟ 3:
{
  "type": 3,
  "type_label": "Gennadi / Ξενοδοχείο / Επενδυτικό",
  "entities": {
    "contacts": [],
    "topics": [],
    "financials": [],
    "dates": [],
    "actions": []
  },
  "cards": [
    {
      "destination": "apple_notes",
      "folder": "Gennadi Hotel",
      "title": "Τίτλος note",
      "content": "Έτοιμο κείμενο",
      "action": "create | append"
    }
  ],
  "reminders": []
}

Σημείωση: η σημερινή ημερομηνία είναι ${new Date().toLocaleDateString('el-GR', {day:'2-digit', month:'2-digit', year:'numeric'})}.`;

const TYPE_CONFIG = {
  1: { label: "Αγοραπωλησία", color: "#2D6A4F", bg: "#D8F3DC", icon: "🏠" },
  2: { label: "Deal Scenario", color: "#7B2D8B", bg: "#F3D8FF", icon: "💡" },
  3: { label: "Gennadi/Ξενοδοχείο", color: "#B5451B", bg: "#FFE8D6", icon: "🏨" },
};

const DEST_CONFIG = {
  qobrix: { label: "Qobrix CRM", color: "#1A4A8A", bg: "#DBEAFE", icon: "📊" },
  apple_notes: { label: "Apple Notes", color: "#1C6B1C", bg: "#DCFCE7", icon: "📝" },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handleCopy} style={{
      padding: "4px 10px", fontSize: "11px", fontFamily: "inherit",
      background: copied ? "#16a34a" : "#f1f5f9",
      color: copied ? "#fff" : "#475569",
      border: "1px solid " + (copied ? "#16a34a" : "#cbd5e1"),
      borderRadius: "5px", cursor: "pointer", transition: "all 0.2s",
      fontWeight: 600, letterSpacing: "0.02em"
    }}>
      {copied ? "✓ Αντιγράφηκε" : "Αντιγραφή"}
    </button>
  );
}

function CardBlock({ card }) {
  const dest = DEST_CONFIG[card.destination] || { label: card.destination, color: "#555", bg: "#eee", icon: "📄" };
  const content = card.content || card.append || "";
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
      overflow: "hidden", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: dest.bg, borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{dest.icon}</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: dest.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{dest.label}</span>
          {card.folder && <span style={{ fontSize: "11px", color: "#64748b" }}>/ {card.folder}</span>}
          {card.card_type && <span style={{ fontSize: "10px", background: "#fff", color: dest.color, border: `1px solid ${dest.color}`, padding: "1px 6px", borderRadius: "10px" }}>{card.card_type}</span>}
          {card.action && <span style={{ fontSize: "10px", background: "#fff", color: "#92400e", border: "1px solid #92400e", padding: "1px 6px", borderRadius: "10px" }}>{card.action}</span>}
          {card.append !== undefined && <span style={{ fontSize: "10px", background: "#fff", color: "#7c3aed", border: "1px solid #7c3aed", padding: "1px 6px", borderRadius: "10px" }}>append →</span>}
        </div>
        <CopyButton text={content} />
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>{card.title}</div>
        <pre style={{
          margin: 0, fontFamily: "'SF Mono', monospace", fontSize: "11.5px",
          lineHeight: "1.7", color: "#334155", whiteSpace: "pre-wrap",
          wordBreak: "break-word", background: "#f8fafc", padding: "10px", borderRadius: "6px"
        }}>{content}</pre>
      </div>
    </div>
  );
}

function ReminderBlock({ reminder }) {
  const text = `${reminder.title}\n${reminder.datetime}${reminder.notes ? "\n" + reminder.notes : ""}`;
  return (
    <div style={{
      background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px",
      padding: "12px 14px", marginBottom: "8px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px"
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span>⏰</span>
          <span style={{ fontWeight: 700, fontSize: "12px", color: "#92400e" }}>Reminder</span>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{reminder.title}</div>
        <div style={{ fontSize: "11px", color: "#78716c", marginTop: "2px" }}>{reminder.datetime}</div>
        {reminder.notes && <div style={{ fontSize: "11px", color: "#78716c" }}>{reminder.notes}</div>}
      </div>
      <CopyButton text={text} />
    </div>
  );
}

function EntityPills({ entities }) {
  const all = [];
  if (entities.persons?.length) entities.persons.forEach(p => all.push({ label: p, type: "person", icon: "👤" }));
  if (entities.properties?.length) entities.properties.forEach(p => all.push({ label: p, type: "property", icon: "🏠" }));
  if (entities.contacts?.length) entities.contacts.forEach(p => all.push({ label: p, type: "contact", icon: "🤝" }));
  if (entities.financials?.length) entities.financials.forEach(p => all.push({ label: p, type: "financial", icon: "💶" }));
  if (entities.dates?.length) entities.dates.forEach(p => all.push({ label: p, type: "date", icon: "📅" }));
  if (entities.topics?.length) entities.topics.forEach(p => all.push({ label: p, type: "topic", icon: "📌" }));
  if (!all.length) return null;
  const colors = { person: "#1d4ed8", property: "#166534", contact: "#7c2d92", financial: "#92400e", date: "#be185d", topic: "#0f766e" };
  const bgs = { person: "#dbeafe", property: "#dcfce7", contact: "#f3e8ff", financial: "#fef3c7", date: "#fce7f3", topic: "#ccfbf1" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
      {all.map((e, i) => (
        <span key={i} style={{
          padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
          background: bgs[e.type] || "#f1f5f9", color: colors[e.type] || "#475569",
          display: "flex", alignItems: "center", gap: "4px"
        }}>
          {e.icon} {e.label}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawJson, setRawJson] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem("fnp_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem("fnp_key"));

  const saveKey = () => {
    localStorage.setItem("fnp_key", apiKey);
    setShowKeyInput(false);
  };

  const parse = async () => {
    if (!input.trim() || !apiKey) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRawJson(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input.trim() }]
        })
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setRawJson(clean);
    } catch (e) {
      setError("Σφάλμα επεξεργασίας. Έλεγξε το API key ή δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") parse();
  };

  const typeConf = result ? TYPE_CONFIG[result.type] : null;
  const allCards = result ? [
    ...(result.cards || []),
    ...(result.master_card ? [result.master_card] : []),
    ...(result.reference_cards || [])
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "#0f172a", padding: "18px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📋</div>
        <div>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: "16px" }}>Field Notes Parser</div>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "monospace" }}>Diakanthou Real Estate · Gennadi Resort</div>
        </div>
        <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontFamily: "sans-serif" }}>
          ⚙️ API Key
        </button>
      </div>

      {showKeyInput && (
        <div style={{ background: "#1e293b", padding: "14px 28px", display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: "13px", fontFamily: "monospace" }}
          />
          <button onClick={saveKey} style={{ padding: "8px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "sans-serif" }}>
            Αποθήκευση
          </button>
        </div>
      )}

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "20px" }}>
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Σημείωση — γράψε ελεύθερα
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Π.χ. «Πήγα με τον Νίκο να δούμε το 3άρι Ιαλυσός. Του άρεσε αλλά βρίσκει την τιμή ψηλή — λέει κάτω από 150 να ξανακοιτάξουμε. Ραντεβού αύριο 11:00 για Φάληρο.»"
              style={{ width: "100%", minHeight: "130px", border: "none", outline: "none", fontSize: "14px", lineHeight: "1.7", color: "#1e293b", fontFamily: "'Georgia', serif", resize: "vertical", padding: "0 0 14px 0", background: "transparent", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "sans-serif" }}>⌘+Enter για ανάλυση</span>
            <button onClick={parse} disabled={loading || !input.trim() || !apiKey} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", background: (loading || !apiKey) ? "#94a3b8" : "#0f172a", color: "#fff", fontWeight: 700, fontSize: "13px", fontFamily: "sans-serif", cursor: (loading || !apiKey) ? "not-allowed" : "pointer" }}>
              {loading ? "Ανάλυση..." : "Ανάλυση →"}
            </button>
          </div>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

        {result && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ padding: "6px 16px", borderRadius: "20px", background: typeConf.bg, color: typeConf.color, fontWeight: 700, fontSize: "13px", fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: "6px", border: `1px solid ${typeConf.color}30` }}>
                <span>{typeConf.icon}</span>
                <span>Τύπος {result.type} — {result.type_label}</span>
              </div>
              {result.scenario_title && <div style={{ fontSize: "13px", color: "#7c3aed", fontWeight: 600 }}>«{result.scenario_title}»</div>}
              <div style={{ marginLeft: "auto", fontSize: "11px", color: "#94a3b8", fontFamily: "sans-serif" }}>{allCards.length} καρτέλες · {(result.reminders || []).length} reminders</div>
            </div>

            {result.entities && <EntityPills entities={result.entities} />}

            {allCards.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Καρτέλες ({allCards.length})</div>
                {allCards.map((card, i) => <CardBlock key={i} card={card} />)}
              </div>
            )}

            {result.reminders?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Reminders</div>
                {result.reminders.map((r, i) => <ReminderBlock key={i} reminder={r} />)}
              </div>
            )}

            <details style={{ marginTop: "8px" }}>
              <summary style={{ fontSize: "11px", color: "#94a3b8", cursor: "pointer", fontFamily: "sans-serif" }}>Raw JSON</summary>
              <pre style={{ marginTop: "8px", padding: "12px", background: "#0f172a", color: "#7dd3fc", borderRadius: "8px", fontSize: "10.5px", fontFamily: "monospace", overflow: "auto", maxHeight: "300px", whiteSpace: "pre-wrap" }}>{rawJson}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
