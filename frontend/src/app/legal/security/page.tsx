'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Code2,
  ArrowRight,
  Github,
  Shield,
  Lock,
  CheckCircle,
  FileCheck,
  Server,
  Database,
  Cloud,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const securityMeasures = [
  {
    icon: Lock,
    title: 'Encryption',
    description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.',
  },
  {
    icon: Server,
    title: 'Infrastructure',
    description: 'SOC 2 compliant infrastructure with regular security audits and penetration testing.',
  },
  {
    icon: Database,
    title: 'Data Protection',
    description: 'Isolated databases with VPC isolation, automated backups, and encryption key management.',
  },
  {
    icon: Cloud,
    title: 'Cloud Security',
    description: 'Hosted on enterprise-grade cloud infrastructure with DDoS protection and WAF.',
  },
];

const compliance = [
  { name: 'SOC 2 Type II', icon: FileCheck, description: 'Annual audit of security, availability, and confidentiality controls' },
  { name: 'GDPR', icon: Shield, description: 'Full compliance with European data protection requirements' },
  { name: 'CCPA', icon: Users, description: 'California Consumer Privacy Act compliance for US users' },
  { name: 'HIPAA', icon: FileCheck, description: 'Healthcare data protection standards available for enterprise' },
];

export default function SecurityPage() {
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
            <Badge className="mb-8">
              <Shield className="h-4 w-4 mr-1" />
              Security Center
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Enterprise-Grade
              <br />
              <span className="text-primary">Security</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Your code and data security is our top priority. Learn about the measures we take
              to keep your intellectual property and user data safe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Security Measures</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multi-layered security approach to protect your data at every level
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityMeasures.map((measure, index) => (
              <motion.div
                key={measure.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <measure.icon className="h-10 w-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{measure.title}</CardTitle>
                    <CardDescription>{measure.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance & Certifications</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Industry-recognized security standards and certifications
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {compliance.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-center">
                    <item.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Details */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Application Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li>All code generated by our AI undergoes security scanning</li>
                  <li>Vulnerability scanning for dependencies and container images</li>
                  <li>Automated secret detection to prevent credential leaks</li>
                  <li>Regular security updates for all dependencies</li>
                  <li>Bug bounty program for responsible disclosure</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Access Control</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li>Multi-factor authentication for all accounts</li>
                  <li>Role-based access control (RBAC) for teams</li>
                  <li>SSO integration with major identity providers</li>
                  <li>Session management with automatic timeout</li>
                  <li>Audit logs for all access and actions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Incident Response</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <ul className="space-y-2">
                  <li>24/7 security monitoring and incident detection</li>
                  <li>Dedicated security team with defined response procedures</li>
                  <li>Automated alerting and escalation processes</li>
                  <li>Regular incident response drills and testing</li>
                  <li>Transparent communication during security incidents</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Data Residency</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">
                  You can choose where your data is stored:
                </p>
                <ul className="space-y-2">
                  <li><strong>United States:</strong> Default region for most users</li>
                  <li><strong>European Union:</strong> GDPR-compliant data residency</li>
                  <li><strong>Asia Pacific:</strong> Singapore region for APAC users</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Report a Vulnerability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-muted-foreground max-w-none">
                <p className="mb-4">
                  We take security seriously and appreciate responsible disclosure. If you
                  believe you have found a security vulnerability, please let us know right away.
                </p>
                <p>
                  <strong>Email:</strong> security@vibeengineering.com<br />
                  <strong>PGP Key:</strong> Available upon request
                </p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Have Questions About Security?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Our security team is available to answer your questions and help with enterprise requirements.
            </p>
            <Link href="/company/contact">
              <Button size="lg" variant="secondary" className="gap-2">
                Contact Security Team
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
