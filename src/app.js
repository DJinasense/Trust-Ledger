/**
 * Trust Ledger Matrix Pro - 3D Core Canvas Visualization Engine
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

let ledgerData = [];
let activeNode = null;
let searchQuery = "";
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = 400;
let height = canvas.height = 260;
let rotationAngle = 0;

// Model Target Cluster Anchor Coordinates
const modelClusters = {
  'chatgpt': { x: 100, y: 130, z: 0, color: '#10a37f', label: 'ChatGPT' },
  'claude': { x: 300, y: 130, z: 40, color: '#d97706', label: 'Claude' },
  'kimi': { x: 200, y: 80, z: -40, color: '#2563eb', label: 'Kimi' },
  'manual-entry': { x: 200, y: 190, z: 0, color: '#7c3aed', label: 'Local' }
};

// Map items to distinct 3D projection positions
function mapLedgerToNodes(ledger) {
  return ledger.map((entry, idx) => {
    const parent = modelClusters[entry.model] || modelClusters['manual-entry'];
    const offsetAngle = (idx * 135) * (Math.PI / 180);
    const radius = 35 + (idx * 3) % 45;
    
    // Check if item matches the active search filter query string
    const matchStr = `${entry.prompt} ${entry.response} ${entry.model}`.toLowerCase();
    const isMatched = searchQuery === "" || matchStr.includes(searchQuery);

    return {
      id: entry.id,
      entry: entry,
      baseX: parent.x + Math.cos(offsetAngle) * radius,
      baseY: parent.y + Math.sin(offsetAngle) * radius,
      baseZ: (idx * 20) % 80 - 40,
      x: 0, y: 0,
      radius: isMatched ? 6 : 2.5,
      isMatched: isMatched,
      color: entry.was_correct === true ? '#10b981' : (entry.was_correct === false ? '#ef4444' : '#38bdf8')
    };
  });
}

// Main 3D Rendering Animation Pipeline Loop
function renderMatrixSpace() {
  ctx.clearRect(0, 0, width, height);
  
  // Theme Color Configurations
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(99, 102, 241, 0.04)';
  const labelColor = isLight ? '#475569' : '#94a3b8';

  // Draw Structural Background Drafting Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for(let i=0; i<width; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
  for(let j=0; j<height; j+=20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke(); }

  rotationAngle += 0.0025; // Continuous spatial drift rotation speed
  const nodes = mapLedgerToNodes(ledgerData);

  // Render Core AI Cluster Centers
  Object.keys(modelClusters).forEach(key => {
    const cluster = modelClusters[key];
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = cluster.color + (isLight ? '1A' : '22');
    ctx.fill();
    ctx.strokeStyle = cluster.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw Model Identity Text Badges
    ctx.fillStyle = labelColor;
    ctx.font = "9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(cluster.label, cluster.x, cluster.y - 14);
  });

  // 1. Draw Sequential Chronological Sequential Roadmap Lines (Bottom up)
  if (nodes.length > 1) {
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]); // Tech drafting style layout dashed lines
    
    // Loop chronologically backwards to connect historical sequences
    for (let i = nodes.length - 1; i > 0; i--) {
      const currNode = nodes[i];
      const nextNode = nodes[i - 1];
      
      // Calculate 3D rotations for alignment steps
      const cosR = Math.cos(rotationAngle); const sinR = Math.sin(rotationAngle);
      const currX = (currNode.baseX - 200) * cosR - (currNode.baseZ) * sinR + 200;
      const nextX = (nextNode.baseX - 200) * cosR - (nextNode.baseZ) * sinR + 200;

      // Color route paths based on historical correctness
      ctx.beginPath();
      ctx.moveTo(currX, currNode.baseY);
      ctx.lineTo(nextX, nextNode.baseY);
      
      if (currNode.entry.was_correct === true && nextNode.entry.was_correct === true) {
        ctx.strokeStyle = isLight ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)';
      } else {
        ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(156, 163, 175, 0.1)';
      }
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line engine rules
  }

  // 2. Render Component Node Synapse Points
  nodes.forEach(node => {
    const cosR = Math.cos(rotationAngle);
    const sinR = Math.sin(rotationAngle);
    node.x = (node.baseX - 200) * cosR - (node.baseZ) * sinR + 200;
    node.y = node.baseY;

    // Dim nodes if they fail to match current search parameters
    if (!node.isMatched) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
      ctx.fill();
      return;
    }

    // Connect node cleanly to parent hub center lines
    const parent = modelClusters[node.entry.model] || modelClusters['manual-entry'];
    ctx.beginPath();
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle = node.color + (isLight ? '15' : '11');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Render primary interactive node orb
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    
    if(!isLight) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = node.color;
    }
    ctx.fill();
    ctx.shadowBlur = 0; // Clear canvas glow layer safely
  });

  requestAnimationFrame(renderMatrixSpace);
}

// Spatial Vector Box Collision Mouse Clicking Setup
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const nodes = mapLedgerToNodes(ledgerData);
  let clickedNode = null;

  nodes.forEach(node => {
    if (!node.isMatched) return;
    const dist = Math.hypot(node.x - clickX, node.y - clickY);
    if (dist < node.radius + 5) clickedNode = node;
  });

  if (clickedNode) {
    activeNode = clickedNode;
    showInspectionPanel(clickedNode.entry);
  }
});

function showInspectionPanel(entry) {
  document.getElementById('panel-model-badge').innerText = entry.model;
  document.getElementById('panel-model-badge').style.background = (modelClusters[entry.model] || modelClusters['manual-entry']).color;
  document.getElementById('panel-prompt').innerText = entry.prompt;
  document.getElementById('panel-response').innerText = entry.response;
  
  document.getElementById('inspection-panel').classList.remove('hidden');
  document.getElementById('audit-actions').classList.remove('hidden');
}

document.getElementById('close-panel-btn').addEventListener('click', () => {
  document.getElementById('inspection-panel').classList.add('hidden');
});

async function auditInteraction(isCorrect) {
  if (!activeNode) return;
  ledgerData = ledgerData.map(entry => {
    if (entry.id === activeNode.id) return { ...entry, was_correct: isCorrect };
    return entry;
  });
  await StorageSync.saveLedger(ledgerData);
  updateStatsBanner();
  document.getElementById('inspection-panel').classList.add('hidden');
}

document.getElementById('btn-correct').addEventListener('click', () => auditInteraction(true));
document.getElementById('btn-hallucinated').addEventListener('click', () => auditInteraction(false));

// Live Filtering Logic Handler
const searchInput = document.getElementById('matrix-search');
const searchCount = document.getElementById('search-count');

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  if (searchQuery === "") {
    searchCount.classList.add('hidden');
  } else {
    const matches = ledgerData.filter(entry => {
      return `${entry.prompt} ${entry.response}`.toLowerCase().includes(searchQuery);
    }).length;
    searchCount.innerText = `${matches} found`;
    searchCount.classList.remove('hidden');
  }
});

// Interactive Theme Switcher Controller
const themeToggleBtn = document.getElementById('theme-toggle-btn');
themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
});

// Global Keyboard Shortcut Listener for Quick Filters (Ctrl + F Focus)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    searchInput.focus();
  }
});

function updateStatsBanner() {
  const verified = ledgerData.filter(e => e.was_correct !== null).length;
  const accuracy = ledgerData.filter(e => e.was_correct === true).length;
  document.getElementById('stats-banner').innerText = `${ledgerData.length} Logs • ${verified} Audited • Accuracy: ${verified ? Math.round((accuracy/verified)*100) : 0}%`;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_AI_INTERACTION") {
      StorageSync.loadLedger().then(data => {
        ledgerData = data;
        updateStatsBanner();
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  ledgerData = await StorageSync.loadLedger();
