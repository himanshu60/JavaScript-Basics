In MongoDB, lookup queries often involve using the `$lookup` stage in the aggregation framework to combine data from multiple collections. Here are some lookup queries with questions, answers, and example collections:

**Question 1:**

**Collection: Customers**

```json
[
  {
    "_id": 1,
    "name": "Alice",
    "city": "New York"
  },
  {
    "_id": 2,
    "name": "Bob",
    "city": "Los Angeles"
  },
  {
    "_id": 3,
    "name": "Carol",
    "city": "Chicago"
  }
]
```

**Collection: Orders**

```json
[
  {
    "_id": 101,
    "customer_id": 1,
    "order_date": "2023-01-05"
  },
  {
    "_id": 102,
    "customer_id": 2,
    "order_date": "2023-01-07"
  },
  {
    "_id": 103,
    "customer_id": 3,
    "order_date": "2023-01-10"
  }
]
```

**Query:** Retrieve orders along with the customer details for each order, combining data from the "Orders" and "Customers" collections.

**Answer:** You can use the `$lookup` stage in a MongoDB aggregation query to achieve this:

```javascript
db.Orders.aggregate([
  {
    $lookup: {
      from: "Customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer_info"
    }
  }
]);
```

**Result:**

```json
[
  {
    "_id": 101,
    "customer_id": 1,
    "order_date": "2023-01-05",
    "customer_info": [
      {
        "_id": 1,
        "name": "Alice",
        "city": "New York"
      }
    ]
  },
  {
    "_id": 102,
    "customer_id": 2,
    "order_date": "2023-01-07",
    "customer_info": [
      {
        "_id": 2,
        "name": "Bob",
        "city": "Los Angeles"
      }
    ]
  },
  {
    "_id": 103,
    "customer_id": 3,
    "order_date": "2023-01-10",
    "customer_info": [
      {
        "_id": 3,
        "name": "Carol",
        "city": "Chicago"
      }
    ]
  }
]
```

This query uses `$lookup` to combine data from "Orders" with data from "Customers" based on the `customer_id` field.

**Question 2:**

**Collection: Products**

```json
[
  {
    "_id": 101,
    "product_name": "Laptop",
    "price": 800.00
  },
  {
    "_id": 102,
    "product_name": "Smartphone",
    "price": 400.00
  },
  {
    "_id": 103,
    "product_name": "Tablet",
    "price": 300.00
  }
]
```

**Collection: OrderItems**

```json
[
  {
    "_id": 1,
    "order_id": 101,
    "product_id": 101,
    "quantity": 2
  },
  {
    "_id": 2,
    "order_id": 101,
    "product_id": 103,
    "quantity": 1
  },
  {
    "_id": 3,
    "order_id": 102,
    "product_id": 102,
    "quantity": 3
  }
]
```

**Query:** Retrieve a list of order items with product details (product name and price) for each item, combining data from the "OrderItems" and "Products" collections.

**Answer:** You can use the `$lookup` stage in an aggregation query to combine data from "OrderItems" and "Products":

```javascript
db.OrderItems.aggregate([
  {
    $lookup: {
      from: "Products",
      localField: "product_id",
      foreignField: "_id",
      as: "product_info"
    }
  }
]);
```

**Result:**

```json
[
  {
    "_id": 1,
    "order_id": 101,
    "product_id": 101,
    "quantity": 2,
    "product_info": [
      {
        "_id": 101,
        "product_name": "Laptop",
        "price": 800.00
      }
    ]
  },
  {
    "_id": 2,
    "order_id": 101,
    "product_id": 103,
    "quantity": 1,
    "product_info": [
      {
        "_id": 103,
        "product_name": "Tablet",
        "price": 300.00
      }
    ]
  },
  {
    "_id": 3,
    "order_id": 102,
    "product_id": 102,
    "quantity": 3,
    "product_info": [
      {
        "_id": 102,
        "product_name": "Smartphone",
        "price": 400.00
      }
    ]
  }
]
```

This query uses `$lookup` to combine data from "OrderItems" with data from "Products" based on the `product_id` field.

These MongoDB lookup queries demonstrate how to retrieve and combine data from multiple collections using the `$lookup` aggregation stage.