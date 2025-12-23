import { aiAggregator } from './aiAggregator';
import { AIResponse } from '../types';

export interface ArchitectureRequest {
  projectName: string;
  description: string;
  requirements?: string[];
  constraints?: string[];
  preferredStack?: {
    frontend?: string;
    backend?: string;
    database?: string;
    cloud?: string;
  };
}

export interface ArchitectureResult {
  projectName: string;
  overview: string;
  techStack: {
    category: string;
    technology: string;
    version: string;
    rationale: string;
  }[];
  folderStructure: {
    path: string;
    type: 'file' | 'folder';
    description?: string;
    children?: any[];
  }[];
  tradeOffs: {
    category: string;
    decision: string;
    implications: string[];
    alternatives?: string[];
  }[];
  scalabilityConsiderations: string[];
  securityConsiderations: string[];
  deploymentStrategy: {
    approach: string;
    infrastructure: string[];
    ciCdPipeline: string[];
  };
}

export class ArchitectureGeneratorService {
  private systemPrompt = `You are a Principal Software Architect with 20+ years of experience designing scalable systems. 
Your expertise spans microservices, monoliths, event-driven architectures, and serverless designs.
You always consider:
- Business requirements and constraints
- Team size and skillset
- Scalability needs
- Security requirements
- Cost optimization
- Time-to-market

Provide thoughtful recommendations with clear trade-off explanations.`;

  async generateArchitecture(request: ArchitectureRequest): Promise<ArchitectureResult> {
    const prompt = this.buildArchitecturePrompt(request);
    
    const response = await aiAggregator.completeJSON<ArchitectureResult>(prompt, {
      provider: 'anthropic',
      model: 'smart',
      temperature: 0.4,
      maxTokens: 6000,
      systemPrompt: this.systemPrompt,
    });

    return response;
  }

  private buildArchitecturePrompt(request: ArchitectureRequest): string {
    return `Design a comprehensive software architecture for the following project:

**Project Name**: ${request.projectName}
**Description**: ${request.description}
${request.requirements?.length ? `**Requirements**:\n${request.requirements.map(r => `- ${r}`).join('\n')}` : ''}
${request.constraints?.length ? `**Constraints**:\n${request.constraints.map(c => `- ${c}`).join('\n')}` : ''}
${request.preferredStack?.frontend ? `**Preferred Frontend**: ${request.preferredStack.frontend}` : ''}
${request.preferredStack?.backend ? `**Preferred Backend**: ${request.preferredStack.backend}` : ''}
${request.preferredStack?.database ? `**Preferred Database**: ${request.preferredStack.database}` : ''}

Please provide a detailed architecture proposal in the following JSON format:

{
  "projectName": "${request.projectName}",
  "overview": "A 2-3 sentence executive summary of the architecture",
  "techStack": [
    {
      "category": "Frontend Framework",
      "technology": "React with Next.js 14",
      "version": "14.x",
      "rationale": "Explain why this technology was chosen"
    },
    {
      "category": "Backend Framework",
      "technology": "Node.js with Express",
      "version": "20.x",
      "rationale": "Explain why this technology was chosen"
    },
    {
      "category": "Database",
      "technology": "PostgreSQL",
      "version": "15.x",
      "rationale": "Explain the database choice"
    }
  ],
  "folderStructure": [
    {
      "path": "/src",
      "type": "folder",
      "description": "Main source directory",
      "children": [
        {
          "path": "/src/components",
          "type": "folder",
          "description": "Reusable UI components"
        },
        {
          "path": "/src/pages",
          "type": "folder",
          "description": "Page components"
        }
      ]
    }
  ],
  "tradeOffs": [
    {
      "category": "Database",
      "decision": "Chose PostgreSQL over MongoDB",
      "implications": [
        "Strong consistency for transactional data",
        "Complex migrations required",
        "Requires schema planning upfront"
      ],
      "alternatives": ["MongoDB for flexible schemas", "MySQL for simpler setup"]
    }
  ],
  "scalabilityConsiderations": [
    "Horizontal scaling strategy",
    "Caching layer recommendations",
    "Database read replicas"
  ],
  "securityConsiderations": [
    "Authentication strategy",
    "Data encryption approach",
    "API security measures"
  ],
  "deploymentStrategy": {
    "approach": "Blue-green deployment",
    "infrastructure": ["AWS EC2", "RDS PostgreSQL", "ElastiCache Redis"],
    "ciCdPipeline": ["Build", "Test", "Security Scan", "Deploy"]
  }
}

IMPORTANT: Respond with valid JSON only. Ensure the folder structure is comprehensive and the trade-offs are realistic.`;
  }

  async generateFolderStructure(
    projectType: string,
    techStack: string[]
  ): Promise<ArchitectureResult['folderStructure']> {
    const prompt = `Generate a comprehensive folder structure for a ${projectType} project using ${techStack.join(', ')}.

Return only a JSON array with this structure:
[
  {
    "path": "/src",
    "type": "folder",
    "description": "Main source directory",
    "children": [...]
  }
]

Make it production-ready with best practices for the specified tech stack.`;

    const response = await aiAggregator.completeJSON<ArchitectureResult['folderStructure']>(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 3000,
    });

    return response;
  }

  async getTechStackRecommendations(
    projectType: string,
    requirements: string[]
  ): Promise<ArchitectureResult['techStack']> {
    const prompt = `Recommend a modern tech stack for a ${projectType} project with these requirements:
${requirements.map(r => `- ${r}`).join('\n')}

Return a JSON array with technologies for:
- Frontend Framework
- Backend Framework
- Database
- Cloud Provider
- DevOps Tools

Each item should have technology, version, and rationale.`;

    return await aiAggregator.completeJSON(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 2000,
    });
  }

  async explainTradeOffs(
    decision: string,
    context: string
  ): Promise<ArchitectureResult['tradeOffs'][0]> {
    const prompt = `Analyze the following architecture decision:
**Decision**: ${decision}
**Context**: ${context}

Provide a trade-off analysis in JSON format:
{
  "category": "Category of the decision",
  "decision": "${decision}",
  "implications": ["Positive and negative implications"],
  "alternatives": ["Alternative approaches considered"]
}`;

    return await aiAggregator.completeJSON(prompt, {
      provider: 'anthropic',
      model: 'smart',
      maxTokens: 1000,
    });
  }
}

export const architectureGenerator = new ArchitectureGeneratorService();
export default ArchitectureGeneratorService;
