'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiService } from '@/services/ai.service';
import { useArchitectureStore } from '@/store/aiStore';

export default function ArchitectureGeneratorPage() {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('fullstack');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'technologies' | 'patterns'>('structure');

  const { generatedArchitecture, setGeneratedArchitecture, isGenerating, setIsGenerating } = useArchitectureStore();

  const handleGenerate = async () => {
    if (!description) return;

    setLoading(true);
    setIsGenerating(true);

    try {
      const response = await aiService.generateArchitecture({
        description,
        requirements: [],
        constraints: [],
        preferences: {}
      });
      
      setGeneratedArchitecture(response.data);
    } catch (error) {
      console.error('Architecture generation failed:', error);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const renderTree = (nodes: any[], depth = 0): JSX.Element => {
    return (
      <div className="ml-4">
        {nodes.map((node, index) => (
          <div key={index} className="mb-1">
            <div className="flex items-center gap-2">
              {depth > 0 && <span className="text-muted-foreground">├──</span>}
              <span className={node.type === 'folder' ? 'font-medium' : 'text-muted-foreground'}>
                {node.type === 'folder' ? '📁' : '📄'} {node.name}
              </span>
              {node.description && (
                <span className="text-xs text-muted-foreground">- {node.description}</span>
              )}
            </div>
            {node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Architecture Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate complete project structures with technology recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Project Description</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Project Type</label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend Application</SelectItem>
                  <SelectItem value="backend">Backend API</SelectItem>
                  <SelectItem value="fullstack">Full Stack Application</SelectItem>
                  <SelectItem value="library">Library/Package</SelectItem>
                  <SelectItem value="microservice">Microservice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                What do you want to build?
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project requirements, features, and any specific technologies you want to use..."
                className="min-h-[200px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!description || loading}
              className="w-full"
            >
              {loading ? 'Generating...' : '🏗️ Generate Architecture'}
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {generatedArchitecture ? (
            <>
              {/* Project Info */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{generatedArchitecture.projectName}</h2>
                  <Badge variant="outline">{projectType}</Badge>
                </div>
                <p className="text-muted-foreground">{generatedArchitecture.description}</p>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2">
                {(['structure', 'technologies', 'patterns'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'structure' && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Project Structure</h3>
                  <div className="bg-muted rounded-lg p-4 max-h-[500px] overflow-auto">
                    {generatedArchitecture.structure && 
                      renderTree(generatedArchitecture.structure)
                    }
                  </div>
                </Card>
              )}

              {activeTab === 'technologies' && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Recommended Technologies</h3>
                  <div className="space-y-4">
                    {generatedArchitecture.recommendedTechnologies?.map((tech: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{tech.name}</span>
                          <Badge variant="secondary">{tech.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tech.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {activeTab === 'patterns' && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Design Patterns</h3>
                  <div className="space-y-2">
                    {generatedArchitecture.patterns?.map((pattern: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span>🔹</span>
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Rationale</h4>
                    <p className="text-sm text-blue-700">{generatedArchitecture.rationale}</p>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
              <p className="text-muted-foreground">
                Describe your project and let AI create the perfect architecture for you
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
