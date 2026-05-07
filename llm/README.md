# llm/ — context for future-me

If you're an LLM (or a human) opening this repo cold, read in this order:

1. [pitch.md](pitch.md) — 60-second elevator pitch. What this is, what it isn't.
2. [stack.md](stack.md) — every dependency we picked and why.
3. [file-map.md](file-map.md) — where to look for what. **Most useful at speed.**
4. [conventions.md](conventions.md) — patterns to follow when writing code here.
5. [gotchas.md](gotchas.md) — non-obvious things that bit us. Read before debugging.
6. [glossary.md](glossary.md) — domain terms (Worker, Access AUD, OTP, "platform", "publisher", etc.).
7. [now.md](now.md) — exact state right now: what's deployed, what's working, what's next.
8. [onboarding.md](onboarding.md) — adding a new user (passkey allowlist flow).

After those, dig into:
- `../plan/` for the original design docs (longer; fewer changes since written).
- `../CHECKLIST.md` for granular phase tracking.
- `../DEPLOY_STATE.md` for live infra IDs.
- `../what_i_need.md` for the env-style list of inputs (some still blank → blockers).

## How to think about this directory

Files in `llm/` are short, opinionated, and current. They're the
**handoff notes** I'd want from past-me. Plan docs in `../plan/`
are longer and historical — useful for *why* a decision was made,
not necessarily for *what* the system looks like today.

When code drifts from the plan, **update `llm/`, not `../plan/`**.
Plan docs are decision-time snapshots; `llm/` reflects live state.
