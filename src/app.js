/**
 * Trust Ledger Management - Core Integration Routing Engine
 */

const StorageSync = {
  async loadLedger() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['trust_ledger'], (result) => resolve(result.trust_ledger || []));
      } else {
        const localData = localStorage.getItem('trust_ledger');
        resolve(localData ? JSON.parse(localData) : []);
      }
    });
  },
  async saveLedger(ledgerArray) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ trust_ledger: ledgerArray });
    }
    localStorage.setItem('trust_ledger', JSON.stringify(ledgerArray));
  }
};

let globalLedger = [];

// --- VIEW NAVIGATION CONTROLLER ---
const tabButtons = document.querySelectorAll('.nav-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Deactivate all targets
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.add('hidden'));

    // Activate selected target frame
    button.classList.add('active');
    const targetId = button.getAttribute('data-target');
    document.getElementById(targetId).classList.remove('hidden');

    // Run custom updates if switching to complex data panels
    if (targetId === 'panel-model-of-you') updateModelOfYouTab();
    if (targetId === 'panel-trust-scores') updateTrustScoresTab();
  });
});

// --- CORE ANALYTICAL UPDATE ENGINES ---

function updateModelOfYouTab() {
  if (globalLedger.length === 0) return;

  const total = globalLedger.length;
  const counts = { General: 0, Coding: 0, Research: 0, Creative: 0 };

  // Aggregate ratios
  globalLedger.forEach(entry => {
    const ctx = entry.context || 'General';
    if (counts[ctx] !== undefined) counts[ctx]++;
  });

  // Calculate percentages and update DOM view bars
  Object.keys(counts).forEach(key => {
    const pct = Math.round((counts[key] / total) * 100);
    const lowKey = key.toLowerCase();
    
    const bar = document.getElementById(`bar-${lowKey}`);
    const txt = document.getElementById(`txt-${lowKey}`);
    
    if (bar && txt) {
      bar.style.width = `${pct}%`;
      txt.innerText = `${pct}%`;
    }
  });

  // Generate dynamic contextual insight summary string
  const sortedContexts = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
  const primaryFocus = sortedContexts[0];
  
  document.getElementById('profile-insight').innerText = 
    `Your primary cognitive dependency is currently centered on [${primaryFocus}] tasks, representing ${Math.round((counts[primaryFocus]/total)*100)}% of your externalized intellect loops.`;
}

function updateTrustScoresTab() {
  const container = document.getElementById('scores-container');
  if (!container) return;

  if (globalLedger.length === 0) {
    container.innerHTML = '<div class="empty-state">No model metrics captured yet. Track your first logs above!</div>';
    return;
  }

  // Parse models performance weights
  const modelStats = {};
  globalLedger.forEach(entry => {
    const model = (entry.model || 'unknown').toLowerCase().trim();
    if (!modelStats[model]) {
      modelStats[model] = { total: 0, correct: 0 };
    }
    modelStats[model].total++;
    if (entry.was_correct === true) modelStats[model].correct++;
  });

  // Construct clean dynamic list layout cards
  let htmlOutput = '';
  Object.keys(modelStats).forEach(model => {
    const stats = modelStats[model];
    const acc = Math.round((stats.correct / stats.total) * 100);
    const isLow = acc < 70;

    htmlOutput += `
      <div class="score-row">
        <div>
          <div class="score-model-name">${model}</div>
          <div class="score-stats">${stats.correct}/${stats.total} entries verified</div>
        </div>
        <div class="score-badge ${isLow ? 'low' : ''}">${acc}% Accurate</div>
      </div>
    `;
  });

  container.innerHTML = htmlOutput;
}

// --- FORM INTERACTION LOG ENTRY SUBMISSION GATEWAY ---
const formElement = document.getElementById('ledger-form');
if (formElement) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Extract inputs safely
    const modelVal = document.getElementById('form-model').value;
    const contextVal = document.getElementById('form-context').value;
    const promptVal = document.getElementById('form-prompt').value;
    const responseVal = document.getElementById('form-response').value;
    const auditVal = document.querySelector('input[name="form-audit"]:checked').value === 'true';

    // Generate record object payload
    const record = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      model: modelVal,
      context: contextVal,
      prompt: promptVal,
      response: responseVal,
      was_correct: auditVal,
      tags: ["manual-form-entry"]
    };

    // Load ledger, append to top, save array state back to storage
    globalLedger = await StorageSync.loadLedger();
    globalLedger.unshift(record);
    await StorageSync.saveLedger(globalLedger);

    // Reset input form visual text blocks cleanly
    formElement.reset();
    alert("Interaction successfully committed to sovereign ledger!");
  });
}

// Background cross-layer broadcast sync triggers
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_AI_INTERACTION") {
      StorageSync.loadLedger().then(data => {
        globalLedger = data;
        updateModelOfYouTab();
        updateTrustScoresTab();
      });
    }
  });
}

// Application Initialization Entry Point
document.addEventListener("DOMContentLoaded", async () => {
  globalLedger = await StorageSync.loadLedger();
  console.log("Trust Ledger Tab Matrix Activated.");
});
