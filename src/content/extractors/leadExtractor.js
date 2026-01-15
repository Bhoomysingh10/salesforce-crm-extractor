// Lead extractor for Salesforce Lightning
// Extends BaseExtractor with Lead-specific logic

import { BaseExtractor } from './baseExtractor.js';

export class LeadExtractor extends BaseExtractor {
  constructor() {
    super('Lead');
  }

  extract(rawData) {
    if (!rawData) return null;

    const record = this.normalizeRecord(rawData);

    // Lead-specific validations
    if (!this.validateLeadRecord(record)) {
      return null;
    }

    return record;
  }

  validateLeadRecord(record) {
    // Call parent validation
    if (!super.validateRecord(record)) return false;

    // Lead-specific validations
    // At minimum, leads should have a name or email
    const hasName = record.firstName || record.lastName || record.name;
    const hasContact = record.email || record.phone || record.mobilePhone;

    if (!hasName && !hasContact) {
      console.warn('Lead record missing both name and contact information');
      return false;
    }

    return true;
  }

  getRequiredFields() {
    return ['id']; // Leads don't require as much as other objects
  }

  getFieldMappings() {
    const baseMappings = super.getFieldMappings();
    return {
      ...baseMappings,
      // Lead-specific mappings
      'firstname': 'firstName',
      'lastname': 'lastName',
      'company': 'company',
      'title': 'title',
      'lead_source': 'leadSource',
      'industry': 'industry',
      'rating': 'rating',
      'annual_revenue': 'annualRevenue',
      'number_of_employees': 'numberOfEmployees',
      'website': 'website',
      'is_converted': 'isConverted',
      'converted_date': 'convertedDate',
      'converted_account_id': 'convertedAccountId',
      'converted_contact_id': 'convertedContactId',
      'converted_opportunity_id': 'convertedOpportunityId'
    };
  }

  // Process lead-specific data transformations
  normalizeRecord(record) {
    const normalized = super.normalizeRecord(record);

    // Combine first and last name if separate
    if (normalized.firstName && normalized.lastName && !normalized.name) {
      normalized.name = `${normalized.firstName} ${normalized.lastName}`.trim();
    }

    // Parse annual revenue
    if (normalized.annualRevenue) {
      normalized.annualRevenue = this.parseCurrency(normalized.annualRevenue);
    }

    // Parse number of employees
    if (normalized.numberOfEmployees) {
      normalized.numberOfEmployees = parseInt(normalized.numberOfEmployees.toString().replace(/[^0-9]/g, '')) || null;
    }

    // Standardize rating values
    if (normalized.rating) {
      normalized.rating = this.standardizeRating(normalized.rating);
    }

    // Standardize lead source
    if (normalized.leadSource) {
      normalized.leadSource = this.standardizeLeadSource(normalized.leadSource);
    }

    return normalized;
  }

  standardizeRating(rating) {
    if (!rating) return null;

    const ratingMap = {
      'hot': 'Hot',
      'warm': 'Warm',
      'cold': 'Cold',
      '1': 'Hot',
      '2': 'Warm',
      '3': 'Cold'
    };

    const cleanRating = rating.toString().toLowerCase().trim();
    return ratingMap[cleanRating] || rating;
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

// Factory function for creating lead extractors
export function createLeadExtractor() {
  return new LeadExtractor();
}