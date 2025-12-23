'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiService } from '@/services/ai.service';
import { useAIReviewStore, useCICDStore, useArchitectureStore, useTestGenerationStore } from '@/store/aiStore';

const aiFeatures = [
  {
    id: 'code-review',
    name: 'AI Code Review',
    description: 'Get intelligent code reviews with security, performance, and best practices analysis',
    icon: '🔍',
    path: '/dashboard/ai/code-review',
    color: 'bg-blue-500',
    capabilities: ['Security Analysis', 'Performance Review', 'Architecture Review', 'Learning Resources']
  },
  {
    id: 'cicd-generator',
    name: 'CI/CD Generator',
    description: 'Automatically generate CI/CD pipelines for any platform and framework',
    icon: '⚙️',
    path: '/dashboard/ai/cicd-generator',
    color: 'bg-green-500',
    capabilities: ['Multi-Platform Support', 'Docker & K8s', 'Security Scanning', 'Deployment Strategies']
  },
  {
    id: 'architecture',
    name: 'Architecture Generator',
    description: 'Generate complete project structures with technology recommendations',
    icon: '🏗️',
    path: '/dashboard/ai/architecture',
    color: 'bg-purple-500',
    capabilities: ['Folder Structure', 'Tech Stack', 'Design Patterns', 'Best Practices']
  },
  {
    id: 'test-intelligence',
    name: 'Test Intelligence',
    description: 'Automatically generate unit, integration, and E2E tests with edge case detection',
    icon: '🧪',
    path: '/dashboard/ai/test-intelligence',
    color: 'bg-orange-500',
    capabilities: ['Unit Tests', 'Integration Tests', 'Edge Cases', 'Mock Data']
  }
];

export default function AIDashboard() {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { reviews } = useAIReviewStore();
  const { pipelines } = useCICDStore();
  const { generatedArchitecture } = useArchitectureStore();
  const { generatedTests } = useTestGenerationStore();

  useEffect(() => {
    loadAIStatus();
  }, []);

  const loadAIStatus = async () => {
    try {
      const response = await aiService.getStatus();
      setAiStatus(response.data);
    } catch (error) {
      console.error('Failed to load AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Code Reviews', value: reviews.length, icon: '📝' },
    { label: 'Pipelines Generated', value: pipelines.length, icon: '📦' },
    { label: 'Architectures', value: generatedArchitecture ? 1 : 0, icon: '🏗️' },
    { label: 'Tests Generated', value: generatedTests.length, icon: '🧪' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Engineering Platform</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent tools to accelerate your development workflow
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          🤖 AI Powered
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Status */}
      {aiStatus && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">AI Services Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Code Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">CI/CD Generator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Architecture Generator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Test Intelligence</span>
            </div>
          </div>
        </Card>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiFeatures.map((feature) => (
          <Link key={feature.id} href={feature.path}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-2xl`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {feature.capabilities.map((capability, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm">
                  Open →
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Start Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <p className="text-sm font-medium">Generate Architecture</p>
            <p className="text-xs text-muted-foreground">Create your project structure</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <p className="text-sm font-medium">Set Up CI/CD</p>
            <p className="text-xs text-muted-foreground">Generate deployment pipeline</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <p className="text-sm font-medium">Review Your Code</p>
            <p className="text-xs text-muted-foreground">Get AI-powered feedback</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-bold">4</span>
            </div>
            <p className="text-sm font-medium">Generate Tests</p>
            <p className="text-xs text-muted-foreground">Create comprehensive tests</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
