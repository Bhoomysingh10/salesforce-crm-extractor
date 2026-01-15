const { useState, useEffect } = React;

function App() {
  const [activeTab, setActiveTab] = useState('leads');
  const [data, setData] = useState({
    leads: [],
    contacts: [],
    accounts: [],
    opportunities: [],
    tasks: [],
    lastSync: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const listener = (changes, namespace) => {
      if (namespace === 'local' && changes.salesforce_data) {
        setData(changes.salesforce_data.newValue || {
          leads: [],
          contacts: [],
          accounts: [],
          opportunities: [],
          tasks: [],
          lastSync: {}
        });
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const loadData = () => {
    chrome.storage.local.get(['salesforce_data'], (result) => {
      if (result.salesforce_data) {
        setData(result.salesforce_data);
      }
    });
  };

  const handleExtract = () => {
    setIsExtracting(true);
    setMessage(null);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startExtraction' }, (response) => {
          setIsExtracting(false);
          
          if (response && response.success) {
            showMessage(`Successfully extracted ${response.count} ${response.objectType}`, 'success');
            loadData();
          } else {
            showMessage(response?.error || 'Extraction failed', 'error');
          }
        });
      }
    });
  };

  const handleDelete = (objectType, recordId) => {
    chrome.runtime.sendMessage({
      action: 'deleteRecord',
      objectType: objectType,
      recordId: recordId
    }, (response) => {
      if (response.success) {
        showMessage('Record deleted', 'success');
        loadData();
      }
    });
  };

  const handleClear = (objectType) => {
    if (confirm(`Clear all ${objectType}?`)) {
      chrome.runtime.sendMessage({
        action: 'clearData',
        objectType: objectType
      }, (response) => {
        if (response.success) {
          showMessage(`All ${objectType} cleared`, 'success');
          loadData();
        }
      });
    }
  };

  const handleExport = (format) => {
    const currentData = data[activeTab] || [];
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      downloadFile(blob, `${activeTab}-${Date.now()}.json`);
    } else if (format === 'csv') {
      const csv = convertToCSV(currentData);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadFile(blob, `${activeTab}-${Date.now()}.csv`);
    }
    
    showMessage(`Exported ${currentData.length} records as ${format.toUpperCase()}`, 'success');
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const getFilteredData = () => {
    const currentData = data[activeTab] || [];
    
    if (!searchTerm) return currentData;
    
    return currentData.filter(record => {
      return Object.values(record).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const tabs = [
    { id: 'leads', label: 'Leads', icon: '👤' },
    { id: 'contacts', label: 'Contacts', icon: '📇' },
    { id: 'accounts', label: 'Accounts', icon: '🏢' },
    { id: 'opportunities', label: 'Opportunities', icon: '💰' },
    { id: 'tasks', label: 'Tasks', icon: '✓' }
  ];

  const filteredData = getFilteredData();

  return React.createElement('div', { className: 'flex flex-col h-full bg-gray-50' },
    // Header
    React.createElement('div', { className: 'bg-blue-600 text-white p-4' },
      React.createElement('h1', { className: 'text-lg font-bold' }, 'Salesforce CRM Extractor'),
      React.createElement('p', { className: 'text-sm text-blue-100' }, 'Extract and manage your Salesforce data')
    ),

    // Actions Bar
    React.createElement('div', { className: 'bg-white border-b p-3 flex items-center gap-2' },
      React.createElement('button', {
        onClick: handleExtract,
        disabled: isExtracting,
        className: `flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm ${isExtracting ? 'opacity-50' : ''}`
      }, isExtracting ? 'Extracting...' : '⬇ Extract Current Page'),
      
      React.createElement('div', { className: 'flex gap-1' },
        React.createElement('button', {
          onClick: () => handleExport('json'),
          className: 'bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-xs',
          title: 'Export as JSON'
        }, 'JSON'),
        
        React.createElement('button', {
          onClick: () => handleExport('csv'),
          className: 'bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-xs',
          title: 'Export as CSV'
        }, 'CSV')
      )
    ),

    // Message
    message && React.createElement('div', {
      className: `px-4 py-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm`
    }, message.text),

    // Tabs
    React.createElement('div', { className: 'flex bg-white border-b overflow-x-auto' },
      tabs.map(tab =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: `px-4 py-2 text-sm font-medium whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`
        }, `${tab.icon} ${tab.label} (${(data[tab.id] || []).length})`)
      )
    ),

    // Search and Info
    React.createElement('div', { className: 'bg-white border-b p-3' },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search records...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        className: 'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
      }),
      
      React.createElement('div', { className: 'flex justify-between items-center mt-2 text-xs text-gray-600' },
        React.createElement('span', null, 
          `${filteredData.length} records`,
          data.lastSync[activeTab] && ` • Last sync: ${formatDate(data.lastSync[activeTab])}`
        ),
        
        (data[activeTab] || []).length > 0 && React.createElement('button', {
          onClick: () => handleClear(activeTab),
          className: 'text-red-600 hover:text-red-800'
        }, 'Clear All')
      )
    ),

    // Content
    React.createElement('div', { className: 'flex-1 overflow-y-auto p-4' },
      filteredData.length === 0
        ? React.createElement('div', { className: 'text-center text-gray-500 py-8' },
            React.createElement('p', { className: 'text-lg mb-2' }, '📭'),
            React.createElement('p', null, 'No records found'),
            React.createElement('p', { className: 'text-sm mt-2' }, 'Navigate to a Salesforce page and click Extract')
          )
        : React.createElement(RecordList, {
            records: filteredData,
            objectType: activeTab,
            onDelete: handleDelete
          })
    )
  );
}

function RecordList({ records, objectType, onDelete }) {
  return React.createElement('div', { className: 'space-y-2' },
    records.map((record, index) =>
      React.createElement(RecordCard, {
        key: record.id || index,
        record: record,
        objectType: objectType,
        onDelete: onDelete
      })
    )
  );
}

function RecordCard({ record, objectType, onDelete }) {
  const getDisplayFields = () => {
    switch (objectType) {
      case 'leads':
        return [
          { label: 'Name', value: record.name },
          { label: 'Company', value: record.company },
          { label: 'Email', value: record.email },
          { label: 'Phone', value: record.phone },
          { label: 'Status', value: record.status, badge: true },
          { label: 'Owner', value: record.owner }
        ];
      
      case 'contacts':
        return [
          { label: 'Name', value: record.name },
          { label: 'Account', value: record.account },
          { label: 'Title', value: record.title },
          { label: 'Email', value: record.email },
          { label: 'Phone', value: record.phone },
          { label: 'Owner', value: record.owner }
        ];
      
      case 'accounts':
        return [
          { label: 'Name', value: record.name },
          { label: 'Industry', value: record.industry },
          { label: 'Website', value: record.website },
          { label: 'Phone', value: record.phone },
          { label: 'Revenue', value: record.annualRevenue ? `$${record.annualRevenue.toLocaleString()}` : '' },
          { label: 'Owner', value: record.owner }
        ];
      
      case 'opportunities':
        return [
          { label: 'Name', value: record.name },
          { label: 'Account', value: record.account },
          { label: 'Amount', value: record.amount ? `$${record.amount.toLocaleString()}` : '' },
          { label: 'Stage', value: record.stage, badge: true },
          { label: 'Probability', value: record.probability ? `${record.probability}%` : '' },
          { label: 'Close Date', value: record.closeDate },
          { label: 'Owner', value: record.owner }
        ];
      
      case 'tasks':
        return [
          { label: 'Subject', value: record.subject },
          { label: 'Due Date', value: record.dueDate },
          { label: 'Status', value: record.status, badge: true },
          { label: 'Priority', value: record.priority, badge: true },
          { label: 'Related To', value: record.relatedTo },
          { label: 'Assigned To', value: record.assignedTo }
        ];
      
      default:
        return [];
    }
  };

  const fields = getDisplayFields().filter(f => f.value);

  return React.createElement('div', { className: 'bg-white border rounded-lg p-3 hover:shadow-md transition-shadow' },
    React.createElement('div', { className: 'flex justify-between items-start mb-2' },
      React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm' },
        record.name || record.subject || 'Unnamed Record'
      ),
      
      React.createElement('button', {
        onClick: () => onDelete(objectType, record.id),
        className: 'text-red-600 hover:text-red-800 text-xs'
      }, '✕')
    ),
    
    React.createElement('div', { className: 'space-y-1' },
      fields.map((field, idx) =>
        React.createElement('div', { key: idx, className: 'flex text-xs' },
          React.createElement('span', { className: 'text-gray-600 w-24 flex-shrink-0' }, field.label + ':'),
          field.badge
            ? React.createElement('span', {
                className: 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs'
              }, field.value)
            : React.createElement('span', { className: 'text-gray-800' }, field.value)
        )
      )
    )
  );
}

// Render the app
ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);