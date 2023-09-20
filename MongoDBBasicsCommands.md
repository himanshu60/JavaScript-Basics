Here are some MongoDB commands with questions and answers:

**Question 1:**

**Command:** Find all documents in the "users" collection.

**Answer:** You can use the `find` command to retrieve all documents in the "users" collection:

```javascript
db.users.find({});
```

**Question 2:**

**Command:** Insert a new document into the "products" collection.

**Answer:** You can use the `insertOne` command to insert a new document into the "products" collection:

```javascript
db.products.insertOne({
  name: "Laptop",
  price: 1000
});
```

**Question 3:**

**Command:** Update the price of a product with the name "Smartphone" in the "products" collection.

**Answer:** You can use the `updateOne` command to update the price of a product with the name "Smartphone":

```javascript
db.products.updateOne(
  { name: "Smartphone" },
  { $set: { price: 550 } }
);
```

**Question 4:**

**Command:** Delete a document with a specific ID from the "orders" collection.

**Answer:** You can use the `deleteOne` command to delete a document with a specific ID from the "orders" collection:

```javascript
db.orders.deleteOne({ _id: ObjectId("your_id_here") });
```

**Question 5:**

**Command:** Create an index on the "email" field of the "users" collection for faster queries.

**Answer:** You can use the `createIndex` command to create an index on the "email" field:

```javascript
db.users.createIndex({ email: 1 });
```

**Question 6:**

**Command:** Aggregate data to find the total sales for each product in the "sales" collection.

**Answer:** You can use the `aggregate` command with the `$group` stage to find the total sales for each product:

```javascript
db.sales.aggregate([
  {
    $group: {
      _id: "$product",
      totalSales: { $sum: "$quantity" }
    }
  }
]);
```

**Question 7:**

**Command:** Show the list of all collections in the current database.

**Answer:** You can use the `show collections` command to list all collections in the current database:

```javascript
show collections
```

These MongoDB commands cover common operations like finding, inserting, updating, deleting documents, creating indexes, and aggregating data. You can adapt and use them according to your specific MongoDB database and requirements.