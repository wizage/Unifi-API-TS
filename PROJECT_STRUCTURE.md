# Project Structure

This project converts the PHP UniFi API client to TypeScript with automated conversion capabilities.

## Directory Structure

```
├── src/                    # TypeScript source code
│   ├── client/            # Main UniFi client implementation
│   ├── types/             # TypeScript type definitions
│   ├── http/              # HTTP client utilities
│   ├── errors/            # Error classes
│   └── utils/             # Utility functions
├── converter/             # PHP to TypeScript conversion tools
│   ├── parser/            # PHP parsing logic
│   ├── generator/         # TypeScript code generation
│   └── cli/               # Command-line tools
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test data

├── dist/                  # Compiled output
│   ├── cjs/               # CommonJS build
│   ├── esm/               # ES6 module build
│   └── types/             # TypeScript declarations
└── docs/                  # Generated documentation
```

## Build System

The project supports dual module builds:
- **CommonJS**: For Node.js compatibility
- **ES6 Modules**: For modern JavaScript environments
- **TypeScript Declarations**: For development-time type checking

## Available Scripts

- `npm run build` - Build all module formats
- `npm run analyze` - Analyze the PHP source and show method information
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run docs` - Generate TypeDoc documentation

## PHP Source Analysis

The project includes a PHP parser that analyzes the original UniFi API client:
- **Found Methods**: 211 public methods to convert
- **Source Repository**: https://github.com/Art-of-WiFi/UniFi-API-client
- **Analysis Tool**: `npm run analyze`

## Next Steps

1. Implement TypeScript code generation from parsed PHP methods
2. Create HTTP client with session management
3. Generate type definitions for all API responses
4. Set up comprehensive testing
5. Create documentation and examples