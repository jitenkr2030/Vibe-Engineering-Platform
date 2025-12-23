import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

// Mock templates data
const templates = [
  {
    id: "tpl-001",
    name: "Modern React Dashboard",
    description:
      "A complete React dashboard with authentication, routing, and modern UI components. Perfect for building admin panels and data-driven applications.",
    shortDescription: "Complete React admin dashboard with auth and routing",
    category: "frontend",
    tags: ["react", "dashboard", "admin", "typescript"],
    author: "Vibe Team",
    downloads: 12450,
    stars: 892,
    lastUpdated: "2 days ago",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query"],
    features: [
      "Authentication with JWT",
      "Role-based access control",
      "Responsive design",
      "Dark mode support",
      "Internationalization",
    ],
    complexity: "intermediate",
    estimatedTime: "30 min",
  },
  {
    id: "tpl-002",
    name: "REST API Starter",
    description:
      "Production-ready REST API boilerplate with authentication, database integration, and comprehensive testing setup.",
    shortDescription: "Production-ready REST API with auth and testing",
    category: "backend",
    tags: ["nodejs", "api", "express", "postgresql"],
    author: "Vibe Team",
    downloads: 8932,
    stars: 654,
    lastUpdated: "1 week ago",
    techStack: ["Node.js", "Express", "PostgreSQL", "Prisma", "Jest"],
    features: [
      "JWT Authentication",
      "PostgreSQL with Prisma ORM",
      "Input validation with Zod",
      "Unit and integration tests",
      "API documentation with Swagger",
    ],
    complexity: "intermediate",
    estimatedTime: "45 min",
  },
  {
    id: "tpl-003",
    name: "Full Stack Next.js App",
    description:
      "End-to-end TypeScript application with Next.js frontend and Node.js backend. Includes database, authentication, and deployment configuration.",
    shortDescription: "Full-stack TypeScript app with Next.js and Node.js",
    category: "fullstack",
    tags: ["nextjs", "fullstack", "typescript", "prisma"],
    author: "Vibe Team",
    downloads: 15678,
    stars: 1243,
    lastUpdated: "3 days ago",
    techStack: ["Next.js 14", "TypeScript", "Prisma", "PostgreSQL"],
    features: [
      "App Router architecture",
      "Server and Client components",
      "API routes with Zod validation",
      "Authentication with NextAuth",
      "Docker configuration included",
    ],
    complexity: "advanced",
    estimatedTime: "1 hour",
  },
  {
    id: "tpl-004",
    name: "GraphQL API Gateway",
    description:
      "Scalable GraphQL API with Apollo Server, schema stitching, and federation support for microservices architecture.",
    shortDescription: "GraphQL API with Apollo and federation",
    category: "api",
    tags: ["graphql", "apollo", "microservices", "nodejs"],
    author: "Vibe Team",
    downloads: 4532,
    stars: 321,
    lastUpdated: "2 weeks ago",
    techStack: ["GraphQL", "Apollo Server", "Node.js", "TypeScript"],
    features: [
      "Schema stitching",
      "Apollo Federation",
      "Authentication directives",
      "Rate limiting",
      "GraphQL Playground",
    ],
    complexity: "advanced",
    estimatedTime: "1.5 hours",
  },
  {
    id: "tpl-005",
    name: "React Native Mobile App",
    description:
      "Cross-platform mobile application with React Native, Expo, and modern navigation patterns.",
    shortDescription: "React Native app with Expo and navigation",
    category: "mobile",
    tags: ["react-native", "mobile", "expo", "typescript"],
    author: "Vibe Team",
    downloads: 6234,
    stars: 456,
    lastUpdated: "1 week ago",
    techStack: ["React Native", "Expo", "TypeScript", "React Navigation"],
    features: [
      "iOS and Android support",
      "Push notifications",
      "Offline data persistence",
      "Deep linking",
      "App icons and splash screen",
    ],
    complexity: "intermediate",
    estimatedTime: "45 min",
  },
  {
    id: "tpl-006",
    name: "Microservices Starter",
    description:
      "Collection of services demonstrating microservices patterns with service discovery, API gateway, and inter-service communication.",
    shortDescription: "Microservices demo with discovery and gateway",
    category: "microservice",
    tags: ["microservices", "docker", "kubernetes", "nodejs"],
    author: "Vibe Team",
    downloads: 3456,
    stars: 234,
    lastUpdated: "3 weeks ago",
    techStack: ["Node.js", "Docker", "Nginx", "Consul"],
    features: [
      "Service discovery with Consul",
      "API Gateway with Nginx",
      "Inter-service communication",
      "Centralized logging",
      "Kubernetes manifests included",
    ],
    complexity: "advanced",
    estimatedTime: "2 hours",
  },
];

const categories = [
  { value: "all", label: "All Templates" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "mobile", label: "Mobile" },
  { value: "api", label: "API" },
  { value: "microservice", label: "Microservice" },
];

/**
 * @route GET /api/v1/templates
 * @desc Get all available templates with optional filtering
 * @access Public
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category = "all", search, sort = "popular" } = req.query;

    let filteredTemplates = [...templates];

    // Filter by category
    if (category && category !== "all") {
      filteredTemplates = filteredTemplates.filter(
        (t) => t.category === category
      );
    }

    // Search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTemplates = filteredTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    switch (sort) {
      case "recent":
        filteredTemplates.sort((a, b) =>
          a.lastUpdated.localeCompare(b.lastUpdated)
        );
        break;
      case "downloads":
        filteredTemplates.sort((a, b) => b.downloads - a.downloads);
        break;
      case "stars":
        filteredTemplates.sort((a, b) => b.stars - a.stars);
        break;
      case "popular":
      default:
        filteredTemplates.sort((a, b) => b.downloads - a.downloads);
    }

    return res.json({
      success: true,
      data: {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        categories,
      },
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/v1/templates/:id
 * @desc Get template details by ID
 * @access Public
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const template = templates.find((t) => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/v1/templates/instantiate
 * @desc Create a new project from a template
 * @access Private
 */
router.post(
  "/instantiate",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { templateId, projectName, settings } = req.body;

      if (!templateId || !projectName) {
        return res.status(400).json({
          success: false,
          error: "templateId and projectName are required",
        });
      }

      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found",
        });
      }

      // In a real implementation, this would:
      // 1. Clone the template repository
      // 2. Update configuration files with project-specific settings
      // 3. Install dependencies
      // 4. Create initial git repository
      // 5. Return the new project details

      const newProject = {
        id: `proj-${Date.now()}`,
        name: projectName,
        template: template.name,
        templateId,
        createdAt: new Date().toISOString(),
        status: "creating",
        settings: settings || {},
      };

      return res.json({
        success: true,
        data: newProject,
        message: `Project "${projectName}" created from template "${template.name}"`,
      });
    } catch (error) {
      console.error("Error instantiating template:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/templates/categories
 * @desc Get all template categories
 * @access Public
 */
router.get("/meta/categories", async (_req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
