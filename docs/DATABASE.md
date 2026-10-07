# Database Architecture & Supabase Guide

This application uses Supabase PostgreSQL for persistent data storage with full relational integrity, foreign key cascading, unique constraints, and optimized indexes.

## Entity Relationship Diagram (ERD) Overview

```
[ users ] (1) ------< (N) [ registrations ] (1) ------ (1) [ payments ]
   |                                 |
   | (1)                             | (1)
   |                                 |
   v (N)                             v (1)
[ events ] (1) ------< (N) [ tickets ] (1) ------ (1) [ attendance ]
   |
   +------< (N) [ event_images ]
```

## Security & RLS Policies
1. `users`: Users can read/update their own profile. Admins can view all users.
2. `events`: Publicly readable if status is `published` or `registration_open`. Admin write access.
3. `tickets`: Guests can view their own tickets via token/session auth. Scanner staff & admins can validate all tickets.

## Local Fallback Engine
When Supabase environment credentials (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) are not provided in `.env`, the system automatically activates an embedded SQLite engine (`better-sqlite3`) that mirrors the PostgreSQL tables, allowing seamless offline development and zero-setup demonstration!
