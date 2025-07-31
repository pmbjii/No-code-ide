# Installation Guide

This guide will help you install and set up the Cursor AI Clone on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (version 18.0.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **npm** (usually comes with Node.js)
  - Verify installation: `npm --version`

- **Git** (for cloning the repository)
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space
- **Internet**: Required for initial setup and cloud AI models

## Quick Installation

### Method 1: Using the Startup Script (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cursor-ai-clone.git
   cd cursor-ai-clone
   ```

2. **Run the startup script**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   The script will automatically:
   - Check for prerequisites
   - Install dependencies
   - Build the application
   - Start both frontend and backend servers

3. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The backend API runs on `http://localhost:5000`

### Method 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cursor-ai-clone.git
   cd cursor-ai-clone
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start the application**
   ```bash
   # Development mode (recommended for first-time setup)
   npm run dev

   # Or production mode
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# AI Configuration (Optional - can be set in UI)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Project Configuration
PROJECT_PATH=/path/to/your/workspace
```

### AI Models Setup

#### Cloud AI Models

1. **OpenAI Setup**
   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)
   - Add it to your `.env` file or configure in Settings (Ctrl+,)

2. **Anthropic Setup**
   - Get an API key from [Anthropic](https://console.anthropic.com/)
   - Add it to your `.env` file or configure in Settings

#### Local AI Models (Optional)

For complete privacy and offline functionality:

1. **Install Ollama**
   ```bash
   # Linux/macOS
   curl -fsSL https://ollama.ai/install.sh | sh

   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Pull AI models**
   ```bash
   ollama pull mistral
   ollama pull codellama
   ollama pull llama2
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   ```

## Docker Installation

### Using Docker Compose (Recommended)

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     cursor-ai-clone:
       build: .
       ports:
         - "3000:3000"
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - PORT=5000
       volumes:
         - ./workspace:/app/workspace
         - ./logs:/app/logs
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Using Docker directly

1. **Build the image**
   ```bash
   docker build -t cursor-ai-clone .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -p 5000:5000 \
     -v $(pwd)/workspace:/app/workspace \
     -v $(pwd)/logs:/app/logs \
     --name cursor-ai-clone \
     cursor-ai-clone
   ```

## Verification

After installation, verify everything is working:

1. **Check the application loads**
   - Navigate to `http://localhost:3000`
   - You should see the welcome screen

2. **Test AI functionality**
   - Open Settings (Ctrl+,)
   - Configure at least one AI provider
   - Open the chat panel and send a test message

3. **Test file operations**
   - Create a new file from the welcome screen examples
   - Verify the file explorer works
   - Test the terminal functionality

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000 or 5000
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### Permission Errors
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use npm prefix
npm config set prefix ~/.npm-global
```

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Monaco Editor Issues
```bash
# Clear browser cache
# Or try incognito mode
# Check browser console for errors
```

### Getting Help

If you encounter issues:

1. **Check the logs**
   ```bash
   # Frontend logs (browser console)
   # Backend logs
   npm run dev:backend
   ```

2. **Enable debug mode**
   ```bash
   DEBUG=cursor-ai:* npm run dev
   ```

3. **Common solutions**
   - Restart the application
   - Clear browser cache
   - Check firewall settings
   - Verify all prerequisites are installed

## Next Steps

After successful installation:

1. **Configure AI Models** - Set up your preferred AI providers
2. **Explore Features** - Try the welcome screen examples
3. **Read Documentation** - Check out the [User Guide](USER_GUIDE.md)
4. **Join Community** - Connect with other users on Discord

## Updating

To update to the latest version:

```bash
git pull origin main
npm install --legacy-peer-deps
npm run build
```

## Uninstalling

To completely remove the application:

```bash
# Stop the application
# Remove the directory
rm -rf cursor-ai-clone

# Clean npm cache (optional)
npm cache clean --force
```

---

**Need help?** Check our [Troubleshooting Guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/yourusername/cursor-ai-clone/issues).