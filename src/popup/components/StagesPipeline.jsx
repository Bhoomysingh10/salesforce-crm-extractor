import React from 'react';

export function StagesPipeline({ stages, activeFilter, onFilterChange }) {
  const stageColors = {
    prospecting: 'bg-gray-200 hover:bg-gray-300',
    qualification: 'bg-blue-200 hover:bg-blue-300',
    proposal: 'bg-yellow-200 hover:bg-yellow-300',
    negotiation: 'bg-orange-200 hover:bg-orange-300',
    closedWon: 'bg-green-200 hover:bg-green-300',
    closedLost: 'bg-red-200 hover:bg-red-300'
  };

  const stageLabels = {
    prospecting: 'Prospecting',
    qualification: 'Qualification',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closedWon: 'Closed Won',
    closedLost: 'Closed Lost'
  };

  const totalOpportunities = Object.values(stages).reduce((sum, count) => sum + count, 0);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Pipeline Overview</h3>
        <span className="text-sm text-gray-500">{totalOpportunities} total opportunities</span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {Object.entries(stages).map(([stage, count]) => (
          <button
            key={stage}
            onClick={() => onFilterChange(activeFilter === stage ? 'all' : stage)}
            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
              stageColors[stage] || 'bg-gray-200 hover:bg-gray-300'
            } ${activeFilter === stage ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="text-lg font-bold text-gray-800">{count}</div>
            <div className="text-xs text-gray-600 mt-1">
              {stageLabels[stage] || stage}
            </div>
          </button>
        ))}
      </div>

      {activeFilter !== 'all' && (
        <div className="mt-2 text-center">
          <button
            onClick={() => onFilterChange('all')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Show all stages
          </button>
        </div>
      )}
    </div>
  );
}