'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  Shield,
  Zap,
  Users,
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
  GitBranch,
  Container,
  Cloud,
  Database,
  BarChart3,
  Target,
  RefreshCw,
  Lightbulb,
  FileCode,
  Bug,
  ShieldCheck,
  Rocket,
  Scale,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const featureCategories = [
  {
    category: 'AI Code Generation',
    description: 'Generate production-ready code from natural language descriptions',
    features: [
      {
        title: 'Multi-Language Support',
        description: 'Generate code in TypeScript, Python, Go, Rust, Java, C++, and 20+ languages with proper syntax and best practices.',
        icon: Code2,
      },
      {
        title: 'Context-Aware Generation',
        description: 'AI understands your project structure, existing code patterns, and architectural decisions for coherent output.',
        icon: Lightbulb,
      },
      {
        title: 'Smart Refactoring',
        description: 'Automatically refactor legacy code with modern patterns, improved performance, and better readability.',
        icon: RefreshCw,
      },
      {
        title: 'Code Completion',
        description: 'Intelligent autocomplete suggestions that understand your coding style and project conventions.',
        icon: FileCode,
      },
    ],
  },
  {
    category: 'Testing & Quality',
    description: 'Comprehensive testing tools to ensure code reliability',
    features: [
      {
        title: 'Auto Unit Tests',
        description: 'Automatically generate unit tests with high coverage for all your functions and components.',
        icon: Check,
      },
      {
        title: 'Integration Testing',
        description: 'Create integration test scaffolds that verify component interactions and API contracts.',
        icon: Target,
      },
      {
        title: 'Code Review AI',
        description: 'AI-powered code review that catches bugs, security issues, and performance problems before merge.',
        icon: Bug,
      },
      {
        title: 'Coverage Analysis',
        description: 'Real-time code coverage tracking with recommendations for untested code paths.',
        icon: BarChart3,
      },
    ],
  },
  {
    category: 'DevOps & Deployment',
    description: 'Complete CI/CD and deployment pipeline generation',
    features: [
      {
        title: 'CI/CD Pipeline Generator',
        description: 'Generate GitHub Actions, GitLab CI, or Jenkins pipelines tailored to your project requirements.',
        icon: GitBranch,
      },
      {
        title: 'Docker Configuration',
        description: 'Production-ready Dockerfiles with multi-stage builds, optimization, and security best practices.',
        icon: Container,
      },
      {
        title: 'Cloud Deployment',
        description: 'One-click deployment to AWS, GCP, Azure, or Vercel with auto-scaling and load balancing config.',
        icon: Cloud,
      },
      {
        title: 'Infrastructure as Code',
        description: 'Terraform and CloudFormation templates for your entire infrastructure stack.',
        icon: Database,
      },
    ],
  },
  {
    category: 'Security & Compliance',
    description: 'Enterprise-grade security features',
    features: [
      {
        title: 'Vulnerability Scanning',
        description: 'Real-time scanning for OWASP Top 10 vulnerabilities, dependency issues, and misconfigurations.',
        icon: Shield,
      },
      {
        title: 'Secret Detection',
        description: 'Automatically detect and prevent accidental commit of API keys, passwords, and tokens.',
        icon: Lock,
      },
      {
        title: 'Compliance Reports',
        description: 'Generate SOC 2, HIPAA, and GDPR compliance reports automatically.',
        icon: Scale,
      },
      {
        title: 'Security Best Practices',
        description: 'Enforce security policies like input validation, output encoding, and secure authentication.',
        icon: ShieldCheck,
      },
    ],
  },
];

const additionalFeatures = [
  { name: 'Real-time Collaboration', icon: Users },
  { name: 'Custom Code Snippets', icon: FileCode },
  { name: 'API Documentation', icon: Globe },
  { name: 'Performance Monitoring', icon: Rocket },
  { name: 'Error Tracking', icon: Bug },
  { name: 'Version Control', icon: GitBranch },
];

export default function FeaturesPage() {
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
              <Link href="/features" className="text-sm text-foreground font-medium">Features</Link>
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
              Powerful Features
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build Faster,
              <br />
              <span className="text-primary">Build Better</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              From AI-powered code generation to enterprise security, Vibe Engineering provides
              everything you need to build production-ready software at scale.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/documentation">
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <section
          key={category.category}
          className={`py-20 px-4 ${categoryIndex % 2 === 1 ? 'bg-muted/30' : ''}`}
        >
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge className="mb-4">{category.category}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {category.category}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {category.description}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {category.features.map((feature, featureIndex) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: featureIndex * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                          <CardDescription className="text-base">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Additional Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              And Much More
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Additional features to enhance your development workflow
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                  <feature.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{feature.name}</span>
                </div>
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
              Ready to Experience These Features?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Start building with Vibe Engineering today and transform your development workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10">
                  View Pricing
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
