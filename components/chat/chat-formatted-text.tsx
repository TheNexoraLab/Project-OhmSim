"use client";

import React from "react";

interface ChatFormattedTextProps {
  content: string;
  isUser?: boolean;
}

/**
 * Lightweight, zero-dependency Markdown formatter for OhmSim chat bubbles.
 * Safely parses bold (**text**), inline code (`code`), bullets (• / -), numbered lists,
 * and paragraph breaks without rendering raw markdown asterisks.
 */
export function ChatFormattedText({ content, isUser = false }: ChatFormattedTextProps) {
  if (!content) return null;

  const lines = content.split("\n");

  const renderInlineTokens = (text: string) => {
    // Regex splits by **bold** or `code`
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return tokens.map((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
        const inner = token.slice(2, -2);
        return (
          <strong
            key={idx}
            className={
              isUser
                ? "font-bold text-mocha-bg"
                : "font-bold text-mocha-text"
            }
          >
            {inner}
          </strong>
        );
      }

      if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
        const inner = token.slice(1, -1);
        return (
          <code
            key={idx}
            className={`px-1 py-0.5 rounded text-[11px] font-mono ${
              isUser
                ? "bg-mocha-bg/20 text-mocha-bg font-bold"
                : "bg-mocha-bg/80 border border-mocha-border/80 text-mocha-accent font-semibold"
            }`}
          >
            {inner}
          </code>
        );
      }

      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <div className="flex flex-col gap-1 text-xs leading-relaxed break-words">
      {lines.map((rawLine, lineIdx) => {
        const line = rawLine.trim();

        // Empty line separator
        if (!line) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Bullet point detection (• or - or *)
        if (line.startsWith("•") || line.startsWith("- ") || line.startsWith("* ")) {
          const cleanLine = line.replace(/^(•|-|\*)\s*/, "");
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
              <span
                className={`text-xs leading-tight mt-0.5 shrink-0 ${
                  isUser ? "text-mocha-bg" : "text-mocha-accent"
                }`}
                aria-hidden="true"
              >
                •
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInlineTokens(cleanLine)}
              </div>
            </div>
          );
        }

        // Numbered list item detection (e.g., 1. , 2. )
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          const [, num, itemContent] = numberedMatch;
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
              <span
                className={`font-mono text-[10px] font-bold mt-0.5 shrink-0 ${
                  isUser ? "text-mocha-bg" : "text-mocha-accent"
                }`}
                aria-hidden="true"
              >
                {num}.
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInlineTokens(itemContent)}
              </div>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderInlineTokens(line)}
          </p>
        );
      })}
    </div>
  );
}
