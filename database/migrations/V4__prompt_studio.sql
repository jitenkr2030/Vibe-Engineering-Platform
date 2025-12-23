-- =====================================================
-- PROMPT STUDIO SCHEMA
-- Adds support for prompt templates and project memory
-- =====================================================

-- Prompt Templates Table
-- Stores reusable prompt structures with variable placeholders
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'Developer' CHECK (role IN ('Architect', 'Developer', 'Tester', 'Security', 'Custom')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_prompt_templates_role ON prompt_templates(role);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_project_id ON prompt_templates(project_id);

-- =====================================================
-- Project Memory Table
-- Stores conversation history for multi-turn context
-- =====================================================
CREATE TABLE IF NOT EXISTS project_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    context_summary TEXT,
    system_prompt TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one memory record per project
    CONSTRAINT one_memory_per_project UNIQUE (project_id)
);

-- Index for project memory queries
CREATE INDEX IF NOT EXISTS idx_project_memory_project_id ON project_memory(project_id);

-- =====================================================
-- Project Preferences Table
-- Stores team preferences for AI behavior
-- =====================================================
CREATE TABLE IF NOT EXISTS project_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    default_role VARCHAR(50) DEFAULT 'Developer',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
    model_preference VARCHAR(100) DEFAULT 'gpt-4',
    max_tokens INTEGER DEFAULT 4096,
    output_format VARCHAR(50) DEFAULT 'markdown' CHECK (output_format IN ('markdown', 'json', 'code', 'plain')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preferences record per project
    CONSTRAINT one_preference_per_project UNIQUE (project_id)
);

-- Index for preferences lookups
CREATE INDEX IF NOT EXISTS idx_project_preferences_project_id ON project_preferences(project_id);

-- =====================================================
-- Prompt Executions Log Table
-- Tracks template usage and AI interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL,
    input_variables JSONB DEFAULT '{}'::jsonb,
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    token_usage JSONB DEFAULT '{}'::jsonb,
    model_used VARCHAR(100),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for execution analytics
CREATE INDEX IF NOT EXISTS idx_prompt_executions_project_id ON prompt_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_template_id ON prompt_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_created_at ON prompt_executions(created_at);

-- =====================================================
-- Seed Default System Templates
-- =====================================================

-- Architect Role Templates
INSERT INTO prompt_templates (id, name, description, role, content, variables, is_system) VALUES
(
    gen_random_uuid(),
    'System Architecture Design',
    'Generate a comprehensive system architecture for a project',
    'Architect',
    E'# System Architecture Design for {{project_name}}

## Project Overview
{{project_description}}

## Requirements
{{requirements}}

## Constraints
{{constraints}}

## Deliverables

Please provide:

### 1. Architecture Overview
High-level system design with component diagram description.

### 2. Tech Stack Recommendations
For each category:
- Frontend Framework
- Backend Framework
- Database
- Caching Layer
- Message Queue
- Cloud Infrastructure

Include version recommendations and rationale for each choice.

### 3. Folder Structure
Show the complete directory structure with file purposes.

### 4. API Design
Define the main API endpoints with:
- HTTP Method
- Path
- Request/Response Schema
- Purpose

### 5. Data Model
Core entities with relationships and key fields.

### 6. Scalability Considerations
How the system handles:
- Horizontal scaling
- Caching strategy
- Database scaling
- CDN usage

### 7. Security Architecture
- Authentication flow
- Authorization patterns
- Data encryption
- API security measures

### 8. Deployment Strategy
- CI/CD pipeline stages
- Infrastructure requirements
- Monitoring and logging approach',
    '["project_name", "project_description", "requirements", "constraints"]',
    TRUE
),
(
    gen_random_uuid(),
    'API Design Review',
    'Review and improve API design',
    'Architect',
    E'# API Design Review

## Current API Specification
```yaml
{{api_specification}}
```

## Context
{{api_context}}

## Review Criteria

1. **RESTful Compliance**
   - Are endpoints properly RESTful?
   - Are HTTP methods used correctly?
   - Are resource names plural and consistent?

2. **URL Structure**
   - Are URLs intuitive and hierarchical?
   - Are query parameters used appropriately for filtering/sorting?

3. **Response Consistency**
   - Are response formats consistent?
   - Is error handling standardized?

4. **Versioning**
   - Is API versioning handled properly?

5. **Best Practices**
   - HATEOAS implementation
   - Pagination strategy
   - Rate limiting considerations

Please provide specific recommendations with code examples.',
    '["api_specification", "api_context"]',
    TRUE
),

-- Developer Role Templates
(
    gen_random_uuid(),
    'Code Generation',
    'Generate production-ready code from specifications',
    'Developer',
    E'# Code Generation Request

## Task Description
{{task_description}}

## Technical Context
- Language: {{language}}
- Framework: {{framework}}
- Project Type: {{project_type}}

## Existing Codebase
{{existing_code}}

## Requirements
{{requirements}}

## Output Format

Generate clean, production-ready code with:

1. **File Structure**
   ```
   {{output_directory}}
   ```

2. **Code Quality Standards**
   - TypeScript with strict typing
   - Proper error handling
   - Comprehensive JSDoc comments
   - ESLint-compliant style

3. **Best Practices Include**
   - Dependency injection
   - Repository pattern for data access
   - Service layer separation
   - Unit test placeholders

4. **Security Considerations**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - Authentication/authorization checks

Please provide the complete file content for each file specified.',
    '["task_description", "language", "framework", "project_type", "existing_code", "requirements", "output_directory"]',
    TRUE
),
(
    gen_random_uuid(),
    'Code Refactoring',
    'Refactor existing code for better maintainability',
    'Developer',
    E'# Code Refactoring Request

## Target Code
```{{language}}
{{code_snippet}}
```

## Current Issues
{{issues_description}}

## Refactoring Goals
{{refactoring_goals}}

## Analysis Checklist

1. **Complexity Reduction**
   - Identify long functions that need拆分
   - Find deeply nested conditions to flatten
   - Detect code duplication

2. **Readability Improvements**
   - Rename unclear variable/function names
   - Add meaningful comments
   - Improve formatting

3. **Pattern Application**
   - Apply SOLID principles
   - Use design patterns where appropriate
   - Implement proper separation of concerns

4. **Testing Considerations**
   - Ensure refactored code is testable
   - Maintain existing test coverage
   - Add unit tests for new functions

## Deliverables

1. **Refactored Code** - Complete working implementation
2. **Changes Summary** - List of all modifications
3. **Testing Notes** - Any test updates needed',
    '["language", "code_snippet", "issues_description", "refactoring_goals"]',
    TRUE
),

-- Tester Role Templates
(
    gen_random_uuid(),
    'Unit Test Generation',
    'Generate comprehensive unit tests',
    'Tester',
    E'# Unit Test Generation

## Target Code
```{{language}}
{{code_snippet}}
```

## Test Scope
{{test_scope}}

## Testing Requirements

1. **Test Framework**: {{test_framework}}

2. **Coverage Areas**
   - Happy path scenarios
   - Edge cases and boundary conditions
   - Error handling paths
   - Null/undefined inputs

3. **Test Data Generation**
   - Use realistic test data
   - Include boundary values
   - Mock external dependencies

4. **Assertion Style**
   - Descriptive test names
   - Single assertion per test (when possible)
   - Arrange-Act-Assert pattern

## Output Format

```{{language}}
{{test_file_header}}
```

Describe the testing approach and provide complete test code.',
    '["language", "code_snippet", "test_scope", "test_framework", "test_file_header"]',
    TRUE
),
(
    gen_random_uuid(),
    'Integration Test Design',
    'Design integration tests for API endpoints',
    'Tester',
    E'# Integration Test Design

## API Endpoint Under Test
{{endpoint_specification}}

## Test Scenarios

1. **Success Cases**
   - Valid request with all required fields
   - Optional fields handling
   - Maximum payload size

2. **Authentication/Authorization**
   - Missing authentication token
   - Invalid token
   - Insufficient permissions

3. **Input Validation**
   - Missing required fields
   - Invalid data types
   - Out-of-range values
   - Malformed payloads

4. **Business Logic**
   - State transitions
   - Cross-reference validation
   - Concurrency handling

5. **Error Scenarios**
   - 4xx client errors
   - 5xx server errors
   - Timeout handling

## Test Data Requirements
{{test_data_requirements}}

## Expected Outcomes
{{expected_outcomes}}

Please provide complete test code with setup, execution, and cleanup.',
    '["endpoint_specification", "test_data_requirements", "expected_outcomes"]',
    TRUE
),

-- Security Role Templates
(
    gen_random_uuid(),
    'Security Audit',
    'Comprehensive security review of code',
    'Security',
    E'# Security Audit

## Code Under Review
```{{language}}
{{code_snippet}}
```

## Audit Scope
{{audit_scope}}

## Security Checklist

### 1. Injection Attacks
- [ ] SQL Injection vulnerabilities
- [ ] NoSQL Injection patterns
- [ ] Command Injection
- [ ] LDAP Injection
- [ ] XPATH Injection

### 2. Authentication & Authorization
- [ ] Broken authentication patterns
- [ ] Weak password policies
- [ ] Missing rate limiting
- [ ] Insecure session management
- [ ] Privilege escalation risks

### 3. Data Exposure
- [ ] Sensitive data in logs
- [ ] Missing encryption at rest
- [ ] Insufficient transport layer protection
- [ ] Hardcoded secrets
- [ ] Information disclosure in errors

### 4. XXE (XML External Entities)
- [ ] XML parser vulnerabilities
- [ ] File upload risks
- [ ] XXE in configuration

### 5. Access Control
- [ ] Insecure direct object references (IDOR)
- [ ] Missing function level access control
- [ ] Path traversal vulnerabilities

### 6. Security Misconfiguration
- [ ] Default credentials
- [ ] Verbose error messages
- [ ] Unnecessary services enabled
- [ ] Missing security headers

## Risk Assessment
- Critical: {{critical_count}}
- High: {{high_count}}
- Medium: {{medium_count}}
- Low: {{low_count}}

## Recommendations
Provide specific fixes with corrected code examples.',
    '["language", "code_snippet", "audit_scope", "critical_count", "high_count", "medium_count", "low_count"]',
    TRUE
),
(
    gen_random_uuid(),
    'OWASP Top 10 Checklist',
    'Verify code against OWASP Top 10 vulnerabilities',
    'Security',
    E'# OWASP Top 10 Security Verification

## Code Review Target
```{{language}}
{{code_snippet}}
```

## Application Context
{{application_context}}

## Verification Against OWASP Top 10 (2021)

### A01:2021 - Broken Access Control
- IDOR vulnerabilities
- Path traversal
- Missing authorization checks
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A02:2021 - Cryptographic Failures
- Hardcoded secrets
- Weak encryption algorithms
- Missing TLS
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A03:2021 - Injection
- SQL Injection
- Command Injection
- LDAP Injection
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A04:2021 - Insecure Design
- Missing rate limits
- Missing input validation
- Missing output encoding
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A05:2021 - Security Misconfiguration
- Default credentials
- Verbose errors
- Unnecessary features
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A06:2021 - Vulnerable Components
- Outdated dependencies
- Known CVEs
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A07:2021 - Identification & Authentication
- Weak passwords
- Missing MFA
- Session management issues
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A08:2021 - Software & Data Integrity
- Insecure deserialization
- Unsigned updates
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A09:2021 - Security Logging
- Missing audit logs
- Sensitive data in logs
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

### A10:2021 - SSRF
- Server-side request forgery
- URL access from server
- ✅ PASS / ❌ FAIL / ⚠️ NEEDS REVIEW

## Summary
Provide overall security score and priority remediation items.',
    '["language", "code_snippet", "application_context"]',
    TRUE
);

-- =====================================================
-- Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_prompt_templates_variables ON prompt_templates USING GIN (variables);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_token_usage ON prompt_executions USING GIN (token_usage);

-- =====================================================
-- Updated at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_preferences_updated_at
    BEFORE UPDATE ON project_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
