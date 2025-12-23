'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  ArrowRight,
  Github,
  Shield,
  FileText,
  Gavel,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
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
              <FileText className="h-4 w-4 mr-1" />
              Terms of Service
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Terms of
              <br />
              <span className="text-primary">Service</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Please read these terms carefully before using Vibe Engineering. By accessing
              or using our services, you agree to be bound by these terms.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  By accessing or using Vibe Engineering's services, you agree to be bound by
                  these Terms of Service and all applicable laws and regulations. If you do not
                  agree with any part of these terms, you may not use our services.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">
                  Vibe Engineering provides an AI-powered software development platform that includes:
                </p>
                <ul className="space-y-2">
                  <li>AI-powered code generation and completion</li>
                  <li>Project management and collaboration tools</li>
                  <li>Testing and quality assurance features</li>
                  <li>CI/CD pipeline generation and deployment tools</li>
                  <li>Team collaboration and sharing features</li>
                  <li>API access and integrations with third-party services</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">3. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">To use our services, you must:</p>
                <ul className="space-y-2">
                  <li>Create an account with accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">4. Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">You agree not to:</p>
                <ul className="space-y-2">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Interfere with or disrupt the service or servers</li>
                  <li>Attempt to gain unauthorized access to any systems or networks</li>
                  <li>Upload viruses or malicious code</li>
                  <li>Harass, threaten, or violate the rights of other users</li>
                  <li>Use the service to generate harmful or malicious code</li>
                  <li>Resell or redistribute the service without authorization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">5. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">
                  <strong>Your Content:</strong> You retain ownership of all code, files, and
                  content you create or upload to the platform. By uploading content, you grant
                  us a license to use, store, and process your content solely to provide our services.
                </p>
                <p className="mb-4">
                  <strong>Our Platform:</strong> Vibe Engineering retains all rights to the
                  platform, including the AI models, code generation algorithms, and overall design.
                </p>
                <p>
                  <strong>Generated Code:</strong> Code generated by our AI is yours to use.
                  However, you are responsible for reviewing and testing all generated code before
                  using it in production.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">6. Payment and Billing</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li>Paid plans are billed monthly or annually as selected</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                  <li>Services may be suspended for overdue payments</li>
                  <li>You are responsible for any applicable taxes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">7. Disclaimer of Warranties</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                  KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE
                  UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">8. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  IN NO EVENT SHALL VIBE ENGINEERING BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
                  LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING
                  FROM YOUR ACCESS TO OR USE OF THE SERVICE.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">9. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  We reserve the right to modify these terms at any time. We will provide notice
                  of material changes through the service or via email. Continued use of the
                  service after such changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">10. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="font-medium mt-4">
                  Vibe Engineering, Inc.<br />
                  350 Fifth Avenue<br />
                  New York, NY 10118<br />
                  Email: legal@vibeengineering.com
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
