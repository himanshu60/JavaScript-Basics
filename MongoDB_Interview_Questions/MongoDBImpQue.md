# MongoDB Interview Questions and Answers

## 1. What is MongoDB?

MongoDB is a NoSQL, document-oriented database that stores data as flexible JSON-like documents (BSON) instead of rows in tables. It supports a dynamic schema, horizontal scaling through sharding and high availability through replica sets.

## 2. What is a document, a collection and a database?

A **document** is a single record made of field-value pairs (like a JSON object). A **collection** is a group of documents (like a SQL table). A **database** is a container of collections.

## 3. What is BSON?

Binary JSON — the binary format MongoDB uses to store documents. It supports types JSON does not, such as `Date`, `ObjectId`, `Decimal128` and binary data, and is faster to parse.

## 4. What is the maximum document size?

16 MB. This limit is why you must never let an embedded array grow without bounds.

## 5. What is `_id` and ObjectId?

`_id` is the unique primary key of every document. By default it is an `ObjectId` — a 12-byte value made of a 4-byte timestamp, 5 random bytes and a 3-byte counter. Because it begins with a timestamp, sorting by `_id` roughly sorts by creation time.

## 6. What does "schema-less" really mean?

It means MongoDB does not enforce a fixed structure — but your data still has a schema, enforced by your **application**. Use Mongoose schemas or MongoDB's `$jsonSchema` validation to keep data consistent.

## 7. Difference between SQL and NoSQL?

SQL uses fixed tables, rows and joins with strict schemas and strong ACID guarantees. NoSQL (MongoDB) uses flexible documents, favours embedding over joins, and scales horizontally more easily.

## 8. When would you choose MongoDB over SQL?

When the data shape varies or changes often, when data is naturally hierarchical, when you need horizontal scaling, or when you are iterating quickly. Choose SQL for heavily relational data, complex multi-table reporting and strict cross-table transactions.

## 9. What are the CRUD operations?

`insertOne`/`insertMany` to create, `find`/`findOne` to read, `updateOne`/`updateMany`/`replaceOne` to update, and `deleteOne`/`deleteMany` to delete.

## 10. What is projection?

The second argument to `find()`, controlling which fields are returned. `1` includes, `0` excludes. You cannot mix them except for `_id`, which can always be excluded.

## 11. What is the difference between `find()` and `findOne()`?

`find()` returns a **cursor** over all matches; `findOne()` returns the first matching document directly, or `null`.

## 12. What is a cursor?

A pointer to a result set that fetches documents in batches rather than loading everything into memory. Methods like `sort`, `skip` and `limit` are chained onto it.

## 13. What are comparison operators?

`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin` — used to compare field values, for example `{ age: { $gte: 18 } }`.

## 14. What are logical operators?

`$and`, `$or`, `$not`, `$nor`. Listing several fields together is an implicit `$and`; explicit `$and` is needed when you use the same field twice.

## 15. What is `$elemMatch`?

It requires a **single array element** to satisfy all the given conditions. Without it, `{ scores: { $gte: 80, $lt: 90 } }` can be satisfied by two different elements.

## 16. What is the difference between `$push` and `$addToSet`?

`$push` always appends the value. `$addToSet` appends only if the value is not already in the array.

## 17. What are the positional operators?

`$` updates the **first** matching array element, `$[]` updates **all** elements, and `$[identifier]` updates the elements matching an `arrayFilters` condition.

## 18. What is upsert?

`{ upsert: true }` updates the document if it exists, and inserts a new one if it does not. `$setOnInsert` sets fields that should apply only when the insert happens.

## 19. What is the difference between `updateOne` and `replaceOne`?

`updateOne` modifies only the fields you specify with operators like `$set`. `replaceOne` replaces the entire document — every field you did not include is deleted.

## 20. What is an index and why is it needed?

An index is a sorted B-tree structure that lets MongoDB find documents without scanning the whole collection. Without one, a query performs a `COLLSCAN` over every document.

## 21. What types of indexes does MongoDB support?

Single field, compound, multikey (arrays), text, geospatial (`2dsphere`), hashed, unique, partial, sparse and TTL indexes.

## 22. What is a compound index and does field order matter?

An index on multiple fields. The order matters enormously — follow the **ESR rule**: Equality fields first, then Sort fields, then Range fields.

## 23. What is the index prefix rule?

A compound index `{a, b, c}` can serve queries on `{a}`, `{a,b}` and `{a,b,c}`, but **not** on `{b}` or `{b,c}` — a query must use the leading fields.

## 24. What is a TTL index?

An index on a `Date` field with `expireAfterSeconds`, which makes MongoDB automatically delete documents after that time. Used for sessions, OTPs and cache entries.

## 25. What is a covered query?

A query where every field needed — for filtering and for the result — exists in the index, so MongoDB never reads the actual documents. `totalDocsExamined` is 0. You must exclude `_id` unless it is in the index.

## 26. What is `explain()` and what should you look for?

It shows how a query was executed. Look for `stage: "IXSCAN"` (good) versus `"COLLSCAN"` (bad), and aim for `nReturned` to be close to `totalDocsExamined`.

## 27. What are the downsides of indexes?

They slow down every write (each write updates all affected indexes), consume RAM and disk, and take time to build. Create only the indexes your queries actually use.

## 28. What is the aggregation pipeline?

A sequence of stages that transform documents one after another — used for grouping, calculating, joining and reshaping data, equivalent to SQL's `GROUP BY` and `JOIN`.

## 29. What are the main aggregation stages?

`$match`, `$group`, `$project`, `$addFields`, `$sort`, `$limit`, `$skip`, `$unwind`, `$lookup`, `$facet`, `$count`, `$out`, `$merge`.

## 30. Why should `$match` come first?

Only the first stage can use indexes, and filtering early means every later stage processes far fewer documents.

## 31. What does `$unwind` do?

It turns a document containing an array of N items into N separate documents. Add `preserveNullAndEmptyArrays: true` or documents with empty arrays are dropped.

## 32. What is `$lookup`?

MongoDB's left outer join. It matches a local field to a foreign field in another collection and puts the results in an array. Always index the foreign field — it is much slower than a SQL join.

## 33. What is `$facet`?

A stage that runs several independent pipelines on the same input and returns all results in one document — ideal for fetching paginated data and its total count in one query.

## 34. What are the accumulator operators in `$group`?

`$sum`, `$avg`, `$min`, `$max`, `$push`, `$addToSet`, `$first`, `$last`, `$count`. `$sum: 1` counts documents.

## 35. Embedding vs referencing — how do you decide?

**Embed** when the data is always read together, is bounded in size, and does not exist independently (one-to-one, one-to-few). **Reference** when the data grows unboundedly, is queried on its own, or is shared by many parents (one-to-many, many-to-many).

## 36. What is denormalisation and when is duplication correct?

Deliberately duplicating data to avoid joins. It is correct when the duplicate is a **historical snapshot** — an order should keep the price the customer actually paid, even if the product price changes later.

## 37. What are common MongoDB schema patterns?

**Extended Reference** (copy a few fields alongside the ID), **Subset** (embed only the most-used items), **Computed** (store pre-calculated totals), and **Bucket** (group time-series readings into one document per hour).

## 38. What are MongoDB schema anti-patterns?

Unbounded arrays, massive documents, too many tiny collections, one collection per tenant, and case-insensitive queries without a collation index.

## 39. Is MongoDB ACID compliant?

Yes. Single-document operations have always been atomic. Multi-document ACID transactions were added in version 4.0 (and 4.2 for sharded clusters).

## 40. What is a transaction and when should you use one?

A group of operations that all commit or all roll back. Use it when you must update several documents consistently — like transferring money. Keep them short; good schema design often removes the need.

## 41. What are the limitations of transactions?

They require a replica set, have a 60-second default time limit, cost noticeable performance, and hold locks that block other writers.

## 42. What is a replica set?

A group of MongoDB servers holding identical copies of the data. One **primary** accepts writes; **secondaries** replicate from it through the oplog and can serve reads.

## 43. What is the oplog?

A capped collection on the primary recording every write. Secondaries read and replay it to stay in sync. Change streams are also built on it.

## 44. What happens when the primary fails?

The remaining members hold an **election** and promote a new primary, usually within 10–12 seconds. Drivers reconnect automatically. This is why replica sets should have an odd number of voting members.

## 45. What is write concern?

How many members must acknowledge a write before it is considered successful. `w: 1` (default) means the primary only; `w: "majority"` protects against losing the write during a failover.

## 46. What is read preference?

Which members a read may be sent to: `primary` (default), `primaryPreferred`, `secondary`, `secondaryPreferred` or `nearest`. Reading from secondaries gives eventual consistency.

## 47. What is sharding?

Splitting a collection's data across multiple servers so no single machine holds it all. It is horizontal scaling for storage, reads and writes.

## 48. What is a shard key and what makes a good one?

The field determining which shard a document goes to. A good shard key has high cardinality, low frequency, is non-monotonic, and appears in most queries so they can target a single shard.

## 49. Why is a monotonically increasing shard key bad?

Because every new document has the highest value, so all writes go to the last shard — creating a "hot shard" while the others sit idle. Use a hashed key or a compound key instead.

## 50. What is the difference between replication and sharding?

Replication copies the **same** data to multiple servers for availability. Sharding splits **different** data across servers for scale. Production clusters use both together.

## 51. What are change streams?

A way to subscribe to real-time data changes in a collection. Built on the oplog, so a replica set is required. Used for notifications, cache invalidation and syncing to search engines.

## 52. What is GridFS?

A specification for storing files larger than 16 MB by splitting them into chunks across two collections (`fs.files` and `fs.chunks`). For most applications, object storage like S3 is a better choice.

## 53. What is Mongoose?

An ODM library for Node.js that adds schemas, validation, type casting, middleware hooks and population on top of MongoDB.

## 54. What is the difference between a Schema and a Model in Mongoose?

A **Schema** defines the structure and rules. A **Model** is the constructor compiled from the schema, which you use to query the collection.

## 55. What is `.lean()` in Mongoose?

It returns plain JavaScript objects instead of full Mongoose documents, making read queries 2–5× faster. The result has no `.save()`, virtuals or getters, so use it for read-only queries.

## 56. Why do Mongoose updates not run validators?

Because `runValidators` defaults to `false` on update methods. You must pass `{ runValidators: true }`, and `{ new: true }` to get the updated document back rather than the old one.

## 57. What is Mongoose middleware?

`pre` and `post` hooks that run around operations like `save`, `find` and `remove`. Used for hashing passwords and cascading deletes. Note that `save` hooks do **not** run on `findOneAndUpdate`.

## 58. What is `populate()`?

Mongoose's way of replacing a stored ObjectId reference with the full referenced document. It runs a **second query**, so it is not a true join — always select only the fields you need.

## 59. What is a virtual in Mongoose?

A computed property that is not stored in the database, such as a `fullName` derived from `firstName` and `lastName`. Enable `toJSON: { virtuals: true }` to include it in responses.

## 60. How do you paginate efficiently?

Avoid deep `skip()`, which forces MongoDB to walk through all skipped documents. Use range-based pagination instead: `find({ _id: { $lt: lastSeenId } }).sort({ _id: -1 }).limit(20)`.

## 61. How do you handle a duplicate key error?

Catch the error and check `err.code === 11000`. `unique` is an index, not a Mongoose validator, so it does not produce a `ValidationError`.

## 62. How do you find and fix slow queries?

Enable the profiler with `db.setProfilingLevel(1, { slowms: 100 })`, read `db.system.profile`, then run `explain("executionStats")` on the slow queries and add the missing indexes.

## 63. Why should money not be stored as a Double?

Floating-point arithmetic introduces rounding errors. Use `Decimal128` (`NumberDecimal("19.99")`), or store the amount as an integer in the smallest unit (paise or cents).

## 64. What is a capped collection?

A fixed-size collection that automatically overwrites its oldest documents when full, preserving insertion order. The oplog is a capped collection.

## 65. How do you secure a MongoDB deployment?

Enable authentication and role-based access control, never expose the database to the public internet, use TLS, create per-application users with least privilege, encrypt data at rest, keep regular backups and never build queries by string concatenation.
