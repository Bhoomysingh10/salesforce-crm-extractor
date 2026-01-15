import { useState } from 'react';

export function useExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtraction, setLastExtraction] = useState(null);

  const extractCurrentPage = async () => {
    setIsExtracting(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Check if we're on a Salesforce page
      if (!tab.url.includes('salesforce.com') && !tab.url.includes('lightning.force.com')) {
        throw new Error('Not on a Salesforce page');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_CURRENT_PAGE'
      });

      if (response && response.success) {
        setLastExtraction({
          timestamp: Date.now(),
          recordCount: response.data ? response.data.length : 0,
          objectType: response.objectType
        });
      } else {
        throw new Error(response?.error || 'Extraction failed');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      throw error;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractCurrentPage,
    isExtracting,
    lastExtraction
  };
}