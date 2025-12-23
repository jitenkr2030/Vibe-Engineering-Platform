'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  Shield,
  Zap,
  Users,
  BookOpen,
  ArrowRight,
  Github,
  Terminal,
  Layers,
  Cpu,
  Lock,
  Check,
  Star,
  CreditCard,
  Crown,
  Building2,
  Globe,
  Smartphone,
  BarChart3,
  RefreshCw,
  Database,
  Cloud,
  Container,
  GitBranch,
  Check,
  Clock,
  Target,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Feature highlights for product page
const productHighlights = [
  {
    icon: Sparkles,
    title: 'AI-Powered Development',
    description: 'Transform natural language into production-ready code with advanced AI models trained on millions of repositories.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SOC 2 compliance, and advanced access controls to keep your code and data safe.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized build pipelines and intelligent caching deliver sub-second response times for all operations.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time collaboration features, code reviews, and seamless team management built-in.',
  },
];

const coreFeatures = [
  {
    category: 'Code Generation',
    features: [
      { name: 'Multi-language support (TS, Python, Go, Rust)', icon: Code2 },
      { name: 'Context-aware code suggestions', icon: Lightbulb },
      { name: 'Automated refactoring', icon: RefreshCw },
      { name: 'Code completion & snippets', icon: Terminal },
    ],
  },
  {
    category: 'Testing & Quality',
    features: [
      { name: 'Auto-generated unit tests', icon: Check },
      { name: 'Integration test scaffolding', icon: Target },
      { name: 'Code coverage analysis', icon: BarChart3 },
      { name: 'Best practices enforcement', icon: ShieldCheck },
    ],
  },
  {
    category: 'DevOps & Deployment',
    features: [
      { name: 'CI/CD pipeline generation', icon: GitBranch },
      { name: 'Docker containerization', icon: Container },
      { name: 'Cloud deployment', icon: Cloud },
      { name: 'Infrastructure as code', icon: Database },
    ],
  },
];

const integrations = [
  { name: 'GitHub', icon: Github, description: 'Full GitHub integration with PR reviews and actions' },
  { name: 'VS Code', icon: Code2, description: 'Native VS Code extension' },
  { name: 'Slack', icon: Globe, description: 'Team notifications and commands' },
  { name: 'Jira', icon: BookOpen, description: 'Project tracking sync' },
  { name: 'Figma', icon: Layers, description: 'Design-to-code import' },
  { name: 'Docker', icon: Container, description: 'Container orchestration' },
];

export default function ProductPage() {
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
              <Link href="/product" className="text-sm text-foreground font-medium">Product</Link>
              <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/documentation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
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
              <Sparkles className="h-4 w-4 mr-1" />
              AI-Native Development Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build Software
              <br />
              <span className="text-primary">Responsibly</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Vibe Engineering is an AI-native software engineering platform that helps you build,
              test, secure, deploy, and monetize your applications with unprecedented speed and quality.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline">
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Build Great Software
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform for modern software development, powered by AI and built for developers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <item.icon className="h-10 w-10 text-primary mb-4" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Development Toolchain
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From code generation to deployment, we have got every step of your workflow covered.
            </p>
          </motion.div>

          <div className="space-y-12">
            {coreFeatures.map((category, categoryIndex) => (
              <div key={category.category}>
                <h3 className="text-2xl font-bold mb-6 text-center">{category.category}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: categoryIndex * 0.1 + featureIndex * 0.05 }}
                    >
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <feature.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm font-medium">{feature.name}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with the tools you already use. Vibe Engineering integrates with your entire development stack.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <integration.icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: '10K+', label: 'Active Developers' },
              { value: '50M+', label: 'Lines Generated' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '200+', label: 'Integrations' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
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
              Ready to Transform Your Development?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already building with Vibe Engineering faster and better.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10">
                  Contact Sales
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
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
