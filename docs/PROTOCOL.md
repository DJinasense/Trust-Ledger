# The Trust Ledger Protocol (v0.1)

> A draft specification for accountable human-AI relationships.

## Core Principle

**Trust is granular, contextual, and earned over time.** Any system claiming to be "trustworthy" in the abstract is either lying or naive. The Trust Ledger protocol makes trust explicit, auditable, and repairable.

## 1. The Ledger

Every interaction between a human and an AI system SHOULD be loggable as a **Ledger Entry** containing:

- **Identity of the AI** (model name, version if known)
- **Context** (what domain was this in?)
- **What was claimed** (the response)
- **Claimed confidence** (how certain did the AI appear?)
- **Actual correctness** (human's assessment)
- **Correction** (if wrong, what should have been said)
- **Trust rating** (human's subjective trust for this specific interaction, 1-5)

### Why this matters

Current AI systems have no memory of their own failures from the user's perspective. A ledger creates:

1. **Accountability** — The AI (or its operator) can see patterns of failure
2. **User agency** — The human has a record they control, not a black box
3. **Contextual trust** — "I trust this AI on code, not on medical advice" becomes data, not intuition

## 2. The Model of You

Every human user SHOULD maintain an explicit, editable **Model of You** — a structured representation of:

- Communication preferences
- Expertise domains
- Behavioral preferences (how they want uncertainty handled)
- Correction history (what the AI got wrong about them before)

### Key properties

- **User-owned**: The user can export, edit, or delete it at any time
- **Portable**: Can be handed to any AI system that supports the protocol
- **Honest about uncertainty**: The model should flag areas where the AI is guessing about the user

## 3. Trust Score Computation

Trust scores MUST NOT be global. They are computed per:

- **Context** (code, advice, facts, etc.)
- **Model** (GPT-4, Claude, etc.)
- **Time window** (recent behavior matters more)

### Formula (suggested)

```
context_trust = average(trust_ratings in context) * correctness_weight

where correctness_weight = 
  (correct_count + 0.5 * partial_count) / total_verified_entries
```

The protocol does not mandate a specific formula. It mandates that the formula be **visible and debatable**.

## 4. The Correction Protocol

When an AI is wrong about a user:

1. The user logs the correction in the Ledger
2. The correction is added to the Model of You's correction history
3. Future AI interactions SHOULD reference this history
4. The AI SHOULD explicitly acknowledge when it is operating in an area where it has been corrected before

## 5. Privacy & Data Sovereignty

- Ledger data belongs to the user
- Default storage: local-first
- Optional sync: encrypted, user-controlled
- No analytics, no "improving the model" without explicit opt-in per entry

## Open Questions

- How do we handle shared/collaborative trust? (e.g., a team using the same AI)
- Should there be a standard API for AIs to read/write ledger entries?
- How do we prevent gamification or obsessive trust-tracking?
- What's the right granularity for "context"?

## Contributing

This is a living document. If you've felt the friction, edit it.
