# SQL Indexes, Normalization and Transactions

---

# PART 1 — Indexes and Query Optimization

## 1. What is an Index?

**Definition:** An index is a separate data structure (usually a **B-tree**) that stores column values in sorted order with pointers to the matching rows, so the database can find rows without scanning the whole table.

**In simple words:** The index at the back of a book. Without it you read every page; with it you jump straight to the right one.

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);   -- composite
DROP INDEX idx_users_email;
```

**Automatically created:** a `PRIMARY KEY` and a `UNIQUE` constraint each create an index. A `FOREIGN KEY` does **not** in MySQL InnoDB it does, in PostgreSQL it does **not** — a very common cause of slow joins in Postgres.

---

## 2. Types of index

| Type | Definition |
|---|---|
| **B-tree** | The default. Supports `=`, `<`, `>`, `BETWEEN`, `ORDER BY` and prefix `LIKE 'abc%'` |
| **Hash** | Only equality `=`. Faster for exact lookups, useless for ranges |
| **Composite** | Multiple columns in one index — order matters |
| **Unique** | Enforces uniqueness and indexes at the same time |
| **Partial / Filtered** | Indexes only the rows matching a condition — smaller and faster |
| **Covering** | Contains every column the query needs, so the table is never read |
| **Full-text** | For searching inside text |
| **Clustered** | Determines the **physical** row order on disk. One per table |

```sql
-- Partial index: only index what you actually query
CREATE INDEX idx_active_orders ON orders(created_at)
WHERE status IN ('pending', 'processing');

-- Covering index: the query is answered from the index alone
CREATE INDEX idx_cover ON users(email, name, created_at);
SELECT name, created_at FROM users WHERE email = 'a@b.com';   -- never touches the table
```

---

## 3. Composite index column order — the leftmost prefix rule

**Definition:** A composite index on `(a, b, c)` can be used by queries filtering on `a`, `(a,b)` or `(a,b,c)` — but **not** by a query filtering only on `b` or `c`. The index is sorted by `a` first, so skipping it makes the sort order useless.

```sql
CREATE INDEX idx ON orders(user_id, status, created_at);

WHERE user_id = 5                                  -- ✅ uses the index
WHERE user_id = 5 AND status = 'paid'              -- ✅ uses it
WHERE user_id = 5 AND status = 'paid' AND created_at > '2024-01-01'  -- ✅ full use
WHERE status = 'paid'                              -- ❌ cannot use it
WHERE created_at > '2024-01-01'                    -- ❌ cannot use it
```

**Ordering rule:** put **equality** columns first, then the **sort** column, then **range** columns.

---

## 4. When an index is NOT used

```sql
-- 1. A function wrapped around the column
WHERE YEAR(created_at) = 2024          -- ❌ index unusable
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'   -- ✅

-- 2. Leading wildcard
WHERE name LIKE '%smith'               -- ❌ cannot use a B-tree
WHERE name LIKE 'smith%'               -- ✅ prefix search works

-- 3. Type mismatch forcing a cast
WHERE user_id = '123'                  -- ❌ if user_id is INT

-- 4. OR across different columns
WHERE email = 'a@b.com' OR phone = '123'   -- often a full scan; use UNION instead

-- 5. Low selectivity
WHERE gender = 'M'                     -- half the table - a scan is cheaper anyway

-- 6. Negation
WHERE status != 'active'               -- usually a scan
```

---

## 5. EXPLAIN — reading a query plan

**Definition:** `EXPLAIN` shows how the database intends to execute a query. `EXPLAIN ANALYZE` actually runs it and reports real timings.

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.name;
```

**What to look for:**

| Sign | Meaning |
|---|---|
| `Seq Scan` / `ALL` | **Full table scan** — usually means a missing index |
| `Index Scan` / `ref` | Using an index ✅ |
| `Index Only Scan` | Covering index — the fastest ✅ |
| `Nested Loop` | Fine for small sets, terrible for large ones |
| `Hash Join` | Good for large joins |
| `rows` estimate far from actual | Stale statistics — run `ANALYZE` |
| `Filter` removing most rows | The index is not selective enough |

---

## 6. Query optimisation checklist

```sql
-- 1. Never SELECT * - fetch only what you need (enables covering indexes)
SELECT id, name FROM users;

-- 2. Filter early and specifically
-- 3. Avoid functions on indexed columns (see section 4)

-- 4. Paginate with keyset pagination, not large OFFSETs
SELECT * FROM posts ORDER BY id DESC LIMIT 20 OFFSET 100000;  -- ❌ slow
SELECT * FROM posts WHERE id < 12345 ORDER BY id DESC LIMIT 20;  -- ✅ fast

-- 5. Fix N+1 queries - one join instead of 1 + N round trips
-- 6. Batch inserts
INSERT INTO logs (msg) VALUES ('a'), ('b'), ('c');    -- ✅ one statement

-- 7. EXISTS instead of COUNT when you only need a yes/no
SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = 5);
```

**Cost of indexes:** every `INSERT`, `UPDATE` and `DELETE` must also update every affected index. Indexes consume disk and RAM. Index what you actually query — no more.

---

# PART 2 — Normalization

## 7. What is Normalization?

**Definition:** Normalization is organising tables to reduce **redundancy** and prevent **anomalies**, by splitting data so each fact is stored exactly once.

**The three anomalies it prevents:**

| Anomaly | Definition |
|---|---|
| **Insert** | You cannot add a fact because unrelated data is missing |
| **Update** | The same value exists in many rows; updating some leaves the data inconsistent |
| **Delete** | Deleting a row destroys unrelated information |

---

## 8. The normal forms

**Unnormalized:**
```
| order_id | customer     | items                | city  |
| 1        | Amit Kumar   | Laptop, Mouse        | Delhi |
```
Problems: multiple values in one column, customer details repeated on every order.

### 1NF — First Normal Form

**Definition:** Every column holds a single **atomic** value, and there are no repeating groups.

```
orders:       | order_id | customer   | city  |
order_items:  | order_id | item       |
              | 1        | Laptop     |
              | 1        | Mouse      |
```

### 2NF — Second Normal Form

**Definition:** Must be in 1NF, **and** every non-key column depends on the **whole** primary key — not just part of a composite key.

```
-- ❌ Violates 2NF: product_name depends only on product_id, not the full key
order_items (order_id, product_id, quantity, product_name)

-- ✅ Split it
order_items (order_id, product_id, quantity)
products    (product_id, product_name, price)
```

### 3NF — Third Normal Form

**Definition:** Must be in 2NF, **and** no non-key column depends on another non-key column (no *transitive* dependency).

```
-- ❌ Violates 3NF: city and state depend on pincode, not on the customer id
customers (id, name, pincode, city, state)

-- ✅ Split it
customers  (id, name, pincode)
pincodes   (pincode, city, state)
```

### BCNF — Boyce-Codd Normal Form

**Definition:** A stricter 3NF — for every dependency `X → Y`, `X` must be a candidate key. It handles rare cases with overlapping candidate keys.

**The memory aid:** *"Every non-key attribute must depend on the key, the whole key, and nothing but the key."*
- **The key** → 1NF · **The whole key** → 2NF · **Nothing but the key** → 3NF

---

## 9. Denormalization

**Definition:** Deliberately adding redundancy back — duplicating a column or storing a computed total — to avoid expensive joins on read-heavy workloads.

```sql
-- Normalized: counting comments requires a join and aggregate on every page load
SELECT p.*, COUNT(c.id) FROM posts p LEFT JOIN comments c ON ... GROUP BY p.id;

-- Denormalized: store the count and keep it updated
ALTER TABLE posts ADD COLUMN comment_count INT DEFAULT 0;
```

**Trade-off:** faster reads, but writes must now keep the duplicate in sync (a trigger, application logic, or a scheduled job). Normalize by default; denormalize only where you have measured a problem.

---

# PART 3 — Transactions and ACID

## 10. What is a Transaction?

**Definition:** A transaction is a group of statements treated as **one unit** — either all of them take effect, or none do.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

COMMIT;     -- both changes become permanent
-- ROLLBACK; -- or neither happens
```

Without a transaction, a crash between the two statements destroys 500 rupees.

---

## 11. ACID

| Letter | Property | Definition |
|---|---|---|
| **A** | **Atomicity** | All statements succeed, or all are undone |
| **C** | **Consistency** | The database moves from one valid state to another; constraints always hold |
| **I** | **Isolation** | Concurrent transactions do not see each other's incomplete work |
| **D** | **Durability** | Once committed, data survives a crash or power loss |

---

## 12. Concurrency problems

**Definition of a Dirty Read:** Reading data another transaction has written but not yet committed. If it rolls back, you acted on data that never existed.

**Definition of a Non-Repeatable Read:** Reading the same row twice in one transaction and getting different values, because another transaction updated it in between.

**Definition of a Phantom Read:** Running the same query twice and getting **different rows**, because another transaction inserted or deleted rows matching your condition.

**Definition of Lost Update:** Two transactions read the same value, both modify it, and the second overwrites the first.

---

## 13. Isolation levels

**Definition:** Isolation levels let you trade consistency against concurrency — stricter levels prevent more problems but allow less parallelism.

| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| **READ UNCOMMITTED** | ✅ possible | ✅ possible | ✅ possible |
| **READ COMMITTED** | ❌ prevented | ✅ possible | ✅ possible |
| **REPEATABLE READ** | ❌ | ❌ prevented | ✅ possible* |
| **SERIALIZABLE** | ❌ | ❌ | ❌ prevented |

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

**Defaults:** PostgreSQL and Oracle use `READ COMMITTED`. MySQL InnoDB uses `REPEATABLE READ`.
\* MySQL InnoDB prevents phantoms at REPEATABLE READ too, using next-key locking.

---

## 14. Locking and deadlocks

**Definition of a Shared (read) lock:** Many transactions may hold it at once; it blocks writers.
**Definition of an Exclusive (write) lock:** Only one transaction may hold it; it blocks everyone else.

```sql
-- Pessimistic locking: claim the row up front
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- Optimistic locking: no lock, but verify nothing changed
UPDATE products SET stock = stock - 1, version = version + 1
WHERE id = 5 AND version = 3;     -- 0 rows affected → someone else won, retry
```

**Definition of a Deadlock:** Transaction A holds a lock B wants, while B holds a lock A wants. Neither can proceed. The database detects this and kills one of them.

```
Txn A: locks row 1 → wants row 2
Txn B: locks row 2 → wants row 1     → deadlock
```

**How to avoid deadlocks:**
1. Always access rows in the **same order** (e.g. always the lower id first)
2. Keep transactions **short**
3. Use a lower isolation level where acceptable
4. Add **retry logic** — deadlocks are normal under load, not a bug

---

## Key points

- An index is a sorted structure that avoids full table scans; a `PRIMARY KEY` creates one automatically.
- Composite indexes follow the **leftmost prefix** rule; order columns as equality → sort → range.
- Functions on a column, leading `%` wildcards and type mismatches all disable the index.
- Use `EXPLAIN ANALYZE`; `Seq Scan` on a large table means a missing index.
- Normalize to **3NF** by default: depend on the key, the whole key, and nothing but the key.
- Denormalize only where you have measured a read bottleneck.
- **ACID** = Atomicity, Consistency, Isolation, Durability.
- Isolation levels trade consistency for concurrency; know dirty / non-repeatable / phantom reads.
- Prevent deadlocks by locking rows in a consistent order and keeping transactions short.
