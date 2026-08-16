// Trust Ledger — Core Logic
// Everything stored in localStorage. No backend needed for MVP.

const STORAGE_KEYS = {
    ENTRIES: 'tl_entries',
    MODEL: 'tl_model'
};

const TRUST_LABELS = {
    1: 'Distrust',
    2: 'Wary',
    3: 'Neutral',
    4: 'Trusting',
    5: 'Full Trust'
};

// ─── State ───
let entries = [];
let userModel = getDefaultModel();

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTabs();
    initForm();
    initModelEditor();
    initTrustView();
    renderEntries();
    renderTrustScores();
});

function getDefaultModel() {
    return {
        communication_style: 'concise',
        tone: 'direct',
        expertise: ['javascript', 'product-design'],
        preferences: {
            explanations: 'show-work',
            uncertainty: 'admit'
        },
        corrections: []
    };
}

// ─── Storage ───
function loadData() {
    const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    const rawModel = localStorage.getItem(STORAGE_KEYS.MODEL);
    if (rawEntries) entries = JSON.parse(rawEntries);
    if (rawModel) userModel = JSON.parse(rawModel);
}

function saveEntries() {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

function saveModel() {
    localStorage.setItem(STORAGE_KEYS.MODEL, JSON.stringify(userModel));
}

// ─── Tabs ───
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'trust') renderTrustScores();
        });
    });
}

// ─── Form ───
function initForm() {
    const trustSlider = document.getElementById('trust-rating');
    const trustLabel = document.getElementById('trust-label');
    trustSlider.addEventListener('input', () => {
        trustLabel.textContent = TRUST_LABELS[trustSlider.value];
    });

    // Correctness buttons
    document.querySelectorAll('.correct-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.correct-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('was-correct').value = btn.dataset.val;
            document.getElementById('correction-row').style.display = 
                btn.dataset.val === 'false' ? 'block' : 'none';
        });
    });

    document.getElementById('add-entry').addEventListener('click', addEntry);
}

function addEntry() {
    const model = document.getElementById('model').value.trim() || 'unknown';
    const context = document.getElementById('context').value;
    const prompt = document.getElementById('prompt').value.trim();
    const response = document.getElementById('response').value.trim();
    const claimedConfidence = document.getElementById('claimed-confidence').value;
    const wasCorrect = document.getElementById('was-correct').value;
    const correction = document.getElementById('correction').value.trim();
    const trustRating = parseInt(document.getElementById('trust-rating').value);
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);

    if (!response) {
        alert('Please at least record what the AI said.');
        return;
    }

    const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        model,
        context,
        prompt,
        response,
        claimed_confidence: claimedConfidence,
        was_correct: wasCorrect || 'unknown',
        correction: wasCorrect === 'false' ? correction : null,
        trust_rating: trustRating,
        tags
    };

    entries.unshift(entry);
    saveEntries();

    // If there was a correction, add it to the Model's correction history
    if (wasCorrect === 'false' && correction) {
        addCorrectionToModel(context, response, correction);
    }

    // Reset form
    document.getElementById('model').value = '';
    document.getElementById('response').value = '';
    document.getElementById('prompt').value = '';
    document.getElementById('correction').value = '';
    document.getElementById('was-correct').value = '';
    document.querySelectorAll('.correct-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('correction-row').style.display = 'none';
    document.getElementById('trust-rating').value = 3;
    document.getElementById('trust-label').textContent = 'Neutral';

    renderEntries();
    renderTrustScores();
}

function addCorrectionToModel(context, wrong, corrected) {
    userModel.corrections.unshift({
        date: new Date().toISOString().split('T')[0],
        context,
        from: wrong.substring(0, 100) + (wrong.length > 100 ? '...' : ''),
        to: corrected.substring(0, 100) + (corrected.length > 100 ? '...' : '')
    });
    // Keep last 20
    if (userModel.corrections.length > 20) userModel.corrections.pop();
    saveModel();
    renderModelCorrections();
}

// ─── Render Entries ───
function renderEntries() {
    const container = document.getElementById('entries');
    document.getElementById('entry-count').textContent = `(\${entries.length})`;

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty">No entries yet. Log your first interaction above.</p>';
        return;
    }

    container.innerHTML = entries.map(e => {
        const date = new Date(e.timestamp).toLocaleDateString();
        const correctClass = e.was_correct;
        const correctLabel = { true: 'Correct', false: 'Wrong', partial: 'Partial', unknown: 'Unsure' }[e.was_correct];
        const dots = Array(5).fill(0).map((_, i) => 
            `<div class="dot \${i < e.trust_rating ? 'filled' : ''}"></div>`
        ).join('');

        return `
        <div class="entry-card">
            <div class="entry-header">
                <div class="entry-meta">
                    <span class="badge model">\${escapeHtml(e.model)}</span>
                    <span class="badge context">\${e.context}</span>
                    <span class="badge \${correctClass}">\${correctLabel}</span>
                </div>
                <button class="delete-btn" onclick="deleteEntry('\${e.id}')">×</button>
            </div>
            \${e.prompt ? `<div class="entry-body"><strong>You:</strong> \${escapeHtml(e.prompt)}</div>` : ''}
            <div class="entry-body">
                <strong>AI:</strong>
                <div class="response-text">\${escapeHtml(e.response)}</div>
            </div>
            \${e.correction ? `
            <div class="entry-correction">
                <strong>Correction:</strong> \${escapeHtml(e.correction)}
            </div>` : ''}
            <div class="entry-footer">
                <div class="trust-dots" title="Trust: \${TRUST_LABELS[e.trust_rating]}">\${dots}</div>
                <div class="tags">\${e.tags.map(t => `<span class="tag">#\${escapeHtml(t)}</span>`).join('')}</div>
                <span>\${date}</span>
            </div>
        </div>
        `;
    }).join('');
}

function deleteEntry(id) {
    entries = entries.filter(e => e.id !== id);
    saveEntries();
    renderEntries();
    renderTrustScores();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Model of You Editor ───
function initModelEditor() {
    // Load values
    document.getElementById('comm-style').value = userModel.communication_style;
    document.getElementById('tone').value = userModel.tone;
    document.getElementById('explanations').value = userModel.preferences.explanations;
    document.getElementById('uncertainty').value = userModel.preferences.uncertainty;
    renderExpertiseTags();
    renderModelCorrections();
    updateRawModel();

    // Listeners
    document.getElementById('comm-style').addEventListener('change', updateModelFromUI);
    document.getElementById('tone').addEventListener('change', updateModelFromUI);
    document.getElementById('explanations').addEventListener('change', updateModelFromUI);
    document.getElementById('uncertainty').addEventListener('change', updateModelFromUI);

    // Expertise input
    const expInput = document.getElementById('expertise-input');
    expInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = expInput.value.trim();
            if (val && !userModel.expertise.includes(val)) {
                userModel.expertise.push(val);
                expInput.value = '';
                updateModelFromUI();
                renderExpertiseTags();
            }
        }
    });

    document.getElementById('save-model').addEventListener('click', () => {
        try {
            userModel = JSON.parse(document.getElementById('model-raw').value);
            saveModel();
            // Refresh UI from parsed model
            document.getElementById('comm-style').value = userModel.communication_style;
            document.getElementById('tone').value = userModel.tone;
            document.getElementById('explanations').value = userModel.preferences.explanations;
            document.getElementById('uncertainty').value = userModel.preferences.uncertainty;
            renderExpertiseTags();
            renderModelCorrections();
            alert('Model saved.');
        } catch (err) {
            alert('Invalid JSON: ' + err.message);
        }
    });

    // Export / Import
    document.getElementById('export-model').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(userModel, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-model.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('import-model-btn').addEventListener('click', () => {
        document.getElementById('import-model').click();
    });

    document.getElementById('import-model').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                userModel = JSON.parse(ev.target.result);
                saveModel();
                document.getElementById('comm-style').value = userModel.communication_style;
                document.getElementById('tone').value = userModel.tone;
                document.getElementById('explanations').value = userModel.preferences.explanations;
                document.getElementById('uncertainty').value = userModel.preferences.uncertainty;
                renderExpertiseTags();
                renderModelCorrections();
                updateRawModel();
                alert('Model imported.');
            } catch (err) {
                alert('Invalid file: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
}

function updateModelFromUI() {
    userModel.communication_style = document.getElementById('comm-style').value;
    userModel.tone = document.getElementById('tone').value;
    userModel.preferences.explanations = document.getElementById('explanations').value;
    userModel.preferences.uncertainty = document.getElementById('uncertainty').value;
    saveModel();
    updateRawModel();
}

function renderExpertiseTags() {
    const container = document.getElementById('expertise-container');
    container.innerHTML = userModel.expertise.map(tag => `
        <div class="tag-chip">
            \${escapeHtml(tag)}
            <button onclick="removeExpertise('\${tag}')">×</button>
        </div>
    `).join('');
}

function removeExpertise(tag) {
    userModel.expertise = userModel.expertise.filter(t => t !== tag);
    saveModel();
    renderExpertiseTags();
    updateRawModel();
}

function renderModelCorrections() {
    const container = document.getElementById('corrections-list');
    if (!userModel.corrections || userModel.corrections.length === 0) {
        container.innerHTML = '<p class="empty">No corrections yet. They appear here when you log them in the Ledger.</p>';
        return;
    }
    container.innerHTML = userModel.corrections.map(c => `
        <div class="correction-item">
            <div class="corr-date">\${c.date} · \${c.context}</div>
            <div class="corr-change">
                <span class="corr-from">\${escapeHtml(c.from)}</span>
                <span style="color:var(--text-muted)"> → </span>
                <span class="corr-to">\${escapeHtml(c.to)}</span>
            </div>
        </div>
    `).join('');
}

function updateRawModel() {
    document.getElementById('model-raw').value = JSON.stringify(userModel, null, 2);
}

// ─── Trust Scores ───
function initTrustView() {
    // Nothing special needed; rendered on tab switch
}

function renderTrustScores() {
    const grid = document.getElementById('trust-grid');
    const timeline = document.getElementById('timeline-chart');

    if (entries.length === 0) {
        grid.innerHTML = '<p class="empty" style="grid-column:1/-1">Add entries to see trust breakdowns.</p>';
        timeline.innerHTML = '<p class="empty">Add ledger entries to see your trust timeline.</p>';
        return;
    }

    // Compute per-context and per-model scores
    const byContext = {};
    const byModel = {};

    entries.forEach(e => {
        if (!byContext[e.context]) byContext[e.context] = { total: 0, count: 0, correct: 0, wrong: 0 };
        byContext[e.context].total += e.trust_rating;
        byContext[e.context].count++;
        if (e.was_correct === 'true') byContext[e.context].correct++;
        if (e.was_correct === 'false') byContext[e.context].wrong++;

        if (!byModel[e.model]) byModel[e.model] = { total: 0, count: 0, correct: 0, wrong: 0 };
        byModel[e.model].total += e.trust_rating;
        byModel[e.model].count++;
        if (e.was_correct === 'true') byModel[e.model].correct++;
        if (e.was_correct === 'false') byModel[e.model].wrong++;
    });

    const cards = [];

    Object.entries(byContext).forEach(([ctx, data]) => {
        const score = (data.total / data.count).toFixed(1);
        const pct = (score / 5) * 100;
        cards.push({ title: ctx, score, pct, count: data.count, correct: data.correct, wrong: data.wrong });
    });

    Object.entries(byModel).forEach(([mdl, data]) => {
        const score = (data.total / data.count).toFixed(1);
        const pct = (score / 5) * 100;
        cards.push({ title: mdl, score, pct, count: data.count, correct: data.correct, wrong: data.wrong, isModel: true });
    });

    grid.innerHTML = cards.map(c => `
        <div class="trust-card">
            <h4>\${c.isModel ? 'Model' : 'Context'}: \${escapeHtml(c.title)}</h4>
            <div class="trust-score-big">\${c.score}<span style="font-size:1rem;color:var(--text-muted)">/5</span></div>
            <div class="trust-score-bar"><div class="fill" style="width:\${c.pct}%"></div></div>
            <div class="meta">\${c.count} entries · \${c.correct}✓ · \${c.wrong}✗</div>
        </div>
    `).join('');

    // Simple timeline: last 20 entries, trust rating over time
    const recent = entries.slice(0, 20).reverse();
    const maxH = 120;
    const barW = Math.max(8, Math.floor(600 / recent.length));
    const bars = recent.map((e, i) => {
        const h = (e.trust_rating / 5) * maxH;
        const color = e.was_correct === 'false' ? 'var(--wrong)' : 
                      e.was_correct === 'true' ? 'var(--correct)' : 'var(--partial)';
        return `<rect x="\${i * (barW + 4)}" y="\${maxH - h}" width="\${barW}" height="\${h}" fill="\${color}" rx="3" />`;
    }).join('');

    const svgW = recent.length * (barW + 4);
    timeline.innerHTML = `
        <div style="overflow-x:auto;">
            <svg width="\${svgW}" height="\${maxH + 20}" style="display:block;margin:0 auto;">
                \${bars}
            </svg>
            <div style="text-align:center;margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted);">
                <span style="color:var(--correct)">■ Correct</span> · 
                <span style="color:var(--wrong)">■ Wrong</span> · 
                <span style="color:var(--partial)">■ Partial/Unsure</span>
                <br>Last \${recent.length} entries (oldest → newest)
            </div>
        </div>

                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    `;
}
