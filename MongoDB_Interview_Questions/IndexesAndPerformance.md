# MongoDB Indexes and Performance

## 1. What is an Index?

**Definition:** An index is a special data structure (a **B-tree**) that stores a small portion of the collection's data in a sorted order, so MongoDB can find matching documents **without scanning every document**.

**In simple words:** An index is the alphabetical index at the back of a book. Without it you flip through every page; with it you jump straight to the right page.

**Without an index:**
```
COLLSCAN - MongoDB reads all 1,000,000 documents to find 5 matches. Very slow.
```

**With an index:**
```
IXSCAN - MongoDB looks up the sorted index and jumps directly to the 5 matches. Fast.
```

---

## 2. Creating and managing indexes

```js
db.users.createIndex({ email: 1 });              // 1 = ascending, -1 = descending
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ city: 1, age: -1 });      // compound index
db.users.createIndex({ name: 1 }, { name: "name_idx" });

db.users.getIndexes();                            // list all indexes
db.users.dropIndex("email_1");
db.users.totalIndexSize();                        // total size in bytes
```

> The `_id` field always has a **unique index**, created automatically. It cannot be dropped.

---

## 3. Types of indexes

### a) Single Field Index

**Definition:** An index on one field. MongoDB can use it for queries and sorts in **either direction**, so the `1`/`-1` choice does not matter for a single-field index.

```js
db.users.createIndex({ age: 1 });
```

### b) Compound Index

**Definition:** An index on **multiple fields**, stored in the order you declare them. The field order is critical.

```js
db.users.createIndex({ city: 1, age: -1, name: 1 });
```

**The ESR rule** — the standard way to order compound index fields:

| Letter | Meaning |
|---|---|
| **E** = Equality | Fields matched with `=` come first |
| **S** = Sort | Fields used for sorting come next |
| **R** = Range | Fields matched with `$gt`, `$lt`, `$in` come last |

```js
// Query: find users in Delhi, aged over 25, sorted by name
db.users.find({ city: "Delhi", age: { $gt: 25 } }).sort({ name: 1 });

// ✅ Correct order: Equality (city) → Sort (name) → Range (age)
db.users.createIndex({ city: 1, name: 1, age: 1 });
```

### c) The Prefix Rule

**Definition:** A compound index can be used by any query that uses a **leading subset** (a prefix) of its fields — but not by a query that skips the first field.

```js
// Index: { a: 1, b: 1, c: 1 }

db.coll.find({ a: 1 })                  // ✅ uses the index (prefix a)
db.coll.find({ a: 1, b: 2 })            // ✅ uses it (prefix a, b)
db.coll.find({ a: 1, b: 2, c: 3 })      // ✅ uses the full index
db.coll.find({ b: 2 })                  // ❌ cannot use it - skips "a"
db.coll.find({ b: 2, c: 3 })            // ❌ cannot use it
db.coll.find({ a: 1, c: 3 })            // ⚠️ partially - uses "a" only
```

**This is why one well-ordered compound index can replace several single-field indexes.**

### d) Multikey Index

**Definition:** An index on an **array field**. MongoDB automatically creates one index entry per array element.

```js
db.users.createIndex({ skills: 1 });        // skills is an array
db.users.find({ skills: "React" });         // uses the index
```

**Limitation:** a compound index can contain **at most one** array field, because indexing two arrays together would create a combinatorial explosion of entries.

### e) Text Index

**Definition:** An index that enables full-text search across string fields — with word stemming and stop-word removal.

```js
db.articles.createIndex({ title: "text", body: "text" });

db.articles.find({ $text: { $search: "mongodb tutorial" } });
db.articles.find({ $text: { $search: "\"exact phrase\"" } });
db.articles.find({ $text: { $search: "mongodb -mysql" } });   // exclude "mysql"

// Sort by relevance score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

**Limitation:** only **one** text index is allowed per collection (but it can cover multiple fields). For serious search, use Atlas Search or Elasticsearch.

### f) Unique Index

**Definition:** Prevents two documents from having the same value for that field.

```js
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ userId: 1, courseId: 1 }, { unique: true });  // compound unique
```

> **Careful:** documents missing the field are treated as having `null`, so only **one** such document is allowed. Combine `unique` with `partialFilterExpression` to allow multiple documents without the field.

### g) Partial Index

**Definition:** Indexes only the documents matching a filter, making the index smaller and faster.

```js
db.users.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $type: "string" } } }
);

// Index only active orders - most queries only ever look at these
db.orders.createIndex(
  { createdAt: -1 },
  { partialFilterExpression: { status: { $in: ["pending", "processing"] } } }
);
```

### h) Sparse Index

**Definition:** Skips documents where the field does not exist. Mostly superseded by partial indexes, which are more flexible.

```js
db.users.createIndex({ phone: 1 }, { sparse: true });
```

### i) TTL Index

**Definition:** "Time To Live" — MongoDB automatically **deletes** documents a set number of seconds after the indexed date field.

```js
// Delete sessions 1 hour after creation
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Delete at an exact time stored in the document
db.tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Rules:** the field must be a `Date` (or an array of Dates). A background task runs about every 60 seconds, so deletion is not instant.

**Used for:** sessions, OTPs, password-reset tokens, cache entries, temporary logs.

### j) Geospatial Index

**Definition:** Enables location-based queries — "find everything within 5 km of me".

```js
db.places.createIndex({ location: "2dsphere" });

db.places.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [77.2090, 28.6139] },  // [lng, lat]
      $maxDistance: 5000,     // metres
    },
  },
});
```

> Note the order: GeoJSON uses **[longitude, latitude]**, not the usual lat/lng.

### k) Hashed Index

**Definition:** Indexes the hash of a field's value. Used for **hash-based sharding**, giving an even data distribution.

```js
db.users.createIndex({ _id: "hashed" });
```

---

## 4. `explain()` — analysing query performance

**Definition:** `explain()` shows how MongoDB executed a query — which index it used (if any) and how many documents it examined.

```js
db.users.find({ email: "a@b.com" }).explain("executionStats");
```

**The key fields to read:**

| Field | What it tells you |
|---|---|
| `stage` | `COLLSCAN` = full scan (bad), `IXSCAN` = index scan (good) |
| `nReturned` | How many documents were returned |
| `totalDocsExamined` | How many documents MongoDB had to read |
| `totalKeysExamined` | How many index entries were read |
| `executionTimeMillis` | How long it took |
| `indexName` | Which index was used |

**The ideal result:**
```
nReturned = totalDocsExamined = totalKeysExamined
```
This means the index found exactly the right documents with no wasted reads.

**A bad result:**
```
nReturned: 5
totalDocsExamined: 1000000    ← scanned a million documents for 5 results
stage: "COLLSCAN"             ← no index used
```

**Explain modes:**
- `"queryPlanner"` (default) — shows the chosen plan without running the query.
- `"executionStats"` — runs the query and reports real numbers. **Use this one.**
- `"allPlansExecution"` — also shows the plans that were rejected.

---

## 5. Covered queries

**Definition:** A covered query is one where **all** the fields needed — both for filtering and for the returned result — exist in the index. MongoDB never touches the actual documents, making it extremely fast.

```js
db.users.createIndex({ email: 1, name: 1 });

// ✅ COVERED - email is in the index, name is in the index, _id is excluded
db.users.find({ email: "a@b.com" }, { name: 1, _id: 0 });
// explain shows: totalDocsExamined: 0

// ❌ NOT covered - "age" is not in the index
db.users.find({ email: "a@b.com" }, { name: 1, age: 1, _id: 0 });
```

**Requirement:** you must exclude `_id` (with `_id: 0`) unless `_id` is part of the index.

---

## 6. The cost of indexes

**Definition:** Indexes speed up reads but **slow down writes**, because every insert, update or delete must also update every affected index.

| Cost | Detail |
|---|---|
| **Write overhead** | Every write updates all relevant indexes |
| **Disk space** | Indexes can be a significant fraction of collection size |
| **RAM usage** | Indexes should fit in RAM for good performance |
| **Build time** | Creating an index on a huge collection takes a long time |

**Rules of thumb:**
- Create indexes for the queries you **actually run**, not for every field.
- Delete unused indexes — check with `$indexStats`.
- Aim to keep the working set of indexes in RAM.
- On a live system, build indexes in the **background** (the default in modern MongoDB).

```js
// Find unused indexes
db.users.aggregate([{ $indexStats: {} }]);
// Look for indexes where accesses.ops is 0 or very low
```

---

## 7. Common performance problems and fixes

| Problem | Fix |
|---|---|
| `COLLSCAN` in explain | Create an index for that query pattern |
| Slow sort (`SORT` stage in explain) | Add the sort field to the index in the right order |
| Slow `skip()` on deep pages | Use range-based pagination instead |
| Regex scanning everything | Use an anchored `^` prefix, or a text index |
| `$lookup` is slow | Index the foreign field; consider embedding instead |
| Large documents | Split rarely-used fields into a separate collection |
| Too many indexes | Drop unused ones; one compound index can replace several |

**Range-based pagination (instead of skip):**

```js
// ❌ Slow on page 1000 - MongoDB walks through 20,000 documents
db.posts.find().sort({ _id: -1 }).skip(20000).limit(20);

// ✅ Fast at any depth - jumps straight to the position using the index
db.posts.find({ _id: { $lt: lastSeenId } }).sort({ _id: -1 }).limit(20);
```

---

## 8. Profiling slow queries

**Definition:** The database profiler records slow operations into a collection you can query.

```js
// Level 0 = off, 1 = slow ops only, 2 = all ops
db.setProfilingLevel(1, { slowms: 100 });     // log anything over 100ms

// Read the slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty();

// Check the current setting
db.getProfilingStatus();
```

**Also useful:**

```js
db.currentOp();                    // operations running right now
db.killOp(opid);                   // kill a runaway query
db.collection.stats();             // collection size, index sizes, doc count
```

---

## Key points

- An index is a sorted structure that avoids scanning the whole collection.
- **Compound index field order matters** — follow the **ESR** rule (Equality, Sort, Range).
- The **prefix rule**: a query must use the leading fields of a compound index.
- Special types: unique, partial, sparse, **TTL** (auto-delete), text, geospatial, hashed.
- Use `explain("executionStats")` and aim for `nReturned ≈ totalDocsExamined`.
- A **covered query** is answered entirely from the index — the fastest possible.
- Indexes cost write performance, RAM and disk — index deliberately, and drop unused ones.
- Replace deep `skip()` pagination with **range-based** pagination.
