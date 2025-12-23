'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  ArrowRight,
  Github,
  BookOpen,
  Terminal,
  FileCode,
  Layers,
  GitBranch,
  Container,
  Cloud,
  Shield,
  Zap,
  Search,
  ChevronRight,
  Menu,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const docCategories = [
  {
    title: 'Getting Started',
    description: 'Learn the basics and set up your development environment',
    icon: BookOpen,
    articles: [
      { title: 'Introduction to Vibe Engineering', href: '#' },
      { title: 'Quick Start Guide', href: '#' },
      { title: 'Installation & Setup', href: '#' },
      { title: 'Your First Project', href: '#' },
    ],
  },
  {
    title: 'Code Generation',
    description: 'Master AI-powered code generation and refactoring',
    icon: FileCode,
    articles: [
      { title: 'Natural Language to Code', href: '#' },
      { title: 'Code Completion', href: '#' },
      { title: 'Refactoring Guide', href: '#' },
      { title: 'Multi-Language Support', href: '#' },
    ],
  },
  {
    title: 'Testing & Quality',
    description: 'Automated testing and code quality assurance',
    icon: Terminal,
    articles: [
      { title: 'Unit Test Generation', href: '#' },
      { title: 'Integration Testing', href: '#' },
      { title: 'Code Review AI', href: '#' },
      { title: 'Coverage Analysis', href: '#' },
    ],
  },
  {
    title: 'DevOps & Deployment',
    description: 'CI/CD pipelines, containers, and cloud deployment',
    icon: Cloud,
    articles: [
      { title: 'CI/CD Pipeline Generation', href: '#' },
      { title: 'Docker Configuration', href: '#' },
      { title: 'Cloud Deployment', href: '#' },
      { title: 'Infrastructure as Code', href: '#' },
    ],
  },
  {
    title: 'Security',
    description: 'Security best practices and compliance guides',
    icon: Shield,
    articles: [
      { title: 'Security Best Practices', href: '#' },
      { title: 'Vulnerability Scanning', href: '#' },
      { title: 'Compliance Guide', href: '#' },
      { title: 'Secret Detection', href: '#' },
    ],
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for developers',
    icon: Layers,
    articles: [
      { title: 'API Overview', href: '#' },
      { title: 'Authentication', href: '#' },
      { title: 'Rate Limits', href: '#' },
      { title: 'Error Handling', href: '#' },
    ],
  },
];

const quickLinks = [
  { title: 'Code Generation Tutorial', icon: FileCode, href: '#' },
  { title: 'CI/CD Setup Guide', icon: GitBranch, href: '#' },
  { title: 'Deployment Documentation', icon: Cloud, href: '#' },
  { title: 'Security Best Practices', icon: Shield, href: '#' },
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
              <Link href="/product" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Product</Link>
              <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/documentation" className="text-sm text-foreground font-medium">Documentation</Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-8">
              <BookOpen className="h-4 w-4 mr-1" />
              Documentation
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Learn to Build
              <br />
              <span className="text-primary">With Vibe</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Comprehensive guides, tutorials, and API reference to help you master
              the Vibe Engineering platform.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Getting Started
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Code Generation
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Testing
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Deployment
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                API Reference
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold">Quick Links</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <link.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{link.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse by Topic
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find the documentation you need organized by topic
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.articles.map((article, i) => (
                        <li key={i}>
                          <a
                            href={article.href}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {article.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Additional Resources
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Github className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">GitHub</CardTitle>
                <CardDescription>
                  Explore our open-source repositories and contribute to the community.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">API Status</CardTitle>
                <CardDescription>
                  Check the real-time status of our API and services.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">Community</CardTitle>
                <CardDescription>
                  Join our Discord community to connect with other developers.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Put your knowledge into practice and start building amazing applications.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Your First Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10">
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Code2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Vibe Engineering</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-Native Software Engineering Platform. Build software responsibly and earn from your creations.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/monetization" className="hover:text-foreground">Monetization</Link></li>
                <li><Link href="/documentation" className="hover:text-foreground">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/company/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/company/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/company/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/company/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/legal/monetization-policy" className="hover:text-foreground">Monetization Policy</Link></li>
                <li><Link href="/legal/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Vibe Engineering. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
