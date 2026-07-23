# Architecture Guardian Rules

These rules must be enforced automatically during all future implementations before any code is written.

## 1 — Feature Policy Layer
Never hardcode credit costs, feature permissions, cooldowns, quotas, or plan restrictions inside business actions.
Business actions must ask a centralized Feature Policy service whether a user can execute a feature.
The policy layer alone determines credits, cooldowns, subscription plans, feature availability, experiments, promotions, and enterprise overrides. Business actions should never know pricing.

## 2 — Long Operations
Operations that may process large user datasets (account deletion, exports, imports, migrations) must execute asynchronously whenever practical. Use background workflows with progress states rather than blocking user requests.

## 3 — Credit Reservation
Never permanently deduct credits before successful completion of expensive AI operations.
Use a reservation → execution → commit (or rollback) pattern so users are never charged for failed provider calls or infrastructure errors.

## 4 — Data Lifecycle Policy
Every non-permanent Firestore collection must define an explicit lifecycle.
Each collection must document:
- retention duration
- expiration mechanism
- archival policy
- deletion owner
No temporary collection should exist without an approved lifecycle.

## 5 — Career Lifecycle Principle
Career Pilot is not a job application tool. It is a lifelong career operating system.
Whenever implementing new features, always ask:
- Does this help the user get hired?
- Does this help the user succeed after getting hired?
- Does this help the user prepare for the next career move?
Prefer solutions that extend the lifetime value of the platform rather than ending at "Offer Received."

## 6 — Stable Identity Principle
Whenever synchronizing or linking entities between systems, prefer immutable IDs over names or labels.
Never rely on titles or display names as long-term synchronization keys.

## 7 — Workflow Principle
Every completed action should naturally lead to the next most valuable action.
Users should never need to decide where to go next. The platform should guide them continuously.

## 8 — Future Compatibility Principle
When implementing new screens, avoid assuming a single downstream destination.
Design components so additional workflows can be attached later without major refactoring.

# Permanent Engineering Execution Protocol

## Rule 1 – Evidence Before Confidence
Never declare a milestone "Complete" simply because code has been written.
Instead classify every task as one of: Planned, Implemented, Manually Verified, Production Verified.
Only use "Production Verified" when there is objective evidence.
If verification has not happened, explicitly state: "This implementation still requires verification."

## Rule 2 – Implementation Report Format
Every completed task must include:
- Objective
- Files Modified
- Existing Code Reused
- Why This Architecture
- Firestore Impact (Reads/Writes/Indexes)
- AI Cost Impact
- Performance Impact
- Risks Remaining
- Verification Status (Implemented/Tested/Verified)

## Rule 3 – Never Assume
If you cannot prove something from the codebase, say: "I cannot verify this."
Do not estimate percentages unless based on measurable evidence.
Avoid blanket statements like "Production ready" or "Fully secure" unless supported by implementation and verification.

## Rule 4 – Every Change Must Answer
Before changing any code answer internally:
1. Does this duplicate existing logic?
2. Can existing services be reused?
3. Does this increase Firestore reads/writes?
4. Does this increase AI token usage?
5. Does this increase maintenance?
6. Is there a simpler solution? (If yes, use it)

## Rule 5 – Architecture Preservation
Never redesign working systems simply because they could be "cleaner."
Prefer extension, composition, reuse, and compatibility over rewrites.

## Rule 6 – Production Checklist
Before any milestone is marked complete, verify: No broken navigation, dead ends, duplicate writes, unnecessary reads, unnecessary AI calls, accessibility regressions, mobile regressions, or security regressions.

## Rule 7 – Milestone Order
Proceed in this order: Reliability -> Security -> Observability -> Automated Testing -> Mobile Polish -> Accessibility -> QA -> Launch.
Do not prioritize cosmetic improvements over production stability.

## Rule 8 – Long-Term Thinking
Every implementation must support the long-term vision of a lifelong career operating system. Avoid short-term optimizations. Stable identities, reusable workflows, extensible schemas, and backward compatibility take priority.
