// Data formatting utilities for Salesforce records

// Format currency values
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return amount.toString();

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(numAmount);
}

// Format dates
export function formatDate(date, options = {}) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return date.toString();

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

// Format phone numbers
export function formatPhoneNumber(phone) {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, '');

  // Format US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone.toString();
}

// Format percentages
export function formatPercentage(value) {
  if (value === null || value === undefined) return '';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return value.toString();

  return `${numValue}%`;
}

// Format record names for display
export function formatRecordName(record) {
  if (!record) return '';

  // For leads and contacts
  if (record.firstName && record.lastName) {
    return `${record.firstName} ${record.lastName}`;
  }

  // For opportunities
  if (record.name) {
    return record.name;
  }

  // For accounts
  if (record.name) {
    return record.name;
  }

  // For tasks
  if (record.subject) {
    return record.subject;
  }

  return 'Unnamed Record';
}

// Format address from components
export function formatAddress(record) {
  const parts = [];

  if (record.street) parts.push(record.street);
  if (record.city) parts.push(record.city);
  if (record.state) parts.push(record.state);
  if (record.postalCode) parts.push(record.postalCode);
  if (record.country) parts.push(record.country);

  return parts.join(', ');
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + '...';
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format opportunity stage for display
export function formatStageName(stage) {
  if (!stage) return 'Unknown';

  const stageMap = {
    'prospecting': 'Prospecting',
    'qualification': 'Qualification',
    'needs_analysis': 'Needs Analysis',
    'value_proposition': 'Value Proposition',
    'id_decision_makers': 'ID Decision Makers',
    'perception_analysis': 'Perception Analysis',
    'proposal_price_quote': 'Proposal',
    'negotiation_review': 'Negotiation',
    'closed_won': 'Closed Won',
    'closed_lost': 'Closed Lost'
  };

  return stageMap[stage.toLowerCase()] || stage;
}

// Get stage color for visualization
export function getStageColor(stage) {
  const colorMap = {
    'prospecting': '#94A3B8',      // gray
    'qualification': '#3B82F6',    // blue
    'needs_analysis': '#F59E0B',   // yellow
    'value_proposition': '#F59E0B', // yellow
    'id_decision_makers': '#F59E0B', // yellow
    'perception_analysis': '#F59E0B', // yellow
    'proposal_price_quote': '#F97316', // orange
    'negotiation_review': '#F97316', // orange
    'closed_won': '#10B981',      // green
    'closed_lost': '#EF4444'      // red
  };

  return colorMap[stage.toLowerCase()] || '#6B7280';
}

// Format time duration
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

// Capitalize first letter of each word
export function capitalizeWords(str) {
  if (!str) return '';

  return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Format boolean values
export function formatBoolean(value) {
  if (value === true || value === 'true') return 'Yes';
  if (value === false || value === 'false') return 'No';
  return '';
}

// Export data as CSV
export function exportToCSV(data, objectType) {
  if (!data || data.length === 0) return;

  // Get all unique keys from all records
  const allKeys = new Set();
  data.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.map(escapeCSV).join(','));

  // Add data rows
  data.forEach(record => {
    const row = headers.map(header => {
      const value = record[header];
      return escapeCSV(formatValueForCSV(value));
    });
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `salesforce_${objectType}_${Date.now()}.csv`, 'text/csv');
}

// Export data as JSON
export function exportToJSON(data, objectType) {
  if (!data) return;

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `salesforce_${objectType}_${Date.now()}.json`, 'application/json');
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

// Format value for CSV export
function formatValueForCSV(value) {
  if (value === null || value === undefined) return '';

  // Format dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Format objects/arrays as JSON strings
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

// Download file helper
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}