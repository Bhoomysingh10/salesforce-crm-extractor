// Storage utilities for managing Salesforce data in Chrome storage

const STORAGE_KEY = 'salesforce_data';

// Get all stored Salesforce data
export async function getStoredData() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const data = result[STORAGE_KEY] || getDefaultStorageSchema();
      resolve(data);
    });
  });
}

// Update stored data
export async function updateStoredData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      resolve();
    });
  });
}

// Add or update records for a specific object type
export async function saveRecords(objectType, records) {
  const data = await getStoredData();

  if (!data[objectType]) {
    data[objectType] = [];
  }

  // Merge records (update existing, add new)
  const mergedRecords = mergeRecords(data[objectType], records);
  data[objectType] = mergedRecords;

  // Update metadata
  updateMetadata(data, objectType, records);

  await updateStoredData(data);
  return mergedRecords;
}

// Delete a record by ID
export async function deleteRecord(objectType, recordId) {
  const data = await getStoredData();

  if (data[objectType]) {
    data[objectType] = data[objectType].filter(record => record.id !== recordId);
    updateMetadata(data, objectType);
    await updateStoredData(data);
  }
}

// Clear all data for an object type
export async function clearObjectData(objectType) {
  const data = await getStoredData();
  data[objectType] = [];
  updateMetadata(data, objectType);
  await updateStoredData(data);
}

// Clear all stored data
export async function clearAllData() {
  await updateStoredData(getDefaultStorageSchema());
}

// Get default storage schema
function getDefaultStorageSchema() {
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

// Merge records, handling updates and deduplication
function mergeRecords(existingRecords, newRecords) {
  const recordMap = new Map();

  // Add existing records
  existingRecords.forEach(record => {
    recordMap.set(record.id, record);
  });

  // Add or update with new records
  newRecords.forEach(newRecord => {
    if (newRecord.id) {
      const existing = recordMap.get(newRecord.id);
      if (existing) {
        // Update existing record
        recordMap.set(newRecord.id, {
          ...existing,
          ...newRecord,
          updatedAt: Date.now()
        });
      } else {
        // Add new record
        recordMap.set(newRecord.id, {
          ...newRecord,
          createdAt: Date.now()
        });
      }
    }
  });

  return Array.from(recordMap.values());
}

// Update metadata after data changes
function updateMetadata(data, objectType, newRecords = []) {
  // Update total counts
  data.metadata.totalRecords[objectType] = data[objectType].length;

  // Update last sync time
  data.metadata.lastSync[objectType] = Date.now();

  // Update opportunity stage counts if applicable
  if (objectType === 'opportunities') {
    updateOpportunityStageCounts(data);
  }
}

// Update opportunity stage counts for pipeline visualization
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

// Convert stage name to metadata key
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

// Export data for a specific object type
export async function exportData(objectType) {
  const data = await getStoredData();
  return data[objectType] || [];
}

// Get storage statistics
export async function getStorageStats() {
  const data = await getStoredData();

  const stats = {
    totalRecords: 0,
    lastSync: data.metadata.lastSync,
    objectCounts: {}
  };

  Object.keys(data.metadata.totalRecords).forEach(objectType => {
    const count = data.metadata.totalRecords[objectType];
    stats.objectCounts[objectType] = count;
    stats.totalRecords += count;
  });

  return stats;
}