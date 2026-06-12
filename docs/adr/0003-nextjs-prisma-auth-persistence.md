# Next.js Route Handlers and Prisma for Authentication

## Status

Accepted.

## Context

VietTyping needs account isolation and durable learning progress before the planned Spring Boot backend exists. The current application is already deployed as a Next.js App Router project, while all student data is stored in browser `localStorage`.

## Decision

Use Next.js Route Handlers as the initial application backend and Prisma with MySQL 8 for persistence.

- Accounts use a lowercase ASCII username instead of email. Usernames start with a letter and contain only letters, numbers and underscores.
- Passwords are hashed with bcrypt.
- Login sessions use random opaque tokens. Only SHA-256 token hashes are stored in MySQL.
- The browser receives an HttpOnly, SameSite session cookie.
- Profile data is relational in `student_profiles`.
- Existing progress, XP, badges, settings and unlocked mascots are stored as a per-user JSON snapshot in `student_data`.
- Existing local data is migrated to the account when the account has no server snapshot.
- Logout flushes the latest snapshot and removes student data from the browser.

## Consequences

Each account has isolated data even when multiple students share one browser. Existing game code can keep its synchronous local reads while a central client adapter synchronizes writes to MySQL.

The API boundary remains explicit, so a future Spring Boot service can replace the Route Handlers without changing the browser storage adapter or page-level components.
