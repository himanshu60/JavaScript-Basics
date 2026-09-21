# MongoDB Aggregation Pipeline

## 1. What is the Aggregation Pipeline?

**Definition:** The aggregation pipeline is a framework for processing documents through a **sequence of stages**. Each stage transforms the documents and passes the result to the next stage, like an assembly line.

**In simple words:** Data flows through a series of filters and transformations. Each stage does one job, and the output of one becomes the input of the next.

```js
db.collection.aggregate([
  { $match: {...} },      // Stage 1: filter
  { $group: {...} },      // Stage 2: group and calculate
  { $sort: {...} },       // Stage 3: sort the result
]);
```

**Why use it instead of `find()`?** `find()` can only filter and project. Aggregation can group, calculate, join, reshape and compute statistics — everything SQL does with `GROUP BY`, `JOIN` and window functions.

---

## 2. The main stages

### `$match` — filter documents

**Definition:** Filters documents using the same syntax as `find()`. **Always put it first** so later stages process fewer documents.

```js
db.orders.aggregate([
  { $match: { status: "completed", total: { $gte: 100 } } },
]);
```

> **Performance rule:** `$match` as the first stage can use indexes. After a `$group` or `$project` it cannot.

### `$group` — group and calculate

**Definition:** Groups documents by a key and computes aggregate values for each group. `_id` defines the grouping key; `_id: null` groups everything into one.

```js
db.orders.aggregate([
  {
    $group: {
      _id: "$customerId",                  // group by this field
      totalSpent: { $sum: "$amount" },
      orderCount: { $sum: 1 },             // count documents
      avgOrder: { $avg: "$amount" },
      maxOrder: { $max: "$amount" },
      minOrder: { $min: "$amount" },
      products: { $push: "$product" },     // collect into an array
      uniqueProducts: { $addToSet: "$product" },  // collect without duplicates
      firstOrder: { $first: "$date" },
      lastOrder: { $last: "$date" },
    },
  },
]);
```

**Accumulator operators:**

| Operator | Definition |
|---|---|
| `$sum` | Adds values (`$sum: 1` counts documents) |
| `$avg` | Average of the values |
| `$min` / `$max` | Smallest / largest value |
| `$push` | Collects all values into an array |
| `$addToSet` | Collects unique values into an array |
| `$first` / `$last` | First / last value in the group (needs a prior `$sort`) |
| `$count` | Counts documents in the group |

**Grouping by multiple fields:**

```js
{ $group: { _id: { city: "$city", year: { $year: "$date" } }, total: { $sum: 1 } } }
```

### `$project` — reshape documents

**Definition:** Chooses which fields to include, renames them, and creates computed fields.

```js
db.users.aggregate([
  {
    $project: {
      _id: 0,
      fullName: { $concat: ["$firstName", " ", "$lastName"] },
      email: 1,
      ageGroup: {
        $cond: { if: { $gte: ["$age", 18] }, then: "Adult", else: "Minor" },
      },
      joinYear: { $year: "$createdAt" },
      discountedPrice: { $multiply: ["$price", 0.9] },
    },
  },
]);
```

### `$addFields` / `$set` — add without removing

**Definition:** Adds new computed fields while **keeping all existing fields**. `$set` is an alias for `$addFields`.

```js
{ $addFields: { total: { $multiply: ["$price", "$quantity"] } } }
```

> Use `$addFields` when you only want to add a field; use `$project` when you want to control the whole shape.

### `$sort`, `$limit`, `$skip`

```js
{ $sort: { total: -1, name: 1 } }    // -1 descending, 1 ascending
{ $limit: 10 }
{ $skip: 20 }
```

> Always put `$limit` as early as possible. `$sort` without an index must load everything into memory (100 MB limit unless `allowDiskUse: true`).

### `$unwind` — flatten an array

**Definition:** Turns a document with an array of N items into **N separate documents**, one per item.

```js
// Before
{ _id: 1, name: "Order1", items: ["A", "B", "C"] }

// { $unwind: "$items" } produces:
{ _id: 1, name: "Order1", items: "A" }
{ _id: 1, name: "Order1", items: "B" }
{ _id: 1, name: "Order1", items: "C" }
```

```js
// Options
{
  $unwind: {
    path: "$items",
    preserveNullAndEmptyArrays: true,   // keep documents with empty/missing arrays
    includeArrayIndex: "itemIndex",     // add the original position
  },
}
```

> **Without `preserveNullAndEmptyArrays: true`, documents with an empty array are dropped entirely** — a very common bug.

### `$lookup` — the MongoDB join

**Definition:** Performs a left outer join with another collection in the **same database**, putting the matched documents into an array field.

```js
db.orders.aggregate([
  {
    $lookup: {
      from: "users",              // the other collection
      localField: "userId",       // field in orders
      foreignField: "_id",        // field in users
      as: "userDetails",          // result array
    },
  },
  { $unwind: "$userDetails" },    // turn the 1-element array into an object
]);
```

**Advanced `$lookup` with a sub-pipeline:**

```js
{
  $lookup: {
    from: "orders",
    let: { userId: "$_id" },              // pass variables in
    pipeline: [
      { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },  // $$ = outer variable
      { $match: { status: "completed" } },                      // extra filtering
      { $sort: { date: -1 } },
      { $limit: 5 },                                            // only the 5 latest
      { $project: { total: 1, date: 1 } },
    ],
    as: "recentOrders",
  },
}
```

> **Performance:** always index the `foreignField`. `$lookup` is much slower than a SQL join — if you do it on every query, consider embedding the data instead.

### `$facet` — run several pipelines at once

**Definition:** Runs multiple independent pipelines on the same input documents and returns all their results in a single document. Perfect for "data + total count" in one query.

```js
db.products.aggregate([
  { $match: { category: "electronics" } },
  {
    $facet: {
      data: [{ $skip: 0 }, { $limit: 10 }],
      totalCount: [{ $count: "count" }],
      priceStats: [
        { $group: { _id: null, avg: { $avg: "$price" }, max: { $max: "$price" } } },
      ],
      byBrand: [{ $group: { _id: "$brand", count: { $sum: 1 } } }],
    },
  },
]);
```

### Other useful stages

| Stage | Definition |
|---|---|
| `$count` | Counts the documents at that point and outputs a single field |
| `$sample` | Returns N randomly selected documents |
| `$out` | Writes the result to a collection (replacing it) |
| `$merge` | Writes the result into a collection, merging with existing documents |
| `$replaceRoot` | Promotes a nested document to be the top-level document |
| `$bucket` | Groups documents into fixed ranges (histogram) |
| `$graphLookup` | Recursive lookup — for hierarchies and graphs |
| `$unionWith` | Combines the results of two collections |

```js
{ $count: "totalUsers" }
{ $sample: { size: 5 } }
{ $replaceRoot: { newRoot: "$userDetails" } }
{ $bucket: { groupBy: "$price", boundaries: [0, 100, 500, 1000], default: "1000+",
             output: { count: { $sum: 1 } } } }
```

---

## 3. Expression operators

**Definition:** Operators used **inside** stages to compute values. Field names are referenced with a `$` prefix.

### Arithmetic

```js
{ $add: ["$price", "$tax"] }
{ $subtract: ["$total", "$discount"] }
{ $multiply: ["$price", "$quantity"] }
{ $divide: ["$total", "$count"] }
{ $round: ["$price", 2] }
```

### String

```js
{ $concat: ["$first", " ", "$last"] }
{ $toUpper: "$name" }
{ $substr: ["$description", 0, 100] }
{ $split: ["$tags", ","] }
{ $strLenCP: "$name" }
{ $trim: { input: "$name" } }
```

### Date

```js
{ $year: "$createdAt" }
{ $month: "$createdAt" }
{ $dayOfWeek: "$createdAt" }
{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
{ $dateDiff: { startDate: "$start", endDate: "$end", unit: "day" } }
```

### Conditional

```js
// if/else
{ $cond: { if: { $gte: ["$score", 60] }, then: "Pass", else: "Fail" } }

// switch - multiple conditions
{
  $switch: {
    branches: [
      { case: { $gte: ["$score", 90] }, then: "A" },
      { case: { $gte: ["$score", 75] }, then: "B" },
      { case: { $gte: ["$score", 60] }, then: "C" },
    ],
    default: "F",
  },
}

// Replace null with a default
{ $ifNull: ["$nickname", "No nickname"] }
```

### Array

```js
{ $size: "$items" }
{ $arrayElemAt: ["$items", 0] }        // first element
{ $slice: ["$items", 3] }
{ $filter: { input: "$items", as: "item", cond: { $gte: ["$$item.price", 100] } } }
{ $map: { input: "$prices", as: "p", in: { $multiply: ["$$p", 1.1] } } }
{ $reduce: { input: "$nums", initialValue: 0, in: { $add: ["$$value", "$$this"] } } }
{ $in: ["React", "$skills"] }
```

> `$$item` refers to a variable defined by `as`. `$$value` and `$$this` are the built-in variables in `$reduce`.

---

## 4. Complete real-world examples

### Sales report by month

```js
db.orders.aggregate([
  { $match: { status: "completed", date: { $gte: ISODate("2024-01-01") } } },
  {
    $group: {
      _id: { year: { $year: "$date" }, month: { $month: "$date" } },
      revenue: { $sum: "$total" },
      orders: { $sum: 1 },
      avgOrderValue: { $avg: "$total" },
    },
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      _id: 0,
      period: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] },
      revenue: { $round: ["$revenue", 2] },
      orders: 1,
      avgOrderValue: { $round: ["$avgOrderValue", 2] },
    },
  },
]);
```

### Top 5 products by revenue

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.productId",
      totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      unitsSold: { $sum: "$items.quantity" },
    },
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 },
  { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
  { $unwind: "$product" },
  { $project: { name: "$product.name", totalRevenue: 1, unitsSold: 1 } },
]);
```

### Paginated search with total count

```js
db.products.aggregate([
  { $match: { category: "electronics", price: { $lte: 50000 } } },
  { $sort: { createdAt: -1 } },
  {
    $facet: {
      data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      meta: [{ $count: "total" }],
    },
  },
  {
    $project: {
      data: 1,
      total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
    },
  },
]);
```

---

## 5. Optimisation rules

| Rule | Why |
|---|---|
| **`$match` first** | Only the first stage can use indexes |
| **`$limit` early** | Reduces work in every later stage |
| **`$project` early** | Drops unneeded fields, lowering memory use |
| **Avoid `$unwind` on huge arrays** | It multiplies the document count |
| **Index the `$lookup` foreign field** | Otherwise it scans the whole collection |
| **Use `allowDiskUse: true` for large sorts** | The default memory limit per stage is 100 MB |
| **Use `$facet` instead of two queries** | One round trip instead of two |

```js
db.collection.aggregate(pipeline, { allowDiskUse: true });

// Analyse a pipeline
db.collection.aggregate(pipeline).explain("executionStats");
```

---

## Key points

- The pipeline is a **sequence of stages**, each feeding the next.
- Core stages: `$match`, `$group`, `$project`, `$sort`, `$limit`, `$unwind`, `$lookup`, `$facet`.
- **`$match` first** — it is the only stage that can use indexes efficiently.
- `$group` uses accumulators: `$sum`, `$avg`, `$push`, `$addToSet`, `$min`, `$max`.
- `$unwind` flattens arrays — always consider `preserveNullAndEmptyArrays`.
- `$lookup` is the left outer join; index the foreign field or it will be slow.
- `$facet` runs several pipelines at once — ideal for data plus total count.
- Each stage is limited to 100 MB of memory unless `allowDiskUse: true`.
