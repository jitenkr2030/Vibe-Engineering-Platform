"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Copy,
  Download,
  ExternalLink,
  Star,
  Clock,
  Code2,
  FileText,
  FolderTree,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Template } from "./TemplateCard";

interface TemplatePreviewProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: Template) => void;
}

export function TemplatePreview({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}: TemplatePreviewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // Mock file structure for preview
  const mockFileStructure = [
    {
      name: template.name.toLowerCase().replace(/\s+/g, "-"),
      type: "folder",
      children: [
        { name: "src", type: "folder", children: [
          { name: "components", type: "folder", children: [
            { name: "App.tsx", type: "file" },
            { name: "Button.tsx", type: "file" },
          ]},
          { name: "pages", type: "folder", children: [
            { name: "Home.tsx", type: "file" },
            { name: "About.tsx", type: "file" },
          ]},
          { name: "utils", type: "folder", children: [
            { name: "helpers.ts", type: "file" },
            { name: "api.ts", type: "file" },
          ]},
          { name: "index.ts", type: "file" },
        ]},
        { name: "public", type: "folder", children: [
          { name: "index.html", type: "file" },
          { name: "favicon.ico", type: "file" },
        ]},
        { name: "tests", type: "folder", children: [
          { name: "App.test.tsx", type: "file" },
        ]},
        { name: "package.json", type: "file" },
        { name: "tsconfig.json", type: "file" },
        { name: "README.md", type: "file" },
      ],
    },
  ];

  const copyCommand = async () => {
    await navigator.clipboard.writeText(
      `npx create-vibe@latest ${template.name.toLowerCase().replace(/\s+/g, "-")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFileTree = (
    items: typeof mockFileStructure,
    depth = 0
  ): React.ReactNode => {
    return items.map((item, index) => (
      <div key={`${item.name}-${index}`}>
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded",
            depth > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {item.type === "folder" ? (
            <span className="text-blue-400">📁</span>
          ) : (
            <span className="text-muted-foreground text-xs">
              {item.name.split(".").pop()}
            </span>
          )}
          <span className="text-sm">{item.name}</span>
        </div>
        {item.children &&
          renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <p className="text-muted-foreground mt-1">
                {template.description}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structure">File Structure</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Tech Stack */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Downloads</p>
                      <p className="font-semibold">
                        {template.downloads.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stars</p>
                      <p className="font-semibold">{template.stars}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Time</p>
                      <p className="font-semibold">{template.estimatedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Complexity</p>
                      <p className="font-semibold capitalize">
                        {template.complexity}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* File Structure Tab */}
              <TabsContent value="structure" className="mt-0">
                <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
                  {renderFileTree(mockFileStructure)}
                </div>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {template.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Setup Tab */}
              <TabsContent value="setup" className="mt-0 space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Quick Start</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Run the following command in your terminal to create a new
                    project from this template:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-sm">
                      npx create-vibe@latest{" "}
                      {template.name.toLowerCase().replace(/\s+/g, "-")}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyCommand}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Node.js 18+ and npm/yarn/pnpm
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Git installed locally
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      VS Code with recommended extensions
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>By {template.author}</span>
            <span>•</span>
            <span>Updated {template.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
            <Button size="sm" onClick={() => onUseTemplate(template)}>
              <Zap className="mr-2 h-4 w-4" />
              Use This Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePreview;
