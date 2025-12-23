'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { aiService } from '@/services/ai.service';
import { useCICDStore } from '@/store/aiStore';

export default function CICDGeneratorPage() {
  const [platform, setPlatform] = useState<'github' | 'gitlab' | 'jenkins'>('github');
  const [language, setLanguage] = useState('typescript');
  const [framework, setFramework] = useState('nextjs');
  const [projectType, setProjectType] = useState<'frontend' | 'backend' | 'fullstack'>('fullstack');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { pipelines, setPipelines, isGenerating, setIsGenerating } = useCICDStore();

  const [config, setConfig] = useState({
    testing: { unit: true, integration: false, e2e: false, coverage: true },
    docker: { enabled: true, multiStage: true },
    security: { dependencyScan: true, codeScan: false, secretsScan: true },
    deployment: { provider: 'vercel', environment: 'production', strategy: 'rolling' as const }
  });

  const handleGenerate = async () => {
    setLoading(true);
    setIsGenerating(true);

    try {
      const response = await aiService.generatePipeline({
        platform,
        language,
        framework,
        projectType,
        testing: config.testing,
        docker: config.docker.enabled ? { enabled: true, multiStage: config.docker.multiStage } : undefined,
        security: config.security,
        deployment: config.deployment
      });
      
      setResult(response.data);
      setPipelines(response.data.pipelines);
    } catch (error) {
      console.error('Pipeline generation failed:', error);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = (pipeline: any) => {
    const blob = new Blob([pipeline.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pipeline.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const platforms = [
    { id: 'github', name: 'GitHub Actions', icon: '🐙', description: 'Best for GitHub repositories' },
    { id: 'gitlab', name: 'GitLab CI', icon: '🦊', description: 'Native GitLab integration' },
    { id: 'jenkins', name: 'Jenkins', icon: '🔧', description: 'Enterprise CI/CD' }
  ];

  const languages = [
    { id: 'typescript', name: 'TypeScript/JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' }
  ];

  const frameworks: Record<string, Array<{ id: string; name: string }>> = {
    typescript: [
      { id: 'nextjs', name: 'Next.js' },
      { id: 'react', name: 'React' },
      { id: 'nestjs', name: 'NestJS' },
      { id: 'express', name: 'Express' }
    ],
    python: [
      { id: 'django', name: 'Django' },
      { id: 'fastapi', name: 'FastAPI' },
      { id: 'flask', name: 'Flask' }
    ],
    java: [
      { id: 'spring-boot', name: 'Spring Boot' }
    ],
    go: [
      { id: 'gin', name: 'Gin' },
      { id: 'echo', name: 'Echo' }
    ],
    rust: [
      { id: 'actix', name: 'Actix' }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">CI/CD Generator</h1>
        <p className="text-muted-foreground mt-1">
          Automatically generate CI/CD pipelines for any platform and framework
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Pipeline Configuration</h2>
          
          <div className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      platform === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <div className="text-2xl">{p.icon}</div>
                    <div className="text-xs font-medium mt-1">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Framework */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Framework</label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(frameworks[language] || []).map((fw) => (
                      <SelectItem key={fw.id} value={fw.id}>
                        {fw.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Project Type</label>
              <Select value={projectType} onValueChange={(v) => setProjectType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="fullstack">Full Stack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Testing Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">Testing</label>
              <div className="space-y-2">
                {[
                  { key: 'unit', label: 'Unit Tests' },
                  { key: 'integration', label: 'Integration Tests' },
                  { key: 'e2e', label: 'E2E Tests' },
                  { key: 'coverage', label: 'Coverage Report' }
                ].map((option) => (
                  <div key={option.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.key}
                      checked={(config.testing as any)[option.key]}
                      onCheckedChange={(checked) => 
                        setConfig({
                          ...config,
                          testing: { ...config.testing, [option.key]: checked as boolean }
                        })
                      }
                    />
                    <label htmlFor={option.key} className="text-sm">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Docker */}
            <div>
              <label className="text-sm font-medium mb-2 block">Docker</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="docker-enabled"
                    checked={config.docker.enabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, docker: { ...config.docker, enabled: checked as boolean } })
                    }
                  />
                  <label htmlFor="docker-enabled" className="text-sm">Enable Docker</label>
                </div>
                {config.docker.enabled && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="multi-stage"
                      checked={config.docker.multiStage}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, docker: { ...config.docker, multiStage: checked as boolean } })
                      }
                    />
                    <label htmlFor="multi-stage" className="text-sm">Multi-stage Build</label>
                  </div>
                )}
              </div>
            </div>

            {/* Security */}
            <div>
              <label className="text-sm font-medium mb-2 block">Security Scanning</label>
              <div className="space-y-2">
                {[
                  { key: 'dependencyScan', label: 'Dependency Scan' },
                  { key: 'secretsScan', label: 'Secrets Detection' }
                ].map((option) => (
                  <div key={option.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.key}
                      checked={(config.security as any)[option.key]}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          security: { ...config.security, [option.key]: checked as boolean }
                        })
                      }
                    />
                    <label htmlFor={option.key} className="text-sm">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : '⚙️ Generate Pipeline'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {pipelines.length > 0 ? (
            <>
              {pipelines.map((pipeline, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        📄
                      </div>
                      <div>
                        <h3 className="font-semibold">{pipeline.name}</h3>
                        <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pipeline.platform}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(pipeline)}>
                        ⬇️ Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 max-h-[400px] overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {pipeline.content}
                    </pre>
                  </div>

                  {pipeline.requirements && pipeline.requirements.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Requirements:</p>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.requirements.map((req, i) => (
                          <Badge key={i} variant="secondary">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
              <p className="text-muted-foreground">
                Configure your pipeline settings and click "Generate Pipeline"
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
