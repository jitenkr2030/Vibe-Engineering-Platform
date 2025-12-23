# 🧠 Vibe Engineering Platform

<p align="center">
  <strong>AI-Native Software Engineering Platform</strong><br>
  Build software responsibly with AI-powered code generation, quality gates, and automated testing.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎯 What is Vibe Engineering?

Vibe Engineering is not AI writing code — it is AI building software responsibly. The platform combines AI-powered code generation with rigorous quality gates, automated testing, security scanning, and learning assistance to help developers build production-ready software.

### Core Philosophy

> **Vibe Engineering = Creativity × Discipline × Automation**

- **AI Creates**: Generate code, tests, and documentation from natural language
- **System Checks**: Automated quality gates for security, performance, and code quality
- **Human Approves**: Developers review and approve AI-generated changes
- **Platform Remembers**: Project memory learns from decisions and mistakes

---

## ✨ Features

### 1. **Vibe Prompt Studio**
- Structured prompt templates for common tasks
- Role-based prompting (Architect, Developer, Tester, Security)
- Multi-turn memory per project
- Output format enforcement

### 2. **Project Architecture Generator**
- Auto-generate folder structures
- Tech stack recommendations
- Architecture diagram generation
- Trade-off explanations

### 3. **AI Code Generation Engine**
- Incremental file-by-file generation
- Diff-based changes (not full rewrites)
- Style and lint enforcement
- Secure defaults

### 4. **Automated Quality Gates** ⚡
- Code quality analysis
- Security vulnerability scanning
- Performance optimization checks
- Test coverage enforcement
- Anti-hallucination checks

### 5. **Test Intelligence Engine**
- Auto-generate unit tests
- Integration test generation
- Edge case detection
- Mock data generation
- Plain English failure explanations

### 6. **AI Reviewer & Mentor**
- Code review comments with severity levels
- Learning suggestions
- Pattern recommendations
- Engineering best practices guidance

### 7. **Memory & Learning System**
- Project-specific memory
- Team preference memory
- Mistake prevention
- Pattern recognition

### 8. **Deployment & DevOps Automation**
- One-click deployment
- CI/CD auto-generation
- Environment management
- Rollback safety

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/vibe-engineering/platform.git
cd vibe-engineering-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development services**
```bash
docker-compose up -d postgres redis minio
```

5. **Run database migrations**
```bash
npm run db:push
```

6. **Start development servers**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Production Setup

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📁 Project Structure

```
vibe-engineering-platform/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── api/         # API routes
│   │   │   ├── auth/        # Authentication pages
│   │   │   └── dashboard/   # Dashboard pages
│   │   ├── components/      # React components
│   │   │   ├── ui/          # UI primitives
│   │   │   ├── layout/      # Layout components
│   │   │   └── ...          # Feature components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── ai/          # AI integration
│   │   │   ├── quality/     # Quality gate services
│   │   │   └── ...          # Other services
│   │   ├── models/          # Data models
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration
│   │   └── index.ts         # Entry point
│   └── prisma/              # Database schema
│
├── shared/                   # Shared between frontend/backend
│   ├── types/               # TypeScript types
│   ├── constants/           # Shared constants
│   └── utils/               # Shared utilities
│
├── database/                # Database scripts
├── infrastructure/          # Docker, nginx configs
├── scripts/                 # Build and deployment scripts
│
├── package.json             # Root package.json
├── docker-compose.yml       # Docker Compose config
└── README.md
```

---

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand + React Query
- **Animation**: Framer Motion
- **Code Editor**: Monaco Editor

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: JWT + Passport
- **API Documentation**: OpenAPI/Swagger

### AI Integration
- **Primary**: OpenAI GPT-4o
- **Alternative**: Anthropic Claude
- **Code**: StarCoder (offline option)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Storage**: MinIO (S3 compatible)
- **Email**: Mailhog (dev) / SendGrid (prod)

---

## 📖 API Documentation

Once the backend is running, access Swagger documentation at:
```
http://localhost:3001/docs
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| GET | `/api/v1/projects` | List user projects |
| POST | `/api/v1/projects` | Create new project |
| GET | `/api/v1/projects/:id` | Get project details |
| POST | `/api/v1/generation/code` | Generate code |
| POST | `/api/v1/quality/check/:projectId` | Run quality gate |
| POST | `/api/v1/deployments/:projectId` | Deploy project |

---

## 🔐 Authentication

The platform uses JWT-based authentication with refresh tokens:

1. **Access Token**: Short-lived (7 days), used for API requests
2. **Refresh Token**: Long-lived (30 days), used to get new access tokens

### Protected Routes

All API routes under `/api/v1/*` require authentication except:
- `/api/v1/auth/register`
- `/api/v1/auth/login`
- `/api/v1/auth/refresh`
- `/health`

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

---

## 📦 Deployment

### Production with Docker

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Kubernetes

Helm charts are available in the `infrastructure/helm` directory.

### Environment Variables

See `.env.example` for all required configuration.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for GPT-4
- [Anthropic](https://anthropic.com) for Claude
- [Vercel](https://vercel.com) for Next.js
- [Prisma](https://prisma.io) for the database toolkit

---

<p align="center">
  Built with ❤️ by the Vibe Engineering Team
</p>
