"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Opportunity, Account, Contact, ExtractedInsights } from "@/lib/types";

export default function NewMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.opportunityId as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("Discovery call");
  const [participants, setParticipants] = useState("Alex (HID), ");
  const [transcript, setTranscript] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [extracting, setExtracting] = useState(false);
  const [insights, setInsights] = useState<ExtractedInsights | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"input" | "review" | "saved">("input");

  const meetingTypes = [
    "Discovery call", "Demo", "Technical deep dive", "On-site workshop",
    "Pricing discussion", "Requirements review", "Competitive mention",
    "Follow-up email", "Next steps call", "Compliance Q&A",
    "Solution workshop", "Pilot planning", "Security review",
    "Scope discussion", "Internal note",
  ];

  useEffect(() => {
    fetch("/api/opportunities").then(r => r.json()).then((opps: Opportunity[]) => {
      const opp = opps.find(o => o.id === opportunityId);
      if (opp) {
        setOpportunity(opp);
        fetch("/api/accounts").then(r => r.json()).then((accs: Account[]) => {
          setAccount(accs.find(a => a.id === opp.accountId) || null);
        });
        fetch(`/api/contacts?accountId=${opp.accountId}`).then(r => r.json()).then(setContacts);
      }
    });
  }, [opportunityId]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
      setStep("review");
    } catch (err) {
      alert("Failed to extract insights. Make sure your ANTHROPIC_API_KEY is set in .env.local");
      console.error(err);
    }
    setExtracting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          accountId: opportunity?.accountId,
          title: title || meetingType,
          type: meetingType,
          date,
          participants: participants.split(",").map(p => p.trim()).filter(Boolean),
          participantContactIds: [],
          transcriptRaw: transcript,
          outcome: "",
          tags: [],
          insights,
        }),
      });
      setStep("saved");
    } catch (err) {
      alert("Failed to save meeting");
      console.error(err);
    }
    setSaving(false);
  };

  const addContactToParticipants = (contactName: string) => {
    if (!participants.includes(contactName)) {
      setParticipants(prev => prev.endsWith(", ") ? prev + contactName + ", " : prev + ", " + contactName + ", ");
    }
  };

  const updateInsightField = (
    field: keyof ExtractedInsights,
    index: number,
    key: string,
    value: string
  ) => {
    if (!insights) return;
    const updated = { ...insights };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = [...(updated[field] as any[])];
    arr[index] = { ...arr[index], [key]: value };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated as any)[field] = arr;
    setInsights(updated);
  };

  if (!opportunity) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/sales/${opportunityId}`} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to {opportunity.name}
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Record New Meeting</h1>
      <p className="text-slate-500 mb-8">{opportunity.name} &middot; {account?.name}</p>

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-8">
        {["Input", "Review", "Saved"].map((label, i) => {
          const stepNames = ["input", "review", "saved"];
          const currentIdx = stepNames.indexOf(step);
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isDone ? "bg-green-100 text-green-700" : isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {isDone ? "\u2713" : i + 1}
              </div>
              <span className={`text-sm ${isActive ? "font-medium text-slate-900" : "text-slate-400"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-px bg-slate-200 ml-2" />}
            </div>
          );
        })}
      </div>

      {step === "input" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Evaluation Call"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={meetingType}
                onChange={e => setMeetingType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meetingTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Participants</label>
            <input
              type="text"
              value={participants}
              onChange={e => setParticipants(e.target.value)}
              placeholder="Alex (HID), Elin Sundberg"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-slate-400">Quick add:</span>
                {contacts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => addContactToParticipants(c.name)}
                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    + {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Transcript / Notes</label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={16}
              placeholder="Paste your meeting transcript or notes here...&#10;&#10;Alex (HID): Thanks for joining today.&#10;Customer: Sure, let me walk you through our current process..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExtract}
              disabled={!transcript || extracting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {extracting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting Insights with AI...
                </>
              ) : (
                "Extract Insights with AI"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "review" && insights && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Meeting Summary</h2>
            <textarea
              value={insights.summary}
              onChange={e => setInsights({ ...insights, summary: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Pain Points ({insights.painPoints.length})
              </h3>
              <div className="space-y-3">
                {insights.painPoints.map((p, i) => (
                  <div key={i} className="space-y-1">
                    <input
                      value={p.text}
                      onChange={e => updateInsightField("painPoints", i, "text", e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 italic pl-2">&ldquo;{p.snippet}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Feature Requests ({insights.featureRequests.length})
              </h3>
              <div className="space-y-3">
                {insights.featureRequests.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <input
                      value={f.text}
                      onChange={e => updateInsightField("featureRequests", i, "text", e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 italic pl-2">&ldquo;{f.snippet}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Objections ({insights.objections.length})
              </h3>
              <div className="space-y-3">
                {insights.objections.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No objections detected</p>
                ) : (
                  insights.objections.map((o, i) => (
                    <div key={i} className="space-y-1">
                      <input
                        value={o.text}
                        onChange={e => updateInsightField("objections", i, "text", e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-400 italic pl-2">&ldquo;{o.snippet}&rdquo;</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                Competitors ({insights.competitors.length})
              </h3>
              <div className="space-y-3">
                {insights.competitors.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No competitors mentioned</p>
                ) : (
                  insights.competitors.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          value={c.name}
                          onChange={e => updateInsightField("competitors", i, "name", e.target.value)}
                          className="w-1/3 border border-slate-200 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          value={c.context}
                          onChange={e => updateInsightField("competitors", i, "context", e.target.value)}
                          className="w-2/3 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400 italic pl-2">&ldquo;{c.snippet}&rdquo;</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Action Items ({insights.actionItems.length})</h3>
            <div className="space-y-2">
              {insights.actionItems.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={a.done}
                    onChange={e => {
                      const updated = [...insights.actionItems];
                      updated[i] = { ...updated[i], done: e.target.checked };
                      setInsights({ ...insights, actionItems: updated });
                    }}
                    className="rounded"
                  />
                  <input
                    value={a.text}
                    onChange={e => {
                      const updated = [...insights.actionItems];
                      updated[i] = { ...updated[i], text: e.target.value };
                      setInsights({ ...insights, actionItems: updated });
                    }}
                    className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    value={a.owner}
                    onChange={e => {
                      const updated = [...insights.actionItems];
                      updated[i] = { ...updated[i], owner: e.target.value };
                      setInsights({ ...insights, actionItems: updated });
                    }}
                    className="w-40 border border-slate-200 rounded px-2 py-1 text-sm text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("input")}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Edit Transcript
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving to CRM..." : "Save to CRM"}
            </button>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="bg-white border border-green-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Meeting Saved Successfully</h2>
          <p className="text-slate-500 mb-6">The meeting and extracted insights have been saved to the CRM.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push(`/sales/${opportunityId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              View Opportunity Timeline
            </button>
            <button
              onClick={() => {
                setStep("input");
                setTitle("");
                setTranscript("");
                setInsights(null);
                setParticipants("Alex (HID), ");
                setDate(new Date().toISOString().split("T")[0]);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Record Another Meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
