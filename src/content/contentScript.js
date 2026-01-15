// // contentScript.js - Using dynamic imports

// (async function() {
//   'use strict';

//   try {
//     // Dynamically import modules
//     const { detectSalesforceObject } = await import('./detectors/objectDetector.js');
//     const { extractFromListView } = await import('./parsers/listViewParser.js');
//     const { extractFromDetailPage } = await import('./parsers/detailViewParser.js');
//     const { extractOpportunitiesFromKanban } = await import('./parsers/kanbanParser.js');
//     const { StatusIndicator } = await import('./ui/StatusIndicator.js');
//     const { waitForElement } = await import('../utils/waitForElement.js');

//     class SalesforceExtractor {
//       constructor() {
//         this.statusIndicator = null;
//         this.currentObjectType = null;
//         this.init();
//       }

//       async init() {
//         try {
//           this.currentObjectType = detectSalesforceObject();

//           if (!this.currentObjectType) {
//             console.log('Not a Salesforce object page, skipping extraction setup');
//             return;
//           }

//           console.log(`Detected Salesforce object: ${this.currentObjectType}`);

//           chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//             if (message.type === 'EXTRACT_CURRENT_PAGE') {
//               this.extractCurrentPage()
//                 .then(data => sendResponse({ success: true, data }))
//                 .catch(error => sendResponse({ success: false, error: error.message }));
//               return true;
//             }

//             if (message.type === 'STORAGE_UPDATED') {
//               console.log('Storage updated from another tab');
//             }
//           });

//         } catch (error) {
//           console.error('Error initializing Salesforce extractor:', error);
//         }
//       }

//       async extractCurrentPage() {
//         if (!this.currentObjectType) {
//           throw new Error('No Salesforce object detected on this page');
//         }

//         this.showStatus('Extracting data...', 'loading');

//         try {
//           let extractedData = [];

//           const url = window.location.href;
//           const isListView = url.includes('/list') || document.querySelector('table.slds-table');
//           const isDetailView = url.includes('/view') && !isListView;
//           const isKanbanView = this.currentObjectType === 'Opportunity' &&
//                               (url.includes('/kanban') || document.querySelector('.kanban-column, [data-stage]'));

//           if (isKanbanView) {
//             extractedData = await this.extractFromKanban();
//           } else if (isListView) {
//             extractedData = await this.extractFromList();
//           } else if (isDetailView) {
//             const record = await this.extractFromDetail();
//             extractedData = record ? [record] : [];
//           } else {
//             throw new Error('Unable to determine page type for extraction');
//           }

//           await this.saveExtractedData(extractedData);

//           this.showStatus(`Extracted ${extractedData.length} records`, 'success');
//           return extractedData;

//         } catch (error) {
//           console.error('Extraction error:', error);
//           this.showStatus(`Extraction failed: ${error.message}`, 'error');
//           throw error;
//         }
//       }

//       async extractFromList() {
//         const table = await waitForElement('table.slds-table', 10000);
//         return extractFromListView(table, this.currentObjectType);
//       }

//       async extractFromDetail() {
//         const detailPanel = await waitForElement('records-lwc-detail-panel, force-record-layout-item', 10000);
//         return extractFromDetailPage(detailPanel, this.currentObjectType);
//       }

//       async extractFromKanban() {
//         const kanbanContainer = await waitForElement('.kanban-column, [data-stage], .opportunity-card', 10000);
//         return extractOpportunitiesFromKanban(kanbanContainer);
//       }

//       async saveExtractedData(data) {
//         return new Promise((resolve, reject) => {
//           chrome.runtime.sendMessage({
//             type: 'SAVE_EXTRACTED_DATA',
//             objectType: this.currentObjectType.toLowerCase() + 's',
//             data: data
//           }, (response) => {
//             if (response && response.success) {
//               resolve();
//             } else {
//               reject(new Error('Failed to save data'));
//             }
//           });
//         });
//       }

//       showStatus(message, type = 'loading') {
//         if (!this.statusIndicator) {
//           this.statusIndicator = new StatusIndicator();
//         }
//         this.statusIndicator.show(message, type);
//       }
//     }

//     if (document.readyState === 'loading') {
//       document.addEventListener('DOMContentLoaded', () => new SalesforceExtractor());
//     } else {
//       new SalesforceExtractor();
//     }

//   } catch (error) {
//     console.error('Failed to load content script modules:', error);
//   }
// })();