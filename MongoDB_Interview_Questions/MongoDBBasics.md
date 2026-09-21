# MongoDB Basics - Documents, Collections and BSON

## 1. What is MongoDB?

**Definition:** MongoDB is a **NoSQL, document-oriented database**. Instead of storing data in tables with fixed rows and columns, it stores data as flexible, JSON-like **documents**.

**In simple words:** SQL stores data in a spreadsheet with fixed columns. MongoDB stores data as folders of flexible forms, where each form can have different fields.

---

## 2. The core building blocks

### Document

**Definition:** A document is a single record in MongoDB, stored as a set of field-value pairs. It looks like a JSON object and is the basic unit of data.

```js
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Himanshu",
  age: 25,
  email: "himanshu@example.com",
  skills: ["JavaScript", "React", "MongoDB"],   // arrays allowed
  address: {                                     // nested objects allowed
    city: "Delhi",
    pin: "110001"
  },
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Maximum document size:** 16 MB.

### Collection

**Definition:** A collection is a group of documents — the MongoDB equivalent of a SQL table. Unlike a table, a collection does **not** enforce a fixed structure, so documents inside it can have different fields.

```js
// The "users" collection can hold documents with different shapes
{ name: "Himanshu", age: 25 }
{ name: "Rahul", age: 30, city: "Mumbai", premium: true }   // extra fields - allowed
```

### Database

**Definition:** A container for collections. One MongoDB server can hold many databases.

```
Database (myapp)
  └── Collection (users)
        └── Document ({ name: "Himanshu", age: 25 })
              └── Field (name: "Himanshu")
```

---

## 3. SQL vs MongoDB terminology

| SQL | MongoDB |
|---|---|
| Database | Database |
| Table | **Collection** |
| Row | **Document** |
| Column | **Field** |
| Primary key | `_id` |
| JOIN | `$lookup` / embedding |
| Schema (fixed) | Flexible schema |
| `GROUP BY` | Aggregation Pipeline |

---

## 4. What is BSON?

**Definition:** BSON stands for **Binary JSON**. It is the binary format MongoDB uses to store documents. It looks like JSON but supports more data types and is faster to scan and parse.

**Why not plain JSON?**

| JSON | BSON |
|---|---|
| Text-based | Binary |
| Limited types (string, number, boolean, null, array, object) | Many extra types |
| No date type | Has a real `Date` type |
| No binary data | Supports binary data |
| Slower to parse | Faster, with length prefixes for skipping |

**BSON data types:**

| Type | Definition | Example |
|---|---|---|
| `String` | UTF-8 text | `"Himanshu"` |
| `Int32` / `Int64` | Whole numbers | `25` |
| `Double` | Floating point numbers | `99.99` |
| `Decimal128` | High-precision decimal — **use for money** | `NumberDecimal("19.99")` |
| `Boolean` | true / false | `true` |
| `Date` | A date and time, stored as milliseconds since epoch | `ISODate("2024-01-15")` |
| `ObjectId` | A unique 12-byte identifier | `ObjectId("507f...")` |
| `Array` | An ordered list | `["a", "b"]` |
| `Object` | An embedded document | `{ city: "Delhi" }` |
| `Null` | An empty value | `null` |
| `Binary` | Raw binary data | images, files |
| `Regex` | A regular expression | `/^A/i` |

> **Important:** never store money as a `Double` — floating-point rounding causes errors. Use `Decimal128`, or store the amount in the smallest unit (paise/cents) as an integer.

---

## 5. What is `_id`?

**Definition:** `_id` is the **primary key** of every document. MongoDB creates it automatically if you do not provide one, and it must be unique within the collection.

**Definition of ObjectId:** A 12-byte identifier that MongoDB generates by default. Its structure is:

```
507f1f77  bcf86cd7  99439011
└─4 bytes─┘└─5 bytes─┘└3 bytes┘
 timestamp   random    counter
```

**Why this matters:** because the first 4 bytes are a timestamp, ObjectIds are **roughly ordered by creation time**. You can sort by `_id` to get newest-first, and extract the creation date without storing it separately.

```js
const id = new ObjectId();
console.log(id.getTimestamp());   // the document's creation time

// Sorting by _id sorts by creation time
db.users.find().sort({ _id: -1 }).limit(10);   // 10 newest users
```

**You can also set `_id` yourself:**

```js
db.users.insertOne({ _id: "user_123", name: "Himanshu" });   // custom string id
```

---

## 6. What does "schema-less" really mean?

**Definition:** MongoDB does not force every document in a collection to have the same fields. This is called a **flexible** or **dynamic** schema.

**Advantages:**
- Add new fields without migrating the whole collection
- Different document shapes in one collection (useful for polymorphic data)
- Fast iteration during early development

**The danger:** "schema-less" does not mean "no schema" — it means the schema is enforced by your **application** instead of the database. Without discipline you get inconsistent data.

```js
// Chaos without discipline
{ name: "Himanshu", age: 25 }
{ fullName: "Rahul", years: 30 }      // different field names!
{ name: "Amit", age: "twenty" }       // different data type!
```

**The fix:** use **Mongoose schemas** in Node.js, or MongoDB's built-in **schema validation**.

```js
// MongoDB native schema validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string", description: "must be a string and is required" },
        email: { bsonType: "string", pattern: "^.+@.+$" },
        age: { bsonType: "int", minimum: 0, maximum: 120 },
      },
    },
  },
  validationAction: "error",   // "error" rejects, "warn" only logs
});
```

---

## 7. Basic shell commands

```js
// Databases
show dbs                     // list all databases
use myapp                    // switch to (or create) a database
db                           // show the current database
db.dropDatabase()            // delete the current database

// Collections
show collections
db.createCollection("users")
db.users.drop()

// Quick data operations
db.users.insertOne({ name: "Himanshu", age: 25 })
db.users.find()
db.users.find().pretty()
db.users.countDocuments()

// Info
db.users.stats()
db.users.getIndexes()
```

> Databases and collections are created **lazily** — they do not exist until you insert the first document.

---

## 8. Why choose MongoDB?

**Advantages:**

| Advantage | Explanation |
|---|---|
| **Flexible schema** | Change the data shape without migrations |
| **Natural for JavaScript** | Documents map directly to JS objects |
| **Horizontal scaling** | Built-in sharding across many servers |
| **Fast reads for nested data** | Related data in one document = one read, no joins |
| **High availability** | Replica sets with automatic failover |
| **Rich querying** | Aggregation pipeline, geospatial, text search |

**Disadvantages:**

| Disadvantage | Explanation |
|---|---|
| **No real joins** | `$lookup` exists but is slower than a SQL join |
| **Data duplication** | Denormalisation means updating data in several places |
| **Memory hungry** | Field names are repeated in every document |
| **Transactions cost more** | Supported since 4.0, but heavier than in SQL |
| **Easy to design badly** | Flexibility lets you create inconsistent data |

---

## 9. When to use MongoDB vs SQL

**Use MongoDB when:**
- The data structure changes often or varies between records
- Data is naturally hierarchical (a product with variants, a post with comments)
- You need to scale horizontally across many servers
- You are building fast and requirements are still evolving
- Handling large volumes of semi-structured data (logs, events, IoT)

**Use SQL when:**
- Data is highly relational with many-to-many relationships everywhere
- You need strict ACID transactions across multiple tables (banking, accounting)
- Complex reporting queries with many joins
- The schema is well-defined and stable
- Data integrity constraints matter more than flexibility

---

## Key points

- MongoDB stores **documents** (JSON-like) inside **collections** (like tables).
- Documents are stored as **BSON** — binary JSON with extra types like `Date`, `ObjectId` and `Decimal128`.
- Every document has a unique `_id`, usually an `ObjectId` containing a creation timestamp.
- "Schema-less" means the **application** enforces the schema — use Mongoose or JSON Schema validation.
- Maximum document size is **16 MB**.
- Never store money as a `Double` — use `Decimal128` or integer cents.
