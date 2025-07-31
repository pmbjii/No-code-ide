import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { AlertCircle, CheckCircle, Cpu, Wifi, WifiOff } from 'lucide-react';

const StatusBar = () => {
  const { state } = useApp();
  const activeFile = state.openFiles.find(f => f.id === state.activeFileId);

  return (
    <div className="h-6 bg-accent text-white flex items-center justify-between px-3 text-xs">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Branch info */}
        <div className="flex items-center space-x-1">
          <span>main</span>
          <CheckCircle className="w-3 h-3" />
        </div>
        
        {/* Problems */}
        <div className="flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>0 problems</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center space-x-4">
        {activeFile && (
          <>
            <span>{activeFile.language}</span>
            <span>UTF-8</span>
            <span>LF</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* AI Status */}
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3" />
          <span>AI Ready</span>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </div>
        
        {/* Position */}
        {activeFile && (
          <span>Ln 1, Col 1</span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;