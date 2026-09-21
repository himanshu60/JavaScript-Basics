# MongoDB Interview Questions

📄 **[MongoDBImpQue.md](MongoDBImpQue.md)** — all 65 questions with answers in one file.

---

## Core Topics

| Topic | File | Covers |
|---|---|---|
| **MongoDB Basics** | [MongoDBBasics.md](MongoDBBasics.md) | Documents, collections, BSON types, `_id`/ObjectId, validation |
| **MongoDB vs SQL** | [MongoVsSQL.md](MongoVsSQL.md) | NoSQL types, query mapping, schema, scaling, when to use which |
| Advantages of MongoDB | [Advantage-of-mongodb.md](Advantage-of-mongodb.md) | Quick benefits list |
| Basic commands | [MongoDBBasicsCommands.md](MongoDBBasicsCommands.md) | Shell command reference |
| **CRUD & Operators** | [CRUDAndOperators.md](CRUDAndOperators.md) | All CRUD methods, query/update/positional operators |
| Inline documents | [MongoInline.md](MongoInline.md) | Embedded document note |

## Design & Performance

| Topic | File | Covers |
|---|---|---|
| **Data Modeling** | [DataModelingAndRelationships.md](DataModelingAndRelationships.md) | Embed vs reference, all relationship types, schema patterns |
| Relations in MySQL | [../SQL_Interview_Questions/CreateRelationsInMySQL.md](../SQL_Interview_Questions/CreateRelationsInMySQL.md) | SQL foreign keys, for comparison |
| Views (virtual tables) | [../SQL_Interview_Questions/Views-VirtualTable.md](../SQL_Interview_Questions/Views-VirtualTable.md) | What a database view is |
| Indexing | [indexing.md](indexing.md) | Basic indexing note |
| **Indexes & Performance** | [IndexesAndPerformance.md](IndexesAndPerformance.md) | All index types, ESR rule, `explain()`, covered queries |

## Aggregation

| Topic | File | Covers |
|---|---|---|
| Aggregation | [Aggregation.md](Aggregation.md) | Introduction |
| Pipeline | [Pipeline.md](Pipeline.md) | Pipeline concept |
| **Aggregation Pipeline** | [AggregationPipeline.md](AggregationPipeline.md) | Every stage, expression operators, real reports |

## Mongoose & Scaling

| Topic | File | Covers |
|---|---|---|
| Mongoose | [Mongoose.md](Mongoose.md) | Short intro |
| **Mongoose Guide** | [MongooseGuide.md](MongooseGuide.md) | Schemas, models, middleware, virtuals, populate |
| Sharding | [ShardingInMongodb.md](ShardingInMongodb.md) | Sharding note |
| **Transactions & Replication** | [TransactionsAndReplication.md](TransactionsAndReplication.md) | ACID, replica sets, write/read concern, sharding, change streams |

---

## All 65 questions ([MongoDBImpQue.md](MongoDBImpQue.md))

1. What is MongoDB?
2. What is a document, a collection and a database?
3. What is BSON?
4. What is the maximum document size?
5. What is `_id` and ObjectId?
6. What does "schema-less" really mean?
7. Difference between SQL and NoSQL?
8. When would you choose MongoDB over SQL?
9. What are the CRUD operations?
10. What is projection?
11. Difference between `find()` and `findOne()`?
12. What is a cursor?
13. What are comparison operators?
14. What are logical operators?
15. What is `$elemMatch`?
16. Difference between `$push` and `$addToSet`?
17. What are the positional operators?
18. What is upsert?
19. Difference between `updateOne` and `replaceOne`?
20. What is an index and why is it needed?
21. What types of indexes does MongoDB support?
22. What is a compound index and does field order matter?
23. What is the index prefix rule?
24. What is a TTL index?
25. What is a covered query?
26. What is `explain()` and what should you look for?
27. What are the downsides of indexes?
28. What is the aggregation pipeline?
29. What are the main aggregation stages?
30. Why should `$match` come first?
31. What does `$unwind` do?
32. What is `$lookup`?
33. What is `$facet`?
34. What are the accumulator operators in `$group`?
35. Embedding vs referencing — how do you decide?
36. What is denormalisation and when is duplication correct?
37. What are common MongoDB schema patterns?
38. What are MongoDB schema anti-patterns?
39. Is MongoDB ACID compliant?
40. What is a transaction and when should you use one?
41. What are the limitations of transactions?
42. What is a replica set?
43. What is the oplog?
44. What happens when the primary fails?
45. What is write concern?
46. What is read preference?
47. What is sharding?
48. What is a shard key and what makes a good one?
49. Why is a monotonically increasing shard key bad?
50. Difference between replication and sharding?
51. What are change streams?
52. What is GridFS?
53. What is Mongoose?
54. Difference between a Schema and a Model in Mongoose?
55. What is `.lean()` in Mongoose?
56. Why do Mongoose updates not run validators?
57. What is Mongoose middleware?
58. What is `populate()`?
59. What is a virtual in Mongoose?
60. How do you paginate efficiently?
61. How do you handle a duplicate key error?
62. How do you find and fix slow queries?
63. Why should money not be stored as a Double?
64. What is a capped collection?
65. How do you secure a MongoDB deployment?

---

**All questions across all topics:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
