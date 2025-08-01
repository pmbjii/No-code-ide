import React from 'react';
import { CheckCircle, XCircle, Clock, Play, AlertCircle } from 'lucide-react';

const WorkflowVisualizer = ({ workflow, execution, isExpanded = false }) => {
  const getStepStatus = (step, execution) => {
    if (!execution || !execution.results) return 'pending';
    
    const stepResult = execution.results.find(r => r.agent === step.agent);
    if (!stepResult) return 'pending';
    
    return stepResult.status || 'completed';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'running':
        return <Play size={16} className="text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock size={16} className="text-gray-400" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-yellow-500 bg-yellow-50';
    }
  };

  if (!workflow) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
        <span className="text-sm text-gray-500">{workflow.description}</span>
      </div>

      <div className="space-y-3">
        {workflow.steps.map((step, index) => {
          const status = getStepStatus(step, execution);
          const Icon = getStatusIcon(status);
          
          return (
            <div key={index} className="flex items-center space-x-3">
              {/* Step Number */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                getStatusColor(status)
              }`}>
                {index + 1}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {Icon}
                  <span className="font-medium text-gray-900">{step.name}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.agent}</p>
              </div>

              {/* Status */}
              <div className="text-xs text-gray-500">
                {status === 'completed' && '✓ Complete'}
                {status === 'error' && '✗ Error'}
                {status === 'running' && '⟳ Running'}
                {status === 'pending' && '⏳ Pending'}
              </div>
            </div>
          );
        })}
      </div>

      {execution && execution.executionTime && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Execution Time:</span>
            <span className="font-medium">{execution.executionTime}ms</span>
          </div>
          
          {execution.combined && execution.combined.overallScore && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Overall Score:</span>
              <span className="font-medium">{Math.round(execution.combined.overallScore)}/100</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowVisualizer;