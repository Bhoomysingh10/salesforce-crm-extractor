// Account extractor for Salesforce Lightning
// Extends BaseExtractor with Account-specific logic

import { BaseExtractor } from './baseExtractor.js';

export class AccountExtractor extends BaseExtractor {
  constructor() {
    super('Account');
  }

  extract(rawData) {
    if (!rawData) return null;

    const record = this.normalizeRecord(rawData);

    // Account-specific validations
    if (!this.validateAccountRecord(record)) {
      return null;
    }

    return record;
  }

  validateAccountRecord(record) {
    // Call parent validation
    if (!super.validateRecord(record)) return false;

    // Accounts should have a name
    if (!record.name) {
      console.warn('Account record missing name');
      return false;
    }

    return true;
  }

  getRequiredFields() {
    return ['id', 'name'];
  }

  getFieldMappings() {
    const baseMappings = super.getFieldMappings();
    return {
      ...baseMappings,
      // Account-specific mappings
      'accountnumber': 'accountNumber',
      'accountsource': 'accountSource',
      'annualrevenue': 'annualRevenue',
      'billingstreet': 'billingStreet',
      'billingcity': 'billingCity',
      'billingstate': 'billingState',
      'billingpostalcode': 'billingPostalCode',
      'billingcountry': 'billingCountry',
      'shippingstreet': 'shippingStreet',
      'shippingcity': 'shippingCity',
      'shippingstate': 'shippingState',
      'shippingpostalcode': 'shippingPostalCode',
      'shippingcountry': 'shippingCountry',
      'industry': 'industry',
      'ownership': 'ownership',
      'phone': 'phone',
      'fax': 'fax',
      'website': 'website',
      'sic': 'sic',
      'ticker_symbol': 'tickerSymbol',
      'tickersymbol': 'tickerSymbol',
      'type': 'type',
      'numberofemployees': 'numberOfEmployees',
      'description': 'description',
      'rating': 'rating',
      'site': 'site',
      'parentid': 'parentId',
      'parent_name': 'parentName'
    };
  }

  // Process account-specific data transformations
  normalizeRecord(record) {
    const normalized = super.normalizeRecord(record);

    // Parse annual revenue
    if (normalized.annualRevenue) {
      normalized.annualRevenue = this.parseCurrency(normalized.annualRevenue);
    }

    // Parse number of employees
    if (normalized.numberOfEmployees) {
      normalized.numberOfEmployees = parseInt(normalized.numberOfEmployees.toString().replace(/[^0-9]/g, '')) || null;
    }

    // Clean website URL
    if (normalized.website) {
      normalized.website = this.cleanWebsiteUrl(normalized.website);
    }

    // Standardize industry
    if (normalized.industry) {
      normalized.industry = this.standardizeIndustry(normalized.industry);
    }

    // Standardize account type
    if (normalized.type) {
      normalized.type = this.standardizeAccountType(normalized.type);
    }

    // Standardize rating
    if (normalized.rating) {
      normalized.rating = this.standardizeRating(normalized.rating);
    }

    return normalized;
  }

  cleanWebsiteUrl(website) {
    if (!website) return null;

    let url = website.trim();

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Basic URL validation
    try {
      new URL(url);
      return url;
    } catch (error) {
      console.warn(`Invalid website URL: ${website}`);
      return website; // Return original if invalid
    }
  }

  standardizeIndustry(industry) {
    if (!industry) return null;

    const industryMap = {
      'technology': 'Technology',
      'tech': 'Technology',
      'healthcare': 'Healthcare',
      'health care': 'Healthcare',
      'health': 'Healthcare',
      'finance': 'Finance',
      'financial': 'Finance',
      'banking': 'Banking',
      'retail': 'Retail',
      'manufacturing': 'Manufacturing',
      'education': 'Education',
      'government': 'Government',
      'non-profit': 'Non-Profit',
      'nonprofit': 'Non-Profit',
      'consulting': 'Consulting',
      'energy': 'Energy',
      'utilities': 'Utilities',
      'telecommunications': 'Telecommunications',
      'telecom': 'Telecommunications',
      'media': 'Media',
      'entertainment': 'Entertainment',
      'other': 'Other'
    };

    const cleanIndustry = industry.toString().toLowerCase().trim();
    return industryMap[cleanIndustry] || industry;
  }

  standardizeAccountType(type) {
    if (!type) return null;

    const typeMap = {
      'prospect': 'Prospect',
      'customer': 'Customer',
      'partner': 'Partner',
      'reseller': 'Reseller',
      'vendor': 'Vendor',
      'supplier': 'Supplier',
      'competitor': 'Competitor',
      'other': 'Other'
    };

    const cleanType = type.toString().toLowerCase().trim();
    return typeMap[cleanType] || type;
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
}

// Factory function for creating account extractors
export function createAccountExtractor() {
  return new AccountExtractor();
}