'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  ArrowRight,
  Github,
  DollarSign,
  CreditCard,
  TrendingUp,
  Shield,
  FileText,
  CheckCircle,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function MonetizationPolicyPage() {
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
              <Link href="/monetization" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Monetization</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Start Earning</Button>
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
              <DollarSign className="h-4 w-4 mr-1" />
              Monetization Policy
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              How Creators
              <br />
              <span className="text-primary">Get Paid</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Transparent policies on revenue share, payments, and monetization for creators
              on the Vibe Engineering platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Revenue Share */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Creator Revenue Share</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe creators should keep the majority of what they earn
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-primary mb-2">90%</div>
                  <div className="text-lg font-semibold mb-2">Creator Share</div>
                  <p className="text-sm text-muted-foreground">
                    Of all revenue from your applications, templates, and services
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-muted-foreground mb-2">10%</div>
                  <div className="text-lg font-semibold mb-2">Platform Fee</div>
                  <p className="text-sm text-muted-foreground">
                    Covers payment processing, infrastructure, and platform maintenance
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-8">
                  <div className="text-5xl font-bold text-green-600 mb-2">$0</div>
                  <div className="text-lg font-semibold mb-2">Setup Fees</div>
                  <p className="text-sm text-muted-foreground">
                    No upfront costs to start selling your creations
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Payment Details */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Payment Details</h2>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">Creators can receive payments through:</p>
                <ul className="space-y-2">
                  <li>Stripe Connect (recommended for most creators)</li>
                  <li>PayPal for business accounts</li>
                  <li>Bank wire transfer (for eligible regions and amounts)</li>
                  <li>Crypto payments (USDC on supported networks)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Payout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li><strong>Standard Payout:</strong> Weekly (every Monday) for balances over $100</li>
                  <li><strong>Minimum Payout:</strong> $100 USD (or equivalent)</li>
                  <li><strong>Processing Time:</strong> 2-5 business days after payout request</li>
                  <li><strong>Currency:</strong> USD default (convert to local currency available)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Tax Information
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li>Creators are responsible for reporting and paying taxes on their earnings</li>
                  <li>We provide annual 1099 forms for US-based creators earning over $600</li>
                  <li>Non-US creators may need to provide tax documentation</li>
                  <li>Platform fees are not tax-deductible for creators</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Monetization Methods</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">Our platform supports multiple monetization channels:</p>
                <ul className="space-y-2">
                  <li><strong>Subscriptions:</strong> Recurring revenue from subscribers</li>
                  <li><strong>One-time Sales:</strong> Single purchases of templates or applications</li>
                  <li><strong>Marketplace Sales:</strong> Sales through our creator marketplace</li>
                  <li><strong>API Access:</strong> Usage-based pricing for API consumers</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Refund Policy for Creators</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">When customers request refunds, the following applies:</p>
                <ul className="space-y-2">
                  <li>Refunds within 30 days of purchase are typically honored</li>
                  <li>Creators receive the full amount of the purchase minus platform fees</li>
                  <li>Disputes and chargebacks may affect creator ratings</li>
                  <li>We provide tools to handle customer service and refunds</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are building and monetizing their AI-powered applications.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Your Account
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
