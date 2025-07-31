import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Menu, Maximize2, Minimize2, X } from 'lucide-react';

const MenuBar = () => {
  const { state } = useApp();

  return (
    <div className="h-8 bg-panel-bg border-b border-border flex items-center justify-between px-2 text-xs">
      {/* Left side - Menu */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Menu className="w-3 h-3 text-text-secondary" />
          <span className="text-text-primary font-medium">Cursor AI Clone</span>
        </div>
        
        <div className="flex items-center space-x-3 text-text-secondary">
          <button className="hover:text-text-primary">File</button>
          <button className="hover:text-text-primary">Edit</button>
          <button className="hover:text-text-primary">View</button>
          <button className="hover:text-text-primary">Go</button>
          <button className="hover:text-text-primary">Run</button>
          <button className="hover:text-text-primary">Terminal</button>
          <button className="hover:text-text-primary">Help</button>
        </div>
      </div>

      {/* Center - Project name */}
      <div className="text-text-secondary">
        {state.projectName}
      </div>

      {/* Right side - Window controls */}
      <div className="flex items-center space-x-1">
        <button className="p-1 hover:bg-border rounded">
          <Minimize2 className="w-3 h-3 text-text-secondary" />
        </button>
        <button className="p-1 hover:bg-border rounded">
          <Maximize2 className="w-3 h-3 text-text-secondary" />
        </button>
        <button className="p-1 hover:bg-red-600 hover:text-white rounded">
          <X className="w-3 h-3 text-text-secondary" />
        </button>
      </div>
    </div>
  );
};

export default MenuBar;