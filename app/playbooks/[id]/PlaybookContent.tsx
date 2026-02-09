"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PlaybookContentProps {
  content: string;
}

export default function PlaybookContent({ content }: PlaybookContentProps) {
  return (
    <div className="prose prose-slate max-w-none min-w-0 break-words overflow-x-auto prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:break-words prose-li:text-muted-foreground prose-li:break-words prose-strong:text-foreground prose-a:break-words prose-code:text-[#ff6b35] prose-code:bg-[#f5f5f5] prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:break-words prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:overflow-x-auto prose-pre:max-w-full prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:[overflow-wrap:anywhere] prose-table:block prose-table:max-w-full prose-table:overflow-x-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
