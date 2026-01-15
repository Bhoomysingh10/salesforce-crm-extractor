// Status indicator UI component using Shadow DOM
// Provides visual feedback during extraction operations

export class StatusIndicator {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'sf-extractor-status';
    this.shadow = this.container.attachShadow({ mode: 'open' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      .status-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #333;
        border: 1px solid #e0e0e0;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .status-indicator.fade-out {
        animation: slideOut 0.3s ease-in forwards;
      }

      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #0070d2;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        flex-shrink: 0;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .success {
        color: #04844B;
      }

      .success::before {
        content: '✓';
        font-size: 18px;
        font-weight: bold;
        margin-right: 8px;
      }

      .error {
        color: #C23934;
        background: #FEF2F2;
        border-color: #FECACA;
      }

      .error::before {
        content: '✗';
        font-size: 18px;
        font-weight: bold;
        margin-right: 8px;
      }

      .warning {
        color: #B45309;
        background: #FFFBEB;
        border-color: #FDE68A;
      }

      .warning::before {
        content: '⚠';
        font-size: 18px;
        font-weight: bold;
        margin-right: 8px;
      }
    `;

    this.shadow.appendChild(style);
    document.body.appendChild(this.container);
  }

  show(message, type = 'loading') {
    // Clear any existing indicator
    this.shadow.innerHTML = '';
    this.shadow.appendChild(this.shadow.querySelector('style'));

    const indicator = document.createElement('div');
    indicator.className = 'status-indicator';

    if (type === 'loading') {
      indicator.innerHTML = `
        <div class="spinner"></div>
        <span>${this.escapeHtml(message)}</span>
      `;
    } else if (type === 'success') {
      indicator.innerHTML = `<span class="success">${this.escapeHtml(message)}</span>`;
      this.autoHide(3000);
    } else if (type === 'error') {
      indicator.innerHTML = `<span class="error">${this.escapeHtml(message)}</span>`;
      this.autoHide(5000);
    } else if (type === 'warning') {
      indicator.innerHTML = `<span class="warning">${this.escapeHtml(message)}</span>`;
      this.autoHide(4000);
    }

    this.shadow.appendChild(indicator);
  }

  hide() {
    const indicator = this.shadow.querySelector('.status-indicator');
    if (indicator) {
      indicator.classList.add('fade-out');
      setTimeout(() => {
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }, 300);
    }
  }

  autoHide(delay) {
    setTimeout(() => this.hide(), delay);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Static method to show a quick status without creating instance
  static show(message, type = 'loading', duration = null) {
    const indicator = new StatusIndicator();
    indicator.show(message, type);
    if (duration && type !== 'loading') {
      setTimeout(() => indicator.hide(), duration);
    }
    return indicator;
  }
}