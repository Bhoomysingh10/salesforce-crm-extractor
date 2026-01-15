# Salesforce CRM Data Extractor

A Chrome extension (Manifest V3) that extracts real data from Salesforce Lightning Experience dashboards, including Leads, Contacts, Accounts, Opportunities, and Tasks.

## Features

- ✅ Extract data from multiple Salesforce object types (Leads, Contacts, Accounts, Opportunities, Tasks)
- ✅ Support for List Views, Detail Pages, and Kanban Views (Opportunities)
- ✅ Real-time data visualization with stage-based pipeline for Opportunities
- ✅ Local storage with deduplication and update logic
- ✅ Export functionality (CSV/JSON)
- ✅ Real-time sync across browser tabs
- ✅ Production-ready with proper error handling
- ✅ Dynamic content detection using MutationObserver

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd salesforce-crm-extractor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## Usage

1. Navigate to your Salesforce Lightning Experience dashboard
2. Click the extension icon in the Chrome toolbar
3. Click "Extract Current Object" to extract data from the current page
4. View extracted data in the tabbed interface
5. Use the pipeline visualization for Opportunities
6. Export data as CSV or JSON

## DOM Selection Strategy

The extension uses sophisticated DOM selection strategies specifically designed for Salesforce Lightning Experience:

### Detection Logic
- **URL Pattern Analysis**: Detects object types from URLs like `/lightning/r/Lead/...` or `/lightning/o/Opportunity/list`
- **Dynamic Content Handling**: Uses MutationObserver to wait for dynamically loaded content
- **SLDS Class Selectors**: Targets Salesforce Lightning Design System (SLDS) classes for reliable element selection

### Extraction Methods
- **List Views**: Extracts from `table.slds-table` with header mapping
- **Detail Pages**: Parses `records-lwc-detail-panel` and `force-record-layout-item`
- **Kanban Views**: Handles stage-based columns for Opportunities

## Storage Schema

Data is stored locally in Chrome storage with the following schema:

```javascript
{
  salesforce_data: {
    leads: [],
    contacts: [],
    accounts: [],
    opportunities: [],
    tasks: [],
    metadata: {
      lastSync: {
        leads: null,
        contacts: null,
        accounts: null,
        opportunities: null,
        tasks: null
      },
      totalRecords: {
        leads: 0,
        contacts: 0,
        accounts: 0,
        opportunities: 0,
        tasks: 0
      },
      opportunityStages: {
        prospecting: 0,
        qualification: 0,
        proposal: 0,
        negotiation: 0,
        closedWon: 0,
        closedLost: 0
      }
    }
  }
}
```

## Architecture

### Content Scripts
- `contentScript.js`: Main orchestrator that detects page type and coordinates extraction
- `objectDetector.js`: Detects Salesforce object types from URL and page content
- Extractors: Object-specific extraction logic (`leadExtractor.js`, etc.)
- Parsers: Handle different view types (`listViewParser.js`, `detailViewParser.js`, `kanbanParser.js`)

### Popup Interface
- React-based UI with tabbed navigation
- Real-time data display with search/filter capabilities
- Stage pipeline visualization for Opportunities
- Export functionality

### Background Service Worker
- Handles storage operations
- Broadcasts updates across tabs
- Manages extension lifecycle

## Testing Checklist

- [ ] Extract from Leads list view
- [ ] Extract from Opportunity Kanban view with all stages
- [ ] Extract from Account detail page
- [ ] Verify data persists after page refresh
- [ ] Test delete functionality
- [ ] Test search/filter
- [ ] Test export CSV/JSON
- [ ] Test with multiple tabs open
- [ ] Handle empty pages gracefully
- [ ] Handle missing fields

## Development

For development with hot reload:
```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Permissions

The extension requires the following permissions:
- `storage`: For local data storage
- `tabs`: For accessing current tab information
- `activeTab`: For injecting scripts into the current tab
- `scripting`: For content script injection
- Host permissions for Salesforce domains

## Security

- No data is transmitted externally
- All data remains local in browser storage
- Content scripts only run on Salesforce domains
- Uses Shadow DOM for UI isolation

## License

MIT License