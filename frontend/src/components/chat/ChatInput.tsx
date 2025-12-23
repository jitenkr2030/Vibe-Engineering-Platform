"use client";

import React, { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X, Smile, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  placeholder = "Type a message... (Shift + Enter for new line)",
  disabled = false,
  maxLength = 10000,
  autoFocus = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    onSend(trimmedMessage, attachments);
    setMessage("");
    setAttachments([]);
  }, [message, isLoading, disabled, attachments, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxLength) {
        setMessage(value);
      }
    },
    [maxLength]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleTextareaResize = useCallback((height: number) => {
    // Auto-resize textarea is handled by CSS
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 border-t bg-background">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 rounded-full hover:bg-accent transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1">
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept=".ts,.tsx,.js,.jsx,.py,.json,.md,.txt,.yaml,.yml"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAttachClick}
            disabled={disabled}
            className="h-10 w-10"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Emoji Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-10 w-10"
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={Math.min(message.split("\n").length, 6)}
            className={cn(
              "w-full resize-none border rounded-lg px-4 py-3 pr-12",
              "text-sm outline-none transition-all",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-muted-foreground",
              "min-h-[48px] max-h-[200px]",
              "scrollbar-thin scrollbar-thumb-muted-foreground/30"
            )}
            style={{
              height: "auto",
              minHeight: "48px",
            }}
          />

          {/* Character Count */}
          <div
            className={cn(
              "absolute bottom-2 right-12 text-xs transition-colors",
              message.length > maxLength * 0.9
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {message.length}/{maxLength}
          </div>
        </div>

        {/* Send/Stop Button */}
        {isLoading ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onStop}
            className="h-10 w-10"
            aria-label="Stop generating"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className={cn(
              "h-10 w-10",
              !message.trim() || disabled ? "opacity-50" : ""
            )}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>AI can make mistakes. Review generated code.</span>
        <span>Shift + Enter for new line, Enter to send</span>
      </div>
    </div>
  );
}

export default ChatInput;
