import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import FileExplorer from './FileExplorer';
import SearchPanel from './SearchPanel';
import ExtensionsPanel from './ExtensionsPanel';
import AgentWorkflowPanel from '../AgentWorkflow/AgentWorkflowPanel';
import { Files, Search, Package, GitBranch, Brain } from 'lucide-react';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('files');

  const tabs = [
    { id: 'files', icon: Files, label: 'Explorer', component: FileExplorer },
    { id: 'search', icon: Search, label: 'Search', component: SearchPanel },
    { id: 'agents', icon: Brain, label: 'Agent Workflows', component: AgentWorkflowPanel },
    { id: 'git', icon: GitBranch, label: 'Source Control', component: () => <div className="p-4 text-text-secondary">Git integration coming soon...</div> },
    { id: 'extensions', icon: Package, label: 'Extensions', component: ExtensionsPanel },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FileExplorer;

  return (
    <div className="h-full flex">
      {/* Tab Bar */}
      <div className="w-12 bg-sidebar-bg border-r border-border flex flex-col">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 border-l-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent bg-panel-bg text-accent'
                  : 'border-transparent hover:bg-panel-bg text-text-secondary hover:text-text-primary'
              }`}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 bg-sidebar-bg">
        <div className="h-full overflow-hidden">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;