"use client";

import React from "react";
import Link from "next/link";
import { MoreHorizontal, GitBranch, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  status: "active" | "completed" | "archived" | "in-progress";
  lastModified: string;
  branchCount: number;
  fileCount: number;
}

interface ProjectCardProps {
  project: Project;
}

const statusConfig = {
  active: { label: "Active", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-blue-500" },
  "in-progress": { label: "In Progress", color: "bg-yellow-500" },
  archived: { label: "Archived", color: "bg-gray-500" },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/dashboard/projects/${project.id}`}>
              <CardTitle className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                {project.name}
              </CardTitle>
            </Link>
            <CardDescription className="mt-1 line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}`}>
                  Open Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/settings`}>
                  Project Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techStack.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            <span>{project.branchCount} branches</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{project.fileCount} files</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${status.color}`}
              aria-hidden="true"
            />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{project.lastModified}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ProjectCard;
