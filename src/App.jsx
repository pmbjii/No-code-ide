import React, { useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import EditorPane from './components/Editor/EditorPane';
import Terminal from './components/Terminal/Terminal';
import ChatPanel from './components/Chat/ChatPanel';
import SettingsModal from './components/Settings/SettingsModal';
import StatusBar from './components/StatusBar/StatusBar';
import MenuBar from './components/MenuBar/MenuBar';
import { useHotkeys } from 'react-hotkeys-hook';

function App() {
  const { state, toggleSidebar, toggleTerminal, toggleChat, toggleSettings } = useApp();

  // Keyboard shortcuts
  useHotkeys('ctrl+shift+e', toggleSidebar);
  useHotkeys('ctrl+shift+`', toggleTerminal);
  useHotkeys('ctrl+shift+c', toggleChat);
  useHotkeys('ctrl+,', toggleSettings);

  // Initialize with some sample files
  useEffect(() => {
    // This would typically load from the file system
    // For now, we'll create some sample files
    const sampleFiles = {
      'welcome.md': {
        id: 'welcome.md',
        name: 'Welcome.md',
        path: '/Welcome.md',
        content: `# Welcome to Cursor AI Clone

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
`,
        type: 'file',
        language: 'markdown',
        modified: false
      },
      'example.js': {
        id: 'example.js',
        name: 'example.js',
        path: '/example.js',
        content: `// Example JavaScript file
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
`,
        type: 'file',
        language: 'javascript',
        modified: false
      }
    };

    // Dispatch to set files (in a real app, this would come from the backend)
    // dispatch({ type: 'SET_FILES', payload: sampleFiles });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-editor-bg text-text-primary">
      <MenuBar />
      
      <div className="flex flex-1 overflow-hidden">
        {state.sidebarVisible && (
          <div className="w-64 bg-sidebar-bg border-r border-border">
            <Sidebar />
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <div className="flex-1">
              <EditorPane />
            </div>
            
            {state.chatVisible && (
              <div className="w-80 bg-panel-bg border-l border-border">
                <ChatPanel />
              </div>
            )}
          </div>
          
          {state.terminalVisible && (
            <div className="h-64 bg-panel-bg border-t border-border">
              <Terminal />
            </div>
          )}
        </div>
      </div>
      
      <StatusBar />
      
      {state.settingsVisible && <SettingsModal />}
    </div>
  );
}

export default App;