// Utility to wait for DOM elements to appear (handles dynamic loading)

export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-component-id']
    });

    // Set timeout
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Wait for multiple elements
export function waitForElements(selectors, timeout = 10000) {
  const promises = selectors.map(selector => waitForElement(selector, timeout));
  return Promise.all(promises);
}

// Wait for element with specific text content
export function waitForElementWithText(selector, text, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const checkElement = () => {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.textContent.trim().includes(text)) {
          resolve(element);
          return;
        }
      }
    };

    // Check immediately
    checkElement();

    // Set up observer
    const observer = new MutationObserver(() => {
      checkElement();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Set timeout
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} with text "${text}" not found within ${timeout}ms`));
    }, timeout);
  });
}

// Wait for Salesforce Lightning component to be ready
export function waitForLightningComponent(componentName, timeout = 10000) {
  return waitForElement(`[data-component-id*="${componentName}"]`, timeout);
}

// Wait for table to load data
export function waitForTableData(tableSelector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const checkTable = () => {
      const table = document.querySelector(tableSelector);
      if (!table) return false;

      const rows = table.querySelectorAll('tbody tr');
      // Consider table loaded if it has at least one data row
      return rows.length > 0;
    };

    if (checkTable()) {
      resolve(document.querySelector(tableSelector));
      return;
    }

    const observer = new MutationObserver(() => {
      if (checkTable()) {
        observer.disconnect();
        resolve(document.querySelector(tableSelector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Table ${tableSelector} did not load data within ${timeout}ms`));
    }, timeout);
  });
}

// Wait for kanban board to load
export function waitForKanbanBoard(timeout = 15000) {
  return waitForElement('.kanban-column, [data-stage], .opportunity-card', timeout);
}

// Generic wait for condition
export function waitForCondition(conditionFn, timeout = 10000, interval = 100) {
  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      if (conditionFn()) {
        resolve();
      } else {
        setTimeout(checkCondition, interval);
      }
    };

    checkCondition();

    setTimeout(() => {
      reject(new Error('Condition not met within timeout'));
    }, timeout);
  });
}