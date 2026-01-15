import React from 'react';

export function Tabs({ activeTab, setActiveTab, counts }) {
  const tabs = [
    { id: 'leads', label: 'Leads', count: counts.leads },
    { id: 'contacts', label: 'Contacts', count: counts.contacts },
    { id: 'accounts', label: 'Accounts', count: counts.accounts },
    { id: 'opportunities', label: 'Opportunities', count: counts.opportunities },
    { id: 'tasks', label: 'Tasks', count: counts.tasks }
  ];

  return (
    <div className="flex border-b bg-white">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}