"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  onApplyCode?: (code: string, language: string) => void;
  onCopyCode?: (code: string) => void;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isLoading = false,
  onApplyCode,
  onCopyCode,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  // Parse markdown and extract code blocks
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      );
    }

    return (
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");

            if (language && codeString) {
              return (
                <div className="relative group rounded-md overflow-hidden my-3">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {language}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigator.clipboard.writeText(codeString)}
                        className="p-1 rounded hover:bg-accent transition-colors"
                        title="Copy code"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </button>
                      {onApplyCode && (
                        <button
                          onClick={() => onApplyCode(codeString, language)}
                          className="p-1 rounded hover:bg-accent transition-colors"
                          title="Apply to editor"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                          >
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      background: "#1a1b26",
                    }}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono", className)} {...rest}>
                {children}
              </code>
            );
          },
          pre(props) {
            return <div className="not-prose">{props.children}</div>;
          },
          p(props) {
            return <p className="leading-7 [&:not(:first-child)]:mt-0">{props.children}</p>;
          },
          ul(props) {
            return <ul className="list-disc list-inside mt-2 space-y-1">{props.children}</ul>;
          },
          ol(props) {
            return <ol className="list-decimal list-inside mt-2 space-y-1">{props.children}</ol>;
          },
          li(props) {
            return <li className="ml-4">{props.children}</li>;
          },
          strong(props) {
            return <strong className="font-semibold">{props.children}</strong>;
          },
          em(props) {
            return <em className="italic">{props.children}</em>;
          },
          a(props) {
            return (
              <a
                href={props.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {props.children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser && "bg-muted/50",
        isAssistant && "bg-background",
        isSystem && "bg-warning/10 border border-warning/20"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser && "bg-primary text-primary-foreground",
          isAssistant && "bg-green-500 text-white",
          isSystem && "bg-yellow-500 text-white"
        )}
      >
        {isUser && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
        {isAssistant && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-1.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="8" cy="14" r="1" />
            <circle cx="16" cy="14" r="1" />
          </svg>
        )}
        {isSystem && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser && "You"}
            {isAssistant && "AI Assistant"}
            {isSystem && "System"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="text-sm text-foreground">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
