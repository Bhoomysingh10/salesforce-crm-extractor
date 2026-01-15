// Validation utilities for Salesforce records

// Validate email format
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Validate phone number format
export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for valid length (US format)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// Validate Salesforce ID format
export function isValidSalesforceId(id) {
  if (!id || typeof id !== 'string') return false;

  // Salesforce IDs are 15 or 18 characters, alphanumeric
  return /^[a-zA-Z0-9]{15,18}$/.test(id);
}

// Validate date format
export function isValidDate(date) {
  if (!date) return false;

  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

// Validate currency amount
export function isValidCurrency(amount) {
  if (amount === null || amount === undefined) return true; // Allow null/undefined

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0;
}

// Validate percentage
export function isValidPercentage(percentage) {
  if (percentage === null || percentage === undefined) return true;

  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return !isNaN(num) && num >= 0 && num <= 100;
}

// Validate URL format
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate record has required fields
export function validateRecordFields(record, requiredFields) {
  if (!record || typeof record !== 'object') return false;

  return requiredFields.every(field => {
    const value = record[field];
    return value !== null && value !== undefined && value !== '';
  });
}

// Validate opportunity record
export function validateOpportunityRecord(record) {
  if (!record) return false;

  // Must have ID and name
  if (!record.id || !record.name) return false;

  // Validate amount if present
  if (record.amount !== undefined && !isValidCurrency(record.amount)) return false;

  // Validate probability if present
  if (record.probability !== undefined && !isValidPercentage(record.probability)) return false;

  // Validate close date if present
  if (record.closeDate && !isValidDate(record.closeDate)) return false;

  return true;
}

// Validate lead record
export function validateLeadRecord(record) {
  if (!record) return false;

  // Must have ID
  if (!record.id) return false;

  // Should have some contact information
  const hasName = record.firstName || record.lastName || record.name;
  const hasContact = record.email || record.phone;

  if (!hasName && !hasContact) return false;

  // Validate email if present
  if (record.email && !isValidEmail(record.email)) return false;

  // Validate phone if present
  if (record.phone && !isValidPhoneNumber(record.phone)) return false;

  return true;
}

// Validate contact record
export function validateContactRecord(record) {
  if (!record) return false;

  // Must have ID
  if (!record.id) return false;

  // Should have name
  if (!record.firstName && !record.lastName && !record.name) return false;

  // Validate email if present
  if (record.email && !isValidEmail(record.email)) return false;

  // Validate phone numbers if present
  const phoneFields = ['phone', 'mobilePhone', 'homePhone'];
  phoneFields.forEach(field => {
    if (record[field] && !isValidPhoneNumber(record[field])) {
      console.warn(`Invalid phone number for ${field}: ${record[field]}`);
    }
  });

  return true;
}

// Validate account record
export function validateAccountRecord(record) {
  if (!record) return false;

  // Must have ID and name
  if (!record.id || !record.name) return false;

  // Validate website if present
  if (record.website && !isValidUrl(record.website)) return false;

  // Validate employee count if present
  if (record.numberOfEmployees !== undefined) {
    const num = parseInt(record.numberOfEmployees);
    if (isNaN(num) || num < 0) return false;
  }

  return true;
}

// Validate task record
export function validateTaskRecord(record) {
  if (!record) return false;

  // Must have ID and subject
  if (!record.id || !record.subject) return false;

  // Validate dates if present
  const dateFields = ['activityDate', 'dueDate', 'reminderDateTime'];
  dateFields.forEach(field => {
    if (record[field] && !isValidDate(record[field])) {
      console.warn(`Invalid date for ${field}: ${record[field]}`);
    }
  });

  return true;
}

// Validate entire dataset
export function validateDataset(records, objectType) {
  if (!Array.isArray(records)) return { valid: false, errors: ['Records must be an array'] };

  const errors = [];
  const validRecords = [];

  records.forEach((record, index) => {
    let isValid = false;

    try {
      switch (objectType.toLowerCase()) {
        case 'leads':
          isValid = validateLeadRecord(record);
          break;
        case 'contacts':
          isValid = validateContactRecord(record);
          break;
        case 'accounts':
          isValid = validateAccountRecord(record);
          break;
        case 'opportunities':
          isValid = validateOpportunityRecord(record);
          break;
        case 'tasks':
          isValid = validateTaskRecord(record);
          break;
        default:
          isValid = record.id && record.name;
      }

      if (isValid) {
        validRecords.push(record);
      } else {
        errors.push(`Invalid record at index ${index}`);
      }
    } catch (error) {
      errors.push(`Error validating record at index ${index}: ${error.message}`);
    }
  });

  return {
    valid: errors.length === 0,
    validRecords,
    invalidCount: errors.length,
    errors
  };
}

// Sanitize record data
export function sanitizeRecord(record) {
  if (!record || typeof record !== 'object') return {};

  const sanitized = {};

  Object.keys(record).forEach(key => {
    const value = record[key];

    // Remove null, undefined, and empty strings
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Trim strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        sanitized[key] = trimmed;
      }
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}