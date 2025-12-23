"use client";

import React, { useState, useMemo } from "react";
import { Search, Grid, List, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./TemplateCard";
import { TemplatePreview } from "./TemplatePreview";
import type { Template, TemplateCategory } from "./TemplateCard";

// Mock templates data
const mockTemplates: Template[] = [
  {
    id: "tpl-001",
    name: "Modern React Dashboard",
    description:
      "A complete React dashboard with authentication, routing, and modern UI components. Perfect for building admin panels and data-driven applications.",
    shortDescription: "Complete React admin dashboard with auth and routing",
    category: "frontend",
    tags: ["react", "dashboard", "admin", "typescript"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 12450,
    stars: 892,
    lastUpdated: "2 days ago",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query"],
    features: [
      "Authentication with JWT",
      "Role-based access control",
      "Responsive design",
      "Dark mode support",
      "Internationalization",
    ],
    complexity: "intermediate",
    estimatedTime: "30 min",
  },
  {
    id: "tpl-002",
    name: "REST API Starter",
    description:
      "Production-ready REST API boilerplate with authentication, database integration, and comprehensive testing setup.",
    shortDescription: "Production-ready REST API with auth and testing",
    category: "backend",
    tags: ["nodejs", "api", "express", "postgresql"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 8932,
    stars: 654,
    lastUpdated: "1 week ago",
    techStack: ["Node.js", "Express", "PostgreSQL", "Prisma", "Jest"],
    features: [
      "JWT Authentication",
      "PostgreSQL with Prisma ORM",
      "Input validation with Zod",
      "Unit and integration tests",
      "API documentation with Swagger",
    ],
    complexity: "intermediate",
    estimatedTime: "45 min",
  },
  {
    id: "tpl-003",
    name: "Full Stack Next.js App",
    description:
      "End-to-end TypeScript application with Next.js frontend and Node.js backend. Includes database, authentication, and deployment configuration.",
    shortDescription: "Full-stack TypeScript app with Next.js and Node.js",
    category: "fullstack",
    tags: ["nextjs", "fullstack", "typescript", "prisma"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 15678,
    stars: 1243,
    lastUpdated: "3 days ago",
    techStack: ["Next.js 14", "TypeScript", "Prisma", "PostgreSQL"],
    features: [
      "App Router architecture",
      "Server and Client components",
      "API routes with Zod validation",
      "Authentication with NextAuth",
      "Docker configuration included",
    ],
    complexity: "advanced",
    estimatedTime: "1 hour",
  },
  {
    id: "tpl-004",
    name: "GraphQL API Gateway",
    description:
      "Scalable GraphQL API with Apollo Server, schema stitching, and federation support for microservices architecture.",
    shortDescription: "GraphQL API with Apollo and federation",
    category: "api",
    tags: ["graphql", "apollo", "microservices", "nodejs"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 4532,
    stars: 321,
    lastUpdated: "2 weeks ago",
    techStack: ["GraphQL", "Apollo Server", "Node.js", "TypeScript"],
    features: [
      "Schema stitching",
      "Apollo Federation",
      "Authentication directives",
      "Rate limiting",
      "GraphQL Playground",
    ],
    complexity: "advanced",
    estimatedTime: "1.5 hours",
  },
  {
    id: "tpl-005",
    name: "React Native Mobile App",
    description:
      "Cross-platform mobile application with React Native, Expo, and modern navigation patterns.",
    shortDescription: "React Native app with Expo and navigation",
    category: "mobile",
    tags: ["react-native", "mobile", "expo", "typescript"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 6234,
    stars: 456,
    lastUpdated: "1 week ago",
    techStack: ["React Native", "Expo", "TypeScript", "React Navigation"],
    features: [
      "iOS and Android support",
      "Push notifications",
      "Offline data persistence",
      "Deep linking",
      "App icons and splash screen",
    ],
    complexity: "intermediate",
    estimatedTime: "45 min",
  },
  {
    id: "tpl-006",
    name: "Microservices Starter",
    description:
      "Collection of services demonstrating microservices patterns with service discovery, API gateway, and inter-service communication.",
    shortDescription: "Microservices demo with discovery and gateway",
    category: "microservice",
    tags: ["microservices", "docker", "kubernetes", "nodejs"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 3456,
    stars: 234,
    lastUpdated: "3 weeks ago",
    techStack: ["Node.js", "Docker", "Nginx", "Consul"],
    features: [
      "Service discovery with Consul",
      "API Gateway with Nginx",
      "Inter-service communication",
      "Centralized logging",
      "Kubernetes manifests included",
    ],
    complexity: "advanced",
    estimatedTime: "2 hours",
  },
  {
    id: "tpl-007",
    name: "Minimal Vue Starter",
    description:
      "Lightweight Vue 3 application starter with Vite, Pinia, and essential tooling configured.",
    shortDescription: "Lightweight Vue 3 starter with Vite",
    category: "frontend",
    tags: ["vue", "vite", "pinia", "typescript"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 7823,
    stars: 567,
    lastUpdated: "4 days ago",
    techStack: ["Vue 3", "Vite", "Pinia", "TypeScript"],
    features: [
      "Composition API patterns",
      "Auto-import components",
      "File-based routing",
      "State management with Pinia",
      "ESLint + Prettier configured",
    ],
    complexity: "beginner",
    estimatedTime: "15 min",
  },
  {
    id: "tpl-008",
    name: "Python FastAPI Backend",
    description:
      "Modern Python API with FastAPI, async database access, and automatic OpenAPI documentation.",
    shortDescription: "FastAPI backend with async database support",
    category: "backend",
    tags: ["python", "fastapi", "async", "postgresql"],
    thumbnail: "",
    author: "Vibe Team",
    downloads: 9123,
    stars: 789,
    lastUpdated: "5 days ago",
    techStack: ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy"],
    features: [
      "Async/await throughout",
      "Automatic OpenAPI docs",
      "Pydantic models",
      "Dependency injection",
      "Background tasks",
    ],
    complexity: "intermediate",
    estimatedTime: "35 min",
  },
];

const categories: TemplateCategory[] = [
  "all",
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "api",
  "microservice",
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Recently Updated" },
  { value: "downloads", label: "Most Downloads" },
  { value: "stars", label: "Highest Rated" },
];

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  className?: string;
}

export function TemplateLibrary({
  onSelectTemplate,
  className,
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("popular");

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = mockTemplates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case "recent":
        result = [...result].sort((a, b) => a.lastUpdated.localeCompare(b.lastUpdated));
        break;
      case "downloads":
        result = [...result].sort((a, b) => b.downloads - a.downloads);
        break;
      case "stars":
        result = [...result].sort((a, b) => b.stars - a.stars);
        break;
      case "popular":
      default:
        result = [...result].sort((a, b) => b.downloads - a.downloads);
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate?.(template);
    setSelectedTemplate(null);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Library</h1>
          <p className="text-muted-foreground mt-1">
            Start your project with production-ready templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredTemplates.length} templates
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Tabs */}
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex gap-1 p-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by: {sortOptions.find((o) => o.value === sortBy)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={sortBy === option.value}
                  onCheckedChange={() => setSortBy(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-4"
          }
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={setSelectedTemplate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No templates found matching your criteria.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
}

export default TemplateLibrary;
