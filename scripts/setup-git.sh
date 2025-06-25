#!/bin/bash

# Claude GPT - Git Setup Script
# This script initializes the git repository and sets up GitHub remote

set -e

echo "🚀 Setting up Git repository for Claude GPT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if we're already in a git repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}Warning: This directory is already a git repository.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    # Initialize git repository
    echo -e "${BLUE}Initializing git repository...${NC}"
    git init
fi

# Configure git user (if not already set globally)
if [ -z "$(git config --global user.name)" ]; then
    echo -e "${BLUE}Setting up git user configuration...${NC}"
    read -p "Enter your name: " GIT_NAME
    read -p "Enter your email: " GIT_EMAIL
    git config user.name "$GIT_NAME"
    git config user.email "$GIT_EMAIL"
    echo -e "${GREEN}Git user configured locally for this repository.${NC}"
fi

# Set up .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${BLUE}Creating .gitignore file...${NC}"
    # The .gitignore file should already be created by the setup script
fi

# Add all files to staging
echo -e "${BLUE}Adding files to git...${NC}"
git add .

# Create initial commit
if [ -z "$(git log --oneline 2>/dev/null)" ]; then
    echo -e "${BLUE}Creating initial commit...${NC}"
    git commit -m "🎉 Initial commit: Claude GPT monorepo setup

Features implemented:
- ✅ React Native frontend with Expo
- ✅ Node.js backend with Express + TypeScript
- ✅ Complete authentication system
- ✅ AI chat functionality with OpenAI integration
- ✅ Subscription management with Stripe
- ✅ Internationalization (English/Chinese)
- ✅ Data export and search functionality
- ✅ Cloud synchronization
- ✅ Performance optimizations
- ✅ Monorepo configuration with pnpm

Architecture:
- Frontend: React Native + Expo + TypeScript + Zustand
- Backend: Node.js + Express + Prisma + PostgreSQL
- DevOps: pnpm workspaces + ESLint + Prettier + Husky"
fi

# Set up GitHub remote
echo -e "${BLUE}Setting up GitHub remote...${NC}"
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name (default: claude-gpt): " REPO_NAME
REPO_NAME=${REPO_NAME:-claude-gpt}

# Add GitHub remote
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo -e "${BLUE}Adding GitHub remote: ${GITHUB_URL}${NC}"

if git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}Remote 'origin' already exists. Updating...${NC}"
    git remote set-url origin "$GITHUB_URL"
else
    git remote add origin "$GITHUB_URL"
fi

# Set up main branch
echo -e "${BLUE}Setting up main branch...${NC}"
git branch -M main

# Create and setup development branch
echo -e "${BLUE}Creating development branch...${NC}"
git checkout -b develop
git checkout main

echo -e "${GREEN}✅ Git repository setup complete!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "   - Repository name: ${REPO_NAME}"
echo "   - Description: AI Chat Application with React Native and Node.js"
echo "   - Make it private initially (you can make it public later)"
echo "   - Don't initialize with README, .gitignore, or license (we already have them)"
echo
echo "2. Push to GitHub:"
echo "   git push -u origin main"
echo "   git push -u origin develop"
echo
echo "3. Set up branch protection rules on GitHub:"
echo "   - Protect 'main' branch"
echo "   - Require pull request reviews"
echo "   - Require status checks"
echo
echo -e "${GREEN}Repository URL: ${GITHUB_URL}${NC}"

# Ask if user wants to push now
echo
read -p "Do you want to push to GitHub now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    
    # Check if remote repository exists
    if git ls-remote --heads origin &> /dev/null; then
        git push -u origin main
        git push -u origin develop
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    else
        echo -e "${RED}Error: Remote repository doesn't exist or you don't have access.${NC}"
        echo "Please create the repository on GitHub first, then run:"
        echo "git push -u origin main"
        echo "git push -u origin develop"
    fi
fi

echo
echo -e "${GREEN}🎉 Setup complete! Happy coding!${NC}"