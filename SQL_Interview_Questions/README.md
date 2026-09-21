# SQL Interview Questions

📄 **[SQLImpQue.md](SQLImpQue.md)** — all 60 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **Basics & Joins** | [SQLBasicsAndJoins.md](SQLBasicsAndJoins.md) | DDL/DML/DQL, constraints, execution order, WHERE vs HAVING, NULL, all JOIN types, UNION, subqueries, CTEs |
| **Indexes, Normalization & Transactions** | [IndexesNormalizationTransactions.md](IndexesNormalizationTransactions.md) | Index types, leftmost prefix rule, EXPLAIN, 1NF–BCNF, ACID, isolation levels, deadlocks |
| **Window Functions & Query Problems** | [WindowFunctionsAndQueries.md](WindowFunctionsAndQueries.md) | RANK vs DENSE_RANK, LAG/LEAD, running totals, 13 practical query problems, Postgres vs MySQL |
| Relations in MySQL | [CreateRelationsInMySQL.md](CreateRelationsInMySQL.md) | Foreign keys and table relations |
| Views (virtual tables) | [Views-VirtualTable.md](Views-VirtualTable.md) | What a database view is |

---

## All 60 questions ([SQLImpQue.md](SQLImpQue.md))

**Basics (1–10)**
1. What is SQL?
2. What are DDL, DML, DQL, DCL and TCL?
3. What is the execution order of a SELECT?
4. Difference between `DELETE`, `TRUNCATE` and `DROP`?
5. Difference between `WHERE` and `HAVING`?
6. What is a primary key vs a unique key?
7. What is a foreign key?
8. What is a composite key?
9. Difference between `CHAR` and `VARCHAR`?
10. Why should money never be stored as `FLOAT`?

**NULL (11–14)**
11. What is NULL in SQL?
12. How do aggregate functions treat NULL?
13. What do `COALESCE` and `NULLIF` do?
14. Why is `NOT IN` dangerous?

**Joins (15–21)**
15. What are the types of JOIN?
16. Difference between INNER JOIN and LEFT JOIN?
17. How do you find rows in table A with no match in table B?
18. What is a self join and when is it used?
19. What happens if you forget the ON clause?
20. Difference between UNION and UNION ALL?
21. Difference between JOIN and UNION?

**Indexes & Performance (22–31)**
22. What is an index and how does it work?
23. What are the downsides of indexes?
24. What is a composite index and does column order matter?
25. What is a covering index?
26. What is a clustered vs non-clustered index?
27. When will an index NOT be used?
28. What does EXPLAIN show you?
29. How do you optimise a slow query?
30. What is the N+1 query problem?
31. Why is a large OFFSET slow and what is the alternative?

**Normalization (32–36)**
32. What is normalization and why do it?
33. Explain 1NF, 2NF and 3NF.
34. What is denormalization and when is it acceptable?
35. What is a view?
36. What is a materialized view?

**Transactions (37–42)**
37. What is a transaction?
38. What does ACID stand for?
39. What are the isolation levels?
40. What are dirty, non-repeatable and phantom reads?
41. What is a deadlock and how do you prevent it?
42. Difference between optimistic and pessimistic locking?

**Window Functions (43–48)**
43. What is a window function?
44. Difference between `ROW_NUMBER`, `RANK` and `DENSE_RANK`?
45. How do you get the top N rows per group?
46. What do `LAG` and `LEAD` do?
47. How do you calculate a running total?
48. How do you find the Nth highest salary?

**Practical (49–60)**
49. How do you find duplicate rows?
50. How do you delete duplicates but keep one?
51. What is a stored procedure?
52. What is a trigger?
53. What is SQL injection and how do you prevent it?
54. What is an upsert?
55. Difference between `EXISTS` and `IN`?
56. What is a CTE and why use it?
57. SQL vs NoSQL — when would you pick each?
58. What is connection pooling?
59. How would you handle a table that has grown to 500 million rows?
60. What is the difference between OLTP and OLAP?

---

## The queries you should be able to write from memory

| Problem | File |
|---|---|
| Find / delete duplicates | [WindowFunctionsAndQueries.md](WindowFunctionsAndQueries.md) Q1–Q2 |
| Nth highest salary | Q3 |
| Employees earning more than their manager (self join) | Q4 |
| Users who never ordered (anti-join) | Q5 |
| Monthly revenue report | Q7 |
| Top N per group (window function) | Window functions section |
| Running total / moving average | Window functions section |
| Pivot rows into columns | Q10 |
| Upsert | Q13 |

---

**Related:** [MongoVsSQL.md](../MongoDB_Interview_Questions/MongoVsSQL.md) — SQL vs NoSQL comparison · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
