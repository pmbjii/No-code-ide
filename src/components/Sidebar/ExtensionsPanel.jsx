import React, { useState } from 'react';
import { Package, Download, Trash2, Settings, Star, Search } from 'lucide-react';

const ExtensionsPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('installed');

  const installedExtensions = [
    {
      id: 'ai-autocomplete',
      name: 'AI Autocomplete',
      description: 'Advanced AI-powered code completion',
      version: '1.2.0',
      enabled: true,
      rating: 4.8
    },
    {
      id: 'theme-pack',
      name: 'Theme Pack Pro',
      description: 'Professional color themes for coding',
      version: '2.1.0',
      enabled: true,
      rating: 4.6
    },
    {
      id: 'git-integration',
      name: 'Git Integration Plus',
      description: 'Enhanced Git workflow tools',
      version: '1.5.0',
      enabled: false,
      rating: 4.7
    }
  ];

  const availableExtensions = [
    {
      id: 'code-formatter',
      name: 'Smart Code Formatter',
      description: 'Intelligent code formatting with AI assistance',
      version: '1.0.0',
      downloads: 12500,
      rating: 4.9
    },
    {
      id: 'debugger-pro',
      name: 'Debugger Pro',
      description: 'Advanced debugging tools with AI insights',
      version: '2.0.0',
      downloads: 8900,
      rating: 4.5
    },
    {
      id: 'api-tester',
      name: 'API Tester',
      description: 'Test APIs directly from the editor',
      version: '1.3.0',
      downloads: 6700,
      rating: 4.4
    }
  ];

  const toggleExtension = (extensionId) => {
    console.log(`Toggle extension: ${extensionId}`);
  };

  const installExtension = (extensionId) => {
    console.log(`Install extension: ${extensionId}`);
  };

  const uninstallExtension = (extensionId) => {
    console.log(`Uninstall extension: ${extensionId}`);
  };

  const renderExtension = (extension, isInstalled = false) => (
    <div key={extension.id} className="p-3 border border-border rounded hover:bg-panel-bg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text-primary">{extension.name}</h4>
          <p className="text-xs text-text-secondary mt-1">{extension.description}</p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <Star className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-text-secondary">{extension.rating}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-text-secondary">
          <span>v{extension.version}</span>
          {!isInstalled && extension.downloads && (
            <span>{extension.downloads.toLocaleString()} downloads</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isInstalled ? (
            <>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={extension.enabled}
                  onChange={() => toggleExtension(extension.id)}
                  className="mr-1"
                />
                <span className="text-xs text-text-secondary">Enabled</span>
              </label>
              <button
                onClick={() => uninstallExtension(extension.id)}
                className="p-1 hover:bg-border rounded text-text-secondary hover:text-red-400"
                title="Uninstall"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              onClick={() => installExtension(extension.id)}
              className="button-primary text-xs px-2 py-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3">Extensions</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-field pr-8"
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === 'installed'
                ? 'bg-accent text-white'
                : 'bg-editor-bg text-text-secondary hover:text-text-primary'
            }`}
          >
            Installed ({installedExtensions.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === 'marketplace'
                ? 'bg-accent text-white'
                : 'bg-editor-bg text-text-secondary hover:text-text-primary'
            }`}
          >
            Marketplace
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {activeTab === 'installed' ? (
          <div className="space-y-3">
            {installedExtensions.length > 0 ? (
              installedExtensions
                .filter(ext => 
                  !searchQuery || 
                  ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ext.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(extension => renderExtension(extension, true))
            ) : (
              <div className="text-center text-text-secondary py-8">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No extensions installed</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {availableExtensions
              .filter(ext => 
                !searchQuery || 
                ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ext.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(extension => renderExtension(extension, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionsPanel;