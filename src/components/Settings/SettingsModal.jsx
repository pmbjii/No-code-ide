import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Save, Plus, Trash2, Eye, EyeOff, TestTube } from 'lucide-react';

const SettingsModal = () => {
  const { state, toggleSettings, updateAiConfig } = useApp();
  const [activeTab, setActiveTab] = useState('ai');
  const [config, setConfig] = useState(state.aiConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSave = () => {
    updateAiConfig(config);
    toggleSettings();
  };

  const handleCancel = () => {
    setConfig(state.aiConfig);
    toggleSettings();
  };

  const addCustomEndpoint = () => {
    const newEndpoint = {
      id: Date.now().toString(),
      name: 'Custom Endpoint',
      url: '',
      apiKey: '',
      model: '',
      enabled: true
    };
    
    setConfig({
      ...config,
      customEndpoints: [...config.customEndpoints, newEndpoint]
    });
  };

  const removeCustomEndpoint = (id) => {
    setConfig({
      ...config,
      customEndpoints: config.customEndpoints.filter(ep => ep.id !== id)
    });
  };

  const updateCustomEndpoint = (id, updates) => {
    setConfig({
      ...config,
      customEndpoints: config.customEndpoints.map(ep =>
        ep.id === id ? { ...ep, ...updates } : ep
      )
    });
  };

  const testConnection = async () => {
    setTestingConnection(true);
    // Simulate connection test
    setTimeout(() => {
      setTestingConnection(false);
      alert('Connection test successful!');
    }, 2000);
  };

  const renderAISettings = () => (
    <div className="space-y-6">
      {/* Primary AI Provider */}
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Primary AI Provider</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value })}
              className="w-full input-field"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local Models</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full input-field pr-20"
                placeholder="Enter your API key"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 hover:bg-border rounded"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="p-1 hover:bg-border rounded disabled:opacity-50"
                  title="Test Connection"
                >
                  <TestTube className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Base URL (Optional)
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              className="w-full input-field"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Default Model
            </label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full input-field"
              placeholder="gpt-4"
            />
          </div>
        </div>
      </div>

      {/* Custom Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-primary">Custom Endpoints</h3>
          <button
            onClick={addCustomEndpoint}
            className="button-primary text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Endpoint
          </button>
        </div>

        <div className="space-y-4">
          {config.customEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="p-4 border border-border rounded">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={endpoint.name}
                  onChange={(e) => updateCustomEndpoint(endpoint.id, { name: e.target.value })}
                  className="font-medium bg-transparent border-none outline-none text-text-primary"
                  placeholder="Endpoint Name"
                />
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={endpoint.enabled}
                      onChange={(e) => updateCustomEndpoint(endpoint.id, { enabled: e.target.checked })}
                      className="mr-1"
                    />
                    Enabled
                  </label>
                  <button
                    onClick={() => removeCustomEndpoint(endpoint.id)}
                    className="p-1 hover:bg-border rounded text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">URL</label>
                  <input
                    type="text"
                    value={endpoint.url}
                    onChange={(e) => updateCustomEndpoint(endpoint.id, { url: e.target.value })}
                    className="w-full input-field text-sm"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Model</label>
                  <input
                    type="text"
                    value={endpoint.model}
                    onChange={(e) => updateCustomEndpoint(endpoint.id, { model: e.target.value })}
                    className="w-full input-field text-sm"
                    placeholder="model-name"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-text-secondary mb-1">API Key</label>
                <input
                  type="password"
                  value={endpoint.apiKey}
                  onChange={(e) => updateCustomEndpoint(endpoint.id, { apiKey: e.target.value })}
                  className="w-full input-field text-sm"
                  placeholder="API Key"
                />
              </div>
            </div>
          ))}

          {config.customEndpoints.length === 0 && (
            <div className="text-center text-text-secondary py-8">
              <p className="text-sm">No custom endpoints configured</p>
              <p className="text-xs mt-1">Add custom endpoints to use your own AI models</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Editor Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Font Size
            </label>
            <input
              type="number"
              min="10"
              max="24"
              defaultValue="14"
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tab Size
            </label>
            <select className="w-full input-field">
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="8">8 spaces</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-text-primary">Auto-save files</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-text-primary">Show minimap</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-text-primary">Word wrap</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-text-primary">Show line numbers</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Color Theme
            </label>
            <select className="w-full input-field">
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="high-contrast">High Contrast</option>
              <option value="monokai">Monokai</option>
              <option value="solarized">Solarized Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Icon Theme
            </label>
            <select className="w-full input-field">
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="material">Material Icons</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-panel-bg border border-border rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-border rounded"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-sidebar-bg border-r border-border p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'ai'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-panel-bg'
                }`}
              >
                AI Configuration
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'editor'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-panel-bg'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'theme'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-panel-bg'
                }`}
              >
                Appearance
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {activeTab === 'ai' && renderAISettings()}
            {activeTab === 'editor' && renderEditorSettings()}
            {activeTab === 'theme' && renderThemeSettings()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border">
          <button
            onClick={handleCancel}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;