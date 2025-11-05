module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Core code quality rules
    'no-var': 'error',
    'prefer-const': 'error',
    'no-console': 'off', // Allow console for debugging in library
    'no-debugger': 'error',
    
    // TypeScript rules - more lenient for build system
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'ignoreRestSiblings': true
    }],
  },
  overrides: [
    {
      // More lenient rules for generated files
      files: ['src/generated/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      }
    },
    {
      // Test files can be more lenient
      files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      }
    }
  ],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
};