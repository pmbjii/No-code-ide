import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Terminal as TerminalIcon, X, Plus, Settings } from 'lucide-react';

const Terminal = () => {
  const { state, dispatch } = useApp();
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus terminal input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [state.terminalHistory]);

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    
    // Add command to history
    const newHistory = [...history, command];
    setHistory(newHistory);
    setHistoryIndex(-1);

    // Add command to terminal output
    const commandOutput = {
      type: 'command',
      content: `$ ${command}`,
      timestamp: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_TERMINAL_OUTPUT', payload: commandOutput });

    try {
      // Simulate command execution
      const result = await simulateCommand(command);
      
      const resultOutput = {
        type: 'output',
        content: result,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_TERMINAL_OUTPUT', payload: resultOutput });
    } catch (error) {
      const errorOutput = {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_TERMINAL_OUTPUT', payload: errorOutput });
    } finally {
      setIsExecuting(false);
    }
  };

  const simulateCommand = async (command) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const [cmd, ...args] = command.trim().split(' ');

    switch (cmd.toLowerCase()) {
      case 'ls':
      case 'dir':
        return `src/\npublic/\npackage.json\nREADME.md\nvite.config.js\ntailwind.config.js`;
      
      case 'pwd':
        return '/workspace/cursor-ai-clone';
      
      case 'whoami':
        return 'developer';
      
      case 'date':
        return new Date().toString();
      
      case 'echo':
        return args.join(' ');
      
      case 'clear':
        dispatch({ type: 'CLEAR_TERMINAL' });
        return '';
      
      case 'help':
        return `Available commands:
ls, dir          - List directory contents
pwd              - Print working directory
whoami           - Current user
date             - Current date and time
echo <text>      - Echo text
clear            - Clear terminal
npm <command>    - Run npm commands
git <command>    - Run git commands
help             - Show this help`;
      
      case 'npm':
        if (args[0] === 'install') {
          return `Installing dependencies...
Added 1337 packages in 42.3s`;
        } else if (args[0] === 'run') {
          return `Running script: ${args[1]}...
Server started on http://localhost:3000`;
        } else if (args[0] === 'version') {
          return `npm: 9.8.1
node: 18.17.0`;
        }
        return `npm ${args.join(' ')} executed successfully`;
      
      case 'git':
        if (args[0] === 'status') {
          return `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/App.jsx
  modified:   src/components/Editor/EditorPane.jsx

no changes added to commit`;
        } else if (args[0] === 'log') {
          return `commit a1b2c3d4e5f6 (HEAD -> main)
Author: Developer <dev@example.com>
Date:   ${new Date().toDateString()}

    Add advanced AI features`;
        }
        return `git ${args.join(' ')} executed successfully`;
      
      case 'node':
        if (args[0] === '--version') {
          return 'v18.17.0';
        }
        return 'Node.js REPL started...';
      
      case 'python':
      case 'python3':
        if (args[0] === '--version') {
          return 'Python 3.11.0';
        }
        return 'Python interpreter started...';
      
      default:
        throw new Error(`Command not found: ${cmd}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion
      const commands = ['ls', 'pwd', 'whoami', 'date', 'echo', 'clear', 'help', 'npm', 'git', 'node', 'python'];
      const matches = commands.filter(cmd => cmd.startsWith(currentInput.toLowerCase()));
      if (matches.length === 1) {
        setCurrentInput(matches[0] + ' ');
      }
    }
  };

  const clearTerminal = () => {
    dispatch({ type: 'CLEAR_TERMINAL' });
  };

  return (
    <div className="h-full flex flex-col bg-editor-bg text-text-primary font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-panel-bg">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={clearTerminal}
            className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary"
            title="Clear Terminal"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary"
            title="New Terminal"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary"
            title="Terminal Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-3 text-sm"
      >
        {/* Welcome message */}
        {state.terminalHistory.length === 0 && (
          <div className="text-text-secondary mb-4">
            <div>Welcome to Cursor AI Clone Terminal</div>
            <div>Type 'help' for available commands</div>
            <div></div>
          </div>
        )}

        {/* Terminal history */}
        {state.terminalHistory.map((entry, index) => (
          <div key={index} className={`mb-1 ${
            entry.type === 'command' ? 'text-green-400' :
            entry.type === 'error' ? 'text-red-400' :
            'text-text-primary'
          }`}>
            <pre className="whitespace-pre-wrap">{entry.content}</pre>
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-text-primary"
            placeholder={isExecuting ? "Executing..." : "Type a command..."}
            disabled={isExecuting}
          />
          {isExecuting && (
            <div className="ml-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;