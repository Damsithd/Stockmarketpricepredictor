interface AnalysisReportProps {
  report: string;
}

/**
 * Renders the AI agent markdown report.
 * Applies a basic markdown-to-HTML conversion matching the original app.js logic,
 * with additional support for bullet lists.
 */
export default function AnalysisReport({ report }: AnalysisReportProps) {
  const html = report
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Convert bullet lists
    .replace(/^- (.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  return (
    <div
      id="analysis-report"
      className="prose prose-invert prose-sm max-w-none text-gray-300"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}
