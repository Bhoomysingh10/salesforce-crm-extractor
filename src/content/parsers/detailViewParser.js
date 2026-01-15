// Parser for Salesforce Lightning detail/record pages
// Extracts data from records-lwc-detail-panel and force-record-layout-item

export function extractFromDetailPage(containerElement, objectType) {
  if (!containerElement) {
    throw new Error('No detail container element found');
  }

  const record = {
    id: null,
    objectType: objectType,
    extractedAt: Date.now(),
    source: 'detail_view'
  };

  // Extract record ID from URL
  record.id = extractRecordIdFromUrl();

  // Method 1: Extract from records-lwc-detail-panel (newer Lightning components)
  const detailPanel = document.querySelector('records-lwc-detail-panel');
  if (detailPanel) {
    const fields = detailPanel.querySelectorAll('.slds-form-element');
    fields.forEach(field => {
      const labelElement = field.querySelector('.slds-form-element__label, label');
      const valueElement = field.querySelector('.slds-form-element__control, .slds-form-element__static');

      if (labelElement && valueElement) {
        const label = labelElement.textContent.trim().toLowerCase().replace(/\s+/g, '_');
        let value = valueElement.textContent.trim();

        // Clean up the value
        value = cleanFieldValue(value, label);

        if (label && value) {
          record[label] = value;
        }
      }
    });
  }

  // Method 2: Extract from force-record-layout-item (older components)
  const layoutItems = document.querySelectorAll('force-record-layout-item');
  layoutItems.forEach(item => {
    const label = item.getAttribute('field-label') ||
                  item.querySelector('[data-field-label]')?.getAttribute('data-field-label');

    const value = item.querySelector('.slds-form-element__static')?.textContent.trim() ||
                  item.querySelector('.field-value')?.textContent.trim();

    if (label && value) {
      const cleanLabel = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      record[cleanLabel] = cleanFieldValue(value, cleanLabel);
    }
  });

  // Method 3: Extract from general field containers
  const fieldContainers = document.querySelectorAll('.slds-form-element, .field-container');
  fieldContainers.forEach(container => {
    const label = container.querySelector('label, .label')?.textContent.trim();
    const value = container.querySelector('.slds-form-element__control, .field-value, .slds-text-body_regular')?.textContent.trim();

    if (label && value && !record[label.toLowerCase().replace(/\s+/g, '_')]) {
      const cleanLabel = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      record[cleanLabel] = cleanFieldValue(value, cleanLabel);
    }
  });

  // Extract additional metadata
  record.pageTitle = document.title;
  record.url = window.location.href;

  console.log(`Extracted detail record:`, record);
  return record;
}

function extractRecordIdFromUrl() {
  // Salesforce URLs contain the record ID
  // Format: /lightning/r/ObjectName/RECORD_ID/view
  const match = window.location.pathname.match(/\/r\/\w+\/([a-zA-Z0-9]{15,18})\//);
  return match ? match[1] : null;
}

function cleanFieldValue(value, fieldName) {
  if (!value) return null;

  // Remove extra whitespace
  value = value.trim();

  // Handle empty/null values
  if (value === '' || value.toLowerCase() === 'none' || value === '--') {
    return null;
  }

  // Handle date fields
  if (fieldName.includes('date') || fieldName.includes('created') || fieldName.includes('modified')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Handle currency/amount fields
  if (fieldName.includes('amount') || fieldName.includes('price') || fieldName.includes('cost')) {
    // Remove currency symbols and commas
    const numericValue = value.replace(/[^0-9.-]/g, '');
    if (numericValue) {
      return parseFloat(numericValue);
    }
  }

  // Handle percentage fields
  if (fieldName.includes('percent') || fieldName.includes('probability')) {
    const percentValue = value.replace(/[^0-9.]/g, '');
    if (percentValue) {
      return parseFloat(percentValue);
    }
  }

  // Handle phone numbers (basic cleaning)
  if (fieldName.includes('phone') || fieldName.includes('mobile') || fieldName.includes('fax')) {
    return value.replace(/\s+/g, '');
  }

  // Handle email (basic validation)
  if (fieldName.includes('email')) {
    return value.toLowerCase().trim();
  }

  return value;
}

// Extract related records if present
export function extractRelatedRecords() {
  const relatedLists = document.querySelectorAll('.slds-related-list, .related-list');
  const relatedData = {};

  relatedLists.forEach(list => {
    const title = list.querySelector('.slds-section__title, .related-list-title')?.textContent.trim();
    if (title) {
      const cleanTitle = title.toLowerCase().replace(/\s+/g, '_');
      const records = [];

      // Extract related records (simplified)
      const rows = list.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const record = {};
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          record[`field_${index}`] = cell.textContent.trim();
        });
        if (Object.keys(record).length > 0) {
          records.push(record);
        }
      });

      relatedData[cleanTitle] = records;
    }
  });

  return relatedData;
}