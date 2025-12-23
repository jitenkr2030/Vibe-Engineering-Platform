'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiService } from '@/services/ai.service';
import { useTestGenerationStore } from '@/store/aiStore';

export default function TestIntelligencePage() {
  const [fileContent, setFileContent] = useState('');
  const [filePath, setFilePath] = useState('src/example.ts');
  const [testType, setTestType] = useState<'unit' | 'integration' | 'e2e'>('unit');
  const [loading, setLoading] = useState(false);

  const { 
    generatedTests, 
    setGeneratedTests, 
    testFramework, 
    setTestFramework,
    coverageGoal,
    setCoverageGoal,
    isGenerating, 
    setIsGenerating,
    supportedFrameworks,
    setSupportedFrameworks
  } = useTestGenerationStore();

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      const response = await aiService.getSupportedFrameworks();
      setSupportedFrameworks(response.data.frameworks);
    } catch (error) {
      console.error('Failed to load frameworks:', error);
    }
  };

  const handleGenerate = async () => {
    if (!fileContent) return;

    setLoading(true);
    setIsGenerating(true);

    try {
      let response;
      switch (testType) {
        case 'unit':
          response = await aiService.generateUnitTests(
            fileContent, 
            filePath, 
            'typescript',
            testFramework,
            coverageGoal
          );
          break;
        case 'integration':
          response = await aiService.generateIntegrationTests(
            [fileContent],
            [filePath],
            'typescript',
            testFramework
          );
          break;
        case 'e2e':
          response = await aiService.generateE2ETests(
            'web',
            ['home', 'about'],
            ['login', 'navigation']
          );
          break;
      }
      
      if (response?.data) {
        setGeneratedTests(response.data.tests || [response.data.test || response.data]);
      }
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleDetectEdgeCases = async () => {
    if (!fileContent) return;

    setLoading(true);
    try {
      const response = await aiService.detectEdgeCases(fileContent, filePath, 'typescript');
      console.log('Edge cases:', response.data.edgeCases);
    } catch (error) {
      console.error('Edge case detection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testTypes = [
    { id: 'unit', name: 'Unit Tests', icon: '🧪', description: 'Test individual functions and components' },
    { id: 'integration', name: 'Integration Tests', icon: '🔗', description: 'Test component interactions' },
    { id: 'e2e', name: 'E2E Tests', icon: '🌐', description: 'Test complete user flows' }
  ];

  const frameworks = [
    { id: 'jest', name: 'Jest', icon: '🃏' },
    { id: 'vitest', name: 'Vitest', icon: '⚡' },
    { id: 'pytest', name: 'Pytest', icon: '🐍' },
    { id: 'mocha', name: 'Mocha', icon: '🍵' },
    { id: 'junit', name: 'JUnit', icon: '☕' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Test Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Automatically generate comprehensive tests with edge case detection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            {/* Test Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <div className="space-y-2">
                {testTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTestType(type.id as any)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      testType === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Framework */}
            <div>
              <label className="text-sm font-medium mb-2 block">Test Framework</label>
              <Select value={testFramework} onValueChange={setTestFramework}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      {fw.icon} {fw.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coverage Goal */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Coverage Goal: {coverageGoal}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={coverageGoal}
                onChange={(e) => setCoverageGoal(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!fileContent || loading}
              className="w-full"
            >
              {loading ? 'Generating...' : '🧪 Generate Tests'}
            </Button>

            <Button
              variant="outline"
              onClick={handleDetectEdgeCases}
              disabled={!fileContent || loading}
              className="w-full"
            >
              🔍 Detect Edge Cases
            </Button>
          </div>
        </Card>

        {/* Code Input */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Source Code</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="src/example.ts"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Code</label>
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="Paste your source code here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Generated Tests */}
        <div className="lg:col-span-1 space-y-6">
          {generatedTests.length > 0 ? (
            <Tabs defaultValue={generatedTests[0]?.name || 'test-1'} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                {generatedTests.slice(0, 5).map((test, index) => (
                  <TabsTrigger key={index} value={`test-${index}`}>
                    Test {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {generatedTests.slice(0, 5).map((test, index) => (
                <TabsContent key={index} value={`test-${index}`}>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{test.type}</Badge>
                      <span className="text-sm text-muted-foreground">{test.edgeCases?.length || 0} edge cases</span>
                    </div>
                    <h4 className="font-medium mb-2">{test.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                    
                    <div className="bg-muted rounded-lg p-3 max-h-[300px] overflow-auto">
                      <pre className="text-sm font-mono whitespace-pre-wrap">{test.code}</pre>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="p-12 text-center h-full">
              <div className="text-6xl mb-4">🧪</div>
              <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
              <p className="text-muted-foreground">
                Paste your code and configure test settings to generate comprehensive tests
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Features Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test Intelligence Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-medium">Smart Test Generation</h3>
            <p className="text-sm text-muted-foreground">Context-aware test creation</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-medium">Edge Case Detection</h3>
            <p className="text-sm text-muted-foreground">Identify hidden bugs</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-medium">Coverage Analysis</h3>
            <p className="text-sm text-muted-foreground">Track test coverage</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-medium">Mock Data Generation</h3>
            <p className="text-sm text-muted-foreground">Realistic test data</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
