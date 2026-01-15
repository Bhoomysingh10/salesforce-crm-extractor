import { useState, useEffect } from 'react';
import { exportToCSV, exportToJSON } from '../../utils/formatters';

export function useStorage() {
  const [data, setData] = useState({
    leads: [],
    contacts: [],
    accounts: [],
    opportunities: [],
    tasks: [],
    metadata: {
      lastSync: {
        leads: null,
        contacts: null,
        accounts: null,
        opportunities: null,
        tasks: null
      },
      totalRecords: {
        leads: 0,
        contacts: 0,
        accounts: 0,
        opportunities: 0,
        tasks: 0
      },
      opportunityStages: {
        prospecting: 0,
        qualification: 0,
        proposal: 0,
        negotiation: 0,
        closedWon: 0,
        closedLost: 0
      }
    }
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await chrome.runtime.sendMessage({ type: 'GET_STORAGE' });
      if (result) {
        setData(result);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (objectType, recordId) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_RECORD',
        objectType,
        recordId
      });
      await refresh();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const exportData = async (objectType) => {
    try {
      const exportData = data[objectType] || [];
      if (exportData.length === 0) {
        alert('No data to export');
        return;
      }

      // Export as CSV by default
      exportToCSV(exportData, objectType);

      // Could add JSON export option in the future
      // exportToJSON(exportData, objectType);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  useEffect(() => {
    refresh();

    // Listen for storage updates from other tabs
    const handleMessage = (message) => {
      if (message.type === 'STORAGE_UPDATED') {
        setData(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return {
    data,
    loading,
    refresh,
    deleteRecord,
    exportData
  };
}