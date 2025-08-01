import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import AIService from '../../services/AIService';
import {
  Play,
  Pause,
  Square,
  Settings,
  Zap,
  Brain,
  Code,
  Shield,
  Gauge,
  FileText,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Loader,
  AlertCircle,
  Info
} from 'lucide-react';

const AgentWorkflowPanel = () => {
  const { state } = useApp();
  const [aiService] = useState(() => new AIService());
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, completed, error
  const [currentExecution, setCurrentExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [customWorkflow, setCustomWorkflow] = useState({
    name: '',
    description: '',
    steps: []
  });
  const [expandedResults, setExpandedResults] = useState(new Set());

  useEffect(() => {
    loadWorkflowsAndAgents();
  }, []);

  const loadWorkflowsAndAgents = async () => {
    try {
      const availableWorkflows = aiService.getAvailableWorkflows();
      const availableAgents = aiService.getAvailableAgents();
      
      setWorkflows(availableWorkflows);
      setAgents(availableAgents);
    } catch (error) {
      console.error('Failed to load workflows and agents:', error);
    }
  };

  const getAgentIcon = (agentId) => {
    const iconMap = {
      'syntax-analyzer': Code,
      'security-analyzer': Shield,
      'performance-analyzer': Gauge,
      'architecture-analyzer': Layers,
      'code-improver': Zap,
      'documentation-agent': FileText
    };
    return iconMap[agentId] || Brain;
  };

  const getSeverityColor = (severity) => {
    const colorMap = {
      critical: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-blue-600 bg-blue-50'
    };
    return colorMap[severity] || 'text-gray-600 bg-gray-50';
  };

  const handleWorkflowExecution = async (workflowId) => {
    const activeFile = state.openFiles.find(f => f.id === state.activeFileId);
    if (!activeFile) {
      alert('Please open a file to analyze');
      return;
    }

    setExecutionStatus('running');
    setCurrentExecution({
      workflowId,
      startTime: Date.now(),
      steps: []
    });

    try {
      const result = await aiService.runWorkflow(workflowId, activeFile.content, {
        language: activeFile.language,
        context: `File: ${activeFile.name}`
      });

      setCurrentExecution(prev => ({
        ...prev,
        result,
        endTime: Date.now(),
        status: 'completed'
      }));

      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      setExecutionStatus('completed');

    } catch (error) {
      setCurrentExecution(prev => ({
        ...prev,
        error: error.message,
        endTime: Date.now(),
        status: 'error'
      }));
      setExecutionStatus('error');
    }
  };

  const handleAgentExecution = async (agentId) => {
    const activeFile = state.openFiles.find(f => f.id === state.activeFileId);
    if (!activeFile) {
      alert('Please open a file to analyze');
      return;
    }

    setExecutionStatus('running');
    setCurrentExecution({
      agentId,
      startTime: Date.now()
    });

    try {
      const result = await aiService.runAgent(agentId, activeFile.content, {
        language: activeFile.language,
        context: `File: ${activeFile.name}`
      });

      setCurrentExecution(prev => ({
        ...prev,
        result,
        endTime: Date.now(),
        status: 'completed'
      }));

      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]);
      setExecutionStatus('completed');

    } catch (error) {
      setCurrentExecution(prev => ({
        ...prev,
        error: error.message,
        endTime: Date.now(),
        status: 'error'
      }));
      setExecutionStatus('error');
    }
  };

  const addCustomWorkflowStep = () => {
    setCustomWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, { agent: '', name: '' }]
    }));
  };

  const updateCustomWorkflowStep = (index, field, value) => {
    setCustomWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeCustomWorkflowStep = (index) => {
    setCustomWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const saveCustomWorkflow = () => {
    if (!customWorkflow.name || customWorkflow.steps.length === 0) {
      alert('Please provide a name and at least one step');
      return;
    }

    const newWorkflow = {
      id: `custom-${Date.now()}`,
      ...customWorkflow,
      parallel: false
    };

    setWorkflows(prev => [...prev, newWorkflow]);
    setCustomWorkflow({ name: '', description: '', steps: [] });
    setShowWorkflowBuilder(false);
  };

  const toggleResultExpansion = (executionId) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const renderExecutionResult = (execution) => {
    if (!execution.result) return null;

    const isExpanded = expandedResults.has(execution.executionId || execution.workflow || execution.agent);
    const executionId = execution.executionId || execution.workflow || execution.agent;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900">
              {execution.workflowName || execution.agentName || 'Analysis Result'}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              execution.status === 'completed' ? 'bg-green-100 text-green-800' :
              execution.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {execution.status || 'completed'}
            </span>
          </div>
          <button
            onClick={() => toggleResultExpansion(executionId)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {execution.executionTime && (
          <div className="text-sm text-gray-600 mb-3">
            Execution time: {execution.executionTime}ms
          </div>
        )}

        {isExpanded && (
          <div className="space-y-4">
            {execution.results && execution.results.length > 0 ? (
              <div className="space-y-3">
                {execution.results.map((result, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {React.createElement(getAgentIcon(result.agent), { size: 16 })}
                      <h5 className="font-medium">{result.agentName}</h5>
                      {result.confidence && (
                        <span className="text-sm text-gray-500">
                          Confidence: {Math.round(result.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {result.result && (
                      <div className="text-sm space-y-2">
                        {result.result.summary && (
                          <p className="text-gray-700">{result.result.summary}</p>
                        )}
                        
                        {result.result.issues && result.result.issues.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="font-medium text-gray-900">Issues Found:</h6>
                            {result.result.issues.map((issue, i) => (
                              <div key={i} className={`p-2 rounded ${getSeverityColor(issue.severity)}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{issue.type}</span>
                                  <span className="text-xs">{issue.severity}</span>
                                </div>
                                <p className="text-sm mt-1">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="text-sm mt-1 italic">Suggestion: {issue.suggestion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {result.result.vulnerabilities && result.result.vulnerabilities.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="font-medium text-gray-900">Security Vulnerabilities:</h6>
                            {result.result.vulnerabilities.map((vuln, i) => (
                              <div key={i} className={`p-2 rounded ${getSeverityColor(vuln.severity)}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{vuln.type}</span>
                                  <span className="text-xs">{vuln.severity}</span>
                                </div>
                                <p className="text-sm mt-1">{vuln.description}</p>
                                {vuln.mitigation && (
                                  <p className="text-sm mt-1 italic">Mitigation: {vuln.mitigation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {result.result.bottlenecks && result.result.bottlenecks.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="font-medium text-gray-900">Performance Bottlenecks:</h6>
                            {result.result.bottlenecks.map((bottleneck, i) => (
                              <div key={i} className={`p-2 rounded ${getSeverityColor(bottleneck.severity)}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{bottleneck.type}</span>
                                  <span className="text-xs">{bottleneck.severity}</span>
                                </div>
                                <p className="text-sm mt-1">{bottleneck.description}</p>
                                {bottleneck.suggestion && (
                                  <p className="text-sm mt-1 italic">Optimization: {bottleneck.suggestion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {result.result.improvements && result.result.improvements.length > 0 && (
                          <div className="space-y-2">
                            <h6 className="font-medium text-gray-900">Code Improvements:</h6>
                            {result.result.improvements.map((improvement, i) => (
                              <div key={i} className="p-2 rounded bg-green-50 border border-green-200">
                                <div className="font-medium text-green-800">{improvement.type}</div>
                                <p className="text-sm mt-1 text-green-700">{improvement.explanation}</p>
                                {improvement.original_code && improvement.improved_code && (
                                  <div className="mt-2 space-y-1">
                                    <div className="text-xs font-medium text-gray-600">Original:</div>
                                    <pre className="text-xs bg-gray-100 p-2 rounded">{improvement.original_code}</pre>
                                    <div className="text-xs font-medium text-gray-600">Improved:</div>
                                    <pre className="text-xs bg-green-100 p-2 rounded">{improvement.improved_code}</pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {execution.result.summary || 'Analysis completed'}
              </div>
            )}

            {execution.combined && (
              <div className="border-t pt-4">
                <h6 className="font-medium text-gray-900 mb-2">Combined Analysis:</h6>
                <p className="text-sm text-gray-700">{execution.combined.summary}</p>
                
                {execution.combined.recommendations && execution.combined.recommendations.length > 0 && (
                  <div className="mt-3">
                    <h6 className="font-medium text-gray-900 mb-2">Recommendations:</h6>
                    <ul className="text-sm space-y-1">
                      {execution.combined.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{rec.description || rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Agent Workflows</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWorkflowBuilder(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>New Workflow</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Execution Status */}
        {executionStatus === 'running' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader className="animate-spin text-blue-600" size={20} />
              <div>
                <h3 className="font-medium text-blue-900">Analysis in Progress</h3>
                <p className="text-sm text-blue-700">
                  {currentExecution?.workflowId ? 
                    `Running workflow: ${workflows.find(w => w.id === currentExecution.workflowId)?.name}` :
                    `Running agent: ${agents.find(a => a.id === currentExecution?.agentId)?.name}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Predefined Workflows */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Predefined Workflows</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                  </div>
                  <button
                    onClick={() => handleWorkflowExecution(workflow.id)}
                    disabled={executionStatus === 'running'}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={14} />
                    <span>Run</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">Steps:</div>
                  {workflow.steps.map((step, index) => {
                    const Icon = getAgentIcon(step.agent);
                    return (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Icon size={14} className="text-gray-400" />
                        <span className="text-gray-700">{step.name}</span>
                        {index < workflow.steps.length - 1 && (
                          <ChevronRight size={12} className="text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Agents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const Icon = getAgentIcon(agent.id);
              return (
                <div key={agent.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Icon size={16} className="text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAgentExecution(agent.id)}
                      disabled={executionStatus === 'running'}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={12} />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution History */}
        {executionHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h3>
            <div className="space-y-4">
              {executionHistory.map((execution, index) => (
                <div key={index}>
                  {renderExecutionResult(execution)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Builder Modal */}
      {showWorkflowBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Custom Workflow</h3>
              <button
                onClick={() => setShowWorkflowBuilder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={customWorkflow.name}
                  onChange={(e) => setCustomWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={customWorkflow.description}
                  onChange={(e) => setCustomWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter workflow description"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Workflow Steps
                  </label>
                  <button
                    onClick={addCustomWorkflowStep}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <Plus size={14} />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {customWorkflow.steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                      <select
                        value={step.agent}
                        onChange={(e) => updateCustomWorkflowStep(index, 'agent', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateCustomWorkflowStep(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Step name"
                      />
                      
                      <button
                        onClick={() => removeCustomWorkflowStep(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowWorkflowBuilder(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomWorkflow}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentWorkflowPanel;