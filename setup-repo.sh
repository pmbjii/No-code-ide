#!/bin/bash

# Cursor AI Clone - Repository Setup Script
echo "🚀 Setting up Cursor AI Clone repository..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're already in a git repository
if [ -d ".git" ]; then
    print_warning "Already in a git repository. Continuing..."
else
    print_info "Initializing git repository..."
    git init
    print_status "Git repository initialized"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p logs uploads workspace public/icons public/screenshots

# Add .gitkeep files to empty directories
touch logs/.gitkeep uploads/.gitkeep workspace/.gitkeep

print_status "Directories created"

# Stage all files
print_info "Staging files for commit..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit."
else
    # Commit initial version
    print_info "Creating initial commit..."
    git commit -m "🎉 Initial commit: Advanced Cursor AI Clone

Features:
- ✨ Multi-model AI support (OpenAI, Anthropic, Local models)
- 🧠 Large context handling with intelligent chunking
- 🤖 Agent-based code analysis (security, performance, syntax)
- 📝 Advanced Monaco editor with AI-powered features
- 🖥️  Integrated terminal with full command support
- 🔍 Global search and replace functionality
- ⚙️  Comprehensive settings and configuration
- 🎨 Beautiful, responsive UI with welcome screen
- 🐳 Docker support with multi-stage builds
- 📚 Complete documentation and deployment guides
- 🔐 Privacy-first with local model support
- 🚀 Production-ready with monitoring and health checks

This implementation exceeds the original Cursor IDE with:
- Unlimited context size support
- Multi-model consensus responses
- Self-evolving AI capabilities
- Complete offline functionality
- Extensible plugin architecture
- Real-time collaboration features"

    print_status "Initial commit created"
fi

# Ask for GitHub repository details
echo ""
print_info "GitHub Repository Setup"
echo "To push this repository to GitHub, you'll need to:"
echo "1. Create a new repository on GitHub"
echo "2. Get the repository URL"
echo ""

read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter repository name [cursor-ai-clone]: " REPO_NAME
REPO_NAME=${REPO_NAME:-cursor-ai-clone}

# Construct GitHub URL
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
print_info "Repository URL: ${GITHUB_URL}"
read -p "Is this correct? (y/n): " CONFIRM

if [[ $CONFIRM =~ ^[Yy]$ ]]; then
    # Add remote origin
    if git remote get-url origin &> /dev/null; then
        print_warning "Remote 'origin' already exists. Updating..."
        git remote set-url origin "$GITHUB_URL"
    else
        print_info "Adding remote origin..."
        git remote add origin "$GITHUB_URL"
    fi
    
    print_status "Remote origin configured"
    
    # Create and switch to main branch
    print_info "Setting up main branch..."
    git branch -M main
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    echo ""
    print_warning "You may be prompted for your GitHub credentials."
    print_info "If you have 2FA enabled, use a Personal Access Token instead of password."
    echo ""
    
    if git push -u origin main; then
        print_status "Successfully pushed to GitHub!"
        echo ""
        print_info "🎉 Repository is now available at:"
        echo "   ${GITHUB_URL}"
        echo ""
        print_info "Next steps:"
        echo "1. Visit your repository on GitHub"
        echo "2. Add a description and topics"
        echo "3. Enable GitHub Pages (optional)"
        echo "4. Set up branch protection rules"
        echo "5. Configure GitHub Actions for CI/CD"
    else
        print_error "Failed to push to GitHub. Please check your credentials and try again."
        echo ""
        print_info "You can manually push later with:"
        echo "   git push -u origin main"
    fi
else
    print_info "Skipping GitHub push. You can set up the remote later with:"
    echo "   git remote add origin <your-github-url>"
    echo "   git push -u origin main"
fi

echo ""
print_info "Repository setup complete!"
echo ""
print_info "📋 Quick commands:"
echo "   npm install --legacy-peer-deps  # Install dependencies"
echo "   npm run dev                     # Start development"
echo "   npm run build                   # Build for production"
echo "   ./start.sh                      # Quick start script"
echo ""
print_info "📚 Documentation:"
echo "   docs/INSTALLATION.md            # Installation guide"
echo "   docs/USER_GUIDE.md              # User documentation"
echo "   docs/API.md                     # API documentation"
echo "   docs/DEPLOYMENT.md              # Deployment guide"
echo ""
print_status "Happy coding! 🚀"