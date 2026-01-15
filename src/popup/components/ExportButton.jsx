import React from 'react';

export function ExportButton({ onExport, objectType, disabled }) {
  const handleExport = (format) => {
    onExport(format);
  };

  return (
    <div className="relative">
      <button
        onClick={() => handleExport('csv')}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Export {objectType}
      </button>
    </div>
  );
}