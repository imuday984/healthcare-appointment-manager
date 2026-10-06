import { useEffect, useMemo, useState } from "react";
import api from "./api";

const tabs = [
  "Dashboard",
  "AI Chat",
  "Flights",
  "Hotels",
  "Cars",
  "Excursions",
  "My Bookings",
  "Approvals",
  "Knowledge Base",
  "System Workflow",
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [chatInput, setChatInput] = useState("Find flights from Chennai to Delhi");
  const [chatMessages, setChatMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cars, setCars] = useState([]);
  const [excursions, setExcursions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [ragStatus, setRagStatus] = useState(null);
  const [kbQuery, setKbQuery] = useState("What is the cancellation policy?");
  const [kbAnswer, setKbAnswer] = useState(null);

  const workflowStages = ["User", "Primary Assistant", "Intent", "Specialized Agent", "RAG/Tool", "Safe/Sensitive", "Approval", "SQLite", "Response"];

  const activeStage = useMemo(() => {
    const last = [...chatMessages].reverse().find((m) => m.role === "assistant");
    if (!last) return "User";
    if (last.workflow_stage?.includes("intent")) return "Intent";
    if (last.workflow_stage?.includes("approval")) return "Approval";
    if (last.workflow_stage?.includes("rag")) return "RAG/Tool";
    return "Response";
  }, [chatMessages]);

  const loadData = async () => {
    const [f, h, c, e, b, a, r] = await Promise.all([
      api.get("/flights"),
      api.get("/hotels"),
      api.get("/cars"),
      api.get("/excursions"),
      api.get("/bookings", { params: { user_id: 1 } }),
      api.get("/approvals", { params: { user_id: 1 } }),
      api.get("/rag/status"),
    ]);
    setFlights(f.data);
    setHotels(h.data);
    setCars(c.data);
    setExcursions(e.data);
    setBookings(b.data);
    setApprovals(a.data);
    setRagStatus(r.data);
  };

  useEffect(() => {
    loadData().catch(() => setError("Unable to load demo data."));
  }, []);

  const sendChat = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/chat", { user_id: 1, conversation_id: conversationId, message: chatInput });
      setConversationId(data.conversation_id);
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: chatInput },
        { ...data, role: "assistant", content: data.response },
      ]);
      setChatInput("");
      loadData();
    } catch {
      setError("Chat request failed.");
    } finally {
      setLoading(false);
    }
  };

  const resolveApproval = async (id, approved) => {
    await api.post(`/approvals/${id}/${approved ? "approve" : "reject"}`);
    await loadData();
  };

  const askKnowledge = async () => {
    const { data } = await api.post("/rag/search", { query: kbQuery, top_k: 4 });
    setKbAnswer(data);
  };

  const ListCard = ({ title, items, render }) => (
    <section className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
      <h2 className="font-semibold text-slate-800 mb-3">{title}</h2>
      <div className="grid md:grid-cols-2 gap-3">{items.map(render)}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Multi-Agentic RAG Travel Support</h1>
          <p className="text-slate-600">Demo mode with LangGraph routing, Qdrant semantic search, approval-gated transactions, and SQLite state.</p>
        </header>

        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <aside className="bg-white rounded-xl p-3 border border-slate-200 h-fit">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${activeTab === tab ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}>
                {tab}
              </button>
            ))}
          </aside>

          <main className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg">{error}</div>}

            {activeTab === "Dashboard" && (
              <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[{ label: "Flights", value: flights.length }, { label: "Hotels", value: hotels.length }, { label: "Bookings", value: bookings.length }, { label: "Pending Approvals", value: approvals.filter((a) => a.status === "PENDING").length }].map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">{kpi.label}</p>
                    <p className="text-2xl font-semibold">{kpi.value}</p>
                  </div>
                ))}
              </section>
            )}

            {activeTab === "AI Chat" && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold mb-3">AI Chat</h2>
                <div className="space-y-3 max-h-96 overflow-auto border rounded-lg p-3 bg-slate-50">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`p-3 rounded-lg ${m.role === "user" ? "bg-blue-50" : "bg-white border"}`}>
                      <p className="text-sm font-medium mb-1">{m.role === "user" ? "You" : `${m.agent || "Assistant"} · ${m.intent || "-"}`}</p>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      {m.tool && <p className="text-xs mt-2 text-slate-500">Tool: {m.tool} | Workflow: {m.workflow_stage}</p>}
                      {m.sources?.length > 0 && <p className="text-xs mt-1 text-slate-500">Sources: {m.sources.join(", ")}</p>}
                      {m.approval_required && m.approval && (
                        <div className="mt-2 border border-amber-300 bg-amber-50 p-2 rounded">
                          <p className="text-xs font-semibold">ACTION REQUIRES APPROVAL</p>
                          <p className="text-xs">{m.approval.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" placeholder="Ask about flights, policies, or bookings" />
                  <button disabled={loading} onClick={sendChat} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60">{loading ? "Sending..." : "Send"}</button>
                </div>
              </section>
            )}

            {activeTab === "Flights" && <ListCard title="Flights" items={flights} render={(f) => <div key={f.id} className="border rounded-lg p-3 bg-slate-50"><p className="font-medium">{f.flight_code}</p><p>{f.origin} → {f.destination}</p><p>{f.travel_date} · ₹{f.price}</p></div>} />}
            {activeTab === "Hotels" && <ListCard title="Hotels" items={hotels} render={(h) => <div key={h.id} className="border rounded-lg p-3 bg-slate-50"><p className="font-medium">{h.name}</p><p>{h.city} · ⭐ {h.rating}</p><p>₹{h.price_per_night}/night</p></div>} />}
            {activeTab === "Cars" && <ListCard title="Cars" items={cars} render={(c) => <div key={c.id} className="border rounded-lg p-3 bg-slate-50"><p className="font-medium">{c.car_model}</p><p>{c.company} · {c.city}</p><p>₹{c.price_per_day}/day</p></div>} />}
            {activeTab === "Excursions" && <ListCard title="Excursions" items={excursions} render={(e) => <div key={e.id} className="border rounded-lg p-3 bg-slate-50"><p className="font-medium">{e.destination} ({e.duration_days} days)</p><p className="text-sm">{e.summary}</p><p>₹{e.price}</p></div>} />}

            {activeTab === "My Bookings" && (
              <ListCard
                title="Bookings"
                items={bookings}
                render={(b) => <div key={b.booking_id} className="border rounded-lg p-3 bg-slate-50"><p className="font-medium">{b.booking_id} · {b.booking_type}</p><p>Status: <span className="font-semibold">{b.status}</span></p><p className="text-xs mt-1">{JSON.stringify(b.details)}</p></div>}
              />
            )}

            {activeTab === "Approvals" && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold mb-3">Pending Sensitive Actions</h2>
                <div className="space-y-3">
                  {approvals.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 bg-slate-50">
                      <p className="font-medium">{a.action} {a.booking_id ? `· ${a.booking_id}` : ""}</p>
                      <p className="text-sm">{a.description}</p>
                      <p className="text-xs text-slate-500">{a.status} · {new Date(a.created_at).toLocaleString()}</p>
                      {a.status === "PENDING" && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => resolveApproval(a.id, true)} className="px-3 py-1 rounded bg-emerald-600 text-white">Approve</button>
                          <button onClick={() => resolveApproval(a.id, false)} className="px-3 py-1 rounded bg-rose-600 text-white">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "Knowledge Base" && (
              <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h2 className="font-semibold">Knowledge Base / RAG</h2>
                {ragStatus && (
                  <div className="grid md:grid-cols-3 gap-2 text-sm">
                    <p>Qdrant: {ragStatus.qdrant_available ? "Available" : "Unavailable"}</p>
                    <p>Documents: {ragStatus.document_count}</p>
                    <p>Chunks: {ragStatus.chunk_count}</p>
                    <p>Embedding: {ragStatus.embedding_model}</p>
                    <p>Metric: {ragStatus.similarity_metric}</p>
                    <p>Top-K: {ragStatus.top_k}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={kbQuery} onChange={(e) => setKbQuery(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
                  <button onClick={askKnowledge} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Ask</button>
                </div>
                {kbAnswer && <div className="border rounded-lg p-3 bg-slate-50"><p className="whitespace-pre-wrap text-sm">{kbAnswer.answer}</p><p className="text-xs mt-2">Sources: {kbAnswer.sources.join(", ")}</p></div>}
              </section>
            )}

            {activeTab === "System Workflow" && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold mb-3">Workflow Visualization</h2>
                <div className="grid md:grid-cols-3 gap-2">
                  {workflowStages.map((stage) => (
                    <div key={stage} className={`border rounded-lg p-3 text-center ${stage === activeStage ? "bg-blue-600 text-white" : "bg-slate-50"}`}>{stage}</div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
