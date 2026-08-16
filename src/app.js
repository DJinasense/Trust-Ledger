/**
 * Trust Ledger Engine Core
 */

const StorageSync = {
  async loadLedger() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['trust_ledger'], (res) => resolve(res.trust_ledger || []));
      } else {
        const d = localStorage.getItem('trust_ledger'); resolve(d ? JSON.parse(d) : []);
      }
    });
  },
  async saveLedger(arr) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) { await chrome.storage.local.set({ trust_ledger: arr }); }
    localStorage.setItem('trust_ledger', JSON.stringify(arr));
  }
};

let globalLedger = [];
let activeFilterTag = "";

// --- TAB ROUTING CONTROLLER ---
const tabButtons = document.querySelectorAll('.nav-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-target');
    document.getElementById(target).classList.remove('hidden');
    
    if (target === 'panel-model-of-you') updateModelOfYouTab();
    if (target === 'panel-trust-scores') updateTrustScoresTab();
  });
});

// --- LIVE TAG FILTER ENGINE ---
const filterInput = document.getElementById('tag-filter-input');
filterInput.addEventListener('input', (e) => {
  activeFilterTag = e.target.value.toLowerCase().trim();
  updateStatsBanner();
});

function getFilteredData() {
  if (!activeFilterTag) return globalLedger;
  return globalLedger.filter(entry => {
    const tagsString = (entry.tags || []).join(' ').toLowerCase();
    return tagsString.includes(activeFilterTag) || entry.context.toLowerCase().includes(activeFilterTag);
  });
}

// --- VIEW UPDATES ---
function updateModelOfYouTab() {
  const dataset = getFilteredData();
  const total = dataset.length || 1;
  const counts = { General: 0, Coding: 0, Research: 0, Creative: 0 };
  
  dataset.forEach(e => { if(counts[e.context] !== undefined) counts[e.context]++; });
  
  Object.keys(counts).forEach(k => {
    const pct = Math.round((counts[k] / total) * 100);
    document.getElementById(`bar-${k.toLowerCase()}`).style.width = `${pct}%`;
    document.getElementById(`txt-${k.toLowerCase()}`).innerText = `${pct}%`;
  });
  document.getElementById('profile-insight').innerText = `Displaying profiles for ${dataset.length} isolated nodes.`;
}

function updateTrustScoresTab() {
  const container = document.getElementById('scores-container');
  if (!container) return;
  const dataset = getFilteredData();
  
  if (!dataset.length) { container.innerHTML = '<div style="font-size:11px;color:#64748b;">No matching logs found.</div>'; return; }
  
  const stats = {};
  dataset.forEach(e => {
    const m = (e.model || 'unknown').toLowerCase();
    if(!stats[m]) stats[m] = { total: 0, correct: 0 };
    stats[m].total++; if(e.was_correct) stats[m].correct++;
  });
  
  container.innerHTML = Object.keys(stats).map(m => `
    <div class="score-row">
      <span><b>${m}</b> (${stats[m].correct}/${stats[m].total})</span>
      <span style="color:${(stats[m].correct/stats[m].total) >= 0.7 ? '#10b981' : '#ef4444'}">${Math.round((stats[m].correct/stats[m].total)*100)}%</span>
    </div>
  `).join('');
}

// --- ONE-CLICK MARKDOWN CONTEXT EXPORT ENGINE ---
document.getElementById('export-md-btn').addEventListener('click', () => {
  const dataset = getFilteredData();
  if (!dataset.length) { alert("No logs available to export."); return; }

  let mdContent = `# Trust Ledger Workspace Documentation\n`;
  mdContent += `Generated on: ${new Date().toLocaleDateString()} • Active Filter: ${activeFilterTag || "None"}\n\n---\n\n`;

  dataset.forEach((entry, idx) => {
    mdContent += `### [Node #${idx + 1}] | Model: ${entry.model.toUpperCase()} | Status: ${entry.was_correct ? '👍 Verified' : '👎 Hallucinated'}\n`;
    mdContent += `* **Timestamp:** ${entry.timestamp}\n`;
    mdContent += `* **Context Classification:** ${entry.context}\n`;
    mdContent += `* **Tags:** \`${(entry.tags || []).join(', ') || 'none'}\`\n\n`;
    mdContent += `#### Prompt Input:\n\`\`\`text\n${entry.prompt || 'N/A'}\n\`\`\`\n\n`;
    mdContent += `#### Verified Output Response:\n\`\`\`text\n${entry.response}\n\`\`\`\n\n`;
    mdContent += `\n---\n\n`;
  });

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trust_ledger_docs_${new Date().toISOString().slice(0,10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// --- FORM HANDLER ---
const form = document.getElementById('ledger-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Process comma separated tags into clean arrays
    const rawTags = document.getElementById('form-tags').value;
    const cleanTags = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

    const record = {
      id: Math.random().toString(36).substring(2), 
      timestamp: new Date().toISOString(),
      model: document.getElementById('form-model').value, 
      context: document.getElementById('form-context').value,
      tags: cleanTags,
      prompt: document.getElementById('form-prompt').value, 
      response: document.getElementById('form-response').value,
      was_correct: document.querySelector('input[name="form-audit"]:checked').value === 'true'
    };
    
    globalLedger = await StorageSync.loadLedger();
    globalLedger.unshift(record);
    await StorageSync.saveLedger(globalLedger);
    form.reset();
    updateStatsBanner();
  });
}

// --- LIGHT/DARK THEME TOGGLE ENGINE ---
document.getElementById('theme-toggle-btn').addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
});

function updateStatsBanner() {
  const dataset = getFilteredData();
  const verified = dataset.filter(e => e.was_correct !== null).length;
  document.getElementById('stats-banner').innerText = `${dataset.length} Matching Nodes Matrix Active (${globalLedger.length} Total Logs)`;
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "NEW_AI_INTERACTION") { StorageSync.loadLedger().then(d => { globalLedger = d; updateStatsBanner(); }); }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  globalLedger = await StorageSync.loadLedger();
  updateStatsBanner();
});
