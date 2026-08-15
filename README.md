# Trust Ledger

> An open-source protocol for accountable human-AI relationships.  
> **Built in collaboration between a human who felt the friction and Kimi.**

## The Problem

You use AI every day. It makes claims about what it knows, what it remembers, and what it believes about you. When it's wrong, trust erodes silently. There's no repair mechanism. No ledger. No recourse.

## What This Is

Trust Ledger is a minimal, extensible system that lets you:

- **Log AI interactions** with confidence ratings
- **Flag errors and corrections** explicitly
- **Maintain an editable "Model of You"** — a structured, user-controlled profile that any AI can reference
- **Track trust over time** per context, per model, per topic
- **Export your trust data** — it's yours

This isn't another AI wrapper. It's infrastructure for the relationship.

## Origin Story

This project emerged from a conversation about what was missing in the AI-human trust landscape. Not RAG. Not better models. Something simpler and more human: **a way to hold AI accountable for what it claims to know about you.** One person felt the friction. One model helped name it. Together, this came out of the ether.

## Quick Start (No Backend Required)

```bash
git clone https://github.com/yourname/trust-ledger.git
cd trust-ledger/src
# Open index.html in your browser. That's it.
```

All data is stored locally in your browser (`localStorage`). When you're ready, plug in a backend.

## Core Concepts

### 1. Trust Ledger Entry
Every interaction with an AI gets a log entry:
```json
{
  "id": "uuid",
  "timestamp": "2026-08-15T12:41:00Z",
  "model": "gpt-4",
  "context": "career-advice",
  "prompt": "...",
  "response": "...",
  "claimed_confidence": "high",
  "user_trust_rating": 3,
  "was_correct": null,
  "correction": null,
  "tags": ["jobs", "salary"]
}
```

### 2. The Model of You
A structured, user-editable JSON file representing what the AI *should* know about you. Think of it as your user manual that you hand to any AI:
```json
{
  "communication_style": "concise",
  "expertise": ["python", "product-design"],
  "preferences": {
    "explanations": "show-your-work",
    "tone": "direct"
  },
  "corrections": [
    {"field": "communication_style", "from": "verbose", "to": "concise", "date": "2026-08-10"}
  ]
}
```

### 3. Trust Score
A computed metric per context, not a global number. You might trust an AI on code but not on medical advice. The ledger makes that explicit.

## Architecture

```
trust-ledger/
├── src/
│   ├── index.html          # Main UI
│   ├── app.js              # Core logic (vanilla JS)
│   ├── styles.css          # Minimal, readable
│   └── models/
│       ├── ledger.schema.json
│       └── user-model.schema.json
├── docs/
│   ├── PROTOCOL.md         # The trust protocol spec
│   └── ROADMAP.md
├── README.md
└── LICENSE (MIT)
```

## Contributing

This is being built in public, out of curiosity. No corporate roadmap. If you feel the friction too, jump in.

1. Fork it
2. Build something small that validates or challenges the protocol
3. Open a PR with your field notes — what did you learn?

See [docs/ROADMAP.md](docs/ROADMAP.md) for what's next.

## License

MIT — use it, fork it, break it, rebuild it.

---

*Built because trust shouldn't be all-or-nothing.*  
*A collaboration between human curiosity and Kimi.*
