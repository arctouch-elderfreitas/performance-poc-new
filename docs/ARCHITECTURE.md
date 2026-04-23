# Architecture Overview

## System Design

The performance testing framework follows a modular, layered architecture designed for extensibility and maintainability.

### Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  - CLI Dashboard (Console Output)                               │
│  - Report Generators (JSON, CLI, Notion)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              AI-POWERED INTELLIGENCE LAYER                      │
│  - Test Generator (Claude API)                                  │
│  - Result Analyzer (Claude API)                                 │
│  - Intelligent Assertions                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXECUTION ENGINE LAYER                             │
│  - HTTP Engine (Axios)                                          │
│  - Mobile Engine (Playwright)                                   │
│  - Test Runner & Orchestration                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           METRICS & ANALYSIS LAYER                              │
│  - Performance Metrics Collection                               │
│  - Statistics Processor (p50, p95, p99)                        │
│  - Data Persistence (JSON, SQLite)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              TARGET SYSTEMS                                     │
│  - REST APIs (HTTP/HTTPS)                                       │
│  - Mobile Apps (via Playwright)                                │
│  - Third-party Services                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Test Generator (`src/generators/`)

**Responsibility**: Generate performance test scripts using AI

- Uses Claude API with custom prompts
- Accepts API specifications and scenario descriptions
- Returns optimized test configurations
- Supports multiple test scenarios: load, stress, spike, soak

**Key Files**:
- `test-generator.ts` - Main generator class
- `prompts/` - Prompt templates for different scenarios

### 2. Execution Engines (`src/engines/`)

**Responsibility**: Execute tests and collect metrics

**HTTP Engine**:
- Makes parallel HTTP requests
- Supports all standard HTTP methods
- Tracks response times, status codes, errors
- Implements concurrent request handling

**Mobile Engine** (future):
- Mobile app testing via Playwright
- User journey automation
- Performance metrics collection

**Key Files**:
- `http-engine.ts` - HTTP request executor
- `base-engine.ts` - Common interface for all engines

### 3. Result Parsers (`src/parsers/`)

**Responsibility**: Analyze results and extract insights

- Processes raw performance metrics
- Calculates statistical measures (percentiles, throughput)
- Uses AI to generate analysis and recommendations
- Identifies performance issues

**Key Files**:
- `result-parser.ts` - AI-powered analysis
- `metrics-processor.ts` - Statistical calculations

### 4. Utilities (`src/utils/`)

**HTTP Client**: Wrapper around Axios for consistency

```typescript
httpClient.executeRequest(config) → PerformanceMetrics
httpClient.executeParallel(requests, { concurrency }) → PerformanceMetrics[]
```

**Metrics Processor**: Statistical calculations

```typescript
MetricsProcessor.process(metrics, duration) → PerformanceStats
// Returns: p50, p95, p99, throughput, error rate, etc.
```

**Logger**: Colored console output

```typescript
logger.info("Message")
logger.success("Completed")
logger.error("Failed")
```

## Data Flow

### Typical Test Execution Flow

```
User Input
    ↓
┌─────────────────────────────────────┐
│ Test Configuration                   │
│ - iterations, concurrency, endpoints │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Generate Requests (optional AI)      │
│ testGenerator.generateTestRequest()  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Execute Tests in Parallel            │
│ httpEngine.executeTest()             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Collect Metrics                      │
│ PerformanceMetrics[]                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Process Statistics                   │
│ MetricsProcessor.process()           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ AI Analysis (optional)               │
│ resultParser.analyzeResults()        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Report & Output                      │
│ Console, JSON, Notion                │
└─────────────────────────────────────┘
```

## Technology Stack

### Core Runtime
- **Node.js 18+**: Runtime environment
- **TypeScript**: Type-safe development
- **Axios**: HTTP client for requests

### AI Integration
- **Anthropic Claude API**: Test generation and analysis
- **@anthropic-ai/sdk**: Official SDK

### Testing & Quality
- **Jest**: Unit and integration tests
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Utilities
- **chalk**: Colored console output
- **table**: Formatted table output
- **dotenv**: Environment configuration

## Scalability Considerations

### Current Limitations
- Single-threaded Node.js (CPU-bound limits)
- In-memory metric storage (not suitable for millions of requests)
- Sequential batch processing

### Future Improvements
- Worker threads for parallel processing
- Metrics database (SQLite, PostgreSQL)
- Distributed test execution
- Real-time dashboard
- Metrics visualization (Grafana integration)

## Extension Points

### Adding a New Engine

```typescript
// 1. Create new engine
export class WebSocketEngine implements BaseEngine {
  async executeTest(config: TestConfig): Promise<TestResult> {
    // Implementation
  }
}

// 2. Register in main index
export { webSocketEngine }
```

### Adding Custom Prompt

```typescript
// 1. Create prompt template
const customPrompt = (config) => `...`

// 2. Use in generator
const result = await testGenerator.generateTestRequest({
  ...config,
  customPrompt: customPrompt
})
```

## Performance Characteristics

### Test Execution
- **Throughput**: Limited by target API and network
- **Concurrency**: Configurable (default 10)
- **Memory**: O(n) where n = total requests in iteration

### Analysis
- **Metric Calculation**: O(n log n) for percentile calculations
- **AI Analysis**: Depends on Claude API (typically 2-5 seconds)

## Error Handling

### Graceful Degradation
- Individual request failures don't stop entire test
- Error metrics are tracked separately
- AI analysis works with partial data

### Recovery Mechanisms
- Automatic retry logic (optional)
- Connection timeout handling
- Graceful shutdown on critical errors
