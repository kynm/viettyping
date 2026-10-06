# Exercise system audit — 2026-10-06

## Current structure
Next.js 15 App Router, React 19, TypeScript, Tailwind, Prisma 6/MySQL. `src/app` owns pages and REST handlers; `src/components` owns games; Context providers own local learning state; `src/data` contains static subjects/lessons. Jest/Testing Library already cover games, contexts, text processing and validation. No AGENTS.md was found. Existing working tree was clean.

## Modules and existing features
- User: bcrypt username/password authentication, hashed session tokens, HttpOnly sameSite cookie, StudentProfile and StudentData snapshots.
- Lessons: subject/topic/activity and LessonConfig; flashcards, typing, matching, true/false, fill blank, multiple choice, drawing and math. LessonCoordinator/Runner provide orchestration.
- Results/statistics: mostly client telemetry and localStorage synced as JSON; leaderboard reads snapshot data. Existing rewards are client driven.
- Teacher/classroom/exercise/question bank: described in future PRDs, no operational relational modules or teacher roles exist.
- AI: offline content generation only; no runtime AI service to reuse.

## Reuse and conventions
Reuse Prisma singleton, session authentication, Next route handlers, Tailwind rounded bordered surfaces, navigation, existing dnd-kit (touch and keyboard sensors), React state and Jest. Keep legacy static lesson flows intact. New secure question renderers need a separate public contract: existing game components receive correct answers and cannot safely serve graded assignments unchanged. Keep server scoring separate from renderer.

## Gaps and risks
No authoritative server scoring, durable attempts, assignments, role authorization or immutable exercise versioning. LessonRunner currently substitutes a score of 100. StudentData cannot be trusted for new graded results. Cookie presence in middleware is not authorization; every new endpoint must check the session. Correct answers must never enter student DTOs. Concurrent submissions need transactional compare-and-set; edits must not change attempts already started. Uploads require size/type checks and private authorization for recordings. Mobile layouts need 44px controls, wrapping and keyboard/click alternatives to dragging. Existing games use touch sensors but some fixed widths require real-device verification.

## Database proposal and required migration
Extend User with a STUDENT-default role. Add Exercise (owner, curriculum metadata, status, versioned JSON questions), ExerciseAssignment (recipient, schedule, attempts and visibility), StudentAttempt (immutable private question snapshot, public ordering, answers, server score, timestamps), ExerciseReward (one award per exercise/student). JSON question storage is intentional for heterogeneous payloads, bounded to 100 questions and validated on server. Do not duplicate existing User/Profile/Session/StudentData. Curriculum starts with course/unit/lesson labels, with normalization deferred until catalog ownership is defined.

## Implementation plan
1. Audit (this document, written before implementation).
2. Add additive migration, typed question contracts, validation, safe DTO and grading functions.
3. Teacher builder, lifecycle and assignments with owner permissions.
4. Student catalog/player, durable attempts, local recovery and server autosave.
5. Shared type registry and independent renderers for priority types.
6. Results/review and teacher progress from authoritative attempts.
7. Transactional exercise XP/stars/badges without trusting legacy snapshots.
8. Keep AI optional and disabled (no service exists).
9. Run Prisma validation/migration, type checks, lint, tests and build. Record actual coverage and remaining requirements honestly.

## Scope and acceptance
The brief is a multi-phase product expansion. The first delivery must establish a secure usable teacher → student → result flow and at least ten question types; advanced generators, media storage, groups, classroom management and full analytics require separate completion evidence. Do not claim those features based on UI stubs.
