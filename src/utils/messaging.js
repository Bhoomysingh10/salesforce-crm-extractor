// Messaging utilities for communication between content scripts, popup, and background

// Send message to background script
export function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Send message to content script
export function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Listen for messages
export function addMessageListener(callback) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    callback(message, sender, sendResponse);
    // Return true to indicate async response
    return true;
  });
}

// Message types
export const MESSAGE_TYPES = {
  EXTRACT_CURRENT_PAGE: 'EXTRACT_CURRENT_PAGE',
  EXTRACTION_COMPLETE: 'EXTRACTION_COMPLETE',
  SAVE_EXTRACTED_DATA: 'SAVE_EXTRACTED_DATA',
  GET_STORAGE: 'GET_STORAGE',
  UPDATE_STORAGE: 'UPDATE_STORAGE',
  STORAGE_UPDATED: 'STORAGE_UPDATED',
  DELETE_RECORD: 'DELETE_RECORD',
  EXPORT_DATA: 'EXPORT_DATA',
  SHOW_STATUS: 'SHOW_STATUS',
  HIDE_STATUS: 'HIDE_STATUS'
};

// Create standardized messages
export function createMessage(type, payload = {}) {
  return {
    type,
    ...payload,
    timestamp: Date.now()
  };
}

// Extract current page message
export function createExtractMessage() {
  return createMessage(MESSAGE_TYPES.EXTRACT_CURRENT_PAGE);
}

// Save data message
export function createSaveDataMessage(objectType, data) {
  return createMessage(MESSAGE_TYPES.SAVE_EXTRACTED_DATA, {
    objectType,
    data
  });
}

// Get storage message
export function createGetStorageMessage() {
  return createMessage(MESSAGE_TYPES.GET_STORAGE);
}

// Update storage message
export function createUpdateStorageMessage(data) {
  return createMessage(MESSAGE_TYPES.UPDATE_STORAGE, { data });
}

// Delete record message
export function createDeleteRecordMessage(objectType, recordId) {
  return createMessage(MESSAGE_TYPES.DELETE_RECORD, {
    objectType,
    recordId
  });
}

// Export data message
export function createExportDataMessage(objectType) {
  return createMessage(MESSAGE_TYPES.EXPORT_DATA, { objectType });
}

// Status messages
export function createStatusMessage(message, type = 'loading') {
  return createMessage(MESSAGE_TYPES.SHOW_STATUS, {
    message,
    statusType: type
  });
}

// Broadcast storage update to all tabs
export async function broadcastStorageUpdate(data) {
  const tabs = await chrome.tabs.query({});
  const promises = tabs.map(tab =>
    sendMessageToContentScript(tab.id, createMessage(MESSAGE_TYPES.STORAGE_UPDATED, { data }))
      .catch(() => {}) // Ignore errors for closed tabs
  );
  await Promise.all(promises);
}