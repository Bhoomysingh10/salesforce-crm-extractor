import React, { useState, useEffect } from 'react';
import { Tabs } from './components/Tabs';
import { LeadsTab } from './components/LeadsTab';
import { ContactsTab } from './components/ContactsTab';
import { AccountsTab } from './components/AccountsTab';
import { OpportunitiesTab } from './components/OpportunitiesTab';
import { TasksTab } from './components/TasksTab';
import { useStorage } from './hooks/useStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState('opportunities');
  const { data, loading, refresh, deleteRecord, exportData } = useStorage();

  const handleExtractCurrentPage = async () => {
    try {
      // Send message to content script to extract current page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_PAGE' });
        // Refresh data after extraction
        setTimeout(refresh, 1000);
      }
    } catch (error) {
      console.error('Error extracting current page:', error);
    }
  };

  return (
    <div className="w-[600px] h-[500px] bg-gray-50 font-sans">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Salesforce CRM Data Extractor</h1>
        <button
          onClick={handleExtractCurrentPage}
          className="mt-2 bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          {loading ? 'Extracting...' : 'Extract Current Object'}
        </button>
      </header>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} counts={data.metadata.totalRecords} />

      <div className="p-4 overflow-y-auto h-[380px]">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'leads' && <LeadsTab data={data.leads} onDelete={deleteRecord} />}
            {activeTab === 'contacts' && <ContactsTab data={data.contacts} onDelete={deleteRecord} />}
            {activeTab === 'accounts' && <AccountsTab data={data.accounts} onDelete={deleteRecord} />}
            {activeTab === 'opportunities' && (
              <OpportunitiesTab
                data={data.opportunities}
                stages={data.metadata.opportunityStages}
                onDelete={deleteRecord}
              />
            )}
            {activeTab === 'tasks' && <TasksTab data={data.tasks} onDelete={deleteRecord} />}
          </>
        )}
      </div>

      <footer className="p-4 border-t flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Last sync: {data.metadata.lastSync[activeTab] ?
            new Date(data.metadata.lastSync[activeTab]).toLocaleString() :
            'Never'
          }
        </span>
        <button
          onClick={() => exportData(activeTab)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          disabled={loading}
        >
          Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </footer>
    </div>
  );
}