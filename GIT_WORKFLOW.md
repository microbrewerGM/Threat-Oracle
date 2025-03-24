# Git Workflow for Threat Oracle

This document outlines the git workflow and best practices for the Threat Oracle project.

## Branch Strategy

We follow a simplified version of the [GitHub Flow](https://guides.github.com/introduction/flow/) branching strategy:

1. The `main` branch is always deployable and contains the latest stable code
2. All development work happens in feature branches
3. Feature branches are merged into `main` via Pull Requests (PRs)
4. PRs require code review and passing CI checks before merging

## Branch Naming Convention

Feature branches should follow this naming convention:

```bash
feature/short-description-of-feature
```

For bug fixes:

```bash
fix/short-description-of-bug
```

For documentation updates:

```bash
docs/short-description-of-changes
```

For refactoring work:

```bash
refactor/short-description-of-changes
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```bash
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

Example:

```bash
feat(schema): add technical asset node type

Add the technical asset node type to the schema with basic properties.
```

## Feature Development Workflow

1. **Create a Feature Branch**

   ```bash
   git checkout main
   git pull
   git checkout -b feature/your-feature-name
   ```

2. **Develop the Feature**

   Make small, focused commits as you develop the feature. Each commit should represent a logical unit of work.

3. **Run Local Tests**

   Before proceeding, make sure all tests pass locally:

   ```bash
   # Run backend tests
   cd src/backend
   pytest

   # Run frontend tests
   cd src/frontend
   npm test
   ```

4. **Demonstrate the Feature to the User**

   **MANDATORY**: Before pushing any code or creating a PR, demonstrate the feature to the user and get their approval.

   - Show the working feature
   - Explain how it was implemented
   - Run through test cases
   - Address any feedback or concerns

5. **Push the Feature Branch (Only After User Approval)**

   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Create a Pull Request**

   Create a PR on GitHub with the following information:

   - Clear title describing the change
   - Description of what the PR does
   - Any relevant issue numbers
   - Steps to test the changes

7. **Code Review**

   - At least one team member must review and approve the PR
   - Address any feedback from the review
   - Make sure all CI checks pass

8. **Merge the PR**

   Once the PR is approved and all checks pass, merge the PR using the "Squash and merge" option to keep the history clean.

9. **Delete the Feature Branch**

   After the PR is merged, delete the feature branch:

   ```bash
   git checkout main
   git pull
   git branch -d feature/your-feature-name
   ```

## Pre-commit and Pre-push Hooks

We use pre-commit and pre-push hooks to ensure code quality, consistency, and adherence to our development workflow. These hooks run automatically when you commit or push changes.

To install the hooks:

```bash
pip install pre-commit
pre-commit install
pre-commit install --hook-type pre-push
```

The pre-commit hooks will:

- Check for trailing whitespace
- Fix end-of-file issues
- Check YAML and JSON syntax
- Run linters (black, ruff, eslint)
- Run type checking (mypy)
- Update the changelog

The pre-push hooks will:

- Run all tests to ensure they pass
- Check for user approval in the INTERACTION_LOG.md file
- Prevent pushing if any checks fail

## Continuous Integration

All PRs trigger CI checks that:

1. Run all tests
2. Check code formatting
3. Run linters
4. Perform type checking
5. Check for security vulnerabilities
6. Verify user approval in the INTERACTION_LOG.md file

PRs cannot be merged until all CI checks pass. This ensures that all features have been demonstrated to and approved by the user before they are merged into the main branch.

## Release Process

1. Update the version number in relevant files
2. Create a release PR with the version bump
3. Once merged, tag the release:

   ```bash
   git checkout main
   git pull
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. Create a GitHub release with release notes

## Hotfix Process

For critical bugs in production:

1. Create a hotfix branch from `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-bug-fix
   ```

2. Fix the bug and push the branch
3. Create a PR and follow the normal review process
4. After merging, create a new patch release

## Best Practices

1. **Keep branches short-lived**
   - Feature branches should not live for more than a few days
   - Break large features into smaller, incremental PRs

2. **Write descriptive commit messages**
   - Follow the conventional commits format
   - Explain why the change was made, not just what was changed

3. **Keep PRs focused**
   - Each PR should address a single concern
   - Avoid mixing unrelated changes in a single PR

4. **Test thoroughly**
   - Write tests for all new features and bug fixes
   - Ensure all tests pass before submitting a PR

5. **Review code carefully**
   - Check for security issues
   - Verify that the code meets the project's standards
   - Ensure the code is well-documented

6. **Update documentation**
   - Keep documentation in sync with code changes
   - Update the changelog for all user-facing changes
