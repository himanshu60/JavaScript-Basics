# MongoDB vs SQL (NoSQL vs Relational Databases)

## 1. What is a SQL / Relational database?

**Definition:** A SQL database stores data in **tables** made of rows and columns, with a **fixed schema** defined in advance. Relationships between tables are created with foreign keys, and data is combined using **JOIN** operations. It is queried with SQL (Structured Query Language).

**Examples:** MySQL, PostgreSQL, Oracle, SQL Server, SQLite.

```sql
-- The schema must be defined BEFORE any data is inserted
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE
);

CREATE TABLE addresses (
  id INT PRIMARY KEY,
  user_id INT,
  city VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reading a user with their address needs a JOIN
SELECT u.name, a.city
FROM users u
JOIN addresses a ON u.id = a.user_id
WHERE u.id = 1;
```

---

## 2. What is a NoSQL / Document database?

**Definition:** A NoSQL database stores data in flexible **documents** (JSON-like objects) instead of rigid tables. Each document can have a different structure, and related data is usually **embedded** inside the same document instead of split across tables.

**Examples:** MongoDB (document), Redis (key-value), Cassandra (wide-column), Neo4j (graph).

```js
// No schema needed in advance. Related data lives together.
db.users.insertOne({
  name: "Himanshu",
  email: "himanshu@example.com",
  address: { city: "Delhi", pin: "110001" },     // embedded, no join
  skills: ["JavaScript", "React"]                // arrays allowed
});

// Reading a user WITH their address is a single query
db.users.findOne({ _id: userId });
```

---

## 3. The four types of NoSQL databases

**Definition:** "NoSQL" is not one thing — it is a family of four different storage models.

| Type | Definition | Examples | Best for |
|---|---|---|---|
| **Document** | Stores JSON-like documents | MongoDB, CouchDB | General purpose apps |
| **Key-Value** | A simple dictionary of key → value | Redis, DynamoDB | Caching, sessions |
| **Wide-Column** | Rows with dynamic columns | Cassandra, HBase | Huge write volumes, time-series |
| **Graph** | Nodes and relationships | Neo4j, ArangoDB | Social networks, recommendations |

MongoDB is a **document** database, which is why it is the closest NoSQL equivalent to a relational database.

---

## 4. Terminology mapping

| SQL | MongoDB |
|---|---|
| Database | Database |
| Table | **Collection** |
| Row / Record | **Document** |
| Column | **Field** |
| Primary key | `_id` |
| Foreign key | A reference field (an ObjectId) |
| JOIN | `$lookup` (or embedding) |
| `GROUP BY` | Aggregation pipeline `$group` |
| `WHERE` | The query filter, or `$match` |
| `SELECT col1, col2` | Projection `{ col1: 1, col2: 1 }` |
| `ORDER BY` | `.sort()` |
| `LIMIT` | `.limit()` |
| Schema (enforced) | Flexible (enforced by the app) |
| Index | Index (same concept) |
| Transaction | Transaction (since v4.0) |

---

## 5. Query comparison side by side

```sql
-- SQL                                    -- MongoDB
SELECT * FROM users;                      db.users.find()

SELECT name, email FROM users;            db.users.find({}, {name:1, email:1, _id:0})

SELECT * FROM users WHERE age > 25;       db.users.find({ age: { $gt: 25 } })

SELECT * FROM users                       db.users.find({
WHERE city='Delhi' AND age >= 18;           city: "Delhi", age: { $gte: 18 } })

SELECT * FROM users                       db.users.find({ $or: [
WHERE city='Delhi' OR city='Mumbai';        { city: "Delhi" }, { city: "Mumbai" } ] })
                                          // or: { city: { $in: ["Delhi","Mumbai"] } }

INSERT INTO users (name) VALUES ('A');    db.users.insertOne({ name: "A" })

UPDATE users SET age=26 WHERE id=1;       db.users.updateOne({_id:1}, {$set:{age:26}})

DELETE FROM users WHERE age < 18;         db.users.deleteMany({ age: { $lt: 18 } })

SELECT city, COUNT(*)                     db.users.aggregate([
FROM users GROUP BY city;                   { $group: { _id: "$city",
                                                        count: { $sum: 1 } } } ])

SELECT * FROM orders o                    db.orders.aggregate([
JOIN users u ON o.user_id = u.id;           { $lookup: { from: "users",
                                                localField: "userId",
                                                foreignField: "_id",
                                                as: "user" } } ])
```

---

## 6. Schema: fixed vs flexible

**SQL — schema-on-write:** The structure is defined first. Any data that does not match is rejected. Changing the structure later needs an `ALTER TABLE` migration across every existing row.

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(15);
-- Must run on millions of rows; can lock the table on large datasets
```

**MongoDB — schema-on-read:** Documents can differ. A new field can simply be added to new documents, with no migration.

```js
// Old documents keep their shape, new ones have the extra field
db.users.insertOne({ name: "New User", phone: "999..." });
// Existing documents are untouched - no migration needed
```

**The trade-off:** MongoDB's flexibility is powerful during rapid development, but "no enforced schema" means **your application** must enforce consistency — otherwise you get this:

```js
{ name: "Himanshu", age: 25 }
{ fullName: "Rahul", years: 30 }     // different field names!
{ name: "Amit", age: "twenty" }      // different data type!
```

The fix is Mongoose schemas or MongoDB's `$jsonSchema` validation — so in practice you end up defining a schema anyway, just in a different place.

---

## 7. Relationships: JOIN vs embed

**SQL: normalise and join.** Data is split to avoid duplication, then joined when read.

```
users table          orders table
id | name            id | user_id | total
1  | Himanshu        1  | 1       | 500
                     2  | 1       | 300
→ Reading a user with their orders requires a JOIN
```

**MongoDB: embed or reference.**

```js
// EMBED - one query gets everything (best for data always read together)
{
  _id: 1,
  name: "Himanshu",
  orders: [ { total: 500 }, { total: 300 } ]
}

// REFERENCE - separate collections (best for unbounded data)
// users:  { _id: 1, name: "Himanshu" }
// orders: { _id: 10, userId: 1, total: 500 }
```

> **Key insight:** `$lookup` exists, but it is noticeably **slower** than a real SQL join. MongoDB is designed so you rarely need it — you embed instead. If your data requires joins everywhere, that is a strong signal you should be using SQL.

---

## 8. Scaling

**Definition of Vertical scaling (scale up):** Making one server more powerful — more CPU, more RAM. Simple, but there is a hard ceiling and cost rises steeply.

**Definition of Horizontal scaling (scale out):** Adding more servers and splitting the data between them. Nearly unlimited, but much more complex.

| | SQL | MongoDB |
|---|---|---|
| Primary approach | **Vertical** (bigger machine) | **Horizontal** (more machines) |
| Built-in sharding | No (manual or add-ons) | **Yes**, built in |
| Read replicas | Yes | Yes (replica sets) |
| Complexity at scale | High — sharding SQL is hard | Designed for it |

> Modern SQL databases (PostgreSQL with Citus, Vitess for MySQL) can scale horizontally too — but MongoDB was designed for it from the start.

---

## 9. Transactions and ACID

**SQL:** Full multi-table ACID transactions have always been core to relational databases. This is why banking and accounting systems traditionally use them.

**MongoDB:**
- **Single-document** operations have always been **fully atomic** — even when updating many fields and nested arrays at once.
- **Multi-document** transactions were added in **version 4.0** (4.2 for sharded clusters).

```js
// This is atomic in MongoDB - no transaction needed
db.accounts.updateOne({ _id: id }, {
  $inc: { balance: -100 },
  $push: { history: { type: "debit", amount: 100 } }
});
```

**The honest comparison:** MongoDB transactions work, but they are heavier than in SQL and have a 60-second default limit. Good schema design (embedding related data) usually avoids needing them at all.

---

## 10. Full comparison table

| Point | SQL (Relational) | MongoDB (NoSQL) |
|---|---|---|
| **Data model** | Tables, rows, columns | Collections, documents |
| **Schema** | Fixed, defined upfront | Flexible, app-enforced |
| **Structure change** | `ALTER TABLE` migration | Just insert the new shape |
| **Relationships** | Foreign keys + JOIN | Embedding or `$lookup` |
| **Query language** | SQL | MQL (JSON-style) + aggregation |
| **Scaling** | Vertical mainly | Horizontal (sharding) |
| **Transactions** | Core strength | Supported since 4.0, heavier |
| **Consistency** | Strong by default | Tunable (read/write concern) |
| **Complex reporting** | **Excellent** (joins, CTEs, windows) | Harder (aggregation pipeline) |
| **Nested/hierarchical data** | Awkward (many tables) | **Natural** |
| **Data duplication** | Minimal (normalised) | Common (denormalised) |
| **Best fit** | Structured, relational data | Evolving, hierarchical data |
| **Maturity** | 40+ years, huge tooling | Newer, growing fast |

---

## 11. When to choose which

**Choose MongoDB when:**
- The data structure changes often or varies between records
- Data is naturally hierarchical (a product with variants, a post with its comments)
- You need horizontal scaling across many servers
- You are iterating fast and requirements are still changing
- You handle large volumes of semi-structured data (logs, events, IoT, analytics)
- Your stack is JavaScript — documents map directly to JS objects

**Choose SQL when:**
- Data is highly relational with many-to-many relationships everywhere
- You need strict ACID transactions across multiple tables (banking, accounting, inventory)
- You run complex reporting with many joins and aggregations
- The schema is well-defined and stable
- Data integrity constraints matter more than flexibility
- Your team and tooling already know SQL well

**The honest real-world answer:** most applications work fine with either. The decision usually comes down to the **shape of your data** (hierarchical → MongoDB, relational → SQL) and what your team knows. Many production systems use **both** — PostgreSQL for orders and payments, MongoDB or Redis for sessions, logs and caching.

---

## 12. Common myths

| Myth | Reality |
|---|---|
| "NoSQL means no schema" | It means the **application** enforces the schema instead of the database |
| "MongoDB is always faster" | Faster for nested-document reads; SQL is faster for complex joins and reporting |
| "MongoDB isn't ACID" | It is — single documents always, multi-document since v4.0 |
| "NoSQL doesn't scale reads" | Both scale reads well; the real difference is write/storage scaling |
| "SQL can't store JSON" | PostgreSQL and MySQL both have strong JSON column support now |
| "You must pick one" | Using both (polyglot persistence) is very common in production |

---

## Key points

- SQL = fixed tables + joins; MongoDB = flexible documents + embedding.
- MongoDB's flexible schema speeds up development but shifts the responsibility to your app.
- `$lookup` works but is slower than a SQL join — MongoDB is designed for **embedding** instead.
- MongoDB scales **horizontally** out of the box; SQL is traditionally **vertical**.
- MongoDB **is** ACID — always for single documents, since 4.0 for multi-document transactions.
- Choose by the **shape of your data**, not by hype — and using both together is normal.
