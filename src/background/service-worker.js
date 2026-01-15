// Background service worker for Salesforce CRM Extractor
// Handles storage operations and cross-tab synchronization

import { saveRecords, deleteRecord } from '../utils/storage.js';

// Listen for storage changes and broadcast to all tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.salesforce_data) {
    // Broadcast update to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'STORAGE_UPDATED',
          data: changes.salesforce_data.newValue
        }).catch(() => {
          // Tab might be closed, ignore error
        });
      });
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    // Handle extraction requests
    handleExtraction(message, sender, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_STORAGE') {
    chrome.storage.local.get('salesforce_data', (result) => {
      sendResponse(result.salesforce_data || getDefaultStorage());
    });
    return true;
  }

  if (message.type === 'UPDATE_STORAGE') {
    chrome.storage.local.set({ salesforce_data: message.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'SAVE_EXTRACTED_DATA') {
    handleSaveExtractedData(message, sendResponse);
    return true;
  }

  if (message.type === 'DELETE_RECORD') {
    handleDeleteRecord(message, sendResponse);
    return true;
  }
});

function handleExtraction(message, sender, sendResponse) {
  // Get current tab and inject extraction script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content/contentScript.js']
      }, () => {
        // Script injected, extraction will happen via content script
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ error: 'No active tab found' });
    }
  });
}

async function handleSaveExtractedData(message, sendResponse) {
  try {
    const { objectType, data } = message;
    await saveRecords(objectType, data);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving extracted data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteRecord(message, sendResponse) {
  try {
    const { objectType, recordId } = message;
    // Get current data
    const result = await chrome.storage.local.get('salesforce_data');
    const currentData = result.salesforce_data || getDefaultStorage();

    // Remove the record
    if (currentData[objectType]) {
      currentData[objectType] = currentData[objectType].filter(record => record.id !== recordId);
      // Update metadata
      currentData.metadata.totalRecords[objectType] = currentData[objectType].length;
      currentData.metadata.lastSync[objectType] = Date.now();

      // Update opportunity stages if applicable
      if (objectType === 'opportunities') {
        updateOpportunityStageCounts(currentData);
      }

      await chrome.storage.local.set({ salesforce_data: currentData });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Object type not found' });
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function updateOpportunityStageCounts(data) {
  const stageCounts = {
    prospecting: 0,
    qualification: 0,
    proposal: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0
  };

  data.opportunities.forEach(opp => {
    const stage = opp.stage;
    if (stage) {
      const stageKey = getStageKey(stage);
      if (stageKey && stageCounts.hasOwnProperty(stageKey)) {
        stageCounts[stageKey]++;
      }
    }
  });

  data.metadata.opportunityStages = stageCounts;
}

function getStageKey(stageName) {
  if (!stageName) return null;

  const stageMap = {
    'prospecting': 'prospecting',
    'qualification': 'qualification',
    'proposal': 'proposal',
    'negotiation': 'negotiation',
    'closed won': 'closedWon',
    'closed_won': 'closedWon',
    'closed lost': 'closedLost',
    'closed_lost': 'closedLost'
  };

  return stageMap[stageName.toLowerCase()] || null;
}

function getDefaultStorage() {
  return {
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
  };
}