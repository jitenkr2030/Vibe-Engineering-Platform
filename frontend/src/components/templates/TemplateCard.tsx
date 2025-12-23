"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  Star,
  Download,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Code2,
  Database,
  Palette,
  Globe,
  Server,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Template categories
export type TemplateCategory =
  | "all"
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "api"
  | "microservice";

export interface Template {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail: string;
  author: string;
  downloads: number;
  stars: number;
  lastUpdated: string;
  techStack: string[];
  features: string[];
  complexity: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  all: <Layers className="h-4 w-4" />,
  frontend: <Palette className="h-4 w-4" />,
  backend: <Server className="h-4 w-4" />,
  fullstack: <Globe className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  api: <Database className="h-4 w-4" />,
  microservice: <Code2 className="h-4 w-4" />,
};

const categoryLabels: Record<TemplateCategory, string> = {
  all: "All Templates",
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full Stack",
  mobile: "Mobile",
  api: "API",
  microservice: "Microservice",
};

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50",
        "overflow-hidden"
      )}
      onClick={() => onSelect(template)}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {categoryIcons[template.category]}
              <span className="text-sm font-medium capitalize">
                {template.category}
              </span>
            </div>
          )}
        </div>
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm">
            <ChevronRight className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
        {/* Complexity badge */}
        <div className="absolute top-2 right-2">
          <Badge
            variant={
              template.complexity === "beginner"
                ? "success"
                : template.complexity === "intermediate"
                  ? "warning"
                  : "destructive"
            }
            className="text-xs"
          >
            {template.complexity}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {template.shortDescription}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {/* Tech stack */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.techStack.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {template.techStack.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{template.techStack.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{template.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            <span>{template.stars}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{template.estimatedTime}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full text-sm">
          <span className="text-muted-foreground">by {template.author}</span>
          <span className="text-muted-foreground">
            Updated {template.lastUpdated}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default TemplateCard;
