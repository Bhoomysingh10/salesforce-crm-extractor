import React from 'react';

export function RecordCard({ record, onDelete, fields }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 truncate">
          {fields.find(f => f.label === 'Name' || f.label === 'Subject')?.value || 'Unnamed Record'}
        </h3>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 p-1"
          title="Delete record"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {fields.filter(field => field.value).map((field, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              {field.label}
            </span>
            <span className="text-gray-900 truncate" title={field.value}>
              {field.value}
            </span>
          </div>
        ))}
      </div>

      {record.createdAt && (
        <div className="mt-2 text-xs text-gray-400">
          Added {new Date(record.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}