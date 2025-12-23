'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Sparkles,
  ArrowRight,
  Github,
  Terminal,
  Layers,
  Cpu,
  Lock,
  Check,
  X,
  Star,
  CreditCard,
  Crown,
  Building2,
  Loader2,
  Send,
  Bot,
  User,
  Trash2,
  Save,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  Settings,
  RefreshCw,
  Plus,
  Edit2,
  MoreHorizontal,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ROLES = [
  { id: 'Architect', name: 'Architect', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'Developer', name: 'Developer', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'Tester', name: 'Tester', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', border: 'border-green-200' },
  { id: 'Security', name: 'Security', icon: Shield, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-200' },
];

const MOCK_TEMPLATES = [
  {
    id: 'arch-001',
    name: 'System Architecture Design',
    description: 'Generate a comprehensive system architecture',
    role: 'Architect',
    variables: [
      { name: 'project_name', label: 'Project Name', type: 'text' },
      { name: 'project_description', label: 'Description', type: 'textarea' },
      { name: 'requirements', label: 'Requirements', type: 'textarea' },
    ],
  },
  {
    id: 'dev-001',
    name: 'Code Generation',
    description: 'Generate production-ready code',
    role: 'Developer',
    variables: [
      { name: 'task_description', label: 'Task Description', type: 'textarea' },
      { name: 'language', label: 'Language', type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'] },
      { name: 'framework', label: 'Framework', type: 'text' },
    ],
  },
  {
    id: 'dev-002',
    name: 'Code Refactoring',
    description: 'Refactor code for better maintainability',
    role: 'Developer',
    variables: [
      { name: 'code_snippet', label: 'Code Snippet', type: 'code' },
      { name: 'language', label: 'Language', type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'] },
      { name: 'refactoring_goals', label: 'Goals', type: 'textarea' },
    ],
  },
  {
    id: 'test-001',
    name: 'Unit Test Generation',
    description: 'Generate comprehensive unit tests',
    role: 'Tester',
    variables: [
      { name: 'code_snippet', label: 'Code Snippet', type: 'code' },
      { name: 'test_framework', label: 'Test Framework', type: 'text' },
    ],
  },
  {
    id: 'sec-001',
    name: 'Security Audit',
    description: 'Comprehensive security review',
    role: 'Security',
    variables: [
      { name: 'code_snippet', label: 'Code Snippet', type: 'code' },
      { name: 'audit_scope', label: 'Audit Scope', type: 'textarea' },
    ],
  },
  {
    id: 'sec-002',
    name: 'OWASP Top 10 Verification',
    description: 'Verify code against OWASP vulnerabilities',
    role: 'Security',
    variables: [
      { name: 'code_snippet', label: 'Code Snippet', type: 'code' },
      { name: 'application_context', label: 'Application Context', type: 'textarea' },
    ],
  },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  variables?: Record<string, string>;
}

function VariableInput({ variable, value, onChange }: { variable: any; value: string; onChange: (v: string) => void }) {
  if (variable.type === 'textarea' || variable.name.includes('description') || variable.name.includes('requirements')) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${variable.label.toLowerCase()}`}
        className="min-h-[80px]"
      />
    );
  }
  
  if (variable.type === 'code') {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${variable.label.toLowerCase()}...`}
        className="min-h-[120px] font-mono text-sm"
      />
    );
  }
  
  if (variable.type === 'select' && variable.options) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${variable.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {variable.options.map((option: string) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Enter ${variable.label.toLowerCase()}`}
    />
  );
}

function TemplateCard({ template, isSelected, onClick }: { template: any; isSelected: boolean; onClick: () => void }) {
  const role = ROLES.find(r => r.id === template.role);
  const RoleIcon = role?.icon || FileText;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${role?.bg || 'bg-gray-100'}`}>
          <RoleIcon className={`h-4 w-4 ${role?.color || 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{template.name}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {template.role}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {template.variables.length} vars
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          {message.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-black/5 p-3 rounded-md overflow-x-auto">
                <code>{message.content}</code>
              </pre>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

export default function PromptStudioPage() {
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVariables, setShowVariables] = useState(true);
  const [useMemory, setUseMemory] = useState(true);
  const [model, setModel] = useState('gpt-4');

  const currentRole = ROLES.find(r => r.id === selectedRole);
  const RoleIcon = currentRole?.icon || Bot;

  const templatesByRole = {
    all: MOCK_TEMPLATES,
    Architect: MOCK_TEMPLATES.filter(t => t.role === 'Architect'),
    Developer: MOCK_TEMPLATES.filter(t => t.role === 'Developer'),
    Tester: MOCK_TEMPLATES.filter(t => t.role === 'Tester'),
    Security: MOCK_TEMPLATES.filter(t => t.role === 'Security'),
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setVariables({});
    setShowVariables(true);
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && Object.keys(variables).length === 0) return;

    setIsLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage || `Using template: ${selectedTemplate?.name}`,
      timestamp: new Date(),
      variables: selectedTemplate ? variables : undefined,
    };

    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `This is a simulated response from the ${selectedRole} AI.\n\nBased on your request and the template "${selectedTemplate?.name}", here's what I would generate:\n\n\`\`\`typescript\n// Generated code based on your requirements\n\ninterface Example {\n  id: string;\n  name: string;\n  createdAt: Date;\n}\n\nfunction createExample(data: Partial<Example>): Example {\n  return {\n    id: crypto.randomUUID(),\n    name: data.name || 'Untitled',\n    createdAt: new Date(),\n  };\n}\n\`\`\`\n\nIn a production environment, this would call the actual AI API with your context and variables.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      setVariables({});
      setInputMessage('');
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Vibe Engineering</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
              <span className="text-sm font-medium text-foreground">Prompt Studio</span>
              <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 h-screen flex">
        <div className="w-80 border-r border-border/40 bg-muted/20 flex flex-col">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Library
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a template to get started
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="h-full flex flex-col">
              <div className="p-2 border-b border-border/40">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="Architect">Arch</TabsTrigger>
                  <TabsTrigger value="Developer">Dev</TabsTrigger>
                  <TabsTrigger value="Tester">Test</TabsTrigger>
                  <TabsTrigger value="Security">Sec</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-3">
                {Object.entries(templatesByRole).map(([key, templates]) => (
                  <TabsContent key={key} value={key} className="mt-0 space-y-2">
                    {templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate?.id === template.id}
                        onClick={() => handleTemplateSelect(template)}
                      />
                    ))}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          </div>

          <div className="p-3 border-t border-border/40">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-border/40 flex items-center px-4 gap-4 bg-muted/10">
            <span className="text-sm font-medium text-muted-foreground">Role:</span>
            <div className="flex items-center gap-1">
              {ROLES.map((role) => {
                const RoleIcon = role.icon;
                return (
                  <Button
                    key={role.id}
                    variant={selectedRole === role.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedRole(role.id)}
                    className={`gap-2 ${selectedRole === role.id ? '' : 'opacity-70'}`}
                  >
                    <RoleIcon className={`h-4 w-4 ${role.color}`} />
                    <span className="hidden sm:inline">{role.name}</span>
                  </Button>
                );
              })}
            </div>

            <div className="flex-1" />

            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude 3.5</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="memory-toggle"
                checked={useMemory}
                onCheckedChange={setUseMemory}
              />
              <label htmlFor="memory-toggle" className="text-sm text-muted-foreground">
                Memory
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Bot className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Prompt Studio</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a template from the sidebar or start a conversation with your AI assistant.
                  Your conversation history will be saved if memory is enabled.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </AnimatePresence>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 border-t border-border/40">
            <div className="flex gap-3">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message your ${selectedRole} AI...`}
                className="min-h-[60px] max-h-[150px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputMessage.trim() && Object.keys(variables).length === 0)}
                className="self-end"
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showVariables && selectedTemplate && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/40 bg-muted/10 overflow-hidden"
            >
              <div className="w-80 h-full flex flex-col">
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Template Variables</h3>
                    <p className="text-xs text-muted-foreground">
                      Fill in the required information
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowVariables(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedTemplate.variables.map((variable: any) => (
                      <div key={variable.name}>
                        <label className="text-sm font-medium mb-2 block">
                          {variable.label}
                          {variable.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <VariableInput
                          variable={variable}
                          value={variables[variable.name] || ''}
                          onChange={(value) => handleVariableChange(variable.name, value)}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border/40 space-y-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || selectedTemplate.variables.some((v: any) => v.required && !variables[v.name])}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setVariables({})}
                    className="w-full"
                    size="sm"
                  >
                    Clear Variables
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
