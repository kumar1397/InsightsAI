# Design Document

## Overview

The AI-Driven Hybrid Customer Insights Platform is a serverless web application that guides users through a structured 5-screen workflow to transform business problems into executive-ready insights. The platform combines AI-powered analysis with human validation to ensure reliable, actionable recommendations.

The system follows a workflow-driven architecture where each screen represents a distinct phase in the insights generation process. State management is centralized using Zustand, while the backend leverages AWS serverless services for scalability and cost-effectiveness.

## Architecture

### High-Level System Architecture

The platform follows a three-tier serverless architecture:

**Presentation Layer**: Next.js frontend with TypeScript and Tailwind CSS provides the user interface. Five distinct screens guide users through the workflow, with Zustand managing application state and user progress.

**API Layer**: Amazon API Gateway serves as the entry point for all backend requests. RESTful endpoints handle workflow operations, AI processing requests, and data persistence. Lambda functions provide serverless compute for business logic.

**Data & AI Layer**: Amazon Bedrock provides LLM capabilities for problem refinement, questionnaire generation, persona simulation, and insight analysis. Amazon DynamoDB stores workflow state and project data. The architecture ensures stateless operations with persistent state management.

### Frontend Architecture

**UI Layer**: Five React components represent each workflow screen:
- ProblemDefinitionScreen: Handles problem input and AI refinement
- QuestionnaireBuilderScreen: Manages questionnaire generation and editing
- PersonaExplorationScreen: Displays AI persona responses and initial insights
- ValidationAnalysisScreen: Shows validation results and confidence scoring
- ExecutiveReportScreen: Presents final insights and export functionality

**State Layer**: Zustand store manages:
- Current workflow step and navigation state
- User inputs and AI-generated content across all screens
- Validation results and confidence scores
- Export-ready report data

**Services Layer**: API service modules handle:
- Authentication and session management
- AI processing requests to backend Lambda functions
- Data persistence operations
- Export functionality for reports

### Backend Architecture

**API Gateway Configuration**: RESTful endpoints organized by workflow stage:
- `/api/problem` - Problem definition and refinement
- `/api/questionnaire` - Questionnaire generation and management
- `/api/personas` - AI persona simulation and analysis
- `/api/validation` - Insight validation and confidence scoring
- `/api/reports` - Executive report generation and export

**Lambda Functions**: Serverless functions handle specific operations:
- ProblemRefinementFunction: Processes raw problems using Bedrock LLMs
- QuestionnaireGeneratorFunction: Creates themed questionnaires based on problems
- PersonaSimulatorFunction: Generates AI persona responses and analyzes patterns
- ValidationProcessorFunction: Compares AI insights with validation signals
- ReportGeneratorFunction: Creates executive-ready summaries and recommendations

**Bedrock Integration**: LLM operations use Claude or similar models for:
- Natural language processing of problem statements
- Questionnaire generation with thematic grouping
- Persona response simulation with realistic variation
- Insight analysis and business recommendation generation

## Components and Interfaces

### Core Components

**WorkflowManager**: Orchestrates progression through the 5-screen workflow
- Validates completion requirements for each screen
- Manages state transitions and data flow
- Handles navigation logic and progress tracking

**AIProcessor**: Interfaces with Amazon Bedrock for all AI operations
- Standardizes prompt engineering across different use cases
- Handles LLM response parsing and validation
- Manages rate limiting and error recovery

**StateManager**: Centralizes application state using Zustand
- Persists workflow progress and user inputs
- Synchronizes state with backend storage
- Handles optimistic updates and conflict resolution

**ValidationEngine**: Compares AI insights with real customer signals
- Calculates convergence/divergence metrics
- Generates confidence scores based on signal alignment
- Identifies areas requiring additional validation

### Key Interfaces

**WorkflowState Interface**:
```typescript
interface WorkflowState {
  currentStep: number;
  problemDefinition: ProblemData;
  questionnaire: QuestionnaireData;
  personaInsights: PersonaData;
  validationResults: ValidationData;
  executiveReport: ReportData;
}
```

**AIRequest Interface**:
```typescript
interface AIRequest {
  operation: 'refine' | 'generate' | 'simulate' | 'analyze';
  context: WorkflowContext;
  parameters: OperationParameters;
}
```

**ValidationSignal Interface**:
```typescript
interface ValidationSignal {
  source: 'real' | 'mocked';
  data: CustomerData;
  confidence: number;
  timestamp: Date;
}
```

## Data Models

### Problem Definition Data
```typescript
interface ProblemData {
  rawStatement: string;
  targetConsumer: string;
  refinedOptions: RefinedProblem[];
  selectedProblem: RefinedProblem;
  keyAssumptions: string[];
}

interface RefinedProblem {
  id: string;
  statement: string;
  researchQuestions: string[];
  assumptions: string[];
  scope: string;
}
```

### Questionnaire Data
```typescript
interface QuestionnaireData {
  version: number;
  themes: QuestionTheme[];
  totalQuestions: number;
  estimatedTime: number;
}

interface QuestionTheme {
  name: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: 'open' | 'multiple' | 'scale' | 'ranking';
  required: boolean;
  theme: string;
}
```

### Persona and Insights Data
```typescript
interface PersonaData {
  personas: AIPersona[];
  responses: PersonaResponse[];
  themes: InsightTheme[];
  hypotheses: Hypothesis[];
}

interface AIPersona {
  id: string;
  demographics: Demographics;
  psychographics: Psychographics;
  behaviors: BehaviorPattern[];
}

interface InsightTheme {
  name: string;
  frequency: number;
  supportingEvidence: string[];
  confidence: number;
}
```

### Validation and Report Data
```typescript
interface ValidationData {
  aiInsights: Insight[];
  validationSignals: ValidationSignal[];
  convergenceAnalysis: ConvergenceResult[];
  overallConfidence: number;
}

interface ReportData {
  executiveSummary: string;
  keyFindings: Finding[];
  recommendations: Recommendation[];
  confidenceScores: ConfidenceScore[];
  exportFormats: ExportOption[];
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  supportingData: string[];
  nextSteps: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Input Acceptance and Storage
*For any* valid problem statement and target consumer input, the platform should accept the input and successfully store it in the workflow state.
**Validates: Requirements 1.1**

### Property 2: AI Problem Refinement Consistency
*For any* problem input provided to the AI refinement process, the platform should generate multiple structured research options with consistent formatting and content quality.
**Validates: Requirements 1.2**

### Property 3: Research Option Assumption Inclusion
*For any* AI-generated research options, each option should include identifiable key assumptions that are relevant to the research scope.
**Validates: Requirements 1.3**

### Property 4: Workflow State Progression
*For any* completed workflow step, selecting to proceed should correctly update the workflow state and enable navigation to the next screen.
**Validates: Requirements 1.5, 2.5, 3.5, 4.5**

### Property 5: Questionnaire Generation Relevance
*For any* selected problem, the generated questionnaire should contain questions that are relevant to the problem scope and properly grouped by research themes.
**Validates: Requirements 2.1, 2.2**

### Property 6: Question Modification Integrity
*For any* questionnaire modification operation (add, edit, remove), the platform should maintain questionnaire integrity and validate question format appropriately.
**Validates: Requirements 2.3, 2.4**

### Property 7: AI Persona Response Generation
*For any* questionnaire, the platform should generate appropriate AI personas that can provide realistic responses to all questions in the questionnaire.
**Validates: Requirements 3.1**

### Property 8: Theme and Hypothesis Generation
*For any* set of AI persona responses, the platform should consistently identify common themes and generate relevant hypotheses based on response patterns.
**Validates: Requirements 3.2, 3.3**

### Property 9: Validation Signal Comparison
*For any* AI-generated insights and validation signals, the platform should correctly identify convergence and divergence patterns and calculate appropriate confidence scores.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 10: Executive Report Generation
*For any* validated insights, the platform should generate business recommendations with confidence scores and create executive-ready summaries suitable for presentation.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 11: Export Functionality
*For any* completed executive report, the platform should provide export capabilities that generate downloadable content suitable for executive consumption.
**Validates: Requirements 5.4, 5.5**

### Property 12: State Persistence and Recovery
*For any* user progress made on any screen, the platform should persist the workflow state and be able to restore it correctly when the user returns.
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 13: Data Integrity and Corruption Handling
*For any* state restoration attempt, the platform should validate data integrity and handle any corruption gracefully without losing user progress.
**Validates: Requirements 6.3, 9.5**

### Property 14: AI Integration Reliability
*For any* AI processing request, the platform should integrate with Amazon Bedrock correctly, handle API errors gracefully, and validate response quality before use.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 15: Security and Privacy Protection
*For any* user data throughout the platform lifecycle, the system should maintain encryption, access controls, audit logging, and proper data sanitization during processing and export.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 16: Performance Standards Compliance
*For any* user interaction or system operation, the platform should meet response time requirements, provide progress indicators for long operations, and maintain performance under concurrent load.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Input Validation Errors
The platform handles invalid inputs gracefully by providing clear error messages and maintaining system stability. When users provide malformed problem statements or invalid questionnaire modifications, the system validates inputs and guides users toward correct formats without losing existing progress.

### AI Processing Errors
Amazon Bedrock integration includes comprehensive error handling for API rate limits, service unavailability, and malformed responses. The platform implements exponential backoff for rate limiting, fallback mechanisms for service failures, and response validation to ensure AI-generated content meets quality standards.

### State Management Errors
Workflow state corruption or inconsistencies are detected through data integrity checks during state restoration. The platform maintains backup state snapshots and can recover from corruption by reverting to the last known good state while preserving as much user progress as possible.

### Network and Infrastructure Errors
Serverless architecture provides inherent resilience through automatic scaling and fault tolerance. API Gateway handles request routing failures, Lambda functions include timeout and memory management, and DynamoDB provides built-in redundancy for data persistence.

## Testing Strategy

### Dual Testing Approach
The platform requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of AI processing workflows
- Integration points between frontend and backend services
- Edge cases in data validation and error handling
- AWS service integration scenarios

**Property Tests** focus on:
- Universal properties that hold across all user inputs
- Comprehensive input coverage through randomization
- Workflow state consistency across all possible user paths
- AI response quality and format validation

### Property-Based Testing Configuration
- **Testing Library**: fast-check for TypeScript/JavaScript property-based testing
- **Test Iterations**: Minimum 100 iterations per property test to ensure comprehensive coverage
- **Test Tagging**: Each property test references its design document property using the format:
  **Feature: ai-customer-insights-platform, Property {number}: {property_text}**

### Unit Testing Balance
Unit tests complement property tests by:
- Verifying specific user scenarios and edge cases
- Testing integration with AWS services (Bedrock, DynamoDB, API Gateway)
- Validating error conditions and recovery mechanisms
- Ensuring proper handling of authentication and authorization

Property tests handle comprehensive input coverage, while unit tests focus on concrete examples and integration points. Together, they provide complete validation of system correctness and reliability.