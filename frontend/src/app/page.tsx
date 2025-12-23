'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  Star,
  CreditCard,
  Crown,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { api } from '@/services/api';

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

// Feature list
const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Transform natural language into production-ready code with advanced AI models.',
    category: 'core',
  },
  {
    icon: Shield,
    title: 'Quality Gates',
    description: 'Automated security, performance, and code quality checks before any merge.',
    category: 'core',
  },
  {
    icon: Layers,
    title: 'Architecture Design',
    description: 'Generate complete project structures with best-practice architectural patterns.',
    category: 'ai',
  },
  {
    icon: Cpu,
    title: 'Smart Testing',
    description: 'Auto-generate unit tests, integration tests, and edge case coverage.',
    category: 'ai',
  },
  {
    icon: Lock,
    title: 'Security First',
    description: 'Detect vulnerabilities, hardcoded secrets, and injection risks instantly.',
    category: 'core',
  },
  {
    icon: BookOpen,
    title: 'Learning Mentor',
    description: 'Get AI-powered guidance that teaches you engineering principles.',
  },
  {
    icon: Terminal,
    title: 'CI/CD Pipeline Generator',
    description: 'Automatically generate GitHub Actions, Docker, and Kubernetes configs.',
    category: 'devops',
  },
  {
    icon: Code2,
    title: 'Multi-Language Support',
  {
    icon: Code2,
    title: 'Multi-Language Support',
    description: 'Generate code in TypeScript, Python, Go, Rust, and 20+ languages.',
    category: 'core',
  },
  },
];

// Stats
const stats = [
  { value: '10K+', label: 'Active Developers' },
  { value: '50M+', label: 'Lines Generated' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '$2M+', label: 'Revenue to Creators' },
];

// How it works steps
const howItWorks = [
  { step: '01', title: 'Describe', desc: 'Tell Vibe what you want to build' },
  { step: '02', title: 'Design', desc: 'AI architect creates the structure' },
  { step: '03', title: 'Generate', desc: 'Code is written with tests included' },
  { step: '04', title: 'Monetize', desc: 'Deploy and earn from your creations' },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  const handlePlanSelect = async (plan: typeof pricingPlans[0]) => {
    if (!isLoggedIn) {
      // Redirect to signup with plan pre-selected
      router.push(`/auth/register?plan=${plan.tier}`);
      return;
    }

    if (plan.tier === 'ENTERPRISE') {
      router.push('/dashboard/settings?tab=billing');
      return;
    }

    setLoadingPlan(plan.tier);

    try {
      // In a real app, this would create a checkout session
      const response = await api.post('/billing/create-checkout', {
        plan: plan.tier,
        billingCycle,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      // Fallback: redirect to billing page
      router.push('/dashboard/settings?tab=billing');
    } finally {
      setLoadingPlan(null);
    }
  };

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
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </Link>
              <Link href="#monetization" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Monetization
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link href="/dashboard/settings?tab=billing">
                    <Button>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Billing
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
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
              AI-Native Software Engineering
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build Software
              <br />
              <span className="text-primary">Responsibly</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Vibe Engineering is not AI writing code — it is AI building software responsibly.
              Create, test, secure, deploy, and <span className="text-primary font-semibold">monetize</span> your creations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Production
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From idea to deployment, with quality gates at every step.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mb-4" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Monetization Section */}
      <section id="monetization" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">
              <Crown className="h-4 w-4 mr-1" />
              Monetization
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Earn from Your Creations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build, deploy, and sell your AI-generated applications. We handle the infrastructure, you keep the revenue.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Subscription Revenue</h3>
              <p className="text-muted-foreground">
                Offer your applications as subscription services. We integrate Stripe, handle billing, and you earn recurring revenue.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Selling</h3>
              <p className="text-muted-foreground">
                Sell to teams and enterprises. Our platform handles multi-seat licensing, SSO, and enterprise billing.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Template Marketplace</h3>
              <p className="text-muted-foreground">
                Sell your project templates and AI prompts. Earn 90% of every sale in our creator marketplace.
              </p>
            </motion.div>
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">Ready to start earning?</h3>
                <p className="text-muted-foreground">Join thousands of creators earning from their AI-generated software.</p>
              </div>
              <Link href="/auth/register">
                <Button size="lg">
                  Start Earning Today
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade anytime as you grow.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
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
                      onClick={() => handlePlanSelect(plan)}
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

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need a custom solution? We offer custom AI model training and dedicated infrastructure.
            </p>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Sales for Custom Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Idea to Revenue
            </h2>
            <p className="text-xl text-muted-foreground">
              A streamlined workflow that takes you from concept to cash.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Responsibly?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and creators who trust Vibe Engineering for their projects.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10">
                View Plans
              </Button>
            </Link>
          </div>
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
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#monetization" className="hover:text-foreground">Monetization</Link></li>
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Monetization Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
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
