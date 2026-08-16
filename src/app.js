/**
 * Trust Ledger - 3D Spatial Network Canvas Visualizer Engine
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
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

// Simulation Space Coordinates
let width = canvas.width = 400;
let height = canvas.height = 250;
let rotationAngle = 0;

// Model Anchors mapping "The Model Brain Clusters"
const modelClusters = {
  'chatgpt': { x: 100, y: 120, z: 0, color: '#10a37f', label: 'ChatGPT' },
  'claude': { x: 300, y: 120, z: 50, color: '#d97706', label: 'Claude' },
  'kimi': { x: 200, y: 80, z: -50, color: '#2563eb', label: 'Kimi' },
  'manual-entry': { x: 200, y: 180, z: 0, color: '#7c3aed', label: 'Local' }
};

// Generates pseudorandom 3D offset structures for the data stream nodes
function mapLedgerToNodes(ledger) {
  return ledger.map((entry, idx) => {
    const parent = modelClusters[entry.model] || modelClusters['manual-entry'];
    // Use index hashing so nodes stay anchored consistently over space
    const offsetAngle = (idx * 135) * (Math.PI / 180);
    const radius = 40 + (idx * 4) % 60;
    
    return {
      id: entry.id,
      entry: entry,
      // Calculate basic 3D projection positions relative to parent cluster
      baseX: parent.x + Math.cos(offsetAngle) * radius,
      baseY: parent.y + Math.sin(offsetAngle) * radius,
      baseZ: (idx * 25) % 100 - 50,
      x: 0, y: 0, // Projected screen spaces
      radius: 5,
      color: entry.was_correct === true ? '#10b981' : (entry.was_correct === false ? '#ef4444' : '#38bdf8')
    };
  });
}

// 3D Matrix Rendering Loop Transformation pipeline
function renderMatrixSpace() {
  ctx.clearRect(0, 0, width, height);
  rotationAngle += 0.003; // Auto slow cosmic spin

  const nodes = mapLedgerToNodes(ledgerData);

  // Draw cluster backdrops & connections
  Object.keys(modelClusters).forEach(key => {
    const cluster = modelClusters[key];
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = cluster.color + '33';
    ctx.fill();
    ctx.strokeStyle = cluster.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Project, calculate tracking linkages, and draw item connections
  nodes.forEach(node => {
    // Basic rotational projection formula 
    const cosR = Math.cos(rotationAngle);
    const sinR = Math.sin(rotationAngle);
    
    const rotatedX = (node.baseX - 200) * cosR - (node.baseZ) * sinR + 200;
    const rotatedZ = (node.baseX - 200) * sinR + (node.baseZ) * cosR;
    
    node.x = rotatedX;
    node.y = node.baseY; // Stabilize altitude vector

    const parent = modelClusters[node.entry.model] || modelClusters['manual-entry'];
    
    // Draw interaction synapse connection lines
    ctx.beginPath();
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle = node.color + '22';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Render node sphere point 
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = node.color;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset canvas filter engine
  });

  requestAnimationFrame(renderMatrixSpace);
}

// Interactive Action Click Handler Hooks
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const nodes = mapLedgerToNodes(ledgerData);
  let clickedNode = null;

  // Collision metric matching
  nodes.forEach(node => {
    const dist = Math.hypot(node.x - clickX, node.y - clickY);
    if (dist < node.radius + 4) clickedNode = node;
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

// Update live data engine weights
async function auditInteraction(isCorrect) {
  if (!activeNode) return;
  
  ledgerData = ledgerData.map(entry => {
    if (entry.id === activeNode.id) {
      return { ...entry, was_correct: isCorrect, claimed_confidence: "reviewed" };
    }
    return entry;
  });

  await StorageSync.saveLedger(ledgerData);
  updateStatsBanner();
  document.getElementById('inspection-panel').classList.add('hidden');
}

document.getElementById('btn-correct').addEventListener('click', () => auditInteraction(true));
document.getElementById('btn-hallucinated').addEventListener('click', () => auditInteraction(false));

function updateStatsBanner() {
  const verified = ledgerData.filter(e => e.was_correct !== null).length;
  const accuracy = ledgerData.filter(e => e.was_correct === true).length;
  document.getElementById('stats-banner').innerText = `${ledgerData.length} Interactions Intercepted • ${verified} Audited • Accuracy: ${verified ? Math.round((accuracy/verified)*100) : 0}%`;
}

// Background storage synchronization runtime hook
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
  updateStatsBanner();
  renderMatrixSpace();
});
