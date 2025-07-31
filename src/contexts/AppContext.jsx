import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

const initialState = {
  // File system
  files: {},
  openFiles: [],
  activeFileId: null,
  
  // AI Configuration
  aiConfig: {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4',
    customEndpoints: []
  },
  
  // UI State
  sidebarVisible: true,
  terminalVisible: true,
  chatVisible: true,
  settingsVisible: false,
  
  // Chat
  chatMessages: [],
  isAiTyping: false,
  
  // Terminal
  terminalHistory: [],
  
  // Project
  projectPath: '',
  projectName: 'Cursor AI Clone',
  
  // Plugins
  installedPlugins: [],
  
  // Theme
  theme: 'dark'
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    
    case 'OPEN_FILE':
      const fileExists = state.openFiles.find(f => f.id === action.payload.id);
      if (fileExists) {
        return { ...state, activeFileId: action.payload.id };
      }
      return {
        ...state,
        openFiles: [...state.openFiles, action.payload],
        activeFileId: action.payload.id
      };
    
    case 'CLOSE_FILE':
      const newOpenFiles = state.openFiles.filter(f => f.id !== action.payload);
      const newActiveFileId = newOpenFiles.length > 0 
        ? (state.activeFileId === action.payload 
          ? newOpenFiles[newOpenFiles.length - 1].id 
          : state.activeFileId)
        : null;
      return {
        ...state,
        openFiles: newOpenFiles,
        activeFileId: newActiveFileId
      };
    
    case 'UPDATE_FILE_CONTENT':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.id]: {
            ...state.files[action.payload.id],
            content: action.payload.content,
            modified: true
          }
        }
      };
    
    case 'SET_ACTIVE_FILE':
      return { ...state, activeFileId: action.payload };
    
    case 'UPDATE_AI_CONFIG':
      return {
        ...state,
        aiConfig: { ...state.aiConfig, ...action.payload }
      };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, {
          id: uuidv4(),
          ...action.payload,
          timestamp: new Date().toISOString()
        }]
      };
    
    case 'SET_AI_TYPING':
      return { ...state, isAiTyping: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarVisible: !state.sidebarVisible };
    
    case 'TOGGLE_TERMINAL':
      return { ...state, terminalVisible: !state.terminalVisible };
    
    case 'TOGGLE_CHAT':
      return { ...state, chatVisible: !state.chatVisible };
    
    case 'TOGGLE_SETTINGS':
      return { ...state, settingsVisible: !state.settingsVisible };
    
    case 'ADD_TERMINAL_OUTPUT':
      return {
        ...state,
        terminalHistory: [...state.terminalHistory, action.payload]
      };

    case 'CLEAR_TERMINAL':
      return {
        ...state,
        terminalHistory: []
      };
    
    case 'SET_PROJECT':
      return {
        ...state,
        projectPath: action.payload.path,
        projectName: action.payload.name
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('cursor-ai-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        dispatch({ type: 'UPDATE_AI_CONFIG', payload: config });
      } catch (error) {
        console.error('Failed to load saved configuration:', error);
      }
    }
  }, []);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cursor-ai-config', JSON.stringify(state.aiConfig));
  }, [state.aiConfig]);

  const value = {
    state,
    dispatch,
    
    // Helper functions
    openFile: (file) => dispatch({ type: 'OPEN_FILE', payload: file }),
    closeFile: (fileId) => dispatch({ type: 'CLOSE_FILE', payload: fileId }),
    updateFileContent: (fileId, content) => 
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { id: fileId, content } }),
    setActiveFile: (fileId) => dispatch({ type: 'SET_ACTIVE_FILE', payload: fileId }),
    
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }),
    setAiTyping: (typing) => dispatch({ type: 'SET_AI_TYPING', payload: typing }),
    
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    toggleTerminal: () => dispatch({ type: 'TOGGLE_TERMINAL' }),
    toggleChat: () => dispatch({ type: 'TOGGLE_CHAT' }),
    toggleSettings: () => dispatch({ type: 'TOGGLE_SETTINGS' }),
    
    updateAiConfig: (config) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: config })
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};