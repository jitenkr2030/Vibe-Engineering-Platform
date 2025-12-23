'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiService } from '@/services/ai.service';
import { useAIReviewStore } from '@/store/aiStore';

export default function CodeReviewPage() {
  const [fileContent, setFileContent] = useState('');
  const [filePath, setFilePath] = useState('example.ts');
  const [language, setLanguage] = useState('typescript');
  const [reviewType, setReviewType] = useState<'general' | 'security' | 'performance' | 'architecture'>('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { currentReview, setCurrentReview, setIsReviewing, isReviewing } = useAIReviewStore();

  const handleReview = async () => {
    if (!fileContent || !filePath) return;

    setLoading(true);
    setIsReviewing(true);

    try {
      let response;
      switch (reviewType) {
        case 'security':
          response = await aiService.reviewSecurity(fileContent, filePath, language);
          break;
        case 'performance':
          response = await aiService.reviewPerformance(fileContent, filePath, language);
          break;
        case 'architecture':
          response = await aiService.reviewArchitecture(fileContent, filePath, language);
          break;
        default:
          response = await aiService.reviewFile(fileContent, filePath, language);
      }
      setResult(response.data);
      setCurrentReview({
        filePath,
        score: response.data.result.score,
        issues: response.data.result.issues,
        summary: response.data.result.summary,
        highlights: response.data.result.highlights,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setLoading(false);
      setIsReviewing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'maintainability': return '🔧';
      case 'correctness': return '✅';
      case 'architecture': return '🏗️';
      case 'documentation': return '📚';
      case 'style': return '🎨';
      default: return '📝';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Code Review</h1>
        <p className="text-muted-foreground mt-1">
          Get intelligent code reviews with security, performance, and best practices analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Code Input</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Review Type</label>
              <Select value={reviewType} onValueChange={(v) => setReviewType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Review</SelectItem>
                  <SelectItem value="security">Security Focused</SelectItem>
                  <SelectItem value="performance">Performance Focused</SelectItem>
                  <SelectItem value="architecture">Architecture Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Code</label>
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="Paste your code here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleReview}
              disabled={!fileContent || loading}
              className="w-full"
            >
              {loading ? 'Analyzing...' : '🔍 Run Code Review'}
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Score Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Review Results</h2>
                  <Badge className={`text-lg px-3 py-1 ${
                    result.result.score >= 80 ? 'bg-green-500' :
                    result.result.score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    Score: {result.result.score}/100
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.result.summary}</p>
              </Card>

              {/* Issues List */}
              {result.result.issues.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">
                    Issues Found ({result.result.issues.length})
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {result.result.issues.map((issue: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(issue.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{getCategoryIcon(issue.category)}</span>
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Line {issue.line}
                              </Badge>
                            </div>
                            <p className="font-medium">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-sm text-muted-foreground mt-1">
                                💡 {issue.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Highlights */}
              {result.result.highlights && result.result.highlights.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Highlights</h3>
                  <div className="space-y-2">
                    {result.result.highlights.map((highlight: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          highlight.type === 'strength' 
                            ? 'bg-green-50 text-green-800' 
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        <span className="font-medium">
                          {highlight.type === 'strength' ? '✅' : '💡'}
                        </span>{' '}
                        {highlight.message}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Ready to Review</h3>
              <p className="text-muted-foreground">
                Paste your code and click "Run Code Review" to get started
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
