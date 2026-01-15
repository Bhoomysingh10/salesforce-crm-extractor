// Parser for Salesforce Lightning list views
// Extracts data from table.slds-table elements

export function extractFromListView(tableElement, objectType) {
  if (!tableElement) {
    throw new Error('No table element found');
  }

  // Get headers to map column positions
  const headerRow = tableElement.querySelector('thead tr');
  if (!headerRow) {
    throw new Error('No table headers found');
  }

  const headers = Array.from(headerRow.querySelectorAll('th')).map(th => {
    // Clean up header text - remove sort indicators, extra spaces
    let text = th.textContent.trim().toLowerCase();
    // Remove common Salesforce header artifacts
    text = text.replace(/↓|↑|sort|sorted/i, '').trim();
    return text;
  });

  console.log('Detected headers:', headers);

  // Get data rows
  const rows = tableElement.querySelectorAll('tbody tr');
  const records = [];

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    const record = {
      id: null,
      extractedAt: Date.now(),
      source: 'list_view'
    };

    // Map cells to headers
    cells.forEach((cell, index) => {
      const fieldName = headers[index];
      if (fieldName) {
        let value = cell.textContent.trim();

        // Handle special cases
        if (fieldName.includes('date') || fieldName.includes('created') || fieldName.includes('modified')) {
          // Try to parse as date
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString();
          }
        } else if (fieldName.includes('amount') || fieldName.includes('probability')) {
          // Clean up currency/numeric fields
          value = value.replace(/[^0-9.-]/g, '');
          if (value) {
            value = parseFloat(value);
          }
        }

        record[fieldName] = value || null;
      }
    });

    // Extract record ID from various sources
    record.id = extractRecordIdFromRow(row);

    // Add object type
    record.objectType = objectType;

    // Only add records with some data
    if (Object.keys(record).length > 3) { // More than just id, extractedAt, source
      records.push(record);
    }
  });

  console.log(`Extracted ${records.length} records from list view`);
  return records;
}

function extractRecordIdFromRow(row) {
  // Method 1: Check for data attributes
  const recordLink = row.querySelector('a[data-refid="recordId"], a[href*="view"]');
  if (recordLink) {
    const href = recordLink.getAttribute('href');
    if (href) {
      const match = href.match(/\/([a-zA-Z0-9]{15,18})\//);
      if (match) return match[1];
    }
  }

  // Method 2: Check for data-record-id attribute
  const recordId = row.getAttribute('data-record-id') ||
                   row.getAttribute('data-id') ||
                   row.querySelector('[data-record-id]')?.getAttribute('data-record-id');

  if (recordId && /^[a-zA-Z0-9]{15,18}$/.test(recordId)) {
    return recordId;
  }

  // Method 3: Generate a temporary ID based on row content hash
  // This is a fallback for when we can't extract the real ID
  const content = row.textContent.trim();
  if (content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `temp_${Math.abs(hash)}`;
  }

  return null;
}

// Handle pagination if present
export function hasPagination() {
  return !!document.querySelector('.slds-pager, .pagination, [data-pagination]');
}

export function getNextPageButton() {
  return document.querySelector('.slds-button_next, .next-page, [title="Next"]');
}

export function getPreviousPageButton() {
  return document.querySelector('.slds-button_previous, .previous-page, [title="Previous"]');
}