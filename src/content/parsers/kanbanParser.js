// Parser for Salesforce Lightning Kanban views (primarily for Opportunities)
// Extracts data from kanban columns and cards

export function extractOpportunitiesFromKanban(containerElement) {
  if (!containerElement) {
    throw new Error('No kanban container element found');
  }

  const stages = {};
  const allOpportunities = [];

  // Find kanban columns - Salesforce uses various class names
  const columns = document.querySelectorAll('.kanban-column, [data-stage], .slds-col, .column');

  if (columns.length === 0) {
    // Try alternative selectors for different Salesforce implementations
    const altColumns = document.querySelectorAll('[data-column-name], .opportunity-stage, .kanban-stage');
    if (altColumns.length > 0) {
      altColumns.forEach(column => {
        const stageName = extractStageName(column);
        const opportunities = extractOpportunitiesFromColumn(column);
        if (stageName && opportunities.length > 0) {
          stages[stageName] = opportunities;
          allOpportunities.push(...opportunities);
        }
      });
    }
  } else {
    columns.forEach(column => {
      const stageName = extractStageName(column);
      const opportunities = extractOpportunitiesFromColumn(column);
      if (stageName && opportunities.length > 0) {
        stages[stageName] = opportunities;
        allOpportunities.push(...opportunities);
      }
    });
  }

  console.log(`Extracted opportunities from ${Object.keys(stages).length} stages:`, stages);
  return allOpportunities;
}

function extractStageName(column) {
  // Method 1: Check for data attributes
  let stageName = column.getAttribute('data-stage') ||
                  column.getAttribute('data-column-name') ||
                  column.getAttribute('data-stage-name');

  if (stageName) return cleanStageName(stageName);

  // Method 2: Check for header/title elements
  const header = column.querySelector('.column-header, .slds-section__title, .kanban-header, h3, h4');
  if (header) {
    stageName = header.textContent.trim();
    if (stageName) return cleanStageName(stageName);
  }

  // Method 3: Check for aria-label or title attributes
  stageName = column.getAttribute('aria-label') || column.getAttribute('title');
  if (stageName) return cleanStageName(stageName);

  // Method 4: Try to infer from class names or data
  const classList = column.className;
  if (classList.includes('prospecting')) return 'Prospecting';
  if (classList.includes('qualification')) return 'Qualification';
  if (classList.includes('proposal')) return 'Proposal';
  if (classList.includes('negotiation')) return 'Negotiation';
  if (classList.includes('closed-won')) return 'Closed Won';
  if (classList.includes('closed-lost')) return 'Closed Lost';

  return null;
}

function cleanStageName(stageName) {
  if (!stageName) return null;

  // Standardize common stage names
  const stageMap = {
    'prospecting': 'Prospecting',
    'qualification': 'Qualification',
    'proposal': 'Proposal',
    'negotiation': 'Negotiation',
    'closed won': 'Closed Won',
    'closed-won': 'Closed Won',
    'closed_lost': 'Closed Lost',
    'closed-lost': 'Closed Lost',
    'closedwon': 'Closed Won',
    'closedlost': 'Closed Lost'
  };

  const cleanName = stageName.toLowerCase().trim();
  return stageMap[cleanName] || stageName.trim();
}

function extractOpportunitiesFromColumn(column) {
  const opportunities = [];

  // Find opportunity cards - Salesforce uses various selectors
  const cards = column.querySelectorAll('.kanban-card, .opportunity-card, .slds-card, .card, [data-record-id]');

  cards.forEach(card => {
    const opportunity = {
      id: null,
      stage: extractStageName(column),
      extractedAt: Date.now(),
      source: 'kanban_view',
      objectType: 'Opportunity'
    };

    // Extract record ID
    opportunity.id = card.getAttribute('data-record-id') ||
                     card.getAttribute('data-id') ||
                     extractIdFromCard(card);

    // Extract card content
    const title = card.querySelector('.card-title, .slds-card__header-title, h3, .title');
    if (title) {
      opportunity.name = title.textContent.trim();
    }

    // Extract amount
    const amountElement = card.querySelector('[data-field="amount"], [title*="Amount"], .amount, .slds-text-heading_small');
    if (amountElement) {
      let amount = amountElement.textContent.trim();
      amount = amount.replace(/[^0-9.,]/g, '');
      if (amount) {
        opportunity.amount = parseFloat(amount.replace(/,/g, ''));
      }
    }

    // Extract close date
    const closeDateElement = card.querySelector('[data-field="closedate"], [title*="Close Date"], .close-date');
    if (closeDateElement) {
      const dateText = closeDateElement.textContent.trim();
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) {
        opportunity.closeDate = date.toISOString();
      } else {
        opportunity.closeDate = dateText;
      }
    }

    // Extract probability
    const probabilityElement = card.querySelector('[data-field="probability"], [title*="Probability"], .probability');
    if (probabilityElement) {
      let prob = probabilityElement.textContent.trim();
      prob = prob.replace(/[^0-9.]/g, '');
      if (prob) {
        opportunity.probability = parseFloat(prob);
      }
    }

    // Extract account name if present
    const accountElement = card.querySelector('[data-field="account"], .account-name');
    if (accountElement) {
      opportunity.accountName = accountElement.textContent.trim();
    }

    // Extract owner/contact if present
    const ownerElement = card.querySelector('[data-field="owner"], .owner-name');
    if (ownerElement) {
      opportunity.ownerName = ownerElement.textContent.trim();
    }

    // Only add if we have at least a name or ID
    if (opportunity.name || opportunity.id) {
      opportunities.push(opportunity);
    }
  });

  return opportunities;
}

function extractIdFromCard(card) {
  // Try to extract ID from links or data attributes
  const link = card.querySelector('a[href*="view"]');
  if (link) {
    const href = link.getAttribute('href');
    const match = href.match(/\/([a-zA-Z0-9]{15,18})\//);
    if (match) return match[1];
  }

  // Fallback: generate temporary ID
  const content = card.textContent.trim();
  if (content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `temp_opp_${Math.abs(hash)}`;
  }

  return null;
}

// Get stage summary for pipeline visualization
export function getStageSummary(opportunities) {
  const stages = {};

  opportunities.forEach(opp => {
    const stage = opp.stage || 'Unknown';
    if (!stages[stage]) {
      stages[stage] = {
        count: 0,
        totalAmount: 0,
        averageAmount: 0
      };
    }

    stages[stage].count++;
    if (opp.amount) {
      stages[stage].totalAmount += opp.amount;
    }
  });

  // Calculate averages
  Object.values(stages).forEach(stage => {
    stage.averageAmount = stage.totalAmount / stage.count;
  });

  return stages;
}