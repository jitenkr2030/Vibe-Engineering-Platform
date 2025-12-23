'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  ArrowRight,
  Github,
  Users,
  Heart,
  Zap,
  Globe,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const benefits = [
  {
    icon: Heart,
    title: 'Health & Wellness',
    items: ['Comprehensive health insurance', 'Mental health support', 'Gym membership reimbursement', 'Unlimited PTO'],
  },
  {
    icon: Zap,
    title: 'Growth & Development',
    items: ['Learning budget', 'Conference attendance', 'Internal tech talks', 'Mentorship programs'],
  },
  {
    icon: Globe,
    title: 'Flexibility',
    items: ['Remote-first culture', 'Flexible hours', 'Home office stipend', 'Co-working space allowance'],
  },
  {
    icon: Building2,
    title: 'Perks',
    items: ['Equity compensation', '401(k) matching', 'Latest MacBook Pro', 'Team retreats'],
  },
];

const openPositions = [
  {
    title: 'Senior Software Engineer, AI',
    department: 'Engineering',
    location: 'Remote / San Francisco',
    type: 'Full-time',
    description: 'Work on our core AI models for code generation and help build the next generation of developer tools.',
  },
  {
    title: 'Machine Learning Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Train and optimize large language models specifically designed for software engineering tasks.',
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'San Francisco',
    type: 'Full-time',
    description: 'Lead product strategy for our developer platform and work closely with engineering and design teams.',
  },
  {
    title: 'Developer Advocate',
    department: 'Growth',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build community engagement, create documentation, and represent Vibe Engineering at conferences.',
  },
  {
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build beautiful, performant user interfaces for our web application and IDE extensions.',
  },
  {
    title: 'Security Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Ensure our platform meets the highest security standards and help our customers stay secure.',
  },
];

const values = [
  { title: 'Impact', description: 'Work on products used by millions of developers worldwide' },
  { title: 'Autonomy', description: 'Own your projects from conception to deployment' },
  { title: 'Growth', description: 'Learn from talented peers and industry experts' },
  { title: 'Balance', description: 'Work-life balance is not just a buzzword for us' },
];

export default function CareersPage() {
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
              <Link href="/="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link hrefpricing" className="/company/about" className="text-sm text-foreground font-medium">Company</Link>
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
            <Badge className="mb-8">
              <Users className="h-4 w-4 mr-1" />
              Join Our Team
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build the Future of
              <br />
              <span className="text-primary">Software Development</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              We are looking for passionate individuals to join our mission of transforming
              how software is built. Come work with a world-class team on problems that matter.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#open-positions">
                <Button size="lg" className="gap-2">
                  View Open Positions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/company/about">
                <Button size="lg" variant="outline">
                  Learn About Our Culture
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Join Us?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Be part of something meaningful
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits & Perks</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We take care of our team so you can focus on building amazing things
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <benefit.icon className="h-10 w-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {benefit.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
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

      {/* Open Positions */}
      <section id="open-positions" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find your next role at Vibe Engineering
            </p>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{position.department}</Badge>
                          <Badge variant="outline">{position.type}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold mb-1">{position.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{position.location}</p>
                        <p className="text-sm">{position.description}</p>
                      </div>
                      <Button className="shrink-0">Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dont See the Right Fit?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              We are always looking for talented people. Send us your resume and we will reach out when a suitable position opens up.
            </p>
            <Link href="/company/contact">
              <Button size="lg" variant="secondary" className="gap-2">
                Get in Touch
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
