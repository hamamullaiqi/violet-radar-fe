"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownNarrativeProps {
  content?: string;
  className?: string;
}

export default function MarkdownNarrative({ content, className = "" }: MarkdownNarrativeProps) {
  if (!content) return null;

  // Pre-process content:
  // 1. Replace LaTeX arrows $\rightarrow$ or $\to$ with clean unicode arrows →
  // 2. Clean up escaped characters if any
  const cleaned = content
    .replace(/\\?\$(\\rightarrow|\\to)\\\?\$/g, "→")
    .replace(/\$\\rightarrow\$/g, "→")
    .replace(/\$\\to\$/g, "→");

  return (
    <div className={`prose-sm max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed space-y-3 ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-700 my-2">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 bg-slate-100/90 px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] border border-slate-200/60 inline-block my-0.5">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-500 font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 my-2.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2.5 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
              <div className="flex-1">{children}</div>
            </li>
          ),
          h1: ({ children }) => (
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-3 mb-1.5 flex items-center gap-2">
              {children}
            </h4>
          ),
          h2: ({ children }) => (
            <h5 className="text-xs sm:text-sm font-bold text-slate-800 mt-2.5 mb-1 flex items-center gap-2">
              {children}
            </h5>
          ),
          h3: ({ children }) => (
            <h6 className="text-xs font-bold text-slate-800 mt-2 mb-1">
              {children}
            </h6>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
