# MongoDB Data Modeling and Relationships

## 1. What is Data Modeling?

**Definition:** Data modeling is deciding **how to structure your documents and collections** — what to keep together in one document, and what to split into separate collections.

**The golden rule of MongoDB modeling:**
> **Design your schema around how your application QUERIES the data, not around how the data relates in theory.**

This is the opposite of SQL, where you normalise first and then write queries to fit.

---

## 2. The two ways to model relationships

### a) Embedding (denormalisation)

**Definition:** Storing related data **inside** the same document as a nested object or array.

```js
// One document holds everything
{
  _id: ObjectId("..."),
  name: "Himanshu",
  email: "himanshu@example.com",
  address: {                       // embedded object
    street: "123 Main St",
    city: "Delhi",
    pin: "110001"
  },
  orders: [                        // embedded array
    { orderId: "A1", total: 500, date: ISODate("...") },
    { orderId: "A2", total: 300, date: ISODate("...") }
  ]
}
```

**Advantages:**
- **One query** gets everything — no joins needed
- **Atomic updates** — a single document update is always atomic
- **Faster reads** — all the data is physically together on disk

**Disadvantages:**
- Documents can grow towards the **16 MB limit**
- **Duplicated data** must be updated in many places
- Hard to query the embedded data on its own

### b) Referencing (normalisation)

**Definition:** Storing related data in a **separate collection** and linking it with the `_id`.

```js
// users collection
{ _id: ObjectId("user1"), name: "Himanshu", email: "himanshu@example.com" }

// orders collection
{ _id: ObjectId("order1"), userId: ObjectId("user1"), total: 500 }
{ _id: ObjectId("order2"), userId: ObjectId("user1"), total: 300 }
```

**Advantages:**
- No document size limit problems
- **No duplication** — update in one place only
- Each collection can be queried independently

**Disadvantages:**
- Needs **multiple queries** or a `$lookup` (slower)
- No cross-collection atomic update without a transaction

---

## 3. When to embed vs when to reference

| Question | Embed | Reference |
|---|---|---|
| Is the data always read **together**? | ✅ Yes | ❌ No |
| Does the child exist **without** the parent? | ❌ No | ✅ Yes |
| How many children? | Few (tens/hundreds) | Many (thousands+) |
| Does the child change often? | Rarely | Frequently |
| Is the child queried **on its own**? | ❌ No | ✅ Yes |
| Is the data shared by many parents? | ❌ No | ✅ Yes |
| Could it grow unbounded? | ❌ No | ✅ Yes |

**The quick rule:**
- **"Contains"** relationship (an address belongs to one user) → **embed**
- **"References"** relationship (many posts by one author) → **reference**

---

## 4. Relationship patterns

### One-to-One → embed

```js
// A user has exactly one profile - embed it
{
  _id: ObjectId("..."),
  email: "himanshu@example.com",
  profile: {
    firstName: "Himanshu",
    bio: "Developer",
    avatar: "url.jpg"
  }
}
```

### One-to-Few → embed

**Definition:** "Few" means a bounded number that will not keep growing — a handful of addresses, a few phone numbers.

```js
{
  _id: ObjectId("..."),
  name: "Himanshu",
  addresses: [                       // a user will never have 10,000 addresses
    { type: "home", city: "Delhi" },
    { type: "office", city: "Gurgaon" }
  ]
}
```

### One-to-Many → reference

**Definition:** "Many" means potentially thousands — a blog post's comments, a user's orders.

```js
// posts collection
{ _id: ObjectId("post1"), title: "MongoDB Guide", authorId: ObjectId("user1") }

// comments collection - could be thousands, so keep them separate
{ _id: ObjectId("c1"), postId: ObjectId("post1"), text: "Great post!" }
```

### One-to-Squillions → reference from the child side

**Definition:** When there are so many children (millions of log entries per server) that even storing their IDs in the parent is impossible, always store the parent reference on the **child**.

```js
// ❌ Impossible - the array would exceed 16 MB
{ _id: "server1", logIds: [/* millions of ids */] }

// ✅ Correct - each log points to its parent
{ _id: ObjectId("..."), serverId: "server1", message: "...", time: ISODate("...") }
```

### Many-to-Many → reference on one or both sides

```js
// Students and courses
// students
{ _id: ObjectId("s1"), name: "Himanshu", courseIds: [ObjectId("c1"), ObjectId("c2")] }

// courses
{ _id: ObjectId("c1"), title: "MongoDB", studentIds: [ObjectId("s1")] }
```

> Storing the array on **both** sides makes queries fast in both directions, but you must keep both in sync. If one side is much smaller, store the array only there.

---

## 5. The Extended Reference pattern

**Definition:** Reference the related document by `_id`, but **also copy a few frequently-needed fields** into the parent. This avoids a join for the common case.

```js
// orders collection
{
  _id: ObjectId("order1"),
  customer: {
    _id: ObjectId("user1"),      // the reference
    name: "Himanshu",            // duplicated for fast display
    email: "himanshu@example.com"
  },
  items: [...],
  total: 1500
}
```

**Benefit:** showing an order list needs no join at all.
**Cost:** if a user changes their name, you must decide whether to update old orders (usually you should **not** — an invoice should keep the name used at the time).

**Best used for:** fields that rarely change (names, SKUs, category titles) or where a historical snapshot is actually correct.

---

## 6. The Subset pattern

**Definition:** Embed only the **most-used subset** of a large array, and keep the full list in another collection.

```js
// products - embed only the 5 most recent reviews
{
  _id: ObjectId("p1"),
  name: "Laptop",
  reviewCount: 1523,
  averageRating: 4.5,
  recentReviews: [                  // only 5 - enough for the product page
    { user: "A", rating: 5, text: "Great!" },
    { user: "B", rating: 4, text: "Good" }
  ]
}

// reviews collection - all 1523 of them, loaded only when needed
{ _id: ObjectId("r1"), productId: ObjectId("p1"), user: "A", rating: 5 }
```

**Benefit:** the product page loads in one fast query; the full review list is a separate request when the user asks for it.

---

## 7. The Computed pattern

**Definition:** Store pre-calculated values instead of computing them on every read.

```js
// ❌ Counting 10,000 reviews on every page load is slow
const count = db.reviews.countDocuments({ productId: id });

// ✅ Store the computed values and update them when a review is added
{
  _id: ObjectId("p1"),
  name: "Laptop",
  reviewCount: 1523,        // computed
  averageRating: 4.5,       // computed
  totalRevenue: 458000      // computed
}
```

```js
// Update them atomically when a new review arrives
db.products.updateOne({ _id: productId }, {
  $inc: { reviewCount: 1, ratingSum: newRating },
});
// then averageRating = ratingSum / reviewCount
```

**Use when:** reads vastly outnumber writes, and the calculation is expensive.

---

## 8. The Bucket pattern

**Definition:** Group many small related documents (like time-series readings) into "buckets" to reduce the total document count and index size.

```js
// ❌ One document per reading = millions of documents
{ sensorId: "s1", temp: 25.3, time: ISODate("2024-01-15T10:00:00Z") }
{ sensorId: "s1", temp: 25.5, time: ISODate("2024-01-15T10:01:00Z") }

// ✅ One document per sensor per hour
{
  sensorId: "s1",
  startTime: ISODate("2024-01-15T10:00:00Z"),
  endTime: ISODate("2024-01-15T11:00:00Z"),
  count: 60,
  readings: [
    { temp: 25.3, time: ISODate("...") },
    { temp: 25.5, time: ISODate("...") }
  ],
  min: 25.1, max: 26.0, avg: 25.4     // pre-computed for the bucket
}
```

**Benefit:** 60× fewer documents, much smaller indexes, faster range queries.
**Used for:** IoT sensors, analytics events, logs, stock prices.

---

## 9. Schema design anti-patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| **Massive arrays** | Documents grow past 16 MB, and updates get slow | Reference instead, or use the Subset pattern |
| **Too many collections** | Hundreds of tiny collections waste resources | Combine related data |
| **Unbounded growth** | Arrays that keep growing forever | Bucket or reference |
| **Bloated documents** | Reading 16 MB to use one field | Split rarely-used fields into another collection |
| **Case-insensitive queries without a collation index** | Full collection scans | Use a collation index, or store a lowercase copy |
| **Separate collection per user/tenant** | Unmanageable at scale | One collection with a `tenantId` field |

---

## 10. A practical e-commerce example

```js
// users - profile embedded (1:1), addresses embedded (1:few)
{
  _id: ObjectId("u1"),
  email: "himanshu@example.com",
  profile: { name: "Himanshu", phone: "999..." },
  addresses: [{ type: "home", city: "Delhi" }],
  // orders are NOT embedded - unbounded growth
}

// products - computed fields + subset of reviews
{
  _id: ObjectId("p1"),
  name: "Laptop",
  price: NumberDecimal("45000.00"),      // Decimal128 for money
  category: { _id: ObjectId("c1"), name: "Electronics" },  // extended reference
  stock: 15,
  reviewCount: 234,                      // computed
  averageRating: 4.5,                    // computed
  recentReviews: [ /* 3 reviews */ ]     // subset
}

// orders - extended reference + a snapshot of items
{
  _id: ObjectId("o1"),
  userId: ObjectId("u1"),
  customer: { name: "Himanshu", email: "..." },   // snapshot at order time
  items: [
    {
      productId: ObjectId("p1"),
      name: "Laptop",                    // snapshot - price must NOT change later
      price: NumberDecimal("45000.00"),
      quantity: 1
    }
  ],
  total: NumberDecimal("45000.00"),
  status: "shipped",
  createdAt: ISODate("...")
}

// reviews - separate, can be thousands per product
{ _id: ObjectId("r1"), productId: ObjectId("p1"), userId: ObjectId("u1"), rating: 5 }
```

**Note the deliberate duplication in `orders.items`:** the product name and price are **snapshots**. If the product price changes next month, the old order must still show what the customer actually paid. Here, duplication is correct, not a mistake.

---

## Key points

- Model around your **queries**, not around theoretical relationships.
- **Embed** for one-to-one and one-to-few data that is always read together.
- **Reference** for one-to-many, many-to-many and anything that grows unboundedly.
- Watch the **16 MB** document limit — never let an array grow without a bound.
- Useful patterns: **Extended Reference**, **Subset**, **Computed**, **Bucket**.
- Some duplication is correct — historical snapshots (order prices) should not change.
- Avoid massive arrays, bloated documents and one-collection-per-tenant designs.
