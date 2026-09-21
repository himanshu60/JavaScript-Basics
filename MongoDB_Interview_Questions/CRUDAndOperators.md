# MongoDB CRUD Operations and Query Operators

**Definition of CRUD:** The four basic operations on data — **C**reate, **R**ead, **U**pdate, **D**elete.

---

# PART 1 — CREATE

## `insertOne()` and `insertMany()`

**Definition of `insertOne(doc)`:** Inserts a single document and returns the inserted `_id`.
**Definition of `insertMany([docs])`:** Inserts several documents in one call.

```js
db.users.insertOne({ name: "Himanshu", age: 25, city: "Delhi" });
// → { acknowledged: true, insertedId: ObjectId("...") }

db.users.insertMany([
  { name: "Rahul", age: 30 },
  { name: "Amit", age: 28 },
]);

// ordered: false → keep going even if one document fails
db.users.insertMany([...], { ordered: false });
```

**Definition of `ordered`:** When `true` (default), insertion stops at the first error. When `false`, MongoDB attempts every document and reports the failures at the end.

---

# PART 2 — READ

## `find()` and `findOne()`

**Definition of `find(filter, projection)`:** Returns a **cursor** over all matching documents.
**Definition of `findOne(filter)`:** Returns the **first** matching document, or `null`.
**Definition of a cursor:** A pointer to the result set that fetches documents in batches instead of loading everything into memory at once.

```js
db.users.find();                              // all documents
db.users.find({ city: "Delhi" });             // filtered
db.users.findOne({ _id: ObjectId("...") });   // single document
```

## Projection — choosing which fields to return

**Definition:** Projection is the second argument to `find()`, controlling which fields come back. `1` includes a field, `0` excludes it.

```js
db.users.find({}, { name: 1, email: 1 });        // name, email AND _id
db.users.find({}, { name: 1, _id: 0 });          // name only
db.users.find({}, { password: 0 });              // everything except password
```

**Rule:** you cannot mix inclusion and exclusion in one projection — except for `_id`, which can always be excluded.

```js
db.users.find({}, { name: 1, age: 0 });   // ❌ Error
db.users.find({}, { name: 1, _id: 0 });   // ✅ Allowed
```

**Array projections:**

```js
db.posts.find({}, { comments: { $slice: 5 } });       // first 5 comments
db.posts.find({}, { comments: { $slice: -3 } });      // last 3
db.posts.find({ "comments.author": "A" }, { "comments.$": 1 });  // first match only
```

---

## Query operators

### Comparison operators

| Operator | Definition | Example |
|---|---|---|
| `$eq` | Equal to | `{ age: { $eq: 25 } }` |
| `$ne` | Not equal to | `{ age: { $ne: 25 } }` |
| `$gt` | Greater than | `{ age: { $gt: 25 } }` |
| `$gte` | Greater than or equal | `{ age: { $gte: 25 } }` |
| `$lt` | Less than | `{ age: { $lt: 25 } }` |
| `$lte` | Less than or equal | `{ age: { $lte: 25 } }` |
| `$in` | Matches any value in an array | `{ city: { $in: ["Delhi", "Mumbai"] } }` |
| `$nin` | Matches none of the values | `{ city: { $nin: ["Delhi"] } }` |

```js
db.products.find({ price: { $gte: 100, $lte: 500 } });   // range: 100 to 500
db.users.find({ role: { $in: ["admin", "moderator"] } });
```

### Logical operators

| Operator | Definition |
|---|---|
| `$and` | All conditions must match (implicit when you list several fields) |
| `$or` | At least one condition must match |
| `$not` | Inverts a condition |
| `$nor` | None of the conditions may match |

```js
// Implicit AND - just list the fields
db.users.find({ age: { $gte: 18 }, city: "Delhi" });

// Explicit AND - needed when using the same field twice
db.users.find({ $and: [{ age: { $gte: 18 } }, { age: { $lte: 30 } }] });

// OR
db.users.find({ $or: [{ city: "Delhi" }, { age: { $lt: 20 } }] });

// Combining them
db.products.find({
  category: "electronics",
  $or: [{ price: { $lt: 500 } }, { onSale: true }],
});
```

### Element operators

| Operator | Definition | Example |
|---|---|---|
| `$exists` | Whether the field is present | `{ phone: { $exists: true } }` |
| `$type` | Matches the BSON type of the field | `{ age: { $type: "number" } }` |

```js
db.users.find({ deletedAt: { $exists: false } });   // not soft-deleted
db.users.find({ age: { $type: "string" } });        // find badly-typed data
```

> **Careful:** `{ field: null }` matches documents where the field is `null` **or** missing. Use `$exists` when you need to distinguish them.

### Array operators

| Operator | Definition |
|---|---|
| `$all` | The array must contain **all** listed values |
| `$size` | The array has exactly this length |
| `$elemMatch` | **One single element** must match all the given conditions |

```js
// Matching a value inside an array - no special operator needed
db.users.find({ skills: "React" });                    // any user with React
db.users.find({ skills: { $all: ["React", "Node"] } }); // must have BOTH
db.users.find({ skills: { $size: 3 } });                // exactly 3 skills

// $elemMatch - the important one
db.students.find({ scores: { $elemMatch: { $gte: 80, $lt: 90 } } });
// ✅ ONE score must be between 80 and 89

db.students.find({ scores: { $gte: 80, $lt: 90 } });
// ⚠️ DIFFERENT: one score ≥80 and ANOTHER score <90 - not necessarily the same one
```

**`$elemMatch` on arrays of objects:**

```js
db.orders.find({
  items: { $elemMatch: { product: "Laptop", quantity: { $gte: 2 } } },
});
// The SAME item must be a Laptop AND have quantity ≥ 2
```

### Evaluation operators

| Operator | Definition |
|---|---|
| `$regex` | Matches a regular expression |
| `$text` | Full-text search (requires a text index) |
| `$expr` | Compare two fields of the same document |
| `$mod` | Modulo operation |

```js
// Regex
db.users.find({ name: { $regex: "^Him", $options: "i" } });   // starts with "Him"
db.users.find({ email: /@gmail\.com$/ });                     // ends with gmail

// $expr - comparing two fields (impossible without it)
db.products.find({ $expr: { $gt: ["$stock", "$sold"] } });

// Text search - needs a text index first
db.articles.createIndex({ title: "text", body: "text" });
db.articles.find({ $text: { $search: "mongodb tutorial" } });
```

> ⚠️ **Performance:** a regex starting with `^` (an anchored prefix) can use an index. Any other regex causes a full collection scan — avoid patterns like `/text/` on large collections.

---

## Cursor methods

**Definition:** Methods chained onto `find()` to shape the result set.

```js
db.users.find().sort({ age: -1 });       // -1 descending, 1 ascending
db.users.find().limit(10);               // maximum 10 documents
db.users.find().skip(20).limit(10);      // pagination: page 3, 10 per page
db.users.countDocuments({ city: "Delhi" });
db.users.distinct("city");               // unique values of a field

// Sort by two fields
db.users.find().sort({ city: 1, age: -1 });
```

**Important:** MongoDB always applies them in the order **sort → skip → limit**, regardless of how you chain them.

> ⚠️ `skip()` becomes very slow on large offsets, because MongoDB must walk through all the skipped documents. For deep pagination, use range-based pagination instead (see the Aggregation file).

---

# PART 3 — UPDATE

## `updateOne()`, `updateMany()` and `replaceOne()`

**Definition of `updateOne(filter, update)`:** Updates the **first** matching document.
**Definition of `updateMany(filter, update)`:** Updates **all** matching documents.
**Definition of `replaceOne(filter, doc)`:** Replaces the entire document (except `_id`).

```js
db.users.updateOne({ name: "Himanshu" }, { $set: { age: 26 } });
db.users.updateMany({ city: "Delhi" }, { $set: { zone: "North" } });
db.users.replaceOne({ _id: id }, { name: "New", age: 30 });   // all other fields deleted!
```

## Update operators

### Field operators

| Operator | Definition |
|---|---|
| `$set` | Sets a field's value (creates it if missing) |
| `$unset` | Removes a field completely |
| `$inc` | Increments (or decrements) a number |
| `$mul` | Multiplies a number |
| `$rename` | Renames a field |
| `$min` / `$max` | Updates only if the new value is smaller / larger |
| `$currentDate` | Sets the field to the current date |
| `$setOnInsert` | Applies only when an upsert creates a new document |

```js
db.users.updateOne({ _id: id }, {
  $set: { name: "Himanshu", "address.city": "Mumbai" },   // dot notation for nested
  $unset: { tempField: "" },
  $inc: { loginCount: 1, credits: -50 },                  // negative = decrement
  $currentDate: { lastModified: true },
});

db.products.updateOne({ _id: id }, { $mul: { price: 1.1 } });    // +10% price
db.users.updateMany({}, { $rename: { "fname": "firstName" } });
```

### Array update operators

| Operator | Definition |
|---|---|
| `$push` | Adds a value to the end of an array |
| `$addToSet` | Adds only if the value is not already present |
| `$pop` | Removes the first (`-1`) or last (`1`) element |
| `$pull` | Removes all elements matching a condition |
| `$pullAll` | Removes all listed values |
| `$each` | Used with `$push`/`$addToSet` to add several values |
| `$slice` | Limits array length after a push |
| `$sort` | Sorts the array after a push |
| `$` | Positional — updates the **first** matching element |
| `$[]` | Updates **all** elements |
| `$[<identifier>]` | Updates all elements matching `arrayFilters` |

```js
// Adding
db.users.updateOne({ _id: id }, { $push: { skills: "MongoDB" } });
db.users.updateOne({ _id: id }, { $addToSet: { skills: "React" } });   // no duplicates

// Adding several, keeping only the newest 10, sorted
db.users.updateOne({ _id: id }, {
  $push: {
    notifications: {
      $each: [{ msg: "A" }, { msg: "B" }],
      $sort: { createdAt: -1 },
      $slice: 10,
    },
  },
});

// Removing
db.users.updateOne({ _id: id }, { $pull: { skills: "jQuery" } });
db.users.updateOne({ _id: id }, { $pull: { scores: { $lt: 50 } } });   // by condition
db.users.updateOne({ _id: id }, { $pop: { skills: 1 } });              // last element
```

**The positional operators — an important interview topic:**

```js
// $ - update the FIRST matching array element
db.orders.updateOne(
  { _id: orderId, "items.product": "Laptop" },
  { $set: { "items.$.quantity": 5 } }
);

// $[] - update ALL elements
db.orders.updateOne({ _id: orderId }, { $inc: { "items.$[].price": 10 } });

// $[identifier] - update all elements matching a filter
db.orders.updateOne(
  { _id: orderId },
  { $set: { "items.$[elem].discounted": true } },
  { arrayFilters: [{ "elem.price": { $gt: 1000 } }] }
);
```

## Upsert

**Definition:** `upsert: true` means "update if it exists, otherwise insert a new document".

```js
db.users.updateOne(
  { email: "new@example.com" },
  {
    $set: { lastLogin: new Date() },
    $setOnInsert: { createdAt: new Date(), role: "user" },   // only on insert
  },
  { upsert: true }
);
```

## `findOneAndUpdate()`

**Definition:** Updates a document and **returns** it — either the version before or after the update. Useful when you need the result immediately, atomically.

```js
const updated = db.users.findOneAndUpdate(
  { _id: id },
  { $inc: { credits: -10 } },
  { returnDocument: "after" }    // "before" is the default
);
```

---

# PART 4 — DELETE

```js
db.users.deleteOne({ _id: id });               // first match only
db.users.deleteMany({ status: "inactive" });   // all matches
db.users.deleteMany({});                       // ⚠️ deletes EVERYTHING
db.users.findOneAndDelete({ _id: id });        // delete and return the document
db.users.drop();                               // drop the whole collection
```

**Soft delete (recommended in real applications):**

```js
// Instead of really deleting, mark it
db.users.updateOne({ _id: id }, {
  $set: { deletedAt: new Date(), isDeleted: true },
});

// Then always filter it out in queries
db.users.find({ isDeleted: { $ne: true } });
```

---

## Bulk operations

**Definition:** `bulkWrite()` sends many different operations to the server in one round trip, which is far faster than sending them one by one.

```js
db.users.bulkWrite([
  { insertOne: { document: { name: "A" } } },
  { updateOne: { filter: { name: "B" }, update: { $set: { age: 30 } } } },
  { deleteOne: { filter: { name: "C" } } },
  { replaceOne: { filter: { name: "D" }, replacement: { name: "D2" } } },
], { ordered: false });
```

---

## Key points

- **Create:** `insertOne`, `insertMany`.
- **Read:** `find` (returns a cursor), `findOne`; projection selects fields.
- **Update:** `updateOne`, `updateMany`, `replaceOne`, `findOneAndUpdate` — always with an operator like `$set`.
- **Delete:** `deleteOne`, `deleteMany`; prefer **soft delete** in production.
- `$elemMatch` requires a **single** array element to satisfy all conditions.
- `$` updates the first matching array element; `$[]` updates all; `$[id]` uses `arrayFilters`.
- `upsert: true` combines update and insert; `$setOnInsert` applies only on creation.
- Use `bulkWrite` for many operations to avoid repeated round trips.
