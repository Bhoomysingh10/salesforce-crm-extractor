// Content Script - Extracts data from Salesforce pages

// Salesforce object type detection and extraction
const SalesforceExtractor = {
  // Detect which Salesforce object is currently being viewed
  detectObjectType() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    // Check URL patterns
    if (url.includes('/lightning/o/Lead/') || pathname.includes('/Lead/')) return 'leads';
    if (url.includes('/lightning/o/Contact/') || pathname.includes('/Contact/')) return 'contacts';
    if (url.includes('/lightning/o/Account/') || pathname.includes('/Account/')) return 'accounts';
    if (url.includes('/lightning/o/Opportunity/') || pathname.includes('/Opportunity/')) return 'opportunities';
    if (url.includes('/lightning/o/Task/') || pathname.includes('/Task/')) return 'tasks';
    
    // Check page title
    const title = document.title.toLowerCase();
    if (title.includes('lead')) return 'leads';
    if (title.includes('contact')) return 'contacts';
    if (title.includes('account')) return 'accounts';
    if (title.includes('opportunit')) return 'opportunities';
    if (title.includes('task')) return 'tasks';
    
    return null;
  },

  // Extract data based on object type
  async extract() {
    const objectType = this.detectObjectType();
    
    if (!objectType) {
      return { success: false, error: 'Could not detect Salesforce object type', data: [] };
    }
    
    this.showIndicator('extracting', objectType);
    
    try {
      let data = [];
      
      // Wait for Lightning components to load
      await this.waitForLightning();
      
      // Check if we're on a list view or detail view
      const isListView = this.isListView();
      const isKanbanView = this.isKanbanView();
      
      if (isListView) {
        data = await this.extractFromListView(objectType);
      } else if (isKanbanView) {
        data = await this.extractFromKanbanView(objectType);
      } else {
        // Detail view - extract single record
        data = await this.extractFromDetailView(objectType);
      }
      
      if (data.length > 0) {
        this.showIndicator('success', objectType, data.length);
        
        // Save to storage
        chrome.runtime.sendMessage({
          action: 'saveData',
          objectType: objectType,
          data: data
        });
        
        setTimeout(() => this.hideIndicator(), 3000);
        
        return { success: true, objectType, count: data.length, data };
      } else {
        this.showIndicator('error', objectType);
        setTimeout(() => this.hideIndicator(), 3000);
        return { success: false, error: 'No data found', data: [] };
      }
      
    } catch (error) {
      console.error('Extraction error:', error);
      this.showIndicator('error', objectType);
      setTimeout(() => this.hideIndicator(), 3000);
      return { success: false, error: error.message, data: [] };
    }
  },

  waitForLightning() {
    return new Promise((resolve) => {
      const check = () => {
        const lightningOut = document.querySelector('.slds-scope, [class*="oneContent"]');
        if (lightningOut) {
          setTimeout(resolve, 500); // Extra wait for dynamic content
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  isListView() {
    return document.querySelector('.listViewContent, .slds-table, table[role="grid"]') !== null;
  },

  isKanbanView() {
    return document.querySelector('.kanbanBoard, [class*="kanban"]') !== null;
  },

  // Extract from list view (table format)
  async extractFromListView(objectType) {
    const data = [];
    
    // Find table rows
    const rows = document.querySelectorAll('table tbody tr, .slds-table tbody tr, [role="row"]');
    
    for (const row of rows) {
      try {
        const record = this.extractRecordFromRow(row, objectType);
        if (record && record.id) {
          data.push(record);
        }
      } catch (e) {
        console.warn('Failed to extract row:', e);
      }
    }
    
    return data;
  },

  // Extract from Kanban view (opportunity pipeline)
  async extractFromKanbanView(objectType) {
    const data = [];
    const cards = document.querySelectorAll('.kanban-card, [class*="kanban"] [class*="card"]');
    
    for (const card of cards) {
      try {
        const record = this.extractRecordFromCard(card, objectType);
        if (record && record.id) {
          data.push(record);
        }
      } catch (e) {
        console.warn('Failed to extract card:', e);
      }
    }
    
    return data;
  },

  // Extract from detail view (single record page)
  async extractFromDetailView(objectType) {
    const data = [];
    
    try {
      const record = this.extractRecordFromDetail(objectType);
      if (record && record.id) {
        data.push(record);
      }
    } catch (e) {
      console.error('Failed to extract detail view:', e);
    }
    
    return data;
  },

  extractRecordFromRow(row, objectType) {
    const cells = row.querySelectorAll('td, [role="gridcell"]');
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    switch (objectType) {
      case 'leads':
        return this.extractLeadFromRow(row, cells);
      case 'contacts':
        return this.extractContactFromRow(row, cells);
      case 'accounts':
        return this.extractAccountFromRow(row, cells);
      case 'opportunities':
        return this.extractOpportunityFromRow(row, cells);
      case 'tasks':
        return this.extractTaskFromRow(row, cells);
      default:
        return null;
    }
  },

  extractLeadFromRow(row, cells) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    // Try to extract from data attributes or text content
    const nameLink = row.querySelector('a[title], th a, td:first-child a');
    record.name = nameLink ? nameLink.textContent.trim() : this.getTextFromCell(cells[0]);
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    // Extract other fields from cells
    record.company = this.getTextFromCell(cells[1]) || '';
    record.email = this.extractEmail(row) || '';
    record.phone = this.extractPhone(row) || '';
    record.leadSource = this.findFieldValue(row, ['lead source', 'source']) || '';
    record.status = this.findFieldValue(row, ['status', 'lead status']) || '';
    record.owner = this.findFieldValue(row, ['owner', 'lead owner']) || '';
    
    return record;
  },

  extractContactFromRow(row, cells) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    const nameLink = row.querySelector('a[title], th a');
    record.name = nameLink ? nameLink.textContent.trim() : this.getTextFromCell(cells[0]);
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    record.email = this.extractEmail(row) || '';
    record.phone = this.extractPhone(row) || '';
    record.account = this.findFieldValue(row, ['account', 'account name']) || '';
    record.title = this.findFieldValue(row, ['title', 'job title']) || '';
    record.owner = this.findFieldValue(row, ['owner', 'contact owner']) || '';
    record.mailingAddress = this.findFieldValue(row, ['address', 'mailing']) || '';
    
    return record;
  },

  extractAccountFromRow(row, cells) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    const nameLink = row.querySelector('a[title], th a');
    record.name = nameLink ? nameLink.textContent.trim() : this.getTextFromCell(cells[0]);
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    record.website = this.extractUrl(row) || '';
    record.phone = this.extractPhone(row) || '';
    record.industry = this.findFieldValue(row, ['industry']) || '';
    record.type = this.findFieldValue(row, ['type', 'account type']) || '';
    record.owner = this.findFieldValue(row, ['owner', 'account owner']) || '';
    record.annualRevenue = this.extractNumber(this.findFieldValue(row, ['revenue', 'annual revenue'])) || 0;
    
    return record;
  },

  extractOpportunityFromRow(row, cells) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    const nameLink = row.querySelector('a[title], th a');
    record.name = nameLink ? nameLink.textContent.trim() : this.getTextFromCell(cells[0]);
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    record.amount = this.extractNumber(this.findFieldValue(row, ['amount', 'value'])) || 0;
    record.stage = this.findFieldValue(row, ['stage', 'opportunity stage']) || '';
    record.probability = this.extractNumber(this.findFieldValue(row, ['probability', 'prob'])) || 0;
    record.closeDate = this.findFieldValue(row, ['close', 'close date']) || '';
    record.forecastCategory = this.findFieldValue(row, ['forecast', 'category']) || '';
    record.owner = this.findFieldValue(row, ['owner', 'opportunity owner']) || '';
    record.account = this.findFieldValue(row, ['account', 'account name']) || '';
    
    return record;
  },

  extractTaskFromRow(row, cells) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    const nameLink = row.querySelector('a[title], th a');
    record.subject = nameLink ? nameLink.textContent.trim() : this.getTextFromCell(cells[0]);
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    record.dueDate = this.findFieldValue(row, ['due', 'due date']) || '';
    record.status = this.findFieldValue(row, ['status', 'task status']) || '';
    record.priority = this.findFieldValue(row, ['priority']) || '';
    record.relatedTo = this.findFieldValue(row, ['related', 'related to']) || '';
    record.assignedTo = this.findFieldValue(row, ['assigned', 'assigned to']) || '';
    
    return record;
  },

  extractRecordFromCard(card, objectType) {
    // Extract from Kanban card (mainly for Opportunities)
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    const nameLink = card.querySelector('a[title], .cardTitle a, h3 a');
    record.name = nameLink ? nameLink.textContent.trim() : '';
    record.id = this.extractIdFromElement(nameLink) || record.id;
    
    if (objectType === 'opportunities') {
      const stage = card.closest('[data-column-name], [class*="column"]');
      record.stage = stage ? stage.getAttribute('data-column-name') || stage.querySelector('h2, .columnTitle')?.textContent.trim() : '';
      
      record.amount = this.extractNumber(card.textContent) || 0;
      record.account = this.findFieldValue(card, ['account']) || '';
      record.closeDate = this.findFieldValue(card, ['close']) || '';
      record.probability = this.extractNumber(this.findFieldValue(card, ['probability', '%'])) || 0;
      record.owner = this.findFieldValue(card, ['owner']) || '';
    }
    
    return record;
  },

  extractRecordFromDetail(objectType) {
    const record = { id: this.generateId(), extractedAt: Date.now() };
    
    // Extract ID from URL
    const urlMatch = window.location.href.match(/\/([a-zA-Z0-9]{15,18})(?:\/|$|\?)/);
    if (urlMatch) record.id = urlMatch[1];
    
    // Extract fields from detail page
    const fields = document.querySelectorAll('.slds-form-element, .forcePageBlockItemView, [class*="field"]');
    
    switch (objectType) {
      case 'leads':
        record.name = this.getFieldValue(fields, 'Name') || document.querySelector('h1')?.textContent.trim() || '';
        record.company = this.getFieldValue(fields, 'Company') || '';
        record.email = this.getFieldValue(fields, 'Email') || '';
        record.phone = this.getFieldValue(fields, 'Phone') || '';
        record.leadSource = this.getFieldValue(fields, 'Lead Source') || '';
        record.status = this.getFieldValue(fields, 'Status', 'Lead Status') || '';
        record.owner = this.getFieldValue(fields, 'Owner', 'Lead Owner') || '';
        break;
        
      case 'contacts':
        record.name = this.getFieldValue(fields, 'Name') || document.querySelector('h1')?.textContent.trim() || '';
        record.email = this.getFieldValue(fields, 'Email') || '';
        record.phone = this.getFieldValue(fields, 'Phone') || '';
        record.account = this.getFieldValue(fields, 'Account', 'Account Name') || '';
        record.title = this.getFieldValue(fields, 'Title') || '';
        record.owner = this.getFieldValue(fields, 'Owner', 'Contact Owner') || '';
        record.mailingAddress = this.getFieldValue(fields, 'Mailing Address', 'Address') || '';
        break;
        
      case 'accounts':
        record.name = this.getFieldValue(fields, 'Account Name', 'Name') || document.querySelector('h1')?.textContent.trim() || '';
        record.website = this.getFieldValue(fields, 'Website') || '';
        record.phone = this.getFieldValue(fields, 'Phone') || '';
        record.industry = this.getFieldValue(fields, 'Industry') || '';
        record.type = this.getFieldValue(fields, 'Type', 'Account Type') || '';
        record.owner = this.getFieldValue(fields, 'Owner', 'Account Owner') || '';
        record.annualRevenue = this.extractNumber(this.getFieldValue(fields, 'Annual Revenue', 'Revenue')) || 0;
        break;
        
      case 'opportunities':
        record.name = this.getFieldValue(fields, 'Opportunity Name', 'Name') || document.querySelector('h1')?.textContent.trim() || '';
        record.amount = this.extractNumber(this.getFieldValue(fields, 'Amount')) || 0;
        record.stage = this.getFieldValue(fields, 'Stage', 'Opportunity Stage') || '';
        record.probability = this.extractNumber(this.getFieldValue(fields, 'Probability')) || 0;
        record.closeDate = this.getFieldValue(fields, 'Close Date') || '';
        record.forecastCategory = this.getFieldValue(fields, 'Forecast Category') || '';
        record.owner = this.getFieldValue(fields, 'Owner', 'Opportunity Owner') || '';
        record.account = this.getFieldValue(fields, 'Account', 'Account Name') || '';
        break;
        
      case 'tasks':
        record.subject = this.getFieldValue(fields, 'Subject') || document.querySelector('h1')?.textContent.trim() || '';
        record.dueDate = this.getFieldValue(fields, 'Due Date') || '';
        record.status = this.getFieldValue(fields, 'Status', 'Task Status') || '';
        record.priority = this.getFieldValue(fields, 'Priority') || '';
        record.relatedTo = this.getFieldValue(fields, 'Related To') || '';
        record.assignedTo = this.getFieldValue(fields, 'Assigned To') || '';
        break;
    }
    
    return record;
  },

  // Utility functions
  getFieldValue(fields, ...labels) {
    for (const field of fields) {
      const label = field.querySelector('label, .slds-form-element__label, [class*="label"]');
      if (label) {
        const labelText = label.textContent.trim().toLowerCase();
        for (const searchLabel of labels) {
          if (labelText.includes(searchLabel.toLowerCase())) {
            const value = field.querySelector('.slds-form-element__control, [class*="outputField"], [class*="value"]');
            return value ? value.textContent.trim() : '';
          }
        }
      }
    }
    return '';
  },

  getTextFromCell(cell) {
    if (!cell) return '';
    return cell.textContent.trim();
  },

  findFieldValue(element, keywords) {
    const text = element.textContent;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword + '[:\\s]+([^\\n]+)', 'i');
      const match = text.match(regex);
      if (match) return match[1].trim();
    }
    
    // Try data attributes
    for (const keyword of keywords) {
      const attr = element.querySelector(`[data-${keyword}], [aria-label*="${keyword}"]`);
      if (attr) return attr.textContent.trim();
    }
    
    return '';
  },

  extractEmail(element) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = element.textContent.match(emailRegex);
    return match ? match[0] : '';
  },

  extractPhone(element) {
    const phoneRegex = /[\d\s\-\(\)\.+]{10,}/;
    const match = element.textContent.match(phoneRegex);
    return match ? match[0].trim() : '';
  },

  extractUrl(element) {
    const urlLink = element.querySelector('a[href^="http"]');
    return urlLink ? urlLink.href : '';
  },

  extractNumber(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  },

  extractIdFromElement(element) {
    if (!element) return null;
    const href = element.getAttribute('href') || '';
    const match = href.match(/\/([a-zA-Z0-9]{15,18})(?:\/|$|\?)/);
    return match ? match[1] : null;
  },

  generateId() {
    return 'SF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Visual indicator with Shadow DOM
  showIndicator(status, objectType, count = 0) {
    this.hideIndicator();
    
    const container = document.createElement('div');
    container.id = 'sf-extractor-indicator';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 999999;';
    
    const shadow = container.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      .indicator {
        background: white;
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      
      .extracting { background: #0070d2; color: white; }
      .success { background: #2e844a; color: white; }
      .error { background: #c23934; color: white; }
      
      .content {
        flex: 1;
      }
      
      .title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        color: #333;
      }
      
      .message {
        font-size: 12px;
        color: #666;
      }
      
      .spinner {
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    const indicator = document.createElement('div');
    indicator.className = 'indicator';
    
    let icon, title, message;
    
    if (status === 'extracting') {
      icon = '<div class="spinner"></div>';
      title = 'Extracting Data';
      message = `Scanning ${objectType}...`;
    } else if (status === 'success') {
      icon = '✓';
      title = 'Extraction Complete';
      message = `${count} ${objectType} extracted`;
    } else {
      icon = '✕';
      title = 'Extraction Failed';
      message = `Could not extract ${objectType}`;
    }
    
    indicator.innerHTML = `
      <div class="icon ${status}">${icon}</div>
      <div class="content">
        <div class="title">${title}</div>
        <div class="message">${message}</div>
      </div>
    `;
    
    shadow.appendChild(style);
    shadow.appendChild(indicator);
    document.body.appendChild(container);
  },

  hideIndicator() {
    const existing = document.getElementById('sf-extractor-indicator');
    if (existing) existing.remove();
  }
};

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startExtraction') {
    SalesforceExtractor.extract().then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open
  }
});

// Auto-detect and show extraction button (optional)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('Salesforce CRM Data Extractor loaded');
}