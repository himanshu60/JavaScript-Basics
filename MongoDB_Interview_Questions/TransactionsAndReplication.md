# MongoDB Transactions, Replication and Sharding

---

# PART 1 — Transactions and ACID

## 1. What is ACID?

**Definition:** ACID is the set of four guarantees a database gives about transactions.

| Letter | Property | Definition |
|---|---|---|
| **A** | **Atomicity** | All operations in a transaction succeed, or none of them do |
| **C** | **Consistency** | The database moves from one valid state to another valid state |
| **I** | **Isolation** | Concurrent transactions do not see each other's partial work |
| **D** | **Durability** | Once committed, the data survives a crash or power loss |

---

## 2. Atomicity in MongoDB

**Definition:** A **single document** operation in MongoDB is **always atomic**, even when it updates many fields or nested arrays. This is a key reason embedding is preferred — it makes transactions unnecessary for related data.

```js
// This is fully atomic - no transaction needed
db.accounts.updateOne(
  { _id: accountId },
  {
    $inc: { balance: -100 },
    $push: { transactions: { type: "debit", amount: 100 } },
    $set: { lastUpdated: new Date() },
  }
);
// Either ALL three changes happen, or none do.
```

**Multi-document operations are NOT atomic by default:**

```js
// ❌ If the second update fails, the first has already happened - money disappears
db.accounts.updateOne({ _id: A }, { $inc: { balance: -100 } });
db.accounts.updateOne({ _id: B }, { $inc: { balance: 100 } });
```

This is exactly what transactions solve.

---

## 3. Multi-document transactions

**Definition:** A transaction groups operations across multiple documents and collections so they all commit together or all roll back. Supported since MongoDB 4.0, and requires a **replica set** (standalone servers cannot use them).

```js
const session = client.startSession();

try {
  session.startTransaction();

  await accounts.updateOne({ _id: A }, { $inc: { balance: -100 } }, { session });
  await accounts.updateOne({ _id: B }, { $inc: { balance: 100 } }, { session });
  await transfers.insertOne({ from: A, to: B, amount: 100 }, { session });

  await session.commitTransaction();     // all three become permanent together
} catch (error) {
  await session.abortTransaction();      // all three are undone
  throw error;
} finally {
  await session.endSession();
}
```

**Key rule:** every operation must be passed `{ session }`. Forgetting it silently excludes that operation from the transaction.

---

## 4. Transaction limitations and costs

| Limitation | Detail |
|---|---|
| Requires a replica set | Not available on a standalone server |
| Default time limit | 60 seconds |
| Performance cost | Noticeably slower than single-document writes |
| Size limit | The oplog entry must stay under 16 MB |
| Cannot create collections | (Allowed in newer versions, but avoid it) |
| Lock contention | Long transactions block other writers |

**Best practices:**
- Keep transactions **short** — do all reads and validation before starting.
- Do not make network calls (API requests) inside a transaction.
- Prefer **schema design** that avoids transactions — embed related data.
- Always implement **retry logic** for transient errors.

```js
// Retrying on a transient error
async function runWithRetry(txnFunc, session) {
  while (true) {
    try {
      return await txnFunc(session);
    } catch (error) {
      if (error.hasErrorLabel("TransientTransactionError")) continue;  // retry
      throw error;
    }
  }
}
```

---

# PART 2 — Replication

## 5. What is a Replica Set?

**Definition:** A replica set is a group of MongoDB servers that keep **the same copy of the data**. One server is the **Primary** (accepts writes) and the others are **Secondaries** (copies of the primary).

**In simple words:** Several identical copies of your database, so if one machine dies, the others take over instantly.

```
        ┌─────────────┐
        │   PRIMARY   │  ← all writes go here
        └──────┬──────┘
               │ replicates via the oplog
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│ SECONDARY 1 │ │ SECONDARY 2 │  ← can serve reads
└─────────────┘ └─────────────┘
```

**Why replication matters:**
- **High availability** — automatic failover if the primary dies
- **Data redundancy** — multiple copies protect against disk failure
- **Read scaling** — reads can be spread across secondaries
- **Backups** — take backups from a secondary without slowing the primary
- **Required for transactions and change streams**

---

## 6. The oplog

**Definition:** The **oplog** (operations log) is a special capped collection on the primary that records every write operation. Secondaries continuously read it and replay the same operations, keeping themselves in sync.

**Definition of a capped collection:** A fixed-size collection that automatically overwrites its oldest entries when full.

> If a secondary falls behind further than the oplog's history, it can no longer catch up and needs a full resync. This is why oplog size matters for busy systems.

---

## 7. Elections and failover

**Definition:** When the primary becomes unreachable, the remaining members hold an **election** and vote for a new primary. This usually completes within 10–12 seconds, and applications reconnect automatically.

**Rules:**
- A member needs a **majority** of votes to become primary.
- A replica set should have an **odd number** of voting members to avoid a tie.
- An **arbiter** is a member that votes but stores no data — used to break ties cheaply.

```
3-member set: can survive 1 failure (2 of 3 is still a majority)
5-member set: can survive 2 failures
```

---

## 8. Read Preference

**Definition:** Read preference tells the driver **which members** of the replica set a read may be sent to.

| Mode | Definition |
|---|---|
| `primary` | **Default.** All reads go to the primary — always the freshest data |
| `primaryPreferred` | The primary if available, otherwise a secondary |
| `secondary` | Only secondaries — may return slightly stale data |
| `secondaryPreferred` | A secondary if available, otherwise the primary |
| `nearest` | Whichever member has the lowest network latency |

```js
db.collection.find().readPref("secondaryPreferred");
```

**Definition of eventual consistency:** Secondaries lag slightly behind the primary (usually milliseconds). Reading from a secondary may return data that is a moment out of date. Never read from a secondary immediately after writing something you must see.

---

## 9. Write Concern

**Definition:** Write concern specifies **how many members must confirm a write** before the driver reports success. It is the trade-off dial between speed and durability.

| Setting | Definition |
|---|---|
| `w: 0` | Fire and forget — no acknowledgement at all (unsafe) |
| `w: 1` | **Default.** The primary confirms the write |
| `w: "majority"` | A majority of members confirm — safe against failover data loss |
| `j: true` | The write is flushed to the on-disk journal |
| `wtimeout: ms` | How long to wait before giving up |

```js
db.orders.insertOne(doc, {
  writeConcern: { w: "majority", j: true, wtimeout: 5000 },
});
```

**Why `w: "majority"` matters:** with `w: 1`, if the primary crashes immediately after acknowledging, the write may never have reached any secondary — and is lost when a new primary is elected. Use `majority` for anything financial or critical.

---

## 10. Read Concern

**Definition:** Read concern specifies **what level of consistency** a read requires.

| Level | Definition |
|---|---|
| `local` | Returns the node's most recent data (may be rolled back later) |
| `available` | Like local, with fewer guarantees on sharded clusters |
| `majority` | Only returns data acknowledged by a majority — never rolled back |
| `linearizable` | Strongest; reflects all writes completed before the read started |
| `snapshot` | A consistent snapshot, used inside transactions |

---

# PART 3 — Sharding

## 11. What is Sharding?

**Definition:** Sharding is splitting a single collection's data **across multiple servers (shards)**, so no one machine has to hold or serve all of it. This is **horizontal scaling**.

**In simple words:** Replication makes copies of the same data. Sharding splits **different** data onto different machines.

```
                    ┌──────────┐
   Application ───► │  mongos  │  (router)
                    └────┬─────┘
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌────────┐     ┌────────┐     ┌────────┐
     │ Shard1 │     │ Shard2 │     │ Shard3 │
     │ A–H    │     │ I–P    │     │ Q–Z    │
     └────────┘     └────────┘     └────────┘
```

**The components:**

| Component | Definition |
|---|---|
| **Shard** | A replica set holding a subset of the data |
| **mongos** | The query router the application connects to |
| **Config servers** | A replica set storing the cluster's metadata and chunk locations |

---

## 12. The Shard Key

**Definition:** The shard key is the field (or fields) MongoDB uses to decide **which shard** each document belongs to. Choosing it well is the single most important sharding decision.

**A good shard key has:**

| Property | Definition |
|---|---|
| **High cardinality** | Many distinct values, so data can be split finely |
| **Low frequency** | No single value dominates the data |
| **Non-monotonic** | Not always increasing, or all new writes hit one shard |
| **Query alignment** | Most queries include it, so they can target one shard |

**Bad shard keys:**

```js
{ country: 1 }      // ❌ low cardinality - a few huge chunks
{ createdAt: 1 }    // ❌ monotonic - every new write goes to the last shard ("hot shard")
{ _id: 1 }          // ❌ ObjectId is monotonic too
```

**Better shard keys:**

```js
{ userId: "hashed" }             // ✅ even distribution
{ region: 1, userId: 1 }         // ✅ compound - queries by region target one shard
{ customerId: 1, orderDate: 1 }  // ✅ high cardinality + query alignment
```

---

## 13. Sharding strategies

**Definition of Ranged Sharding:** Documents are split into contiguous ranges of the shard key. Range queries are efficient, but poorly chosen keys create hotspots.

**Definition of Hashed Sharding:** MongoDB hashes the shard key value to decide placement. Distribution is very even, but range queries must hit every shard.

```js
sh.shardCollection("mydb.users", { userId: 1 });          // ranged
sh.shardCollection("mydb.users", { userId: "hashed" });   // hashed
```

**Definition of a Chunk:** A contiguous range of shard key values (default 128 MB). The **balancer** automatically moves chunks between shards to keep them evenly loaded.

---

## 14. Targeted vs broadcast queries

**Definition of a targeted query:** A query that includes the shard key, so mongos sends it to **one** shard. Fast.
**Definition of a broadcast (scatter-gather) query:** A query without the shard key, so mongos sends it to **every** shard and merges the results. Slow.

```js
// ✅ Targeted - goes to one shard only
db.users.find({ userId: "u123" });

// ❌ Broadcast - hits every shard
db.users.find({ email: "a@b.com" });
```

This is why **query alignment** is part of choosing the shard key.

---

## 15. Replication vs Sharding

| Point | Replication | Sharding |
|---|---|---|
| **Purpose** | Availability and redundancy | Scale beyond one machine |
| **Data** | Every node has the **same** data | Each shard has **different** data |
| **Scales** | Reads | Reads **and** writes, and storage |
| **Complexity** | Moderate | High |
| **When to use** | **Always** in production | Only when one machine is genuinely not enough |

> **Important:** shard **late**. Sharding adds significant operational complexity. First try better indexes, better schema design, caching and a bigger machine. Production clusters normally use replication for every shard, so the two are combined, not alternatives.

---

## 16. Change Streams

**Definition:** Change streams let an application **subscribe to real-time changes** in a collection, database or cluster. They are built on the oplog, so they require a replica set.

```js
const changeStream = db.collection("orders").watch([
  { $match: { operationType: { $in: ["insert", "update"] } } },
]);

changeStream.on("change", (change) => {
  console.log(change.operationType);   // "insert", "update", "delete", "replace"
  console.log(change.fullDocument);
  // push a notification, update a cache, sync to Elasticsearch...
});
```

```js
// Get the full document on updates (only the changed fields are sent by default)
db.collection("orders").watch([], { fullDocument: "updateLookup" });

// Resume after a disconnection - no events are missed
db.collection("orders").watch([], { resumeAfter: lastToken });
```

**Used for:** real-time dashboards, notifications, cache invalidation, syncing to a search engine, and audit logs.

---

## Key points

- **Single-document operations are always atomic** — good schema design often removes the need for transactions.
- **Multi-document transactions** exist since 4.0 but require a replica set and are slower — keep them short.
- A **replica set** keeps identical copies for high availability; the **oplog** drives replication.
- **Write concern** `w: "majority"` protects against losing writes during failover.
- Reading from **secondaries** gives eventual consistency — slightly stale data.
- **Sharding** splits different data across machines for horizontal scaling.
- The **shard key** must have high cardinality, be non-monotonic, and match your queries.
- **Change streams** give real-time notifications of data changes.
