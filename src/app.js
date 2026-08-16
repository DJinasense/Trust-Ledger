/**
 * Trust Ledger - Main Application Logic
 * Manages uniform local storage syncing and interface interaction bindings.
 */

// Universal Cross-Platform Storage Adapter
const StorageSync = {
  // Gracefully switches between extension layer storage and standard browser web storage
  async loadLedger() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['trust_ledger'], (result) => {
          resolve(result.trust_ledger || []);
        });
      } else {
        const localData = localStorage.getItem('trust_ledger');
        resolve(localData ? JSON.parse(localData) : []);
      }
    });
  },

  // Saves arrays identically to prevent environment data mismatches
  async saveLedger(ledgerArray) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ trust_ledger: ledgerArray });
    }
    localStorage.setItem('trust_ledger', JSON.stringify(ledgerArray));
  }
};

// Generates structural tracking logs matching your base protocol schemas
function createLedgerRecord(prompt, response, model) {
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);

  return {
    id: uniqueId,
    timestamp: new Date().toISOString(),
    model: model || "manual-entry",
    context: "auto-scraped",
    prompt: prompt,
    response: response,
    claimed_confidence: "pending_review",
    user_trust_rating: null,
    was_correct: null,
    correction: null,
    tags: ["auto-logged"]
  };
}

// Listen for dynamic incoming scrapes broadcasted from content.js
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "NEW_AI_INTERACTION") {
      StorageSync.loadLedger().then((currentLedger) => {
        // Prevent duplicate logging of the exact same prompt/response run
        const isDuplicate = currentLedger.some(entry => entry.prompt === message.data.prompt);
        if (isDuplicate) return;

        const newRecord = createLedgerRecord(
          message.data.prompt,
          message.data.response,
          message.data.model
        );

        currentLedger.unshift(newRecord);
        return StorageSync.saveLedger(currentLedger).then(() => {
          // Trigger your custom DOM visual render loop if defined
          if (typeof renderLedger === 'function') {
            renderLedger(currentLedger);
          }
        });
      }).catch(err => console.error("Sync Failure:", err));
    }
  });
}

// Application Initialization Hook
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Trust Ledger Management Core Initialized.");
  const initialLedger = await StorageSync.loadLedger();
  
  // Connect your initial view render loops here
  if (typeof renderLedger === 'function') {
    renderLedger(initialLedger);
  }
});
