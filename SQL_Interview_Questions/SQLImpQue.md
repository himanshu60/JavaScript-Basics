# SQL Interview Questions and Answers

## Basics

## 1. What is SQL?

Structured Query Language — the standard language for defining, querying and manipulating data in a relational database (tables of rows and columns with defined relationships).

## 2. What are DDL, DML, DQL, DCL and TCL?

**DDL** defines structure (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`). **DML** changes data (`INSERT`, `UPDATE`, `DELETE`). **DQL** reads (`SELECT`). **DCL** controls permissions (`GRANT`, `REVOKE`). **TCL** manages transactions (`COMMIT`, `ROLLBACK`, `SAVEPOINT`).

## 3. What is the execution order of a SELECT?

`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`. This is why a `SELECT` alias cannot be used in `WHERE` but can be used in `ORDER BY`.

## 4. Difference between `DELETE`, `TRUNCATE` and `DROP`?

`DELETE` removes selected rows, can have a `WHERE`, is logged row by row and can be rolled back. `TRUNCATE` removes **all** rows quickly, cannot use `WHERE`, and resets identity counters. `DROP` removes the entire table including its structure.

## 5. Difference between `WHERE` and `HAVING`?

`WHERE` filters individual **rows before** grouping and cannot use aggregate functions. `HAVING` filters **groups after** `GROUP BY` and can use aggregates.

## 6. What is a primary key vs a unique key?

A primary key uniquely identifies a row, cannot be NULL, and there is one per table. A unique key also enforces uniqueness but **allows NULLs** and you can have several per table.

## 7. What is a foreign key?

A column referencing the primary key of another table, enforcing referential integrity. `ON DELETE CASCADE` removes the children when the parent is deleted; `SET NULL` orphans them; `RESTRICT` blocks the delete.

## 8. What is a composite key?

A primary key made of two or more columns, used when no single column is unique on its own — for example `(order_id, product_id)` in an order-items table.

## 9. What is the difference between `CHAR` and `VARCHAR`?

`CHAR(n)` is fixed length and pads with spaces — faster for values that are always the same size. `VARCHAR(n)` is variable length and stores only what is needed.

## 10. Why should money never be stored as `FLOAT`?

Floating point cannot represent decimals like `0.1` exactly, so repeated arithmetic drifts and totals end up wrong. Use `DECIMAL`/`NUMERIC`, or store the amount as an integer in the smallest unit (paise/cents).

---

## NULL

## 11. What is NULL in SQL?

`NULL` means **unknown**, not zero and not an empty string. Any comparison with NULL yields NULL, which is why `= NULL` never matches — use `IS NULL`.

## 12. How do aggregate functions treat NULL?

They **skip** NULLs. `COUNT(*)` counts all rows, but `COUNT(column)` counts only non-null values. `AVG` of `[100, 200, NULL]` is 150, not 100.

## 13. What do `COALESCE` and `NULLIF` do?

`COALESCE(a, b, c)` returns the first non-null argument. `NULLIF(a, b)` returns NULL when `a = b` — commonly used as `NULLIF(divisor, 0)` to avoid divide-by-zero.

## 14. Why is `NOT IN` dangerous?

If the subquery returns even one NULL, `NOT IN` returns **no rows at all**, because comparing with NULL is never true. Use `NOT EXISTS` instead.

---

## Joins

## 15. What are the types of JOIN?

`INNER` (matches only), `LEFT` (all left rows), `RIGHT` (all right rows), `FULL OUTER` (everything from both), `CROSS` (Cartesian product), and `SELF` (a table joined to itself).

## 16. Difference between INNER JOIN and LEFT JOIN?

`INNER JOIN` returns only rows that match in both tables. `LEFT JOIN` returns every row from the left table, filling the right-hand columns with NULL where there is no match.

## 17. How do you find rows in table A with no match in table B?

`LEFT JOIN` then filter for NULL:
```sql
SELECT a.* FROM a LEFT JOIN b ON a.id = b.a_id WHERE b.id IS NULL;
```
This is called an anti-join.

## 18. What is a self join and when is it used?

A table joined to itself with two aliases. Used for hierarchies stored in a single table — employees with their managers, categories with parent categories.

## 19. What happens if you forget the ON clause?

You get a `CROSS JOIN` — every row of A paired with every row of B. Two tables of 10,000 rows produce 100 million rows.

## 20. Difference between UNION and UNION ALL?

Both stack results vertically. `UNION` removes duplicates, which requires a sort and is slower. `UNION ALL` keeps everything and is much faster — prefer it unless you genuinely need deduplication.

## 21. Difference between JOIN and UNION?

`JOIN` combines tables **horizontally** (adds columns). `UNION` combines results **vertically** (adds rows).

---

## Indexes and Performance

## 22. What is an index and how does it work?

A separate sorted structure (usually a B-tree) storing column values with pointers to their rows, letting the database find data without scanning the whole table.

## 23. What are the downsides of indexes?

Every `INSERT`, `UPDATE` and `DELETE` must also update the affected indexes, so writes get slower. Indexes also consume disk and RAM. Create only the indexes your queries actually use.

## 24. What is a composite index and does column order matter?

An index on multiple columns. Order matters enormously — the **leftmost prefix rule** means an index on `(a,b,c)` serves queries on `a`, `(a,b)` and `(a,b,c)`, but not on `b` or `c` alone.

## 25. What is a covering index?

An index containing every column a query needs, so the query is answered from the index alone without reading the table. `EXPLAIN` shows this as an Index Only Scan.

## 26. What is a clustered vs non-clustered index?

A **clustered** index determines the physical order of rows on disk, so there can be only one. A **non-clustered** index is a separate structure pointing at rows, and you can have many.

## 27. When will an index NOT be used?

When a function wraps the column (`YEAR(date) = 2024`), with a leading wildcard (`LIKE '%abc'`), on type mismatches, with `OR` across different columns, on low-selectivity columns, and often with `!=`.

## 28. What does EXPLAIN show you?

The query plan. Look for `Seq Scan`/`ALL` (full table scan — usually a missing index) versus `Index Scan`. `EXPLAIN ANALYZE` actually runs the query and reports real timings and row counts.

## 29. How do you optimise a slow query?

Run `EXPLAIN ANALYZE`, add indexes for the filter and join columns, select only needed columns, avoid functions on indexed columns, replace `OFFSET` pagination with keyset pagination, fix N+1 queries, and batch inserts.

## 30. What is the N+1 query problem?

Fetching a list (1 query) then looping to fetch each item's related data (N queries). 100 posts become 101 round trips. Fix it with a single JOIN or an `IN` query.

## 31. Why is a large OFFSET slow and what is the alternative?

`OFFSET 100000` forces the database to generate and discard 100,000 rows first. Use **keyset (cursor) pagination** instead: `WHERE id < :lastSeenId ORDER BY id DESC LIMIT 20`, which jumps straight there using the index.

---

## Normalization

## 32. What is normalization and why do it?

Organising tables to remove redundancy and prevent insert, update and delete anomalies, by storing each fact exactly once.

## 33. Explain 1NF, 2NF and 3NF.

**1NF:** every column holds a single atomic value, no repeating groups. **2NF:** 1NF plus every non-key column depends on the *whole* primary key. **3NF:** 2NF plus no non-key column depends on another non-key column (no transitive dependency).

The memory aid: *the key, the whole key, and nothing but the key.*

## 34. What is denormalization and when is it acceptable?

Deliberately duplicating data or storing computed totals to avoid expensive joins on read-heavy workloads. It is acceptable when you have measured a read bottleneck and can keep the duplicate in sync reliably.

## 35. What is a view?

A saved query that behaves like a virtual table. It stores no data itself — it runs the underlying query each time. Used to simplify complex joins and to restrict which columns users can see.

## 36. What is a materialized view?

A view whose results are physically **stored** and refreshed on demand or on a schedule. Reads are fast, but the data can be stale. Standard in reporting and analytics.

---

## Transactions

## 37. What is a transaction?

A group of statements treated as one unit — either all take effect (`COMMIT`) or none do (`ROLLBACK`).

## 38. What does ACID stand for?

**Atomicity** (all or nothing), **Consistency** (constraints always hold), **Isolation** (concurrent transactions do not see each other's partial work), **Durability** (committed data survives a crash).

## 39. What are the isolation levels?

`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE` — in increasing strictness. Each prevents more concurrency problems but allows less parallelism.

## 40. What are dirty, non-repeatable and phantom reads?

A **dirty read** sees uncommitted data from another transaction. A **non-repeatable read** gets a different value when re-reading the same row. A **phantom read** gets different **rows** when re-running the same query, because rows were inserted or deleted.

## 41. What is a deadlock and how do you prevent it?

Two transactions each hold a lock the other needs, so neither can proceed. Prevent it by always accessing rows in the same order, keeping transactions short, and adding retry logic — deadlocks are normal under load.

## 42. Difference between optimistic and pessimistic locking?

**Pessimistic** locks the row up front (`SELECT ... FOR UPDATE`), blocking others. **Optimistic** takes no lock but includes a version check in the `UPDATE`; if zero rows are affected, someone else won and you retry.

---

## Window Functions

## 43. What is a window function?

A function that calculates across a set of related rows **without collapsing them**, unlike `GROUP BY`. Every input row remains in the output, with the calculated value alongside.

## 44. Difference between `ROW_NUMBER`, `RANK` and `DENSE_RANK`?

For values 100, 90, 90, 80: `ROW_NUMBER` gives 1,2,3,4 (always unique). `RANK` gives 1,2,2,4 (skips after a tie). `DENSE_RANK` gives 1,2,2,3 (no gaps).

## 45. How do you get the top N rows per group?

Use `ROW_NUMBER() OVER (PARTITION BY group ORDER BY value DESC)` in a CTE, then filter `WHERE rn <= N` outside it. You cannot filter a window function directly in `WHERE`.

## 46. What do `LAG` and `LEAD` do?

`LAG` returns a value from a previous row and `LEAD` from a following row, within the partition. They are how you calculate month-on-month growth or differences between consecutive rows.

## 47. How do you calculate a running total?

```sql
SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

## 48. How do you find the Nth highest salary?

```sql
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N-1;
```
Or use `DENSE_RANK()` in a CTE and filter `WHERE rnk = N`. Use `DENSE_RANK`, not `ROW_NUMBER`, so tied salaries count as one rank.

---

## Practical

## 49. How do you find duplicate rows?

`GROUP BY` the columns that define a duplicate and filter with `HAVING COUNT(*) > 1`.

## 50. How do you delete duplicates but keep one?

Keep the minimum id per group: `DELETE FROM t WHERE id NOT IN (SELECT MIN(id) FROM t GROUP BY email)`. Or use `ROW_NUMBER()` in a CTE and delete where `rn > 1`.

## 51. What is a stored procedure?

Precompiled SQL stored in the database and called by name. It reduces network round trips and centralises logic, but it is harder to version control and test than application code.

## 52. What is a trigger?

Code that runs automatically in response to `INSERT`, `UPDATE` or `DELETE` on a table. Useful for audit logs, but it hides behaviour — debugging becomes hard because nothing in the application mentions it.

## 53. What is SQL injection and how do you prevent it?

An attack where user input is concatenated into a query and changes its meaning — input `1 OR 1=1` returns every row. Prevent it with **parameterised queries**, never string concatenation. Also validate input and apply least-privilege database users.

## 54. What is an upsert?

Insert a row, or update it if it already exists. Postgres: `INSERT ... ON CONFLICT (col) DO UPDATE`. MySQL: `INSERT ... ON DUPLICATE KEY UPDATE`.

## 55. Difference between `EXISTS` and `IN`?

`IN` compares against a returned list and suits small fixed sets. `EXISTS` stops at the first match and is usually faster on large subqueries — and it handles NULLs safely.

## 56. What is a CTE and why use it?

A Common Table Expression — a named temporary result set defined with `WITH`. It makes complex queries readable by breaking them into steps, and it can be recursive for hierarchies of unknown depth.

## 57. SQL vs NoSQL — when would you pick each?

SQL for relational data, complex joins and reporting, and strict multi-table transactions. NoSQL for flexible or hierarchical data, horizontal scaling and fast-changing requirements. See [MongoVsSQL.md](../MongoDB_Interview_Questions/MongoVsSQL.md).

## 58. What is connection pooling?

Reusing a set of open database connections instead of opening one per request. Opening a connection costs tens of milliseconds and databases cap total connections, so without pooling a traffic spike exhausts them.

## 59. How would you handle a table that has grown to 500 million rows?

Add the right indexes, partition the table by date or key, archive old rows to cold storage, use read replicas for reporting, consider sharding, and switch to keyset pagination. Check `EXPLAIN` before assuming anything.

## 60. What is the difference between OLTP and OLAP?

**OLTP** (Online Transaction Processing) handles many small reads and writes — a normal application database, normalized and indexed for point lookups. **OLAP** (Online Analytical Processing) handles large aggregate queries for reporting — usually denormalized, often columnar.

---

**Related:** [SQLBasicsAndJoins.md](SQLBasicsAndJoins.md) · [IndexesNormalizationTransactions.md](IndexesNormalizationTransactions.md) · [WindowFunctionsAndQueries.md](WindowFunctionsAndQueries.md)
