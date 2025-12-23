"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Grid, List, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard, type Project } from "@/components/project/ProjectCard";

// Mock data for demonstration
const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "E-Commerce Platform",
    description:
      "A full-stack e-commerce solution with payment integration, inventory management, and customer analytics dashboard.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Stripe", "Tailwind"],
    status: "active",
    lastModified: "2 hours ago",
    branchCount: 12,
    fileCount: 248,
  },
  {
    id: "proj-002",
    name: "Task Management API",
    description:
      "RESTful API for task management with support for teams, projects, and granular permissions.",
    techStack: ["Node.js", "Express", "TypeScript", "Redis", "Docker"],
    status: "in-progress",
    lastModified: "1 day ago",
    branchCount: 8,
    fileCount: 156,
  },
  {
    id: "proj-003",
    name: "Portfolio Website",
    description:
      "Modern portfolio website with CMS integration, animations, and SEO optimization.",
    techStack: ["React", "Framer Motion", "Contentful", "Vercel"],
    status: "completed",
    lastModified: "1 week ago",
    branchCount: 5,
    fileCount: 89,
  },
  {
    id: "proj-004",
    name: "Real-time Chat Application",
    description:
      "WebSocket-based chat application with rooms, direct messages, and file sharing capabilities.",
    techStack: ["Socket.io", "React", "MongoDB", "Node.js"],
    status: "active",
    lastModified: "3 days ago",
    branchCount: 15,
    fileCount: 312,
  },
  {
    id: "proj-005",
    name: "Machine Learning Pipeline",
    description:
      "End-to-end ML pipeline for data preprocessing, model training, and inference deployment.",
    techStack: ["Python", "PyTorch", "MLflow", "FastAPI", "AWS"],
    status: "in-progress",
    lastModified: "5 hours ago",
    branchCount: 22,
    fileCount: 178,
  },
  {
    id: "proj-006",
    name: "Mobile App Backend",
    description:
      "Scalable backend infrastructure for mobile application with push notifications and analytics.",
    techStack: ["Go", "PostgreSQL", "Redis", "Kubernetes", "gRPC"],
    status: "archived",
    lastModified: "2 months ago",
    branchCount: 18,
    fileCount: 203,
  },
  {
    id: "proj-007",
    name: "Document Processing Service",
    description:
      "PDF and document processing service with OCR capabilities and format conversion.",
    techStack: ["Python", "Tesseract", "Celery", "RabbitMQ"],
    status: "completed",
    lastModified: "3 weeks ago",
    branchCount: 7,
    fileCount: 94,
  },
  {
    id: "proj-008",
    name: "Analytics Dashboard",
    description:
      "Interactive analytics dashboard with real-time data visualization and custom reporting.",
    techStack: ["D3.js", "React", "PostgreSQL", "Express"],
    status: "active",
    lastModified: "6 hours ago",
    branchCount: 11,
    fileCount: 167,
  },
];

type ViewMode = "grid" | "list";
type SortOption = "recent" | "name" | "modified";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [projects, setProjects] = useState(mockProjects);

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.techStack.some((tech) =>
      tech.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort projects based on selected option
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "modified":
        // For demo purposes, we're comparing by a simple heuristic
        // In production, this would compare actual dates
        return a.lastModified.localeCompare(b.lastModified);
      case "recent":
      default:
        return 0; // Keep original order for mock data
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize all your software engineering projects
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, description, or tech stack..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="modified">Last Modified</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Button */}
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter projects</span>
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {sortedProjects.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
          }
        >
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              {searchQuery
                ? `No projects match "${searchQuery}". Try a different search term.`
                : "Get started by creating your first project."}
            </p>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {sortedProjects.length} of {projects.length} projects
      </div>
    </div>
  );
}
