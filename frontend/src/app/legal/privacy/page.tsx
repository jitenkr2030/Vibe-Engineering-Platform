'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  ArrowRight,
  Github,
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
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
              <Shield className="h-4 w-4 mr-1" />
              Privacy Policy
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your Privacy
              <br />
              <span className="text-primary">Matters to Us</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              We are committed to protecting your personal information and being transparent
              about how we collect, use, and share your data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  Vibe Engineering ("we," "our," or "us") is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you use our website, applications, and services.
                </p>
                <p>
                  By using Vibe Engineering, you agree to the collection and use of information
                  in accordance with this policy. If you do not agree with our policies and practices,
                  please do not use our services.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">2. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <h3 className="text-lg font-semibold mb-4">Information You Provide</h3>
                <ul className="space-y-2 mb-6">
                  <li>Account information (name, email, password)</li>
                  <li>Profile information (avatar, bio, preferences)</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Content you create or upload (code, files, projects)</li>
                  <li>Communications with us (support requests, feedback)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-4">Information Collected Automatically</h3>
                <ul className="space-y-2">
                  <li>Usage data (features used, time spent, interactions)</li>
                  <li>Device information (browser type, operating system, IP address)</li>
                  <li>Log data (access times, pages viewed, referring URLs)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">3. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions</li>
                  <li>Personalize and improve your experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">4. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">
                  We implement appropriate technical and organizational security measures to protect
                  your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <p className="mb-4">Our security measures include:</p>
                <ul className="space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure infrastructure with regular patches and updates</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p className="mt-4">
                  While we strive to protect your information, no method of transmission over the
                  Internet or electronic storage is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">5. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">Depending on your location, you may have the following rights:</p>
                <ul className="space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to the processing of your data for marketing purposes</li>
                  <li><strong>Withdrawal:</strong> Withdraw your consent at any time</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">6. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  If you have any questions about this Privacy Policy or our data practices,
                  please contact us at:
                </p>
                <p className="font-medium mt-4">
                  Vibe Engineering, Inc.<br />
                  350 Fifth Avenue<br />
                  New York, NY 10118<br />
                  Email: privacy@vibeengineering.com
                </p>
              </CardContent>
            </Card>
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
