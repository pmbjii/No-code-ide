import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code, 
  FileImage, 
  Settings,
  Plus,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const FileExplorer = () => {
  const { state, openFile, dispatch } = useApp();
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
  const [fileTree, setFileTree] = useState({});

  // Sample file structure - in a real app, this would come from the backend
  useEffect(() => {
    const sampleFileTree = {
      '': {
        type: 'folder',
        name: 'Project Root',
        children: {
          'src': {
            type: 'folder',
            name: 'src',
            children: {
              'components': {
                type: 'folder',
                name: 'components',
                children: {
                  'App.jsx': {
                    type: 'file',
                    name: 'App.jsx',
                    path: '/src/components/App.jsx',
                    language: 'javascript'
                  },
                  'Header.jsx': {
                    type: 'file',
                    name: 'Header.jsx',
                    path: '/src/components/Header.jsx',
                    language: 'javascript'
                  }
                }
              },
              'utils': {
                type: 'folder',
                name: 'utils',
                children: {
                  'helpers.js': {
                    type: 'file',
                    name: 'helpers.js',
                    path: '/src/utils/helpers.js',
                    language: 'javascript'
                  }
                }
              },
              'main.jsx': {
                type: 'file',
                name: 'main.jsx',
                path: '/src/main.jsx',
                language: 'javascript'
              },
              'index.css': {
                type: 'file',
                name: 'index.css',
                path: '/src/index.css',
                language: 'css'
              }
            }
          },
          'public': {
            type: 'folder',
            name: 'public',
            children: {
              'index.html': {
                type: 'file',
                name: 'index.html',
                path: '/public/index.html',
                language: 'html'
              },
              'favicon.ico': {
                type: 'file',
                name: 'favicon.ico',
                path: '/public/favicon.ico',
                language: 'binary'
              }
            }
          },
          'package.json': {
            type: 'file',
            name: 'package.json',
            path: '/package.json',
            language: 'json'
          },
          'README.md': {
            type: 'file',
            name: 'README.md',
            path: '/README.md',
            language: 'markdown'
          },
          'Welcome.md': {
            type: 'file',
            name: 'Welcome.md',
            path: '/Welcome.md',
            language: 'markdown'
          },
          'example.js': {
            type: 'file',
            name: 'example.js',
            path: '/example.js',
            language: 'javascript'
          }
        }
      }
    };
    setFileTree(sampleFileTree);
  }, []);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file) => {
    const fileData = {
      id: file.name,
      name: file.name,
      path: file.path,
      content: getDefaultContent(file),
      type: 'file',
      language: file.language,
      modified: false
    };
    openFile(fileData);
  };

  const getDefaultContent = (file) => {
    // In a real app, this would fetch from the backend
    if (file.name === 'Welcome.md') {
      return `# Welcome to Cursor AI Clone

This is an advanced AI-powered code editor with the following features:

## 🚀 Features

- **Advanced Code Editor**: Monaco Editor with syntax highlighting
- **AI Integration**: Support for custom APIs and endpoints
- **File Management**: Full file explorer and project management
- **Terminal Integration**: Built-in terminal with command execution
- **Plugin System**: Extensible architecture for custom functionality
- **Real-time Chat**: AI assistant with context awareness
- **Code Analysis**: Intelligent suggestions and linting

## 🔧 Configuration

1. Open Settings (Ctrl+,)
2. Configure your AI provider and API key
3. Add custom endpoints as needed
4. Customize your development environment

## 🎯 Getting Started

- Use Ctrl+Shift+E to toggle the file explorer
- Use Ctrl+Shift+\` to toggle the terminal
- Use Ctrl+Shift+C to toggle the AI chat
- Start coding and let the AI assist you!

Happy coding! 🎉
`;
    } else if (file.name === 'example.js') {
      return `// Example JavaScript file
import React, { useState, useEffect } from 'react';

const ExampleComponent = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data on component mount
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div className="example-component">
      <h2>Example Component</h2>
      <p>Count: {count}</p>
      <button onClick={handleIncrement}>
        Increment
      </button>
      {data && (
        <div>
          <h3>Data:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ExampleComponent;
`;
    }
    return `// ${file.name}\n// This file is empty. Start coding!\n`;
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') {
      return expandedFolders.has(getFullPath(file)) ? 
        <FolderOpen className="w-4 h-4 text-blue-400" /> : 
        <Folder className="w-4 h-4 text-blue-400" />;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'md':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'json':
        return <Settings className="w-4 h-4 text-green-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'ico':
        return <FileImage className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getFullPath = (file, parentPath = '') => {
    return parentPath ? `${parentPath}/${file.name}` : file.name;
  };

  const renderFileTree = (items, parentPath = '', depth = 0) => {
    return Object.entries(items).map(([key, item]) => {
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      const isExpanded = expandedFolders.has(fullPath);

      return (
        <div key={fullPath}>
          <div
            className={`flex items-center px-2 py-1 hover:bg-panel-bg cursor-pointer text-sm ${
              state.activeFileId === item.name ? 'bg-accent text-white' : 'text-text-primary'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(fullPath);
              } else {
                handleFileClick(item);
              }
            }}
          >
            {item.type === 'folder' && (
              <div className="mr-1">
                {isExpanded ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
              </div>
            )}
            <div className="mr-2">
              {getFileIcon(item)}
            </div>
            <span className="truncate">{item.name}</span>
          </div>
          
          {item.type === 'folder' && isExpanded && item.children && (
            <div>
              {renderFileTree(item.children, fullPath, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-primary">Explorer</h3>
          <div className="flex space-x-1">
            <button 
              className="p-1 hover:bg-panel-bg rounded"
              title="New File"
            >
              <Plus className="w-4 h-4 text-text-secondary" />
            </button>
            <button 
              className="p-1 hover:bg-panel-bg rounded"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-text-secondary" />
            </button>
            <button 
              className="p-1 hover:bg-panel-bg rounded"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-text-secondary">
          {state.projectName}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {fileTree[''] && fileTree[''].children ? (
          renderFileTree(fileTree[''].children)
        ) : (
          <div className="p-4 text-center text-text-secondary text-sm">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No files found
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;