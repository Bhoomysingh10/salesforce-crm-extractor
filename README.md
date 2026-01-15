# Salesforce CRM Data Extractor

A Chrome Extension built with Manifest V3 that extracts data from Salesforce CRM objects (Leads, Contacts, Accounts, Opportunities, Tasks), stores them locally, and displays them in a React-powered popup dashboard.

## 🚀 Features

- **Multi-Object Extraction**: Extracts Leads, Contacts, Accounts, Opportunities, and Tasks
- **Smart Detection**: Automatically detects which Salesforce object you're viewing
- **Multiple View Support**: Works with List Views, Record Detail pages, and Kanban boards
- **Real-time Sync**: Updates across all browser tabs using Chrome storage API
- **Search & Filter**: Search across all extracted records
- **Export**: Export data as JSON or CSV
- **Visual Feedback**: Shadow DOM-based extraction indicators
- **Data Management**: Delete individual records or clear entire object types

## 📋 Prerequisites

- Chrome/Edge browser (Manifest V3 compatible)
- Salesforce account (Developer Edition recommended)
  - Sign up: https://developer.salesforce.com/signup

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/salesforce-crm-extractor.git
cd salesforce-crm-extractor
```

### 2. Project Structure
```
salesforce-crm-extractor/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for message handling
├── content.js            # Content script for data extraction
├── popup.html            # Popup UI structure
├── popup.js              # React dashboard application
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### 3. Create Icons
Create PNG icons with the following sizes:
- 16x16 pixels → `icons/icon16.png`
- 48x48 pixels → `icons/icon48.png`
- 128x128 pixels → `icons/icon128.png`

You can use any image editor or online tools to create simple blue/white icons with "SF" text.

### 4. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `salesforce-crm-extractor` folder
5. The extension icon should appear in your toolbar

## 📖 Usage

### 1. Navigate to Salesforce
- Log into your Salesforce account
- Navigate to any object page (Leads, Contacts, Accounts, Opportunities, or Tasks)

### 2. Extract Data
- Click the extension icon in your toolbar
- Click the **"Extract Current Page"** button
- The extension will automatically detect the object type and extract data
- You'll see a visual indicator on the page showing extraction progress

### 3. View Data
- Switch between tabs (Leads, Contacts, Accounts, Opportunities, Tasks)
- Use the search box to filter records
- See last sync timestamp for each object type

### 4. Manage Data
- **Delete**: Click the ✕ button on any record
- **Clear All**: Click "Clear All" to remove all records of the current type
- **Export**: Click JSON or CSV to download your data

## 🔍 DOM Selection Strategy

### Object Type Detection
The extension uses multiple strategies to identify the current Salesforce object:

1. **URL Pattern Matching**
   ```javascript
   /lightning/o/Lead/      → Leads
   /lightning/o/Contact/   → Contacts
   /lightning/o/Account/   → Accounts
   /lightning/o/Opportunity/ → Opportunities
   /lightning/o/Task/      → Tasks
   ```

2. **Page Title Analysis**
   - Checks document.title for object keywords

3. **DOM Element Inspection**
   - Searches for Lightning component data attributes

### View Type Detection

**List View**
- Selector: `.listViewContent, .slds-table, table[role="grid"]`
- Extracts from table rows (`<tr>` elements)
- Handles multiple records at once

**Kanban View** (Opportunities)
- Selector: `.kanbanBoard, [class*="kanban"]`
- Extracts from cards grouped by stage
- Captures stage information from column headers

**Detail View**
- Extracts from field elements: `.slds-form-element, .forcePageBlockItemView`
- Matches field labels to extract specific values
- Extracts single record with complete details

### Field Extraction Methods

1. **Direct Text Extraction**
   - Reads visible text from cells and fields
   - Cleans and trims whitespace

2. **Link-based ID Extraction**
   - Extracts Salesforce 15/18 character IDs from record links
   - Pattern: `/[a-zA-Z0-9]{15,18}/`

3. **Pattern Matching**
   - Email: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/`
   - Phone: `/[\d\s\-\(\)\.+]{10,}/`
   - Numbers: Removes currency symbols and extracts numeric values

4. **Label-Value Pairing**
   - Finds field labels (e.g., "Email:", "Phone:")
   - Extracts associated values from adjacent elements

### Handling Dynamic Content
- Waits for Lightning components to load using `.slds-scope` detection
- 500ms grace period for dynamic rendering
- Retry logic for failed extractions

## 💾 Storage Schema

Data is stored in `chrome.storage.local` with the following structure:

```json
{
  "salesforce_data": {
    "leads": [
      {
        "id": "00Q5g00000ABC123",
        "name": "John Doe",
        "company": "Acme Corp",
        "email": "john@acme.com",
        "phone": "(555) 123-4567",
        "leadSource": "Web",
        "status": "Open",
        "owner": "Jane Smith",
        "extractedAt": 1704672000000
      }
    ],
    "contacts": [
      {
        "id": "0035g00000XYZ789",
        "name": "Sarah Johnson",
        "email": "sarah@company.com",
        "phone": "(555) 987-6543",
        "account": "Tech Solutions Inc",
        "title": "VP of Sales",
        "owner": "John Admin",
        "mailingAddress": "123 Main St, City, ST 12345",
        "extractedAt": 1704672000000
      }
    ],
    "accounts": [
      {
        "id": "0015g00000DEF456",
        "name": "Enterprise Corp",
        "website": "https://enterprise.com",
        "phone": "(555) 111-2222",
        "industry": "Technology",
        "type": "Customer",
        "owner": "Sales Team",
        "annualRevenue": 5000000,
        "extractedAt": 1704672000000
      }
    ],
    "opportunities": [
      {
        "id": "0065g00000GHI012",
        "name": "Q1 Enterprise Deal",
        "amount": 250000,
        "stage": "Proposal",
        "probability": 75,
        "closeDate": "2024-03-31",
        "forecastCategory": "Pipeline",
        "owner": "Sales Rep",
        "account": "Enterprise Corp",
        "extractedAt": 1704672000000
      }
    ],
    "tasks": [
      {
        "id": "00T5g00000JKL345",
        "subject": "Follow-up call",
        "dueDate": "2024-01-20",
        "status": "Not Started",
        "priority": "High",
        "relatedTo": "Opportunity: Q1 Deal",
        "assignedTo": "John Doe",
        "extractedAt": 1704672000000
      }
    ],
    "lastSync": {
      "leads": 1704672000000,
      "contacts": 1704672123000,
      "accounts": 1704672456000,
      "opportunities": 1704672789000,
      "tasks": 1704672999000
    }
  }
}
```

### Data Integrity Features

1. **Deduplication**: Records with the same ID are merged, keeping the latest version
2. **Timestamps**: Each record includes `extractedAt` timestamp
3. **Race Condition Handling**: Last-write-wins strategy for concurrent updates
4. **Automatic Cleanup**: Invalid or empty records are filtered out

## 🎯 Key Implementation Details

### Manifest V3 Patterns

**Service Worker (background.js)**
- Handles message passing between popup and content script
- Manages storage operations
- Broadcasts updates to all extension contexts

**Content Script (content.js)**
- Injected into Salesforce pages
- Extracts data from DOM
- Shows visual feedback using Shadow DOM

**Popup (popup.html + popup.js)**
- React-based dashboard
- Displays extracted data with search/filter
- Handles export and delete operations

### Shadow DOM Usage
Visual indicators are injected using Shadow DOM for style isolation:
```javascript
const container = document.createElement('div');
const shadow = container.attachShadow({ mode: 'open' });
shadow.appendChild(style);
shadow.appendChild(indicator);
```

This prevents Salesforce's styles from affecting the indicator.

## 🐛 Error Handling

The extension includes comprehensive error handling:

- **Network Errors**: Gracefully handles page load issues
- **Missing Data**: Returns empty arrays instead of throwing errors
- **Invalid Selectors**: Falls back to alternative extraction methods
- **Storage Quota**: Monitors storage usage (chrome.storage.local limit: 5MB)
- **Message Passing**: Keeps async channels open with `return true`

## 🎨 Opportunity Stage Handling

The extension properly extracts and displays opportunity stages:

- **Prospecting**
- **Qualification**
- **Proposal**
- **Negotiation**
- **Closed Won**
- **Closed Lost**

Stages are displayed as badges in the UI with probability percentages.

## 📊 Bonus Features Implemented

✅ Real-time sync across tabs using `chrome.storage.onChanged`  
✅ Export data as CSV or JSON  
✅ Detect object type automatically  
✅ Visual feedback with Shadow DOM  
✅ Search and filter functionality  
✅ Individual record deletion  
✅ Last sync timestamps  

## 🧪 Testing Checklist

- [ ] Extract from Leads list view
- [ ] Extract from Contacts list view
- [ ] Extract from Accounts list view
- [ ] Extract from Opportunities list view (multiple stages)
- [ ] Extract from Opportunities Kanban view
- [ ] Extract from Task list view
- [ ] Extract from detail page (single record)
- [ ] Verify data persistence after page refresh
- [ ] Test search/filter functionality
- [ ] Test delete functionality
- [ ] Test export (JSON and CSV)
- [ ] Test across multiple browser tabs
- [ ] Verify deduplication on re-extraction

## 🎥 Demo Video Requirements

Your 3-5 minute demo should show:

1. **Installation** (15 seconds)
   - Loading the extension in Chrome

2. **Extraction** (2 minutes)
   - Navigate to Opportunities page
   - Extract from multiple stages (Kanban view)
   - Extract Leads
   - Extract Contacts
   - Extract Accounts
   - Show visual indicator

3. **Dashboard** (1 minute)
   - Switch between tabs
   - Show record counts
   - Demonstrate search
   - Show last sync timestamp

4. **Persistence** (30 seconds)
   - Refresh page
   - Open popup again
   - Verify data persists

5. **Management** (30 seconds)
   - Delete a record
   - Export as CSV

## 🚀 Deployment

To share your extension:

1. Zip the entire project folder (excluding .git)
2. Upload to Chrome Web Store (optional)
3. Share the GitHub repository

## 📝 License

MIT License - Feel free to use this project as you wish.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---
