// Opportunity extractor for Salesforce Lightning
// Extends BaseExtractor with Opportunity-specific logic

import { BaseExtractor } from './baseExtractor.js';

export class OpportunityExtractor extends BaseExtractor {
  constructor() {
    super('Opportunity');
  }

  extract(rawData) {
    if (!rawData) return null;

    const record = this.normalizeRecord(rawData);

    // Opportunity-specific validations
    if (!this.validateOpportunityRecord(record)) {
      return null;
    }

    return record;
  }

  validateOpportunityRecord(record) {
    // Call parent validation
    if (!super.validateRecord(record)) return false;

    // Opportunities should have a name
    if (!record.name) {
      console.warn('Opportunity record missing name');
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
      // Opportunity-specific mappings
      'accountid': 'accountId',
      'account_name': 'accountName',
      'amount': 'amount',
      'closedate': 'closeDate',
      'stage_name': 'stage',
      'stagename': 'stage',
      'probability': 'probability',
      'expected_revenue': 'expectedRevenue',
      'total_opportunity_quantity': 'totalOpportunityQuantity',
      'type': 'type',
      'lead_source': 'leadSource',
      'next_step': 'nextStep',
      'campaignid': 'campaignId',
      'campaign_name': 'campaignName',
      'contactid': 'contactId',
      'contact_name': 'contactName',
      'ownerid': 'ownerId',
      'owner_name': 'ownerName',
      'forecast_category': 'forecastCategory',
      'forecastcategory': 'forecastCategory',
      'pricebook2id': 'pricebookId',
      'contractid': 'contractId',
      'fiscal_year': 'fiscalYear',
      'fiscal_quarter': 'fiscalQuarter',
      'has_opportunity_line_item': 'hasOpportunityLineItem',
      'is_closed': 'isClosed',
      'is_won': 'isWon',
      'description': 'description'
    };
  }

  // Process opportunity-specific data transformations
  normalizeRecord(record) {
    const normalized = super.normalizeRecord(record);

    // Parse amount
    if (normalized.amount) {
      normalized.amount = this.parseCurrency(normalized.amount);
    }

    // Parse close date
    if (normalized.closeDate) {
      normalized.closeDate = this.parseDate(normalized.closeDate);
    }

    // Parse probability
    if (normalized.probability) {
      if (typeof normalized.probability === 'string') {
        // Remove % sign and parse
        const probStr = normalized.probability.replace(/[^0-9.]/g, '');
        normalized.probability = parseFloat(probStr);
      }
    }

    // Calculate expected revenue if not present
    if (normalized.amount && normalized.probability && !normalized.expectedRevenue) {
      normalized.expectedRevenue = (normalized.amount * normalized.probability) / 100;
    }

    // Parse expected revenue
    if (normalized.expectedRevenue) {
      normalized.expectedRevenue = this.parseCurrency(normalized.expectedRevenue);
    }

    // Standardize stage name
    if (normalized.stage) {
      normalized.stage = this.standardizeStageName(normalized.stage);
    }

    // Standardize type
    if (normalized.type) {
      normalized.type = this.standardizeOpportunityType(normalized.type);
    }

    // Standardize forecast category
    if (normalized.forecastCategory) {
      normalized.forecastCategory = this.standardizeForecastCategory(normalized.forecastCategory);
    }

    // Set boolean flags
    normalized.isClosed = this.isClosedStage(normalized.stage);
    normalized.isWon = this.isWonStage(normalized.stage);

    return normalized;
  }

  standardizeStageName(stage) {
    if (!stage) return null;

    const stageMap = {
      'prospecting': 'Prospecting',
      'qualification': 'Qualification',
      'needs analysis': 'Needs Analysis',
      'needs_analysis': 'Needs Analysis',
      'value proposition': 'Value Proposition',
      'value_proposition': 'Value Proposition',
      'id. decision makers': 'Id. Decision Makers',
      'id_decision_makers': 'Id. Decision Makers',
      'perception analysis': 'Perception Analysis',
      'perception_analysis': 'Perception Analysis',
      'proposal/price quote': 'Proposal/Price Quote',
      'proposal_price_quote': 'Proposal/Price Quote',
      'proposal': 'Proposal',
      'negotiation/review': 'Negotiation/Review',
      'negotiation_review': 'Negotiation/Review',
      'negotiation': 'Negotiation',
      'closed won': 'Closed Won',
      'closed_won': 'Closed Won',
      'closed lost': 'Closed Lost',
      'closed_lost': 'Closed Lost'
    };

    const cleanStage = stage.toString().toLowerCase().trim();
    return stageMap[cleanStage] || stage;
  }

  standardizeOpportunityType(type) {
    if (!type) return null;

    const typeMap = {
      'new customer': 'New Customer',
      'new_customer': 'New Customer',
      'existing customer': 'Existing Customer',
      'existing_customer': 'Existing Customer',
      'existing': 'Existing Customer',
      'partner': 'Partner',
      'reseller': 'Reseller',
      'other': 'Other'
    };

    const cleanType = type.toString().toLowerCase().trim();
    return typeMap[cleanType] || type;
  }

  standardizeForecastCategory(category) {
    if (!category) return null;

    const categoryMap = {
      'best case': 'Best Case',
      'best_case': 'Best Case',
      'worst case': 'Worst Case',
      'worst_case': 'Worst Case',
      'committed': 'Committed',
      'pipeline': 'Pipeline',
      'forecast': 'Forecast',
      'closed': 'Closed',
      'omitted': 'Omitted'
    };

    const cleanCategory = category.toString().toLowerCase().trim();
    return categoryMap[cleanCategory] || category;
  }

  isClosedStage(stage) {
    if (!stage) return false;

    const closedStages = ['closed won', 'closed lost', 'closed_won', 'closed_lost'];
    return closedStages.includes(stage.toLowerCase());
  }

  isWonStage(stage) {
    if (!stage) return false;

    const wonStages = ['closed won', 'closed_won'];
    return wonStages.includes(stage.toLowerCase());
  }

  // Get pipeline stage order for visualization
  getStageOrder() {
    return [
      'Prospecting',
      'Qualification',
      'Needs Analysis',
      'Value Proposition',
      'Id. Decision Makers',
      'Perception Analysis',
      'Proposal/Price Quote',
      'Negotiation/Review',
      'Closed Won',
      'Closed Lost'
    ];
  }

  // Calculate stage metrics
  calculateStageMetrics(opportunities) {
    const metrics = {
      totalValue: 0,
      totalCount: opportunities.length,
      averageValue: 0,
      stageBreakdown: {}
    };

    opportunities.forEach(opp => {
      if (opp.amount) {
        metrics.totalValue += opp.amount;
      }

      const stage = opp.stage || 'Unknown';
      if (!metrics.stageBreakdown[stage]) {
        metrics.stageBreakdown[stage] = {
          count: 0,
          value: 0,
          averageValue: 0
        };
      }

      metrics.stageBreakdown[stage].count++;
      if (opp.amount) {
        metrics.stageBreakdown[stage].value += opp.amount;
      }
    });

    metrics.averageValue = metrics.totalValue / metrics.totalCount;

    Object.values(metrics.stageBreakdown).forEach(stage => {
      stage.averageValue = stage.value / stage.count;
    });

    return metrics;
  }
}

// Factory function for creating opportunity extractors
export function createOpportunityExtractor() {
  return new OpportunityExtractor();
}