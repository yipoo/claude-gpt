# Contributing to Claude GPT

Thank you for your interest in contributing to Claude GPT! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/claude-gpt.git
   cd claude-gpt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   Copy the example environment files and configure them:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Setup database**
   ```bash
   pnpm run db:setup
   ```

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

## 📋 Development Workflow

### Branching Strategy

We use **Git Flow** branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Emergency fixes for production
- `release/*` - Release preparation branches

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Code Style**: Follow the existing code style and conventions
2. **TypeScript**: Use TypeScript for all new code
3. **Testing**: Add tests for new functionality
4. **Documentation**: Update documentation as needed

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add OAuth2 authentication"
git commit -m "fix(chat): resolve message ordering issue"
git commit -m "docs: update API documentation"
```

### Submitting Changes

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Target: `develop` branch
   - Fill out the PR template
   - Link related issues
   - Add reviewers

3. **Code Review**
   - Address feedback from reviewers
   - Ensure all CI checks pass
   - Keep PR updated with develop branch

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm run test

# Frontend tests only
pnpm run test:frontend

# Backend tests only  
pnpm run test:backend

# With coverage
pnpm run test:coverage
```

### Writing Tests

#### Frontend Tests
Use Jest with React Native Testing Library:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello World')).toBeTruthy();
  });
});
```

#### Backend Tests
Use Jest with Supertest for API testing:

```typescript
import request from 'supertest';
import { app } from '../app';

describe('POST /api/auth/login', () => {
  it('should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

## 📝 Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use strict mode configuration
- Avoid `any` type when possible

### React Native Guidelines

- Use functional components with hooks
- Follow component composition patterns
- Use StyleSheet for styling
- Implement proper error boundaries

### Backend Guidelines

- Use Express.js best practices
- Implement proper error handling
- Use Prisma for database operations
- Follow RESTful API conventions

### Styling Guidelines

- Use consistent naming conventions
- Follow iOS design patterns for mobile
- Implement responsive design
- Use design tokens for consistency

## 🔧 Tools and Configuration

### Code Quality Tools

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for quality gates

### Pre-commit Hooks

The following checks run before each commit:
- ESLint linting
- Prettier formatting
- TypeScript compilation
- Test execution

### IDE Setup

**VS Code Extensions (Recommended):**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- React Native Tools
- Prisma

**Settings:**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Node.js version
   - React Native version
   - Device information (for mobile bugs)

2. **Steps to Reproduce**
   - Detailed steps to reproduce the issue
   - Expected behavior
   - Actual behavior

3. **Additional Context**
   - Screenshots or videos if applicable
   - Error messages and stack traces
   - Relevant configuration

## 💡 Feature Requests

For feature requests, please:

1. **Check Existing Issues**: Search for existing feature requests
2. **Provide Context**: Explain the use case and problem
3. **Propose Solution**: Suggest how the feature might work
4. **Consider Alternatives**: Mention alternative solutions

## 📖 Documentation

### API Documentation

- Use OpenAPI/Swagger for REST API documentation
- Include request/response examples
- Document error codes and messages

### Code Documentation

- Use JSDoc for function documentation
- Include usage examples
- Document complex algorithms

### README Updates

When adding new features:
- Update installation instructions if needed
- Add new environment variables
- Update feature list
- Include usage examples

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Report inappropriate behavior

### Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and ideas
- Be clear and concise in communication
- Provide context for technical discussions

## 🏆 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes for significant contributions
- Special recognition for long-term contributors

## 📞 Getting Help

If you need help:

1. Check the [documentation](./docs/)
2. Search existing GitHub Issues
3. Create a new issue with the "question" label
4. Join our community discussions

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Claude GPT! 🙏