# SQL Basics and Joins

## 1. What is SQL?

**Definition:** SQL (Structured Query Language) is the standard language for storing, retrieving and manipulating data in a **relational database** — a database that organises data into tables of rows and columns, with relationships defined between them.

**The command categories:**

| Category | Full name | Commands | Purpose |
|---|---|---|---|
| **DDL** | Data Definition Language | `CREATE`, `ALTER`, `DROP`, `TRUNCATE` | Define the structure |
| **DML** | Data Manipulation Language | `INSERT`, `UPDATE`, `DELETE` | Change the data |
| **DQL** | Data Query Language | `SELECT` | Read the data |
| **DCL** | Data Control Language | `GRANT`, `REVOKE` | Permissions |
| **TCL** | Transaction Control Language | `COMMIT`, `ROLLBACK`, `SAVEPOINT` | Manage transactions |

---

## 2. Creating tables and constraints

**Definition of a Constraint:** A rule enforced by the database on a column, guaranteeing data validity regardless of what the application does.

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,           -- auto-incrementing unique id
  email       VARCHAR(100) UNIQUE NOT NULL, -- no duplicates, no nulls
  name        VARCHAR(50)  NOT NULL,
  age         INT CHECK (age >= 0),         -- value must satisfy the condition
  role        VARCHAR(20) DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id       SERIAL PRIMARY KEY,
  user_id  INT NOT NULL,
  total    DECIMAL(10,2) NOT NULL,          -- exact for money, never FLOAT
  status   VARCHAR(20) DEFAULT 'pending',

  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE                       -- delete the user → delete their orders
);
```

| Constraint | Definition |
|---|---|
| `PRIMARY KEY` | Uniquely identifies each row. Cannot be NULL. One per table. |
| `FOREIGN KEY` | Links to a primary key in another table, enforcing referential integrity |
| `UNIQUE` | No two rows may share this value (NULLs are allowed) |
| `NOT NULL` | The column must always have a value |
| `CHECK` | The value must satisfy a condition |
| `DEFAULT` | Value used when none is supplied |

**`ON DELETE` options:** `CASCADE` (delete the children too), `SET NULL` (orphan them), `RESTRICT` / `NO ACTION` (block the delete).

> **Money rule:** always use `DECIMAL`/`NUMERIC`, never `FLOAT` or `DOUBLE`. Floating point cannot represent `0.1` exactly, so totals drift.

---

## 3. The SELECT statement

**Definition:** `SELECT` reads rows from one or more tables. Its clauses are **written** in one order but **executed** in another — which explains several classic errors.

```sql
SELECT   department, COUNT(*) AS staff_count   -- 5. pick columns
FROM     employees                              -- 1. choose the source
WHERE    salary > 50000                         -- 2. filter ROWS
GROUP BY department                             -- 3. group them
HAVING   COUNT(*) > 5                           -- 4. filter GROUPS
ORDER BY staff_count DESC                       -- 6. sort
LIMIT    10;                                    -- 7. take the top 10
```

**Execution order:** `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`

**Two consequences that are asked constantly:**

```sql
-- ❌ Fails: the alias does not exist yet when WHERE runs
SELECT salary * 12 AS annual FROM employees WHERE annual > 600000;

-- ✅ ORDER BY runs AFTER SELECT, so the alias works there
SELECT salary * 12 AS annual FROM employees ORDER BY annual DESC;
```

---

## 4. WHERE vs HAVING

**Definition of `WHERE`:** Filters **individual rows** *before* grouping. Cannot use aggregate functions.
**Definition of `HAVING`:** Filters **groups** *after* `GROUP BY`. Can use aggregate functions.

```sql
-- ❌ Wrong - aggregates do not exist yet at WHERE time
SELECT department FROM employees WHERE COUNT(*) > 5 GROUP BY department;

-- ✅ Correct
SELECT department, COUNT(*)
FROM employees
WHERE status = 'active'          -- filter rows first (fewer rows to group)
GROUP BY department
HAVING COUNT(*) > 5;             -- then filter the resulting groups
```

**Performance tip:** filter as much as possible in `WHERE`, because it reduces the number of rows before the expensive grouping step.

---

## 5. Aggregate functions

| Function | Definition |
|---|---|
| `COUNT(*)` | Counts all rows, including those with NULLs |
| `COUNT(col)` | Counts rows where `col` is **not NULL** |
| `COUNT(DISTINCT col)` | Counts unique non-null values |
| `SUM(col)` | Total |
| `AVG(col)` | Average — **ignores NULLs** |
| `MIN` / `MAX` | Smallest / largest |

```sql
SELECT
  COUNT(*)            AS total_rows,
  COUNT(phone)        AS rows_with_phone,   -- different if phone can be NULL
  AVG(salary)         AS avg_salary,
  SUM(salary)         AS payroll
FROM employees;
```

> **The NULL trap:** `AVG(salary)` over `[100, 200, NULL]` is `150`, not `100`. NULLs are skipped, not treated as zero. Use `AVG(COALESCE(salary, 0))` if you want them counted.

---

## 6. NULL handling

**Definition:** `NULL` means **unknown**, not zero and not empty string. Any comparison with `NULL` returns `NULL` (not true, not false).

```sql
-- ❌ Never matches anything, not even null rows
SELECT * FROM users WHERE phone = NULL;

-- ✅ Correct
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- Replacing NULLs
SELECT COALESCE(phone, 'not provided') FROM users;   -- first non-null argument
SELECT NULLIF(discount, 0) FROM orders;              -- turn 0 into NULL
```

---

## 7. JOINs — the most asked SQL topic

**Definition:** A JOIN combines rows from two or more tables based on a related column.

**Sample data:**
```
users                    orders
id | name                id | user_id | total
1  | Amit                1  | 1       | 500
2  | Priya               2  | 1       | 300
3  | Rahul               3  | 2       | 700
                         4  | NULL    | 100   (guest order)
```

### INNER JOIN

**Definition:** Returns only the rows that have a match in **both** tables. Non-matching rows from either side are dropped.

```sql
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```
```
Amit  | 500
Amit  | 300
Priya | 700
-- Rahul is missing (no orders), the guest order is missing (no user)
```

### LEFT JOIN (LEFT OUTER JOIN)

**Definition:** Returns **all** rows from the left table, plus matching rows from the right. Where there is no match, the right-hand columns are `NULL`.

```sql
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```
```
Amit  | 500
Amit  | 300
Priya | 700
Rahul | NULL    ← kept, with NULL
```

**The most useful pattern — find rows with NO match:**

```sql
-- Users who have never ordered
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;              -- the "anti-join" trick
```

### RIGHT JOIN

**Definition:** The mirror of LEFT JOIN — all rows from the right table. Rarely used in practice; people swap the table order and use LEFT JOIN instead.

### FULL OUTER JOIN

**Definition:** All rows from both tables, with `NULL`s wherever there is no match.

```sql
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
```
> MySQL does not support `FULL OUTER JOIN` — emulate it with `LEFT JOIN UNION RIGHT JOIN`.

### CROSS JOIN

**Definition:** The Cartesian product — every row of A paired with every row of B. 1,000 × 1,000 rows = 1,000,000 results.

```sql
SELECT s.size, c.colour FROM sizes s CROSS JOIN colours c;
```

> ⚠️ Forgetting the `ON` clause silently produces a CROSS JOIN. This is how people accidentally generate a billion rows.

### SELF JOIN

**Definition:** A table joined to itself, using two aliases. Used for hierarchies stored in one table.

```sql
-- Each employee with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

### Join summary

| Join | Returns |
|---|---|
| `INNER` | Only matching rows from both |
| `LEFT` | All left rows + matches (NULL where none) |
| `RIGHT` | All right rows + matches |
| `FULL OUTER` | Everything from both sides |
| `CROSS` | Every combination (Cartesian product) |
| `SELF` | A table joined to itself |

---

## 8. UNION vs UNION ALL vs JOIN

**Definition of `UNION`:** Stacks the results of two queries **vertically** (more rows) and removes duplicates.
**Definition of `UNION ALL`:** The same, but keeps duplicates — **much faster** because it skips the de-duplication sort.
**Definition of `JOIN`:** Combines tables **horizontally** (more columns).

```sql
SELECT name, email FROM customers
UNION ALL                          -- prefer ALL unless you truly need dedup
SELECT name, email FROM suppliers;
```

**Rules:** both queries must have the same number of columns with compatible types.

---

## 9. Subqueries and CTEs

**Definition of a Subquery:** A query nested inside another query.

```sql
-- Scalar subquery (returns one value)
SELECT name, salary FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- IN subquery (returns a list)
SELECT name FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- EXISTS - usually faster than IN, stops at the first match
SELECT name FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
```

**Definition of a Correlated Subquery:** A subquery that references the outer query, so it re-runs **once per outer row**. Powerful but often slow — a JOIN is usually better.

**Definition of a CTE (Common Table Expression):** A named temporary result set defined with `WITH`, used to break a complex query into readable steps.

```sql
WITH high_value_orders AS (
  SELECT user_id, SUM(total) AS lifetime_value
  FROM orders
  GROUP BY user_id
  HAVING SUM(total) > 10000
)
SELECT u.name, h.lifetime_value
FROM users u
JOIN high_value_orders h ON u.id = h.user_id
ORDER BY h.lifetime_value DESC;
```

**Recursive CTE** — for hierarchies of unknown depth:

```sql
WITH RECURSIVE org_chart AS (
  SELECT id, name, manager_id, 1 AS level      -- anchor: the top
  FROM employees WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, oc.level + 1   -- recursive part
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY level;
```

---

## 10. `IN` vs `EXISTS` vs `JOIN`

| Use | Best when |
|---|---|
| `JOIN` | You need **columns** from the other table |
| `EXISTS` | You only need to **check existence**; stops at the first match |
| `IN` | The subquery returns a small, fixed list |
| `NOT EXISTS` | Checking absence — **safe with NULLs** |

> ⚠️ **The `NOT IN` NULL trap:** if the subquery returns even one `NULL`, `NOT IN` returns **no rows at all**. Always use `NOT EXISTS` instead.

```sql
-- ❌ Returns nothing if any user_id is NULL
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM orders);

-- ✅ Safe
SELECT * FROM users u WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

---

## Key points

- Execution order is `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`, which is why aliases fail in `WHERE` but work in `ORDER BY`.
- `WHERE` filters rows, `HAVING` filters groups.
- `NULL` is unknown — use `IS NULL`, never `= NULL`. Aggregates skip NULLs.
- `INNER` keeps matches only; `LEFT` keeps everything on the left.
- `LEFT JOIN ... WHERE right.id IS NULL` is the standard "find the missing ones" pattern.
- Use `UNION ALL` unless you genuinely need duplicate removal.
- Prefer `NOT EXISTS` over `NOT IN` — NULLs break `NOT IN`.
- Store money as `DECIMAL`, never `FLOAT`.
