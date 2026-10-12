# QuickPoll Entity Relationship Diagram

This document describes the database tables and constraints used in QuickPoll.

```mermaid
erDiagram
    POLLS ||--o{ OPTIONS : "has (2-10)"
    POLLS ||--o{ POLL_VOTERS : "tracks"
    POLLS ||--o{ VOTES : "receives"
    OPTIONS ||--o{ VOTES : "selected in"

    POLLS {
        UUID id PK "DEFAULT gen_random_uuid()"
        TEXT question "NOT NULL"
        BOOLEAN is_multiple_choice "NOT NULL DEFAULT false"
        BOOLEAN is_closed "NOT NULL DEFAULT false"
        UUID admin_token "NOT NULL DEFAULT gen_random_uuid()"
        TIMESTAMPTZ expires_at "NULL"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT NOW()"
    }

    OPTIONS {
        UUID id PK "DEFAULT gen_random_uuid()"
        UUID poll_id FK "REFERENCES polls(id) ON DELETE CASCADE"
        VARCHAR option_text "VARCHAR(255) NOT NULL"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT NOW()"
    }

    POLL_VOTERS {
        UUID poll_id PK, FK "REFERENCES polls(id) ON DELETE CASCADE"
        VARCHAR voter_token PK "VARCHAR(255) NOT NULL"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT NOW()"
    }

    VOTES {
        UUID id PK "DEFAULT gen_random_uuid()"
        UUID poll_id FK "REFERENCES polls(id) ON DELETE CASCADE"
        UUID option_id FK "REFERENCES options(id) ON DELETE CASCADE"
        TIMESTAMPTZ created_at "NOT NULL DEFAULT NOW()"
    }
```

## Key Constraints & Guarantees
1. **Duplicate Ballot Prevention**:
   - `poll_voters` has a compound primary key `(poll_id, voter_token)`.
   - Any duplicate submission attempt triggers PostgreSQL error code `23505` (`unique_violation`), which the API catches and translates to HTTP `409 Conflict`.
2. **Cascading Deletions**:
   - Deleting a poll cascades to its options, voter tracking records, and cast votes (`ON DELETE CASCADE`).
3. **Optimized Indexing**:
   - `idx_options_poll_id` on `options(poll_id)`
   - `idx_votes_poll_id` on `votes(poll_id)`
   - `idx_votes_option_id` on `votes(option_id)`
