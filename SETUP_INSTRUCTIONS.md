# Setup Instructions

This project has been created with minimal external dependencies to work in restricted environments. Follow these steps to get started.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- (Optional) Anthropic API key for AI-powered features

## Installation

### Step 1: Install TypeScript and ts-node

```bash
npm install --save-dev typescript ts-node
```

### Step 2: (Optional) Install Additional Dependencies

If you have internet access to npm registry, install the optional dependencies:

```bash
npm install --save-dev @types/node prettier
```

These are optional but recommended for better development experience.

## Configuration

### Step 1: Create .env file

```bash
cp .env.example .env
```

### Step 2: Add Your API Keys

Edit `.env` and add:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
TARGET_API_URL=https://jsonplaceholder.typicode.com
```

To get an Anthropic API key:
1. Go to https://console.anthropic.com
2. Create an account or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy it to your `.env` file

**Note**: If you don't have an API key, the framework will still work with default analysis (no AI-powered insights).

## Running Examples

### Example 1: Simple GET Request

```bash
npx ts-node tests/examples/01-simple-get.perf.ts
```

This runs a basic performance test against JSONPlaceholder API.

### Example 2: Load Testing

```bash
npx ts-node tests/examples/02-load-test.perf.ts
```

This demonstrates load testing multiple endpoints with AI analysis.

### Example 3: AI-Generated Tests

```bash
npx ts-node tests/examples/03-ai-generated-test.perf.ts
```

This shows how Claude generates test configurations automatically.

**Note**: Requires ANTHROPIC_API_KEY to be set.

## Building for Production

```bash
npx tsc
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Troubleshooting

### "Module not found" errors

Make sure you've installed TypeScript and ts-node:

```bash
npm install --save-dev typescript ts-node
```

### "ANTHROPIC_API_KEY is not set"

Either:
1. Set it in your `.env` file, or
2. Set it as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_key_here
npx ts-node tests/examples/03-ai-generated-test.perf.ts
```

### Network/Timeout Issues

If tests are timing out:
1. Ensure you have internet connectivity
2. Check TARGET_API_URL is reachable
3. Increase timeouts in `DEFAULT_TIMEOUT_MS` in `.env`

## Next Steps

1. **Run the examples** to understand how the framework works
2. **Create your first test** - see `tests/examples/01-simple-get.perf.ts` as a template
3. **Read the documentation** in `docs/` folder
4. **Join the journey** - this framework is designed for your IDP goals!

## Project Structure

```
src/                    # Source code
├── config/            # Configuration
├── engines/           # Test execution engines
├── generators/        # AI-powered test generation
├── parsers/           # Result analysis
└── utils/             # Utilities

tests/
├── examples/          # Example tests
├── unit/              # Unit tests
└── integration/       # Integration tests

docs/                  # Documentation
```

## Tips for Development

### Watch Mode

```bash
# Install nodemon (optional)
npm install --save-dev nodemon

# Run with watch
npx nodemon --exec "ts-node" tests/examples/01-simple-get.perf.ts
```

### Environment-Specific Configuration

Create multiple `.env` files:

```bash
.env.local     # Local development
.env.staging   # Staging environment
.env.prod      # Production environment
```

Then load them:

```bash
NODE_ENV=staging node tests/examples/01-simple-get.perf.ts
```

## Performance Tips

- Adjust `DEFAULT_CONCURRENCY` in `.env` to match your system capabilities
- Start with small iterations (10-50) before scaling up
- Monitor CPU usage during tests with concurrent requests
- Use `warmupIterations` to stabilize metrics

## Support & Resources

- Claude API Docs: https://docs.anthropic.com
- Node.js HTTP Docs: https://nodejs.org/api/http.html
- TypeScript Docs: https://www.typescriptlang.org/docs

---

**Last Updated**: April 2026
**Framework Version**: 0.1.0
