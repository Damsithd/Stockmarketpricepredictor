interface AnalysisReportProps {
  report: string;
}

/**
 * Converts a basic markdown string to safe HTML for the analysis report.
 */
function markdownToHtml(text: string): string {
  return (
    text
      // Headings
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Bullet list items
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      // Group consecutive <li> elements into a <ul> block (no 's' flag)
      .replace(/(<li>[^<]*<\/li>(\s*<li>[^<]*<\/li>)*)/g, "<ul>$1</ul>")
      // Paragraph breaks
      .replace(/\n\n/g, "</p><p>")
      // Line breaks
      .replace(/\n/g, "<br/>")
  );
}

export default function AnalysisReport({ report }: AnalysisReportProps) {
  const html = markdownToHtml(report);

  return (
    <div
      id="analysis-report"
      className="prose prose-invert prose-sm max-w-none text-gray-300"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}
