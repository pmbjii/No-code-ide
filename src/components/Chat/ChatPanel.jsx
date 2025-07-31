import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import AIService from '../../services/AIService';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  Settings, 
  Zap, 
  Brain, 
  MessageSquare,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Layers,
  Activity
} from 'lucide-react';

const ChatPanel = () => {
  const { state, addChatMessage, setAiTyping } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [aiService] = useState(() => new AIService());
  const [selectedModels, setSelectedModels] = useState(['openai-gpt4']);
  const [multiModelMode, setMultiModelMode] = useState(false);
  const [contextMode, setContextMode] = useState('auto');
  const [agentMode, setAgentMode] = useState(false);
  const [showModelStats, setShowModelStats] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  useEffect(() => {
    // Initialize AI service with default local models
    initializeDefaultModels();
  }, []);

  const initializeDefaultModels = async () => {
    try {
      // Initialize local models for offline capability
      await aiService.initializeModel('local-mistral', {});
      await aiService.initializeModel('local-codellama', {});
    } catch (error) {
      console.log('Local models not available, using mock responses');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getContextFromEditor = () => {
    const activeFile = state.openFiles.find(f => f.id === state.activeFileId);
    if (!activeFile) return '';

    const context = {
      currentFile: {
        name: activeFile.name,
        language: activeFile.language,
        content: activeFile.content
      },
      openFiles: state.openFiles.map(f => ({
        name: f.name,
        language: f.language,
        modified: f.modified
      })),
      projectInfo: {
        name: state.projectName,
        path: state.projectPath
      }
    };

    return JSON.stringify(context, null, 2);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    addChatMessage(userMessage);
    setInputValue('');
    setAiTyping(true);

    try {
      const context = contextMode === 'auto' ? getContextFromEditor() : '';
      
      const options = {
        capability: agentMode ? 'analysis' : 'chat',
        context,
        modelPreference: selectedModels[0],
        multiModel: multiModelMode,
        systemPrompt: getSystemPrompt(),
        includeContext: contextMode !== 'none'
      };

      let response;
      if (agentMode) {
        response = await handleAgentRequest(inputValue, options);
      } else {
        response = await aiService.generateResponse(inputValue, options);
      }

      const aiMessage = {
        type: 'ai',
        content: response.response || response.result,
        model: response.model,
        confidence: response.confidence,
        alternatives: response.alternatives,
        consensus: response.consensus,
        metadata: {
          tokens: response.tokens,
          multiModel: multiModelMode,
          contextUsed: !!context
        }
      };

      addChatMessage(aiMessage);
    } catch (error) {
      const errorMessage = {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      addChatMessage(errorMessage);
    } finally {
      setAiTyping(false);
    }
  };

  const handleAgentRequest = async (input, options) => {
    // Determine which agent to use based on input
    if (input.toLowerCase().includes('analyze') || input.toLowerCase().includes('review')) {
      const activeFile = state.openFiles.find(f => f.id === state.activeFileId);
      if (activeFile) {
        return await aiService.analyzeCode(activeFile.content, activeFile.language, options);
      }
    }
    
    if (input.toLowerCase().includes('improve') || input.toLowerCase().includes('fix')) {
      const activeFile = state.openFiles.find(f => f.id === state.activeFileId);
      if (activeFile) {
        // First analyze, then improve
        const analysis = await aiService.analyzeCode(activeFile.content, activeFile.language, options);
        return await aiService.improveCode(activeFile.content, activeFile.language, analysis.results, options);
      }
    }

    // Default to regular chat
    return await aiService.generateResponse(input, { ...options, capability: 'chat' });
  };

  const getSystemPrompt = () => {
    if (agentMode) {
      return `You are an advanced AI coding assistant with specialized agent capabilities. 
              You can analyze code, suggest improvements, identify issues, and provide solutions.
              Always be thorough and provide actionable advice.`;
    }
    
    return `You are an advanced AI coding assistant. You have access to the current project context
            and can help with coding, debugging, architecture decisions, and general development questions.
            Be concise but thorough in your responses.`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const regenerateResponse = async (messageIndex) => {
    const message = state.chatMessages[messageIndex - 1]; // Get the user message
    if (message && message.type === 'user') {
      setInputValue(message.content);
      await handleSendMessage();
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-accent ml-2' : isError ? 'bg-red-600 mr-2' : 'bg-green-600 mr-2'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : isError ? '!' : <Bot className="w-4 h-4" />}
          </div>
          
          {/* Message Content */}
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-accent text-white' 
              : isError 
                ? 'bg-red-900 text-red-100' 
                : 'bg-panel-bg text-text-primary border border-border'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Message Metadata */}
            {!isUser && !isError && message.metadata && (
              <div className="mt-2 pt-2 border-t border-border text-xs text-text-secondary">
                <div className="flex items-center space-x-4">
                  {message.model && (
                    <span className="flex items-center">
                      <Brain className="w-3 h-3 mr-1" />
                      {message.model}
                    </span>
                  )}
                  {message.confidence && (
                    <span className="flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      {Math.round(message.confidence * 100)}%
                    </span>
                  )}
                  {message.metadata.tokens && (
                    <span>{message.metadata.tokens} tokens</span>
                  )}
                  {message.metadata.multiModel && (
                    <span className="flex items-center">
                      <Layers className="w-3 h-3 mr-1" />
                      Multi-model
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Alternative Responses */}
            {message.alternatives && message.alternatives.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <details className="text-sm">
                  <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
                    Alternative responses ({message.alternatives.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {message.alternatives.map((alt, altIndex) => (
                      <div key={altIndex} className="p-2 bg-editor-bg rounded text-xs">
                        <div className="font-medium text-text-secondary mb-1">
                          {alt.model} ({Math.round(alt.confidence * 100)}%)
                        </div>
                        <div className="text-text-primary">{alt.response}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
            
            {/* Message Actions */}
            {!isUser && (
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => copyMessage(message.content)}
                  className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary"
                  title="Copy message"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => regenerateResponse(index)}
                  className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary">
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary">
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-panel-bg">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-primary flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Assistant
          </h3>
          <button
            onClick={() => setShowModelStats(!showModelStats)}
            className="p-1 hover:bg-border rounded"
            title="Model Statistics"
          >
            <Activity className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        
        {/* Controls */}
        <div className="space-y-2">
          {/* Model Selection */}
          <div className="flex items-center space-x-2">
            <select 
              value={selectedModels[0]} 
              onChange={(e) => setSelectedModels([e.target.value])}
              className="text-xs bg-editor-bg border border-border rounded px-2 py-1 text-text-primary"
            >
              <option value="openai-gpt4">GPT-4</option>
              <option value="openai-gpt4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="local-mistral">Local Mistral</option>
              <option value="local-codellama">Local CodeLlama</option>
            </select>
            
            <label className="flex items-center text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={multiModelMode}
                onChange={(e) => setMultiModelMode(e.target.checked)}
                className="mr-1"
              />
              Multi-model
            </label>
          </div>
          
          {/* Mode Controls */}
          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center text-text-secondary">
              <input
                type="checkbox"
                checked={agentMode}
                onChange={(e) => setAgentMode(e.target.checked)}
                className="mr-1"
              />
              <Zap className="w-3 h-3 mr-1" />
              Agent Mode
            </label>
            
            <select
              value={contextMode}
              onChange={(e) => setContextMode(e.target.value)}
              className="bg-editor-bg border border-border rounded px-2 py-1 text-text-primary"
            >
              <option value="auto">Auto Context</option>
              <option value="full">Full Context</option>
              <option value="none">No Context</option>
            </select>
          </div>
        </div>
        
        {/* Model Stats */}
        {showModelStats && (
          <div className="mt-2 p-2 bg-editor-bg rounded text-xs">
            <div className="grid grid-cols-2 gap-2">
              {aiService.getModelStats().slice(0, 4).map(model => (
                <div key={model.id} className="flex justify-between">
                  <span className={`${model.status === 'active' ? 'text-green-400' : 'text-text-secondary'}`}>
                    {model.id.split('-').pop()}
                  </span>
                  <span className="text-text-secondary">
                    {Math.round(model.successRate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {state.chatMessages.length === 0 ? (
          <div className="text-center text-text-secondary mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm mb-4">Ask me anything about your code or project!</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-editor-bg rounded">
                <Code className="w-4 h-4 mb-1" />
                Code Analysis
              </div>
              <div className="p-2 bg-editor-bg rounded">
                <Brain className="w-4 h-4 mb-1" />
                Smart Suggestions
              </div>
              <div className="p-2 bg-editor-bg rounded">
                <Zap className="w-4 h-4 mb-1" />
                Agent Actions
              </div>
              <div className="p-2 bg-editor-bg rounded">
                <Layers className="w-4 h-4 mb-1" />
                Multi-model
              </div>
            </div>
          </div>
        ) : (
          <>
            {state.chatMessages.map((message, index) => renderMessage(message, index))}
            {state.isAiTyping && (
              <div className="flex justify-start mb-4">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-panel-bg border border-border rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your code..."
            className="flex-1 input-field resize-none"
            rows="2"
            disabled={state.isAiTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || state.isAiTyping}
            className="button-primary flex items-center justify-center w-10 h-10 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => setInputValue('Analyze the current file for issues')}
            className="text-xs bg-editor-bg hover:bg-border px-2 py-1 rounded text-text-secondary hover:text-text-primary"
          >
            Analyze Code
          </button>
          <button
            onClick={() => setInputValue('Explain what this code does')}
            className="text-xs bg-editor-bg hover:bg-border px-2 py-1 rounded text-text-secondary hover:text-text-primary"
          >
            Explain Code
          </button>
          <button
            onClick={() => setInputValue('Suggest improvements for this code')}
            className="text-xs bg-editor-bg hover:bg-border px-2 py-1 rounded text-text-secondary hover:text-text-primary"
          >
            Improve Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;