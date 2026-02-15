"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Account, Contact, Opportunity, Meeting } from "@/lib/types";

export default function OpportunityDetailPage() {
  const params = useParams();
  const opportunityId = params.opportunityId as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMeetingId, setEmailMeetingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/opportunities`).then(r => r.json()).then((opps: Opportunity[]) => {
      const opp = opps.find(o => o.id === opportunityId);
      if (opp) {
        setOpportunity(opp);
        fetch(`/api/accounts`).then(r => r.json()).then((accs: Account[]) => {
          const acc = accs.find(a => a.id === opp.accountId);
          if (acc) setAccount(acc);
        });
        fetch(`/api/contacts?accountId=${opp.accountId}`).then(r => r.json()).then(setContacts);
      }
    });
    fetch(`/api/meetings?opportunityId=${opportunityId}`).then(r => r.json()).then(setMeetings);
  }, [opportunityId]);

  const allPainPoints = meetings.flatMap(m => m.insights?.painPoints || []);
  const allFeatureRequests = meetings.flatMap(m => m.insights?.featureRequests || []);
  const allObjections = meetings.flatMap(m => m.insights?.objections || []);
  const allCompetitors = meetings.flatMap(m => m.insights?.competitors || []);
  const allActionItems = meetings.flatMap(m => m.insights?.actionItems || []);
  const openActions = allActionItems.filter(a => !a.done);

  const handleGenerateEmail = async (meeting: Meeting) => {
    if (!meeting.insights || !account) return;
    setEmailLoading(true);
    setEmailMeetingId(meeting.id);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: account.name,
          summary: meeting.insights.summary,
          actionItems: meeting.insights.actionItems,
          participants: meeting.participants,
        }),
      });
      const data = await res.json();
      setEmailContent(data.email);
    } catch {
      setEmailContent("Failed to generate email. Check your API key.");
    }
    setEmailLoading(false);
  };

  const typeColors: Record<string, string> = {
    "Discovery call": "bg-blue-100 text-blue-700",
    "Demo": "bg-green-100 text-green-700",
    "Technical deep dive": "bg-indigo-100 text-indigo-700",
    "On-site workshop": "bg-orange-100 text-orange-700",
    "Pricing discussion": "bg-amber-100 text-amber-700",
    "Follow-up email": "bg-slate-100 text-slate-600",
    "Competitive mention": "bg-purple-100 text-purple-700",
    "Internal note": "bg-slate-100 text-slate-500",
    "Requirements review": "bg-cyan-100 text-cyan-700",
    "Next steps call": "bg-teal-100 text-teal-700",
    "Compliance Q&A": "bg-rose-100 text-rose-700",
    "Validation discussion": "bg-pink-100 text-pink-700",
    "Security review": "bg-red-100 text-red-700",
    "Scope discussion": "bg-lime-100 text-lime-700",
    "Procurement note": "bg-gray-100 text-gray-600",
    "Workshop": "bg-orange-100 text-orange-700",
    "Risk review": "bg-red-100 text-red-700",
    "Next steps": "bg-teal-100 text-teal-700",
    "Stakeholder alignment": "bg-violet-100 text-violet-700",
    "Solution workshop": "bg-emerald-100 text-emerald-700",
    "Compliance requirements": "bg-rose-100 text-rose-700",
    "Pilot planning": "bg-sky-100 text-sky-700",
    "Technical Q&A": "bg-indigo-100 text-indigo-700",
    "Value framing": "bg-amber-100 text-amber-700",
  };

  const influenceColors: Record<string, string> = {
    "Champion": "bg-green-100 text-green-700",
    "Economic buyer": "bg-amber-100 text-amber-700",
    "Technical evaluator": "bg-blue-100 text-blue-700",
    "Key stakeholder": "bg-purple-100 text-purple-700",
    "Blocker": "bg-red-100 text-red-700",
  };

  if (!opportunity) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/sales" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Opportunities
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{opportunity.name}</h1>
            <p className="text-slate-500 mt-1">{account?.name} &middot; {opportunity.product} &middot; ${opportunity.value.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-1">
              Stage: <span className="font-medium text-slate-600">{opportunity.stage}</span>
              {" "}&middot; Close: {opportunity.close_date_est}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBriefing(!showBriefing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showBriefing ? "Hide Briefing" : "Prepare for Meeting"}
            </button>
            <Link
              href={`/sales/${opportunityId}/new-meeting`}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              + New Meeting
            </Link>
          </div>
        </div>
      </div>

      {/* Opportunity Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Opportunity Details</h2>
            <p className="text-sm text-slate-600 mb-3">{opportunity.use_case}</p>
            {opportunity.key_risks.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500">Key Risks: </span>
                {opportunity.key_risks.map((r, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs mr-1">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {opportunity.competitors_mentioned.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-500">Competitors: </span>
                {opportunity.competitors_mentioned.map((c, i) => (
                  <span key={i} className="inline-block px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs mr-1">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contacts Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Key Contacts</h2>
          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.role} &middot; {c.seniority}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${influenceColors[c.influence_level] || "bg-slate-100 text-slate-600"}`}>
                  {c.influence_level}
                </span>
                <p className="text-xs text-slate-400 mt-1 italic">{c.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Briefing Card */}
      {showBriefing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Briefing Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Pain Points</h3>
              {allPainPoints.length === 0 ? (
                <p className="text-sm text-blue-600 italic">None recorded yet</p>
              ) : (
                <ul className="space-y-1">
                  {allPainPoints.map((p, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">&#9679;</span>
                      {p.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Feature Requests</h3>
              {allFeatureRequests.length === 0 ? (
                <p className="text-sm text-blue-600 italic">None recorded yet</p>
              ) : (
                <ul className="space-y-1">
                  {allFeatureRequests.map((f, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&#9679;</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Objections</h3>
              {allObjections.length === 0 ? (
                <p className="text-sm text-blue-600 italic">None recorded yet</p>
              ) : (
                <ul className="space-y-1">
                  {allObjections.map((o, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">&#9679;</span>
                      {o.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Competitors Mentioned</h3>
              {allCompetitors.length === 0 ? (
                <p className="text-sm text-blue-600 italic">None mentioned yet</p>
              ) : (
                <ul className="space-y-1">
                  {allCompetitors.map((c, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">&#9679;</span>
                      <span><strong>{c.name}</strong> &mdash; {c.context}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {openActions.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Open Action Items</h3>
                <ul className="space-y-1">
                  {openActions.map((a, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-center gap-2">
                      <input type="checkbox" className="rounded" disabled />
                      {a.text} <span className="text-blue-600">({a.owner})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Timeline */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Timeline ({meetings.length} activities)</h2>
      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-500">No meetings recorded yet.</p>
          <Link
            href={`/sales/${opportunityId}/new-meeting`}
            className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Record your first meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map(meeting => (
            <div key={meeting.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[meeting.type] || "bg-slate-100 text-slate-600"}`}>
                      {meeting.type}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(meeting.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {meeting.participants.join(", ")}
                  </p>
                </div>
                {meeting.insights && (
                  <button
                    onClick={() => handleGenerateEmail(meeting)}
                    disabled={emailLoading && emailMeetingId === meeting.id}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {emailLoading && emailMeetingId === meeting.id ? "Generating..." : "Generate Follow-up Email"}
                  </button>
                )}
              </div>

              {meeting.insights ? (
                <div>
                  <p className="text-sm text-slate-700 mb-2">{meeting.insights.summary}</p>
                  {meeting.outcome && (
                    <p className="text-xs text-slate-500 mb-3 italic">Outcome: {meeting.outcome}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {meeting.insights.painPoints.map((p, i) => (
                      <span key={`pp-${i}`} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                        {p.text}
                      </span>
                    ))}
                    {meeting.insights.featureRequests.map((f, i) => (
                      <span key={`fr-${i}`} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                        {f.text}
                      </span>
                    ))}
                    {meeting.insights.objections.map((o, i) => (
                      <span key={`ob-${i}`} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
                        {o.text}
                      </span>
                    ))}
                    {meeting.insights.competitors.map((c, i) => (
                      <span key={`co-${i}`} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                        vs {c.name}
                      </span>
                    ))}
                  </div>
                  {meeting.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {meeting.tags.map((t, i) => (
                        <span key={i} className="text-xs text-slate-400">#{t}</span>
                      ))}
                    </div>
                  )}
                  {meeting.insights.actionItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">Action Items</p>
                      <ul className="space-y-0.5">
                        {meeting.insights.actionItems.map((a, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                            <span className={a.done ? "line-through text-slate-400" : ""}>
                              {a.done ? "Done" : "To do"}: {a.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {emailContent && emailMeetingId === meeting.id && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700">Follow-up Email Draft</h4>
                        <button
                          onClick={() => { navigator.clipboard.writeText(emailContent); }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                      <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{emailContent}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-2">{meeting.transcriptRaw.slice(0, 200)}...</p>
                  <p className="text-sm text-amber-600 italic">Insights not yet extracted - this transcript can be processed with AI</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
