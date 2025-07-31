import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useApp } from '../../contexts/AppContext';
import { X, FileText, Code, FileImage, Settings } from 'lucide-react';

const EditorPane = () => {
  const { state, closeFile, setActiveFile, updateFileContent } = useApp();
  const editorRef = useRef(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');

  const activeFile = state.openFiles.find(f => f.id === state.activeFileId);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor
    monaco.editor.defineTheme('cursor-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionHighlightBackground': '#add6ff26',
      }
    });
    
    monaco.editor.setTheme('cursor-dark');

    // Add AI-powered features
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      // Trigger AI inline suggestions
      handleAiInlineSuggestion();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      // Trigger AI chat with current selection
      handleAiChatWithSelection();
    });
  };

  const handleEditorChange = (value) => {
    if (activeFile) {
      updateFileContent(activeFile.id, value);
    }
  };

  const handleAiInlineSuggestion = () => {
    if (!editorRef.current) return;
    
    const selection = editorRef.current.getSelection();
    const selectedText = editorRef.current.getModel().getValueInRange(selection);
    
    // This would integrate with your AI service
    console.log('AI inline suggestion for:', selectedText);
  };

  const handleAiChatWithSelection = () => {
    if (!editorRef.current) return;
    
    const selection = editorRef.current.getSelection();
    const selectedText = editorRef.current.getModel().getValueInRange(selection);
    
    // This would open chat with selected text
    console.log('AI chat with selection:', selectedText);
  };

  const getFileIcon = (file) => {
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
        return <FileImage className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getLanguageFromFile = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile'
    };
    return languageMap[ext] || 'plaintext';
  };

  if (state.openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-editor-bg">
        <div className="text-center text-text-secondary">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No files open</h3>
          <p className="text-sm">Open a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* File Tabs */}
      <div className="flex bg-panel-bg border-b border-border overflow-x-auto scrollbar-thin">
        {state.openFiles.map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-4 py-2 border-r border-border cursor-pointer min-w-0 ${
              file.id === state.activeFileId
                ? 'bg-editor-bg text-text-primary'
                : 'bg-panel-bg text-text-secondary hover:bg-border'
            }`}
            onClick={() => setActiveFile(file.id)}
          >
            <div className="flex items-center space-x-2 min-w-0">
              {getFileIcon(file)}
              <span className="text-sm truncate">
                {file.name}
                {file.modified && <span className="text-accent ml-1">●</span>}
              </span>
            </div>
            <button
              className="ml-2 p-1 hover:bg-border rounded"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguageFromFile(activeFile.name)}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="cursor-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'all',
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showUsers: true,
                showIssues: true,
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
              parameterHints: {
                enabled: true,
              },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoSurround: 'languageDefined',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-text-secondary">Select a file to edit</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPane;