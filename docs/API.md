# API Documentation

This document describes the REST API and WebSocket endpoints for the Cursor AI Clone backend.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://your-domain.com`

## Authentication

Currently, the API doesn't require authentication for local development. For production deployments, consider implementing:
- JWT tokens
- API keys
- OAuth integration

## REST API Endpoints

### File System Operations

#### Get File Tree
```http
GET /api/files
```

Returns the complete file tree structure.

**Response:**
```json
{
  "files": {
    "src": {
      "type": "folder",
      "name": "src",
      "children": {
        "App.jsx": {
          "type": "file",
          "name": "App.jsx",
          "path": "/src/App.jsx",
          "size": 1234,
          "modified": "2024-01-01T12:00:00Z",
          "language": "javascript"
        }
      }
    }
  }
}
```

#### Get File Content
```http
GET /api/files/*
```

Retrieves the content of a specific file.

**Parameters:**
- `*` (path) - File path relative to project root

**Response:**
```json
{
  "content": "file content here..."
}
```

**Example:**
```bash
curl http://localhost:5000/api/files/src/App.jsx
```

#### Save File Content
```http
POST /api/files/*
```

Saves content to a specific file.

**Parameters:**
- `*` (path) - File path relative to project root

**Request Body:**
```json
{
  "content": "updated file content..."
}
```

**Response:**
```json
{
  "success": true
}
```

#### Delete File
```http
DELETE /api/files/*
```

Deletes a specific file.

**Parameters:**
- `*` (path) - File path relative to project root

**Response:**
```json
{
  "success": true
}
```

### AI Operations

#### Chat with AI
```http
POST /api/ai/chat
```

Send a message to the AI and get a response.

**Request Body:**
```json
{
  "prompt": "Explain this React component",
  "context": "import React from 'react'...",
  "options": {
    "modelId": "openai-gpt4",
    "multiModel": false,
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

**Response:**
```json
{
  "response": "This React component...",
  "model": "openai-gpt4",
  "tokens": 150,
  "confidence": 0.8,
  "alternatives": [],
  "consensus": 1.0
}
```

#### Analyze Code
```http
POST /api/ai/analyze
```

Analyze code for issues and improvements.

**Request Body:**
```json
{
  "code": "function example() { ... }",
  "language": "javascript",
  "options": {
    "includePerformance": true,
    "includeSecurity": true,
    "includeStyle": true
  }
}
```

**Response:**
```json
{
  "response": "Analysis results...",
  "model": "claude-3-opus",
  "issues": [
    {
      "type": "performance",
      "severity": "medium",
      "line": 5,
      "message": "Consider memoizing this calculation"
    }
  ],
  "suggestions": [
    {
      "type": "improvement",
      "description": "Use const instead of let"
    }
  ]
}
```

#### Get Available Models
```http
GET /api/ai/models
```

Get list of available AI models.

**Response:**
```json
{
  "models": [
    {
      "id": "openai-gpt4",
      "provider": "openai",
      "model": "gpt-4",
      "contextWindow": 8192,
      "capabilities": ["chat", "code", "analysis"],
      "status": "available"
    }
  ]
}
```

### Terminal Operations

#### Create Terminal Session
```http
POST /api/terminal/create
```

Creates a new terminal session.

**Response:**
```json
{
  "sessionId": "1640995200000"
}
```

#### Execute Command
```http
POST /api/terminal/:sessionId/command
```

Execute a command in a specific terminal session.

**Parameters:**
- `sessionId` - Terminal session ID

**Request Body:**
```json
{
  "command": "ls -la"
}
```

**Response:**
```json
{
  "success": true
}
```

### Search Operations

#### Search in Files
```http
POST /api/search
```

Search for text across project files.

**Request Body:**
```json
{
  "query": "React",
  "options": {
    "caseSensitive": false,
    "wholeWord": false,
    "regex": false,
    "include": "*.js,*.jsx",
    "exclude": "node_modules"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "file": "src/App.jsx",
      "matches": [
        {
          "line": 1,
          "text": "import React from 'react';",
          "match": "React"
        }
      ]
    }
  ]
}
```

### Settings Operations

#### Get Settings
```http
GET /api/settings
```

Retrieve current application settings.

**Response:**
```json
{
  "aiConfig": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7
  },
  "editorConfig": {
    "fontSize": 14,
    "tabSize": 2,
    "wordWrap": true
  }
}
```

#### Update Settings
```http
POST /api/settings
```

Update application settings.

**Request Body:**
```json
{
  "aiConfig": {
    "provider": "anthropic",
    "apiKey": "new-api-key"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## WebSocket Events

The application uses WebSocket for real-time communication on `/socket.io`.

### Client → Server Events

#### Join Project
```javascript
socket.emit('join-project', 'project-id');
```

Join a specific project room for collaboration.

#### File Change
```javascript
socket.emit('file-change', {
  file: '/src/App.jsx',
  content: 'updated content',
  userId: 'user-123'
});
```

Notify other users of file changes.

#### Cursor Position
```javascript
socket.emit('cursor-position', {
  file: '/src/App.jsx',
  line: 10,
  column: 5,
  userId: 'user-123'
});
```

Share cursor position with other users.

#### Terminal Command
```javascript
socket.emit('terminal-command', {
  sessionId: '1640995200000',
  command: 'npm install'
});
```

Execute command in terminal session.

### Server → Client Events

#### File Changed
```javascript
socket.on('file-changed', (data) => {
  // data: { file: string, content: string, userId: string }
});
```

Receive file change notifications.

#### Cursor Moved
```javascript
socket.on('cursor-moved', (data) => {
  // data: { file: string, line: number, column: number, userId: string }
});
```

Receive cursor position updates.

#### Terminal Output
```javascript
socket.on('terminal-output', (data) => {
  // data: { sessionId: string, type: 'stdout'|'stderr'|'close', data: string }
});
```

Receive terminal command output.

#### File Added
```javascript
socket.on('file-added', (data) => {
  // data: { path: string }
});
```

Notification when new files are created.

#### File Deleted
```javascript
socket.on('file-deleted', (data) => {
  // data: { path: string }
});
```

Notification when files are deleted.

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `FILE_NOT_FOUND` - Requested file doesn't exist
- `PERMISSION_DENIED` - Insufficient permissions
- `AI_SERVICE_ERROR` - AI service unavailable
- `INVALID_REQUEST` - Malformed request
- `RATE_LIMIT_EXCEEDED` - Too many requests

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **File operations**: 100 requests per minute
- **AI operations**: 20 requests per minute
- **Search operations**: 30 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Get file content
const response = await axios.get('http://localhost:5000/api/files/src/App.jsx');
console.log(response.data.content);

// Chat with AI
const aiResponse = await axios.post('http://localhost:5000/api/ai/chat', {
  prompt: 'Explain this code',
  context: 'const x = 1;'
});
console.log(aiResponse.data.response);
```

### Python

```python
import requests

# Get file tree
response = requests.get('http://localhost:5000/api/files')
files = response.json()['files']

# Analyze code
response = requests.post('http://localhost:5000/api/ai/analyze', json={
    'code': 'def hello(): print("world")',
    'language': 'python'
})
analysis = response.json()
```

### cURL

```bash
# Save file
curl -X POST http://localhost:5000/api/files/test.js \
  -H "Content-Type: application/json" \
  -d '{"content": "console.log(\"Hello World\");"}'

# Search files
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "React", "options": {"caseSensitive": false}}'
```

## SDK Libraries

### JavaScript SDK

```javascript
import { CursorAIClient } from 'cursor-ai-sdk';

const client = new CursorAIClient({
  baseUrl: 'http://localhost:5000',
  apiKey: 'your-api-key' // if authentication is enabled
});

// File operations
const content = await client.files.get('/src/App.jsx');
await client.files.save('/src/App.jsx', updatedContent);

// AI operations
const response = await client.ai.chat('Explain this code', { context: code });
const analysis = await client.ai.analyze(code, 'javascript');
```

### Python SDK

```python
from cursor_ai import CursorAIClient

client = CursorAIClient(
    base_url='http://localhost:5000',
    api_key='your-api-key'  # if authentication is enabled
)

# File operations
content = client.files.get('/src/app.py')
client.files.save('/src/app.py', updated_content)

# AI operations
response = client.ai.chat('Explain this code', context=code)
analysis = client.ai.analyze(code, 'python')
```

## Development

### Running the API Server

```bash
# Development mode
npm run dev:backend

# Production mode
npm start
```

### Environment Variables

```env
PORT=5000
NODE_ENV=development
PROJECT_PATH=/path/to/project
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
```

### Health Check

```http
GET /api/health
```

Returns server health status:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "models": {
    "available": 5,
    "active": 2
  }
}
```

---

**Need help?** Check the [troubleshooting guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/yourusername/cursor-ai-clone/issues).