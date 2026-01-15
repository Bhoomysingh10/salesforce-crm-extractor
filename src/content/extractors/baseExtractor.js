// Base extractor class providing common functionality for all Salesforce object extractors

export class BaseExtractor {
  constructor(objectType) {
    this.objectType = objectType;
    this.requiredFields = this.getRequiredFields();
    this.fieldMappings = this.getFieldMappings();
  }

  // Abstract method to be implemented by subclasses
  extract(data) {
    throw new Error('extract() method must be implemented by subclass');
  }

  // Validate extracted record
  validateRecord(record) {
    if (!record) return false;

    // Check for required fields
    for (const field of this.requiredFields) {
      if (!record[field] && record[field] !== 0) {
        console.warn(`Missing required field: ${field} for ${this.objectType}`);
        return false;
      }
    }

    // Basic data type validation
    if (record.id && typeof record.id !== 'string') {
      console.warn(`Invalid ID type for ${this.objectType}: ${typeof record.id}`);
      return false;
    }

    return true;
  }

  // Normalize field names and values
  normalizeRecord(record) {
    const normalized = { ...record };

    // Apply field mappings
    Object.keys(this.fieldMappings).forEach(mappedField => {
      const actualField = this.fieldMappings[mappedField];
      if (normalized[actualField] !== undefined) {
        normalized[mappedField] = normalized[actualField];
        delete normalized[actualField];
      }
    });

    // Normalize common fields
    if (normalized.created_date) {
      normalized.createdDate = this.parseDate(normalized.created_date);
      delete normalized.created_date;
    }

    if (normalized.last_modified_date) {
      normalized.lastModifiedDate = this.parseDate(normalized.last_modified_date);
      delete normalized.last_modified_date;
    }

    if (normalized.amount) {
      normalized.amount = this.parseCurrency(normalized.amount);
    }

    // Add metadata
    normalized.objectType = this.objectType;
    normalized.extractedAt = Date.now();
    normalized.source = 'salesforce_extractor';

    return normalized;
  }

  // Parse date strings into ISO format
  parseDate(dateString) {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toISOString();
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`);
      return dateString;
    }
  }

  // Parse currency strings into numbers
  parseCurrency(currencyString) {
    if (!currencyString) return null;

    if (typeof currencyString === 'number') return currencyString;

    try {
      // Remove currency symbols, commas, and extra spaces
      const cleaned = currencyString.toString().replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? currencyString : parsed;
    } catch (error) {
      console.warn(`Failed to parse currency: ${currencyString}`);
      return currencyString;
    }
  }

  // Get required fields for this object type
  getRequiredFields() {
    // Base required fields
    return ['id'];
  }

  // Get field mappings (Salesforce field name -> standard name)
  getFieldMappings() {
    return {
      // Common mappings
      'name': 'name',
      'first_name': 'firstName',
      'last_name': 'lastName',
      'email': 'email',
      'phone': 'phone',
      'mobile_phone': 'mobilePhone',
      'account_name': 'accountName',
      'owner_name': 'ownerName',
      'created_date': 'createdDate',
      'last_modified_date': 'lastModifiedDate',
      'close_date': 'closeDate',
      'amount': 'amount',
      'probability': 'probability',
      'stage_name': 'stage',
      'status': 'status',
      'priority': 'priority',
      'subject': 'subject',
      'description': 'description'
    };
  }

  // Clean and standardize field names
  standardizeFieldName(fieldName) {
    if (!fieldName) return null;

    return fieldName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Extract ID from various Salesforce ID formats
  extractSalesforceId(idString) {
    if (!idString) return null;

    // Salesforce IDs are 15 or 18 characters
    const idMatch = idString.match(/([a-zA-Z0-9]{15,18})/);
    return idMatch ? idMatch[1] : null;
  }
}