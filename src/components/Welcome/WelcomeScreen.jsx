import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Code, 
  FileText, 
  Folder, 
  Terminal, 
  Bot, 
  Zap, 
  Layers,
  Settings,
  Github,
  BookOpen,
  Play,
  Sparkles
} from 'lucide-react';

const WelcomeScreen = () => {
  const { openFile, toggleSettings } = useApp();
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "Use Ctrl+Shift+E to toggle the file explorer",
    "Enable Agent Mode for advanced code analysis",
    "Try Multi-model mode for consensus AI responses",
    "Use Ctrl+K to chat with AI about selected code",
    "Local models work completely offline",
    "Configure custom AI endpoints in Settings"
  ];

  const quickActions = [
    {
      title: "Open File Explorer",
      description: "Browse and manage your project files",
      icon: Folder,
      action: () => {}, // File explorer is already visible
      shortcut: "Ctrl+Shift+E"
    },
    {
      title: "Start AI Chat",
      description: "Get help with coding questions",
      icon: Bot,
      action: () => {}, // Chat panel is already visible
      shortcut: "Ctrl+Shift+C"
    },
    {
      title: "Open Terminal",
      description: "Execute commands and run scripts",
      icon: Terminal,
      action: () => {},
      shortcut: "Ctrl+Shift+`"
    },
    {
      title: "Configure AI",
      description: "Set up your AI models and API keys",
      icon: Settings,
      action: toggleSettings,
      shortcut: "Ctrl+,"
    }
  ];

  const features = [
    {
      icon: Layers,
      title: "Multi-Model AI",
      description: "Use multiple AI models simultaneously for better results"
    },
    {
      icon: Zap,
      title: "Agent-Based Analysis",
      description: "Specialized AI agents for security, performance, and code quality"
    },
    {
      icon: Code,
      title: "Advanced Editor",
      description: "Monaco editor with intelligent autocomplete and syntax highlighting"
    },
    {
      icon: Sparkles,
      title: "Self-Evolving",
      description: "AI system that improves its own prompts based on performance"
    }
  ];

  const createSampleFile = (name, content, language) => {
    const file = {
      id: name,
      name,
      path: `/${name}`,
      content,
      type: 'file',
      language,
      modified: false
    };
    openFile(file);
  };

  const createReactExample = () => {
    const content = `import React, { useState, useEffect } from 'react';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    // Save todos to localStorage
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue,
        completed: false
      }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Todo App</h1>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add a new todo..."
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="rounded"
            />
            <span className={\`flex-1 \${todo.completed ? 'line-through text-gray-500' : ''}\`}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="px-2 py-1 text-red-500 hover:bg-red-100 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      {todos.length === 0 && (
        <p className="text-gray-500 text-center mt-4">No todos yet. Add one above!</p>
      )}
    </div>
  );
};

export default TodoApp;`;
    createSampleFile('TodoApp.jsx', content, 'javascript');
  };

  const createPythonExample = () => {
    const content = `#!/usr/bin/env python3
"""
Advanced Todo Manager - A Python CLI application
Demonstrates clean code practices and modern Python features
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class Todo:
    id: int
    title: str
    description: str
    completed: bool = False
    priority: Priority = Priority.MEDIUM
    created_at: str = ""
    completed_at: Optional[str] = None
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

class TodoManager:
    def __init__(self, filename: str = "todos.json"):
        self.filename = filename
        self.todos: List[Todo] = []
        self.load_todos()
    
    def load_todos(self) -> None:
        """Load todos from JSON file"""
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    data = json.load(f)
                    self.todos = [Todo(**item) for item in data]
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error loading todos: {e}")
                self.todos = []
    
    def save_todos(self) -> None:
        """Save todos to JSON file"""
        try:
            with open(self.filename, 'w') as f:
                json.dump([asdict(todo) for todo in self.todos], f, indent=2)
        except IOError as e:
            print(f"Error saving todos: {e}")
    
    def add_todo(self, title: str, description: str = "", priority: Priority = Priority.MEDIUM) -> Todo:
        """Add a new todo item"""
        todo_id = max([todo.id for todo in self.todos], default=0) + 1
        todo = Todo(id=todo_id, title=title, description=description, priority=priority)
        self.todos.append(todo)
        self.save_todos()
        return todo
    
    def complete_todo(self, todo_id: int) -> bool:
        """Mark a todo as completed"""
        for todo in self.todos:
            if todo.id == todo_id:
                todo.completed = True
                todo.completed_at = datetime.now().isoformat()
                self.save_todos()
                return True
        return False
    
    def delete_todo(self, todo_id: int) -> bool:
        """Delete a todo item"""
        original_length = len(self.todos)
        self.todos = [todo for todo in self.todos if todo.id != todo_id]
        if len(self.todos) < original_length:
            self.save_todos()
            return True
        return False
    
    def list_todos(self, show_completed: bool = True) -> List[Todo]:
        """List all todos, optionally filtering completed ones"""
        if show_completed:
            return self.todos
        return [todo for todo in self.todos if not todo.completed]
    
    def search_todos(self, query: str) -> List[Todo]:
        """Search todos by title or description"""
        query = query.lower()
        return [
            todo for todo in self.todos
            if query in todo.title.lower() or query in todo.description.lower()
        ]

def main():
    """Main CLI interface"""
    manager = TodoManager()
    
    print("🚀 Advanced Todo Manager")
    print("Commands: add, list, complete, delete, search, quit")
    
    while True:
        command = input("\\n> ").strip().lower()
        
        if command == "quit" or command == "q":
            break
        elif command == "add":
            title = input("Title: ").strip()
            if title:
                description = input("Description (optional): ").strip()
                priority_input = input("Priority (low/medium/high) [medium]: ").strip().lower()
                
                try:
                    priority = Priority(priority_input) if priority_input else Priority.MEDIUM
                except ValueError:
                    priority = Priority.MEDIUM
                
                todo = manager.add_todo(title, description, priority)
                print(f"✅ Added todo #{todo.id}: {todo.title}")
        
        elif command == "list":
            todos = manager.list_todos()
            if not todos:
                print("📝 No todos found")
            else:
                print("\\n📋 Your todos:")
                for todo in todos:
                    status = "✅" if todo.completed else "⏳"
                    priority_emoji = {"low": "🟢", "medium": "🟡", "high": "🔴"}[todo.priority.value]
                    print(f"  {status} #{todo.id} {priority_emoji} {todo.title}")
                    if todo.description:
                        print(f"      {todo.description}")
        
        elif command == "complete":
            try:
                todo_id = int(input("Todo ID to complete: "))
                if manager.complete_todo(todo_id):
                    print(f"✅ Completed todo #{todo_id}")
                else:
                    print(f"❌ Todo #{todo_id} not found")
            except ValueError:
                print("❌ Please enter a valid number")
        
        elif command == "delete":
            try:
                todo_id = int(input("Todo ID to delete: "))
                if manager.delete_todo(todo_id):
                    print(f"🗑️ Deleted todo #{todo_id}")
                else:
                    print(f"❌ Todo #{todo_id} not found")
            except ValueError:
                print("❌ Please enter a valid number")
        
        elif command == "search":
            query = input("Search query: ").strip()
            if query:
                results = manager.search_todos(query)
                if results:
                    print(f"\\n🔍 Found {len(results)} results:")
                    for todo in results:
                        status = "✅" if todo.completed else "⏳"
                        print(f"  {status} #{todo.id} {todo.title}")
                else:
                    print("🔍 No results found")
        
        else:
            print("❓ Unknown command. Try: add, list, complete, delete, search, quit")

if __name__ == "__main__":
    main()`;
    createSampleFile('todo_manager.py', content, 'python');
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="h-full flex items-center justify-center bg-editor-bg p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent to-accent-hover rounded-2xl mb-6">
            <Code className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Welcome to Cursor AI Clone
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            The most advanced AI-powered code editor with multi-model support, 
            unlimited context, and complete local execution capabilities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="p-6 bg-panel-bg hover:bg-border rounded-lg border border-border transition-all duration-200 hover:scale-105 group"
              >
                <Icon className="w-8 h-8 text-accent mb-3 group-hover:text-accent-hover transition-colors" />
                <h3 className="font-semibold text-text-primary mb-2">{action.title}</h3>
                <p className="text-sm text-text-secondary mb-3">{action.description}</p>
                <div className="text-xs text-accent font-mono">{action.shortcut}</div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sample Projects */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            Get Started with Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={createReactExample}
              className="p-6 bg-panel-bg hover:bg-border rounded-lg border border-border transition-all duration-200 hover:scale-105 text-left group"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">React Todo App</h3>
                  <p className="text-sm text-text-secondary">Modern React with hooks</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                A complete Todo application showcasing React best practices, hooks, 
                and modern JavaScript features.
              </p>
            </button>

            <button
              onClick={createPythonExample}
              className="p-6 bg-panel-bg hover:bg-border rounded-lg border border-border transition-all duration-200 hover:scale-105 text-left group"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Python CLI App</h3>
                  <p className="text-sm text-text-secondary">Advanced Python patterns</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                A sophisticated command-line todo manager demonstrating dataclasses, 
                type hints, and clean architecture.
              </p>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-accent/10 rounded-full">
            <Sparkles className="w-4 h-4 text-accent mr-2" />
            <span className="text-sm text-text-primary">
              <strong>Tip:</strong> {tips[currentTip]}
            </span>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center space-x-6 mt-8 text-sm">
          <a href="#" className="flex items-center text-text-secondary hover:text-accent transition-colors">
            <BookOpen className="w-4 h-4 mr-1" />
            Documentation
          </a>
          <a href="#" className="flex items-center text-text-secondary hover:text-accent transition-colors">
            <Github className="w-4 h-4 mr-1" />
            GitHub
          </a>
          <a href="#" className="flex items-center text-text-secondary hover:text-accent transition-colors">
            <Play className="w-4 h-4 mr-1" />
            Tutorials
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;