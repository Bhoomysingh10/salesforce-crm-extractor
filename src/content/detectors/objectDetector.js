// Object detector for Salesforce Lightning Experience
// Analyzes URL patterns and page content to detect current object type

export function detectSalesforceObject() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Check for object types in URL patterns
  // Lightning Experience URLs follow specific patterns:
  // /lightning/r/Lead/00Q.../view (record view)
  // /lightning/o/Opportunity/list (list view)
  // /lightning/r/Account/001.../view (record view)

  if (url.includes('/lightning/o/Lead/') || url.includes('/lightning/r/Lead/')) {
    return 'Lead';
  }

  if (url.includes('/lightning/o/Contact/') || url.includes('/lightning/r/Contact/')) {
    return 'Contact';
  }

  if (url.includes('/lightning/o/Account/') || url.includes('/lightning/r/Account/')) {
    return 'Account';
  }

  if (url.includes('/lightning/o/Opportunity/') || url.includes('/lightning/r/Opportunity/')) {
    return 'Opportunity';
  }

  if (url.includes('/lightning/o/Task/') || url.includes('/lightning/r/Task/')) {
    return 'Task';
  }

  // Fallback: check page title or breadcrumbs
  // Salesforce often includes object type in page title
  const title = document.title.toLowerCase();

  if (title.includes('lead')) return 'Lead';
  if (title.includes('contact')) return 'Contact';
  if (title.includes('account')) return 'Account';
  if (title.includes('opportunity')) return 'Opportunity';
  if (title.includes('task')) return 'Task';

  // Check for breadcrumbs or navigation elements
  const breadcrumbs = document.querySelectorAll('.slds-breadcrumb__item, .breadcrumb-item');
  for (const breadcrumb of breadcrumbs) {
    const text = breadcrumb.textContent.toLowerCase().trim();
    if (text === 'leads') return 'Lead';
    if (text === 'contacts') return 'Contact';
    if (text === 'accounts') return 'Account';
    if (text === 'opportunities') return 'Opportunity';
    if (text === 'tasks') return 'Task';
  }

  // Check for specific Lightning components or data attributes
  if (document.querySelector('[data-component-id*="Lead"]')) return 'Lead';
  if (document.querySelector('[data-component-id*="Contact"]')) return 'Contact';
  if (document.querySelector('[data-component-id*="Account"]')) return 'Account';
  if (document.querySelector('[data-component-id*="Opportunity"]')) return 'Opportunity';
  if (document.querySelector('[data-component-id*="Task"]')) return 'Task';

  return null; // Not a recognized Salesforce object page
}

// Additional utility to get record ID from URL
export function getRecordIdFromUrl() {
  const match = window.location.pathname.match(/\/r\/\w+\/([a-zA-Z0-9]{15,18})\//);
  return match ? match[1] : null;
}

// Check if current page is a list view
export function isListView() {
  return window.location.href.includes('/list') ||
         !!document.querySelector('table.slds-table') ||
         !!document.querySelector('.slds-table');
}

// Check if current page is a detail/record view
export function isDetailView() {
  return window.location.href.includes('/view') &&
         !isListView();
}

// Check if current page is kanban view (typically for Opportunities)
export function isKanbanView() {
  return !!document.querySelector('.kanban-column, [data-stage], .opportunity-card');
}