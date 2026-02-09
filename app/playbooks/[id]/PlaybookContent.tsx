"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PlaybookContentProps {
  content: string;
}

export default function PlaybookContent({ content }: PlaybookContentProps) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-[#666] dark:prose-p:text-[#999] prose-li:text-[#666] dark:prose-li:text-[#999] prose-strong:text-[#1a1a1a] dark:prose-strong:text-white prose-code:text-[#ff6b35] prose-code:bg-[#f5f5f5] dark:prose-code:bg-[#1a1a1a] prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-[''] prose-code:after:content-['']">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
