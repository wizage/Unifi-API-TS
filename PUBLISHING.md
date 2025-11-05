# Publishing Guide

This document outlines the process for publishing the UniFi API TypeScript package to npm.

## Prerequisites

1. **npm Account**: Ensure you have an npm account with publishing permissions
2. **Authentication**: Login to npm using `npm login`
3. **Repository Access**: Ensure you have push access to the GitHub repository

## Pre-Publishing Checklist

Before publishing, ensure all of the following are completed:

### 1. Code Quality
- [ ] All tests pass: `npm run test:ci`
- [ ] Linting passes: `npm run lint:ci`
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Build succeeds: `npm run build`

### 2. Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md includes all changes
- [ ] API documentation is generated: `npm run docs`
- [ ] Examples are working and up to date

### 3. Version Management
- [ ] Version number follows semantic versioning
- [ ] CHANGELOG.md reflects the new version
- [ ] All breaking changes are documented

### 4. Package Validation
- [ ] Package structure is correct: `npm run pack:test`
- [ ] All necessary files are included
- [ ] No unnecessary files are included
- [ ] Package size is reasonable (< 100KB compressed)

## Publishing Process

### Automated Publishing (Recommended)

The repository includes GitHub Actions workflows for automated publishing:

1. **Create a Release Tag**:
   ```bash
   # For patch releases (bug fixes)
   npm run release:patch
   
   # For minor releases (new features)
   npm run release:minor
   
   # For major releases (breaking changes)
   npm run release:major
   ```

2. **GitHub Actions will automatically**:
   - Run all validation checks
   - Build the package
   - Publish to npm
   - Create a GitHub release

### Manual Publishing

If you need to publish manually:

1. **Validate the Package**:
   ```bash
   npm run validate
   ```

2. **Build the Package**:
   ```bash
   npm run build
   ```

3. **Test the Package**:
   ```bash
   npm run pack:test
   ```

4. **Publish to npm**:
   ```bash
   npm publish
   ```

## Version Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Version Examples

- `1.0.0` → `1.0.1`: Bug fix
- `1.0.0` → `1.1.0`: New feature
- `1.0.0` → `2.0.0`: Breaking change

## Release Notes

When creating releases, include:

1. **Summary**: Brief description of changes
2. **New Features**: List of new functionality
3. **Bug Fixes**: List of resolved issues
4. **Breaking Changes**: Any incompatible changes
5. **Migration Guide**: How to upgrade from previous versions

## Post-Publishing

After publishing:

1. **Verify Publication**: Check that the package appears on [npmjs.com](https://www.npmjs.com/package/unifi-api-typescript)
2. **Test Installation**: Test installing the package in a fresh project
3. **Update Documentation**: Ensure all documentation reflects the new version
4. **Announce**: Announce the release in relevant channels

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure you're logged in with `npm whoami`
2. **Permission Errors**: Verify you have publishing rights to the package
3. **Version Conflicts**: Ensure the version number hasn't been used before
4. **Build Failures**: Check that all dependencies are installed and up to date

### Emergency Procedures

If you need to unpublish a version (within 24 hours):

```bash
npm unpublish unifi-api-typescript@<version>
```

**Note**: Unpublishing should only be used in emergencies as it can break dependent projects.

## Security

- Never commit npm tokens to the repository
- Use GitHub Secrets for automated publishing
- Regularly audit dependencies for vulnerabilities
- Follow npm security best practices

## Support

For publishing issues:
1. Check the GitHub Actions logs
2. Review npm documentation
3. Contact the maintainers
4. Open an issue in the repository