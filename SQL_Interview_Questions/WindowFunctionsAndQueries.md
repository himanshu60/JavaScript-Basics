# SQL Window Functions and Practical Query Problems

---

# PART 1 — Window Functions

## 1. What is a Window Function?

**Definition:** A window function performs a calculation across a set of rows **related to the current row**, without collapsing them into one row. Unlike `GROUP BY`, every input row stays in the output.

**The difference in one example:**

```sql
-- GROUP BY: 3 departments → 3 rows, detail is lost
SELECT department, AVG(salary) FROM employees GROUP BY department;

-- Window: 100 employees → 100 rows, each with its department average alongside
SELECT name, department, salary,
       AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```

**The syntax:**

```sql
function() OVER (
  PARTITION BY column      -- split rows into groups (like GROUP BY, but non-collapsing)
  ORDER BY column          -- order within each group
  ROWS BETWEEN ... AND ... -- the frame: which rows to include
)
```

---

## 2. Ranking functions

| Function | Definition | 100, 90, 90, 80 → |
|---|---|---|
| `ROW_NUMBER()` | A unique sequential number, ties broken arbitrarily | 1, 2, 3, 4 |
| `RANK()` | Same rank for ties, then **skips** numbers | 1, 2, 2, 4 |
| `DENSE_RANK()` | Same rank for ties, **no gaps** | 1, 2, 2, 3 |
| `NTILE(n)` | Splits rows into n roughly equal buckets | quartiles etc. |

```sql
SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
  RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank
FROM employees;
```

### The classic question — top N per group

**Problem:** Get the top 3 highest-paid employees **in each department**.

```sql
WITH ranked AS (
  SELECT name, department, salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
  FROM employees
)
SELECT name, department, salary
FROM ranked
WHERE rn <= 3;
```

> You **cannot** filter on a window function directly in `WHERE` — window functions run after `WHERE`. Wrap it in a CTE or subquery. This is the single most common mistake with window functions.

### The other classic — Nth highest salary

```sql
-- 2nd highest salary overall
WITH ranked AS (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE rnk = 2;

-- Simpler alternative
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;
```

> Use `DENSE_RANK` here, not `ROW_NUMBER` — if two people share the top salary, `ROW_NUMBER` would return one of *them* as "second highest" rather than the genuinely second-highest value.

---

## 3. Value functions

**Definition of `LAG(col, n)`:** Returns the value from `n` rows **before** the current row.
**Definition of `LEAD(col, n)`:** Returns the value from `n` rows **after**.

```sql
-- Month-on-month growth
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_month,
  revenue - LAG(revenue) OVER (ORDER BY month) AS change,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
    / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2
  ) AS pct_change
FROM monthly_sales;
```

**Other value functions:** `FIRST_VALUE()`, `LAST_VALUE()`, `NTH_VALUE()`.

---

## 4. Running totals and moving averages

**Definition of a Frame:** The subset of rows in the partition that the function actually looks at, relative to the current row.

```sql
-- Running total (cumulative sum)
SELECT order_date, amount,
  SUM(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders;

-- 7-day moving average
SELECT order_date, amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS moving_avg_7d
FROM daily_sales;
```

**Frame keywords:** `UNBOUNDED PRECEDING` (start of partition), `n PRECEDING`, `CURRENT ROW`, `n FOLLOWING`, `UNBOUNDED FOLLOWING`.

> **Default frame gotcha:** with an `ORDER BY` and no explicit frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — which is why `LAST_VALUE()` unexpectedly returns the current row instead of the partition's last.

---

# PART 2 — Practical query problems

These are the queries that actually come up in interviews.

## Q1. Find duplicate rows

```sql
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

## Q2. Delete duplicates, keeping one

```sql
-- Keep the lowest id of each duplicate group
DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id) FROM users GROUP BY email
);

-- Cleaner with a window function
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
  FROM users
)
DELETE FROM users WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

## Q3. Second highest salary

```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```
Returns `NULL` safely if there is no second value — which interviewers check for.

## Q4. Employees earning more than their manager

```sql
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

## Q5. Users who never placed an order

```sql
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

## Q6. Department with the highest average salary

```sql
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC
LIMIT 1;
```

## Q7. Monthly revenue report

```sql
SELECT
  DATE_TRUNC('month', created_at) AS month,     -- Postgres
  COUNT(*)                        AS order_count,
  SUM(total)                      AS revenue,
  ROUND(AVG(total), 2)            AS avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```
MySQL equivalent: `DATE_FORMAT(created_at, '%Y-%m')`.

## Q8. Customers with more than 5 orders and over ₹10,000 spent

```sql
SELECT u.id, u.name, COUNT(o.id) AS orders, SUM(o.total) AS spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5 AND SUM(o.total) > 10000
ORDER BY spent DESC;
```

## Q9. Consecutive days a user logged in (gaps and islands)

```sql
-- Subtracting a row number from the date gives a constant for consecutive runs
WITH grouped AS (
  SELECT user_id, login_date,
         login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date))::int
           AS grp
  FROM logins
)
SELECT user_id, MIN(login_date) AS streak_start, COUNT(*) AS streak_length
FROM grouped
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;
```

## Q10. Pivot rows into columns

```sql
SELECT
  department,
  COUNT(*) FILTER (WHERE status = 'active')   AS active,     -- Postgres
  COUNT(*) FILTER (WHERE status = 'inactive') AS inactive
FROM employees
GROUP BY department;

-- Portable version (works in MySQL too)
SELECT
  department,
  SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active,
  SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive
FROM employees
GROUP BY department;
```

## Q11. Running total of orders per customer

```sql
SELECT user_id, order_date, total,
  SUM(total) OVER (PARTITION BY user_id ORDER BY order_date) AS lifetime_value
FROM orders;
```

## Q12. Update one table from another

```sql
-- Postgres
UPDATE products p
SET stock = s.quantity
FROM stock_updates s
WHERE p.id = s.product_id;

-- MySQL
UPDATE products p
JOIN stock_updates s ON p.id = s.product_id
SET p.stock = s.quantity;
```

## Q13. Upsert (insert or update)

```sql
-- Postgres
INSERT INTO users (email, name)
VALUES ('a@b.com', 'Amit')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- MySQL
INSERT INTO users (email, name) VALUES ('a@b.com', 'Amit')
ON DUPLICATE KEY UPDATE name = VALUES(name);
```

---

## PostgreSQL vs MySQL — the differences that matter

| Feature | PostgreSQL | MySQL |
|---|---|---|
| Auto-increment | `SERIAL` / `IDENTITY` | `AUTO_INCREMENT` |
| String concatenation | `\|\|` or `CONCAT()` | `CONCAT()` only |
| Case sensitivity | Sensitive by default | Depends on collation |
| `FULL OUTER JOIN` | ✅ | ❌ (emulate with UNION) |
| Upsert | `ON CONFLICT` | `ON DUPLICATE KEY UPDATE` |
| Arrays / JSONB | ✅ Strong support | JSON only |
| Window functions | ✅ Long-standing | ✅ Since 8.0 |
| CTEs | ✅ Including recursive | ✅ Since 8.0 |
| Default isolation | READ COMMITTED | REPEATABLE READ |
| Best for | Complex queries, data integrity | Read-heavy web apps, simplicity |

---

## Key points

- Window functions calculate across related rows **without collapsing** them.
- `ROW_NUMBER` always unique · `RANK` skips after ties · `DENSE_RANK` does not skip.
- You cannot filter a window function in `WHERE` — wrap it in a CTE.
- `LAG`/`LEAD` compare a row with the previous/next one — the basis of growth reports.
- Frames (`ROWS BETWEEN ...`) give running totals and moving averages.
- Know the standard queries cold: duplicates, Nth highest, never-ordered users, monthly reports.
- Postgres and MySQL differ on upsert syntax, `FULL OUTER JOIN` and default isolation.
