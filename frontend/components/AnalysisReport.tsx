import React from "react";

interface AnalysisReportProps {
  report: string;
}

type Verdict = "Bullish" | "Bearish" | "Neutral" | "Accumulate" | "Hold" | "Reduce" | string;

interface AgentRow {
  icon: React.ReactNode;
  name: string;
  summary: string;
  verdict: Verdict;
}

/** Map verdict strings (case-insensitive) to badge styles */
function getBadgeStyle(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v.includes("bull"))    return "bg-[#E6F1FB] text-[#185FA5] dark:bg-blue-900/40 dark:text-blue-300";
  if (v.includes("bear") || v.includes("reduce")) return "bg-[#FAECE7] text-[#993C1D] dark:bg-red-900/40 dark:text-red-300";
  if (v.includes("accum"))   return "bg-[#E1F5EE] text-[#0F6E56] dark:bg-green-900/40 dark:text-green-300";
  if (v.includes("hold"))    return "bg-[#E1F5EE] text-[#0F6E56] dark:bg-green-900/40 dark:text-green-300";
  if (v.includes("neutral")) return "bg-[#FAEEDA] text-[#854F0B] dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
}

/**
 * Tries to extract structured agent rows from the markdown report.
 * Falls back to rendering the entire report as plain prose.
 */
function parseAgentRows(report: string): AgentRow[] | null {
  const rows: AgentRow[] = [];

  // Patterns: look for "Technical Analyst", "Sentiment Analyst", "Portfolio Manager" sections
  const sections = [
    {
      key: "technical",
      names: ["technical analyst", "technical analysis"],
      icon: (
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      displayName: "Technical analyst",
    },
    {
      key: "sentiment",
      names: ["sentiment analyst", "sentiment analysis", "news analyst"],
      icon: (
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      displayName: "Sentiment analyst",
    },
    {
      key: "portfolio",
      names: ["portfolio manager", "portfolio management", "risk manager"],
      icon: (
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      displayName: "Portfolio manager",
    },
  ];

  for (const section of sections) {
    // Try to find this section in the report
    const pattern = new RegExp(
      `(?:#+\\s*)?(?:${section.names.join("|")}).*?\\n([\\s\\S]*?)(?=(?:#+\\s*)|$)`,
      "i"
    );
    const match = report.match(pattern);

    // Extract verdict from bold/caps keywords
    let verdict = "Neutral";
    const verdictPattern = /\*\*(bullish|bearish|neutral|accumulate|hold|reduce|buy|sell)\*\*|(?:^|\s)(bullish|bearish|neutral|accumulate|hold|reduce)(?:\s|$)/gi;
    let vm: RegExpExecArray | null;
    if (match) {
      while ((vm = verdictPattern.exec(match[0])) !== null) {
        verdict = (vm[1] ?? vm[2] ?? "Neutral");
        verdict = verdict.charAt(0).toUpperCase() + verdict.slice(1).toLowerCase();
        break;
      }
    } else {
      // search the whole report for this section's verdict
      while ((vm = verdictPattern.exec(report)) !== null) {
        verdict = (vm[1] ?? vm[2] ?? "Neutral");
        verdict = verdict.charAt(0).toUpperCase() + verdict.slice(1).toLowerCase();
        break;
      }
    }

    // Extract a one-line summary — first non-empty line after the heading
    let summary = "";
    if (match?.[1]) {
      const lines = match[1]
        .split("\n")
        .map((l) => l.replace(/^[-*#>\s]+/, "").trim())
        .filter(Boolean);
      summary = lines[0]?.slice(0, 80) ?? "";
      if (summary.length === 80) summary += "…";
    }

    rows.push({
      icon: section.icon,
      name: section.displayName,
      summary: summary || "See full report below.",
      verdict,
    });
  }

  return rows.length > 0 ? rows : null;
}

/** Minimal markdown → HTML for the fallback full report */
function markdownToHtml(text: string): string {
  return (
    text
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[^<]*<\/li>(\s*<li>[^<]*<\/li>)*)/g, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>")
  );
}

export default function AnalysisReport({ report }: AnalysisReportProps) {
  const agentRows = parseAgentRows(report);

  if (agentRows) {
    return (
        <div id="analysis-report" className="divide-y divide-slate-100 dark:divide-slate-700">
        {agentRows.map((row, i) => (
          <div key={i} className={`flex items-start justify-between gap-3 py-4 ${i === 0 ? "pt-0" : ""}`}>
            <div className="flex items-start gap-2 min-w-0">
              <div className="mt-0.5 shrink-0">{row.icon}</div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-900 dark:text-slate-100 truncate">{row.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{row.summary}</p>
              </div>
            </div>
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${getBadgeStyle(row.verdict)}`}>
              {row.verdict}
            </span>
          </div>
        ))}

        <details className="pt-3">
          <summary className="text-[11px] font-medium text-[#185FA5] dark:text-blue-400 cursor-pointer select-none">
            Full report ↓
          </summary>
          <div
            className="prose max-w-none mt-3"
            dangerouslySetInnerHTML={{ __html: `<p>${markdownToHtml(report)}</p>` }}
          />
        </details>
      </div>
    );
  }

  // Fallback: plain prose
  return (
    <div
      id="analysis-report"
      className="prose max-w-none text-slate-600 dark:text-slate-400"
      dangerouslySetInnerHTML={{ __html: `<p>${markdownToHtml(report)}</p>` }}
    />
  );
}
