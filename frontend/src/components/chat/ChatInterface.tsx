"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Settings, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, type ChatMessageProps } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ChatInterfaceProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => Promise<string>;
  onApplyCode?: (code: string, language: string) => void;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
  className?: string;
}

// Default system message for the AI assistant
const DEFAULT_SYSTEM_MESSAGE = `You are an expert AI software engineering assistant helping a developer build high-quality software.

Your capabilities include:
- Writing and explaining code in multiple languages (TypeScript, JavaScript, Python, Go, Rust, etc.)
- Code review and refactoring suggestions
- Debugging and troubleshooting
- Architecture and design recommendations
- Best practices for security, performance, and maintainability

When providing code:
1. Explain your approach before showing code
2. Use clear, readable code with appropriate comments
3. Consider edge cases and error handling
4. Follow the project's existing style and conventions

Be helpful, precise, and constructive in your responses.`;

export function ChatInterface({
  initialMessages = [],
  onSendMessage,
  onApplyCode,
  onClearHistory,
  onExportHistory,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system",
      role: "system",
      content: DEFAULT_SYSTEM_MESSAGE,
      timestamp: new Date(),
    },
    ...initialMessages,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Handle sending a message
  const handleSend = useCallback(
    async (messageText: string, _files?: File[]) => {
      if (!messageText.trim() || isLoading) return;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        // Simulate streaming response (replace with actual API call)
        if (onSendMessage) {
          const response = await onSendMessage(messageText);

          // Simulate streaming effect
          let currentContent = "";
          const words = response.split(" ");

          for (const word of words) {
            currentContent += (currentContent ? " " : "") + word;
            setStreamingContent(currentContent);
            await new Promise((resolve) => setTimeout(resolve, 30));
          }

          // Add assistant message with full content
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: response,
              timestamp: new Date(),
            },
          ]);
        } else {
          // Mock response for demo purposes
          const mockResponse = `I'll help you with that! Here's a comprehensive approach:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

class UserService {
  private users: Map<string, User> = new Map();

  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
\`\`\`

This implementation provides:
- Type-safe user interface
- Async methods for better performance
- UUID generation for unique IDs
- Proper error handling through null returns

Would you like me to explain any part in more detail or add additional features?`;

          // Simulate streaming
          let currentContent = "";
          const words = mockResponse.split(" ");

          for (const word of words) {
            currentContent += (currentContent ? " " : "") + word;
            setStreamingContent(currentContent);
            await new Promise((resolve) => setTimeout(resolve, 20));
          }

          // Add assistant message
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: mockResponse,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "I apologize, but I encountered an error processing your request. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    },
    [isLoading, onSendMessage]
  );

  // Handle stopping the current response
  const handleStop = useCallback(() => {
    setIsLoading(false);
    setStreamingContent("");
  }, []);

  // Handle clearing history
  const handleClearHistory = useCallback(() => {
    setMessages([
      {
        id: "system",
        role: "system",
        content: DEFAULT_SYSTEM_MESSAGE,
        timestamp: new Date(),
      },
    ]);
    onClearHistory?.();
  }, [onClearHistory]);

  // Handle exporting history
  const handleExportHistory = useCallback(() => {
    const exportData = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onExportHistory?.();
  }, [messages, onExportHistory]);

  // Handle applying code from chat to editor
  const handleApplyCode = useCallback(
    (code: string, language: string) => {
      onApplyCode?.(code, language);
    },
    [onApplyCode]
  );

  // Get the last message for streaming display
  const lastMessage = messages[messages.length - 1];
  const showStreaming =
    isLoading &&
    streamingContent &&
    lastMessage?.role === "assistant";

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div>
          <h2 className="font-semibold text-lg">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            {messages.length - 1} messages
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Chat settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Export History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearHistory} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 h-[calc(100%-140px)]">
        <div className="p-4 space-y-4">
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                onApplyCode={handleApplyCode}
              />
            ))}

          {/* Streaming Message */}
          {showStreaming && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              isLoading={false}
              onApplyCode={handleApplyCode}
            />
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <ChatMessage role="assistant" content="" isLoading />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        placeholder="Ask me to help with code, explain concepts, or debug issues..."
        autoFocus={false}
      />
    </div>
  );
}

export default ChatInterface;
