const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload middleware
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory storage for demo (in production, use a database)
let projectState = {
  files: {},
  openFiles: [],
  settings: {},
  chatHistory: [],
  terminalSessions: new Map()
};

// AI Service Integration
class ServerAIService {
  constructor() {
    this.models = new Map();
    this.localModels = new LocalModelManager();
    this.initializeModels();
  }

  initializeModels() {
    // Initialize available models
    this.models.set('openai-gpt4', {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4',
      contextWindow: 8192
    });

    this.models.set('claude-3-opus', {
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-opus-20240229',
      contextWindow: 200000
    });

    // Local models
    this.models.set('local-mistral', {
      provider: 'local',
      model: 'mistral-7b',
      contextWindow: 8192,
      offline: true
    });
  }

  async generateResponse(prompt, options = {}) {
    const { modelId, context, multiModel = false } = options;
    
    try {
      if (multiModel) {
        return await this.multiModelGeneration(prompt, context, options);
      } else {
        return await this.singleModelGeneration(modelId || 'local-mistral', prompt, context, options);
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        response: `I apologize, but I encountered an error: ${error.message}. I'm running in demo mode with simulated responses.`,
        model: modelId || 'demo',
        confidence: 0.5,
        error: true
      };
    }
  }

  async singleModelGeneration(modelId, prompt, context, options) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.provider === 'local') {
      return await this.localModels.generate(model, prompt, context);
    }

    // For demo purposes, return simulated responses
    // In production, this would call actual AI APIs
    return this.simulateAIResponse(prompt, context, model);
  }

  async multiModelGeneration(prompt, context, options) {
    const models = ['local-mistral', 'openai-gpt4'];
    const promises = models.map(modelId => 
      this.singleModelGeneration(modelId, prompt, context, options)
        .catch(error => ({ error: error.message, model: modelId }))
    );

    const results = await Promise.all(promises);
    const successfulResults = results.filter(r => !r.error);

    if (successfulResults.length === 0) {
      throw new Error('All models failed');
    }

    return {
      response: successfulResults[0].response,
      model: successfulResults[0].model,
      confidence: successfulResults[0].confidence,
      alternatives: successfulResults.slice(1),
      consensus: this.calculateConsensus(successfulResults)
    };
  }

  simulateAIResponse(prompt, context, model) {
    // Simulate AI response based on prompt content
    let response = '';
    
    if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('review')) {
      response = `I've analyzed the code and found the following observations:

1. **Code Structure**: The code follows good practices with proper component organization.
2. **Performance**: Consider memoizing expensive calculations and using React.memo for components.
3. **Error Handling**: Add more comprehensive error boundaries and input validation.
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation support.
5. **Security**: Input sanitization looks good, but consider adding CSP headers.

Overall, the code quality is good with room for minor improvements in performance optimization.`;
    } else if (prompt.toLowerCase().includes('improve') || prompt.toLowerCase().includes('fix')) {
      response = `Here are the suggested improvements for your code:

\`\`\`javascript
// Improved version with better error handling and performance
import React, { useState, useCallback, useMemo } from 'react';

const ImprovedComponent = ({ data }) => {
  const [state, setState] = useState(initialState);
  
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data?.map(item => processItem(item)) || [];
  }, [data]);
  
  // Use useCallback for event handlers
  const handleClick = useCallback((id) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);
  
  // Add error boundary
  if (!data) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
\`\`\`

Key improvements:
- Added memoization for performance
- Better error handling
- Proper dependency arrays
- Loading states`;
    } else if (prompt.toLowerCase().includes('explain')) {
      response = `This code implements a React component with the following functionality:

**Main Purpose**: Creates an interactive user interface component that manages state and handles user interactions.

**Key Features**:
- State management using React hooks
- Event handling for user interactions  
- Conditional rendering based on data availability
- Component lifecycle management

**How it works**:
1. Initializes component state with default values
2. Renders UI elements based on current state
3. Handles user events and updates state accordingly
4. Re-renders when state changes occur

**Best Practices Used**:
- Functional components with hooks
- Proper key props for list items
- Clean separation of concerns
- Descriptive variable names`;
    } else {
      response = `I understand you're asking about: "${prompt}"

As an AI coding assistant, I can help you with:
- Code analysis and review
- Bug fixing and optimization
- Explaining complex code concepts
- Architecture recommendations
- Best practices guidance
- Performance improvements

${context ? '\n\nBased on the current file context, I can see you\'re working with ' + this.detectLanguage(context) + ' code.' : ''}

How can I assist you with your development needs?`;
    }

    return {
      response,
      model: model.model,
      confidence: 0.8,
      tokens: response.length / 4, // Rough token estimate
      timestamp: new Date().toISOString()
    };
  }

  detectLanguage(context) {
    if (context.includes('import React')) return 'React/JavaScript';
    if (context.includes('def ') || context.includes('import ')) return 'Python';
    if (context.includes('public class')) return 'Java';
    if (context.includes('#include')) return 'C/C++';
    return 'code';
  }

  calculateConsensus(responses) {
    // Simple consensus calculation
    return responses.length > 1 ? 0.7 : 1.0;
  }
}

// Local Model Manager for offline AI capabilities
class LocalModelManager {
  constructor() {
    this.loadedModels = new Map();
    this.modelProcesses = new Map();
  }

  async generate(model, prompt, context) {
    // In a real implementation, this would:
    // 1. Load local models using ONNX, TensorFlow.js, or call local APIs (Ollama)
    // 2. Process the prompt with the model
    // 3. Return the generated response
    
    // For demo, return simulated local model response
    return {
      response: `[Local ${model.model}] ${this.generateLocalResponse(prompt, context)}`,
      model: model.model,
      confidence: 0.7,
      tokens: 150,
      offline: true,
      timestamp: new Date().toISOString()
    };
  }

  generateLocalResponse(prompt, context) {
    // Simulate local model response
    const responses = [
      "I'm running locally on your machine. Here's my analysis of your code...",
      "As a local AI model, I can help you with code review and suggestions...",
      "Local processing complete. Your code shows good structure and practices...",
      "Running offline analysis... The code quality looks good with minor improvements needed..."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async loadModel(modelId) {
    // Simulate model loading
    console.log(`Loading local model: ${modelId}`);
    return true;
  }

  unloadModel(modelId) {
    this.loadedModels.delete(modelId);
    const process = this.modelProcesses.get(modelId);
    if (process) {
      process.kill();
      this.modelProcesses.delete(modelId);
    }
  }
}

// Initialize AI service
const aiService = new ServerAIService();

// File System Operations
const getProjectPath = () => {
  return process.env.PROJECT_PATH || process.cwd();
};

const readDirectoryRecursive = async (dirPath, basePath = '') => {
  const files = {};
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      if (item.startsWith('.')) continue; // Skip hidden files
      
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        files[item] = {
          type: 'folder',
          name: item,
          path: relativePath,
          children: await readDirectoryRecursive(fullPath, relativePath)
        };
      } else {
        files[item] = {
          type: 'file',
          name: item,
          path: relativePath,
          size: stat.size,
          modified: stat.mtime,
          language: getLanguageFromExtension(path.extname(item))
        };
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return files;
};

const getLanguageFromExtension = (ext) => {
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'shell'
  };
  
  return languageMap[ext.toLowerCase()] || 'plaintext';
};

// Terminal Management
const createTerminalSession = (sessionId) => {
  const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
  const terminal = spawn(shell, [], {
    cwd: getProjectPath(),
    env: process.env
  });

  projectState.terminalSessions.set(sessionId, terminal);

  terminal.stdout.on('data', (data) => {
    io.emit('terminal-output', {
      sessionId,
      type: 'stdout',
      data: data.toString()
    });
  });

  terminal.stderr.on('data', (data) => {
    io.emit('terminal-output', {
      sessionId,
      type: 'stderr',
      data: data.toString()
    });
  });

  terminal.on('close', (code) => {
    io.emit('terminal-output', {
      sessionId,
      type: 'close',
      code
    });
    projectState.terminalSessions.delete(sessionId);
  });

  return terminal;
};

// API Routes

// File System Routes
app.get('/api/files', async (req, res) => {
  try {
    const projectPath = getProjectPath();
    const files = await readDirectoryRecursive(projectPath);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/*', async (req, res) => {
  try {
    const filePath = path.join(getProjectPath(), req.params[0]);
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/*', async (req, res) => {
  try {
    const filePath = path.join(getProjectPath(), req.params[0]);
    const { content } = req.body;
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/*', async (req, res) => {
  try {
    const filePath = path.join(getProjectPath(), req.params[0]);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Routes
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, context, options = {} } = req.body;
    const response = await aiService.generateResponse(prompt, { 
      context, 
      ...options 
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { code, language, options = {} } = req.body;
    const analysisPrompt = `Analyze this ${language} code for issues, improvements, and best practices:\n\n${code}`;
    
    const response = await aiService.generateResponse(analysisPrompt, {
      context: code,
      ...options
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai/models', (req, res) => {
  const models = Array.from(aiService.models.entries()).map(([id, model]) => ({
    id,
    ...model,
    status: 'available'
  }));
  res.json({ models });
});

// Terminal Routes
app.post('/api/terminal/create', (req, res) => {
  const sessionId = Date.now().toString();
  createTerminalSession(sessionId);
  res.json({ sessionId });
});

app.post('/api/terminal/:sessionId/command', (req, res) => {
  const { sessionId } = req.params;
  const { command } = req.body;
  
  const terminal = projectState.terminalSessions.get(sessionId);
  if (terminal) {
    terminal.stdin.write(command + '\n');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Terminal session not found' });
  }
});

// Search Routes
app.post('/api/search', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    const { caseSensitive = false, wholeWord = false, regex = false } = options;
    
    // Simple file search implementation
    const results = await searchInFiles(query, {
      caseSensitive,
      wholeWord,
      regex,
      path: getProjectPath()
    });
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const searchInFiles = async (query, options) => {
  // Implementation would recursively search through files
  // For demo, return mock results
  return [
    {
      file: 'src/App.jsx',
      matches: [
        { line: 15, text: 'import React from "react";', match: 'React' },
        { line: 23, text: 'const App = () => {', match: 'App' }
      ]
    }
  ];
};

// Settings Routes
app.get('/api/settings', (req, res) => {
  res.json(projectState.settings);
});

app.post('/api/settings', (req, res) => {
  projectState.settings = { ...projectState.settings, ...req.body };
  res.json({ success: true });
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
  });

  socket.on('file-change', (data) => {
    socket.broadcast.emit('file-changed', data);
  });

  socket.on('cursor-position', (data) => {
    socket.broadcast.emit('cursor-moved', data);
  });

  socket.on('terminal-command', (data) => {
    const { sessionId, command } = data;
    const terminal = projectState.terminalSessions.get(sessionId);
    if (terminal) {
      terminal.stdin.write(command + '\n');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// File watcher for live updates
const setupFileWatcher = () => {
  const projectPath = getProjectPath();
  const watcher = chokidar.watch(projectPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  watcher
    .on('add', (filePath) => {
      io.emit('file-added', { path: path.relative(projectPath, filePath) });
    })
    .on('change', (filePath) => {
      io.emit('file-changed', { path: path.relative(projectPath, filePath) });
    })
    .on('unlink', (filePath) => {
      io.emit('file-deleted', { path: path.relative(projectPath, filePath) });
    });
};

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Cursor AI Clone Server running on port ${PORT}`);
  console.log(`📁 Project path: ${getProjectPath()}`);
  console.log(`🤖 AI Service initialized with ${aiService.models.size} models`);
  
  // Setup file watcher
  setupFileWatcher();
  
  // Initialize local models
  aiService.localModels.loadModel('local-mistral');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});