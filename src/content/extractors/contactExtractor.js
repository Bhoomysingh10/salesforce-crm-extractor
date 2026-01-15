// Contact extractor for Salesforce Lightning
// Extends BaseExtractor with Contact-specific logic

import { BaseExtractor } from './baseExtractor.js';

export class ContactExtractor extends BaseExtractor {
  constructor() {
    super('Contact');
  }

  extract(rawData) {
    if (!rawData) return null;

    const record = this.normalizeRecord(rawData);

    // Contact-specific validations
    if (!this.validateContactRecord(record)) {
      return null;
    }

    return record;
  }

  validateContactRecord(record) {
    // Call parent validation
    if (!super.validateRecord(record)) return false;

    // Contacts should have some form of identification
    const hasName = record.firstName || record.lastName || record.name;
    const hasContact = record.email || record.phone || record.mobilePhone;

    if (!hasName && !hasContact) {
      console.warn('Contact record missing both name and contact information');
      return false;
    }

    return true;
  }

  getRequiredFields() {
    return ['id'];
  }

  getFieldMappings() {
    const baseMappings = super.getFieldMappings();
    return {
      ...baseMappings,
      // Contact-specific mappings
      'firstname': 'firstName',
      'lastname': 'lastName',
      'accountid': 'accountId',
      'account_name': 'accountName',
      'title': 'title',
      'department': 'department',
      'birthdate': 'birthdate',
      'mailing_street': 'mailingStreet',
      'mailing_city': 'mailingCity',
      'mailing_state': 'mailingState',
      'mailing_postal_code': 'mailingPostalCode',
      'mailing_country': 'mailingCountry',
      'other_street': 'otherStreet',
      'other_city': 'otherCity',
      'other_state': 'otherState',
      'other_postal_code': 'otherPostalCode',
      'other_country': 'otherCountry',
      'phone': 'phone',
      'mobilephone': 'mobilePhone',
      'homephone': 'homePhone',
      'otherphone': 'otherPhone',
      'fax': 'fax',
      'email': 'email',
      'assistant_name': 'assistantName',
      'assistant_phone': 'assistantPhone',
      'lead_source': 'leadSource',
      'description': 'description'
    };
  }

  // Process contact-specific data transformations
  normalizeRecord(record) {
    const normalized = super.normalizeRecord(record);

    // Combine first and last name if separate
    if (normalized.firstName && normalized.lastName && !normalized.name) {
      normalized.name = `${normalized.firstName} ${normalized.lastName}`.trim();
    }

    // Parse birthdate
    if (normalized.birthdate) {
      normalized.birthdate = this.parseDate(normalized.birthdate);
    }

    // Clean phone numbers
    const phoneFields = ['phone', 'mobilePhone', 'homePhone', 'otherPhone', 'fax', 'assistantPhone'];
    phoneFields.forEach(field => {
      if (normalized[field]) {
        normalized[field] = this.cleanPhoneNumber(normalized[field]);
      }
    });

    // Validate email format
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase().trim();
      if (!this.isValidEmail(normalized.email)) {
        console.warn(`Invalid email format: ${normalized.email}`);
        // Don't remove invalid emails, just warn
      }
    }

    // Standardize lead source
    if (normalized.leadSource) {
      normalized.leadSource = this.standardizeLeadSource(normalized.leadSource);
    }

    return normalized;
  }

  cleanPhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-digit characters except + for international codes
    let cleaned = phone.toString().replace(/[^0-9+]/g, '');

    // Ensure it starts with + or digit
    if (cleaned && !cleaned.startsWith('+') && !cleaned.startsWith('0') && !cleaned.startsWith('1')) {
      // Assume US number if it doesn't start with country code
      if (cleaned.length === 10) {
        cleaned = `+1${cleaned}`;
      }
    }

    return cleaned || phone; // Return original if cleaning fails
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  standardizeLeadSource(source) {
    if (!source) return null;

    const sourceMap = {
      'web': 'Web',
      'phone': 'Phone',
      'email': 'Email',
      'partner': 'Partner',
      'advertising': 'Advertising',
      'social': 'Social',
      'trade show': 'Trade Show',
      'tradeshow': 'Trade Show',
      'direct mail': 'Direct Mail',
      'directmail': 'Direct Mail',
      'employee referral': 'Employee Referral',
      'employeereferral': 'Employee Referral',
      'purchased list': 'Purchased List',
      'purchasedlist': 'Purchased List',
      'other': 'Other'
    };

    const cleanSource = source.toString().toLowerCase().trim();
    return sourceMap[cleanSource] || source;
  }
}

// Factory function for creating contact extractors
export function createContactExtractor() {
  return new ContactExtractor();
}