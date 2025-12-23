'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  ArrowRight,
  Github,
  Check,
  X,
  Star,
  Zap,
  Users,
  Building2,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Pricing plans configuration
const pricingPlans = [
  {
    name: 'Free',
    description: 'Perfect for trying out the platform',
    price: 0,
    yearlyPrice: 0,
    icon: Star,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    features: [
      { name: '10,000 AI tokens/day', included: true },
      { name: '3 projects', included: true },
      { name: 'Basic code generation', included: true },
      { name: 'Community support', included: true },
      { name: '1GB storage', included: true },
      { name: 'Code review (basic)', included: true },
      { name: 'CI/CD generation', included: false },
      { name: 'Architecture design', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
    tier: 'FREE',
  },
  {
    name: 'Pro',
    description: 'For individual developers and freelancers',
    price: 29,
    yearlyPrice: 290,
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    features: [
      { name: '100,000 AI tokens/day', included: true },
      { name: '20 projects', included: true },
      { name: 'Advanced AI models', included: true },
      { name: 'Priority support', included: true },
      { name: '10GB storage', included: true },
      { name: 'Code review (advanced)', included: true },
      { name: 'CI/CD generation', included: true },
      { name: 'Architecture design', included: true },
      { name: 'Team collaboration (3 seats)', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Start Pro Trial',
    popular: true,
    tier: 'PRO',
  },
  {
    name: 'Team',
    description: 'For small teams and startups',
    price: 99,
    yearlyPrice: 990,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    features: [
      { name: '500,000 AI tokens/day', included: true },
      { name: 'Unlimited projects', included: true },
      { name: 'Custom AI models', included: true },
      { name: 'Dedicated support', included: true },
      { name: '50GB storage', included: true },
      { name: 'Code review (advanced)', included: true },
      { name: 'CI/CD generation', included: true },
      { name: 'Architecture design', included: true },
      { name: 'Team collaboration (5 seats)', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Start Team Trial',
    popular: false,
    tier: 'TEAM',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: 499,
    yearlyPrice: 4990,
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    features: [
      { name: 'Unlimited AI tokens', included: true },
      { name: 'Unlimited projects', included: true },
      { name: 'Custom AI fine-tuning', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'Unlimited storage', included: true },
      { name: 'Enterprise code review', included: true },
      { name: 'Advanced CI/CD pipelines', included: true },
      { name: 'Enterprise architecture', included: true },
      { name: 'Unlimited team seats', included: true },
      { name: 'Full API access + SLA', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
    tier: 'ENTERPRISE',
  },
];

const faqs = [
  {
    question: 'What are AI tokens and how many do I need?',
    answer: 'AI tokens are the units used for AI-powered code generation. A typical code generation request uses 100-500 tokens. The Free plan provides 10,000 tokens per day, which is enough for about 20-100 code generations daily.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will be charged the prorated amount. When downgrading, the new rate takes effect at the start of your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and wire transfers for Enterprise plans. All payments are securely processed through Stripe.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes! The Pro and Team plans come with a 14-day free trial. No credit card required to start your trial. You can also schedule a demo with our sales team for Enterprise.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data is yours. You can export all your projects and code at any time. After cancellation, your data will be available for 30 days before being permanently deleted.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied with our service, contact support within 30 days of your purchase for a full refund.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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
              <Link href="/pricing" className="text-sm text-foreground font-medium">Pricing</Link>
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
              Simple, Transparent Pricing
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Choose the Right Plan
              <br />
              <span className="text-primary">For Your Needs</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              From individual developers to enterprise teams, we have pricing options that scale with you.
              Start free, upgrade when you need more power.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>
                Monthly
              </span>
              <Switch
                checked={billingCycle === 'yearly'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              />
              <span className={billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}>
                Yearly
              </span>
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${plan.bgColor} flex items-center justify-center mb-4`}>
                      <plan.icon className={`h-6 w-6 ${plan.color}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        ${billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.price}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ${plan.yearlyPrice} billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === plan.tier ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Have questions? We have answers.
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Building2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              For large organizations with specific requirements, we offer custom pricing,
              dedicated support, and on-premise deployment options.
            </p>
            <Link href="/company/contact">
              <Button size="lg" className="gap-2">
                Contact Sales Team
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
