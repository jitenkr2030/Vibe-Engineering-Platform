'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  Code2,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { projectService, Project } from '@/services/project';
import { useToast } from '@/hooks/use-toast';

const stats = [
  {
    title: 'Total Projects',
    value: '0',
    icon: FolderKanban,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Code Generated',
    value: '0',
    icon: Code2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'Quality Score',
    value: 'N/A',
    icon: Shield,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'Time Saved',
    value: '0h',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 5 });
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Vibe</h1>
          <p className="text-muted-foreground">
            Your AI-powered software engineering platform
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/dashboard/projects/new">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Create New Project</div>
                    <div className="text-sm text-muted-foreground">
                      Start building with AI assistance
                    </div>
                  </div>
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Terminal className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Open Terminal</div>
                  <div className="text-sm text-muted-foreground">
                    Run commands and scripts
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Sparkles className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Generate Code</div>
                  <div className="text-sm text-muted-foreground">
                    Describe what you want to build
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>Your latest projects</CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Code2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.status?.replace('_', ' ') || 'Active'} ·{' '}
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No projects yet. Create your first project!
                  </p>
                  <Link href="/dashboard/projects/new">
                    <Button variant="outline">Create Project</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Learn how to use Vibe Engineering Platform effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: 'Write Your First Prompt',
                  description: 'Learn how to describe what you want to build',
                  href: '#',
                },
                {
                  title: 'Understanding Quality Gates',
                  description: 'How automated checks improve your code',
                  href: '#',
                },
                {
                  title: 'Project Best Practices',
                  description: 'Tips for organizing and managing projects',
                  href: '#',
                },
              ].map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors group"
                >
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
