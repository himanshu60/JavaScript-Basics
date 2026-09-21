# Mongoose - Schemas, Models, Middleware and Populate

## 1. What is Mongoose?

**Definition:** Mongoose is an **ODM (Object Data Modeling)** library for MongoDB and Node.js. It adds a schema layer on top of MongoDB's flexible documents, providing validation, type casting, middleware hooks, query helpers and relationship population.

**In simple words:** MongoDB lets you store anything. Mongoose adds rules so your data stays consistent, and gives you a much nicer API.

```bash
npm install mongoose
```

---

## 2. Connecting

```js
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);

// With options and error handling
try {
  await mongoose.connect(uri, {
    maxPoolSize: 10,                    // maximum simultaneous connections
    serverSelectionTimeoutMS: 5000,
  });
  console.log("MongoDB connected");
} catch (err) {
  console.error("Connection failed:", err);
  process.exit(1);
}

mongoose.connection.on("error", (err) => console.error(err));
mongoose.connection.on("disconnected", () => console.log("Disconnected"));
```

**Caching the connection in Next.js / serverless:**

```js
// Serverless functions re-run often - without caching you open a new
// connection every request and exhaust the database's connection limit
let cached = global.mongoose ?? { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 3. What is a Schema?

**Definition:** A Schema defines the **structure** of documents in a collection — which fields exist, their types, default values, and validation rules.

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],     // custom error message
      trim: true,                                // removes whitespace
      minlength: [2, "Name too short"],
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,                              // creates a unique INDEX
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    age: { type: Number, min: 0, max: 120 },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],      // only these values allowed
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    tags: [String],                              // array of strings
    address: {                                   // nested object
      street: String,
      city: String,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,      // a reference
      ref: "User",                               // to the User model
    },
  },
  {
    timestamps: true,        // automatically adds createdAt and updatedAt
  }
);
```

**Schema types:** `String`, `Number`, `Date`, `Boolean`, `ObjectId`, `Array`, `Mixed`, `Buffer`, `Decimal128`, `Map`.

**Common validators:**

| Validator | Applies to | Definition |
|---|---|---|
| `required` | All | The field must be present |
| `default` | All | The value used when none is given |
| `unique` | All | Creates a unique index (not a real validator) |
| `min` / `max` | Number, Date | Numeric or date range |
| `minlength` / `maxlength` | String | Length limits |
| `match` | String | Must match a regex |
| `enum` | String, Number | Must be one of the listed values |
| `validate` | All | A custom validation function |

```js
// Custom validator
password: {
  type: String,
  validate: {
    validator: (v) => /[A-Z]/.test(v) && /[0-9]/.test(v),
    message: "Password must contain an uppercase letter and a number",
  },
}
```

> ⚠️ **`unique` is not a validator** — it creates a MongoDB unique index. Its error comes from the database as error code `11000`, not as a Mongoose validation error, so handle it separately.

---

## 4. What is a Model?

**Definition:** A Model is a constructor compiled from a Schema. It represents a collection and provides all the query methods.

```js
const User = mongoose.model("User", userSchema);
// Mongoose pluralises and lowercases the name → the "users" collection
```

**Avoiding the "model already compiled" error in Next.js:**

```js
const User = mongoose.models.User || mongoose.model("User", userSchema);
```

---

## 5. CRUD with Mongoose

```js
// CREATE
const user = await User.create({ name: "Himanshu", email: "h@example.com" });
await User.insertMany([{...}, {...}]);

// READ
const users = await User.find({ isActive: true });
const user = await User.findById(id);
const one = await User.findOne({ email: "h@example.com" });

// Chained query builders
const result = await User.find({ age: { $gte: 18 } })
  .select("name email -_id")     // projection ("-" excludes)
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(20)
  .lean();                       // returns plain objects - much faster

// UPDATE
await User.findByIdAndUpdate(id, { name: "New" }, {
  new: true,              // return the UPDATED document (default is the old one)
  runValidators: true,    // run schema validators on update (off by default!)
});
await User.updateMany({ role: "user" }, { $set: { verified: true } });

// DELETE
await User.findByIdAndDelete(id);
await User.deleteMany({ isActive: false });
```

**Definition of `.lean()`:** Returns plain JavaScript objects instead of full Mongoose documents. It skips hydration, making queries **2–5× faster** — but the result has no `.save()`, virtuals or getters. **Use it for read-only queries.**

> ⚠️ **Two important defaults:** update methods do **not** run validators unless you pass `runValidators: true`, and they return the **old** document unless you pass `new: true`.

---

## 6. Middleware (hooks)

**Definition:** Middleware are functions that run **before** (`pre`) or **after** (`post`) certain operations — saving, validating, querying or deleting. They are the standard place for hashing passwords and cascading deletes.

### Document middleware

```js
import bcrypt from "bcryptjs";

// Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();   // only if it changed
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// After saving
userSchema.post("save", function (doc, next) {
  console.log("User saved:", doc._id);
  next();
});
```

**`this` inside document middleware refers to the document being saved.**

### Query middleware

```js
// Automatically exclude soft-deleted documents from every find
userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Always populate a field
postSchema.pre(/^find/, function (next) {
  this.populate("author", "name email");
  next();
});
```

**`this` inside query middleware refers to the query object, not a document.**

### Cascading delete

```js
userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    await mongoose.model("Post").deleteMany({ author: user._id });
  }
  next();
});
```

> ⚠️ `save` hooks do **not** run on `updateOne`, `findOneAndUpdate` or `insertMany`. This is a very common source of bugs — a password updated via `findByIdAndUpdate` will **not** be hashed.

---

## 7. Virtuals

**Definition:** A virtual is a computed property that is **not stored** in the database. It is calculated when the document is read.

```js
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("fullName").set(function (value) {
  const [first, last] = value.split(" ");
  this.firstName = first;
  this.lastName = last;
});

// Virtuals are hidden from JSON by default - enable them
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
```

**Virtual populate** — reference children without storing their IDs:

```js
userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
});

const user = await User.findById(id).populate("posts");
```

---

## 8. Instance and static methods

**Definition of an instance method:** A function available on every **document**.
**Definition of a static method:** A function available on the **Model** itself.

```js
// Instance method - works on one document
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const user = await User.findOne({ email });
const isValid = await user.comparePassword(inputPassword);

// Static method - works on the model
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const user = await User.findByEmail("H@Example.com");

// Query helper - chainable
userSchema.query.active = function () {
  return this.where({ isActive: true });
};

const users = await User.find().active().limit(10);
```

> Always use a regular `function`, never an arrow function — arrow functions have no own `this`.

---

## 9. Populate — the Mongoose join

**Definition:** `populate()` replaces a stored `ObjectId` reference with the actual document from the referenced collection. Internally it runs a second query.

```js
const postSchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

// Basic
const post = await Post.findById(id).populate("author");
// post.author is now the full user document instead of just an ObjectId

// Select only specific fields (important for performance)
await Post.findById(id).populate("author", "name email");

// Multiple fields
await Post.findById(id).populate("author").populate("comments");

// With options
await Post.findById(id).populate({
  path: "comments",
  select: "text createdAt",
  options: { sort: { createdAt: -1 }, limit: 10 },
  match: { isApproved: true },
});

// Nested populate
await Post.findById(id).populate({
  path: "comments",
  populate: { path: "author", select: "name" },
});
```

**Populate performance warning:**

```js
// ❌ N+1 problem - one query for posts, then one per post
const posts = await Post.find();
for (const post of posts) {
  await post.populate("author");
}

// ✅ One extra query for ALL authors
const posts = await Post.find().populate("author", "name");
```

> `populate` is **not** a real join — it is a second round trip. For read-heavy pages, consider embedding a few fields (the Extended Reference pattern) instead.

---

## 10. Transactions

**Definition:** A transaction groups several operations so they either **all succeed or all fail**. Requires a replica set (MongoDB Atlas provides one by default).

```js
const session = await mongoose.startSession();

try {
  session.startTransaction();

  const order = await Order.create([{ userId, items, total }], { session });
  await Product.updateOne(
    { _id: productId },
    { $inc: { stock: -quantity } },
    { session }
  );
  await User.updateOne({ _id: userId }, { $inc: { credits: -total } }, { session });

  await session.commitTransaction();     // all three succeed together
} catch (error) {
  await session.abortTransaction();      // all three are rolled back
  throw error;
} finally {
  session.endSession();
}
```

---

## 11. Error handling

```js
try {
  await User.create(data);
} catch (err) {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ errors });
  }
  if (err.code === 11000) {                              // duplicate key
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }
  if (err.name === "CastError") {                        // invalid ObjectId
    return res.status(400).json({ error: "Invalid ID format" });
  }
  throw err;
}
```

---

## 12. Performance tips

| Tip | Why |
|---|---|
| Use `.lean()` for read-only queries | 2–5× faster — skips document hydration |
| Use `.select()` to fetch only needed fields | Less data over the network |
| Add indexes with `schema.index({...})` | Avoids collection scans |
| Limit `populate` fields | Populating everything is expensive |
| Use `insertMany` / `bulkWrite` | One round trip instead of many |
| Cache the connection in serverless | Prevents connection exhaustion |
| Use `countDocuments()` not `find().length` | Counts in the database, not in Node |

```js
userSchema.index({ email: 1 });
userSchema.index({ city: 1, createdAt: -1 });   // compound
userSchema.index({ name: "text", bio: "text" }); // text search
```

---

## Key points

- Mongoose is an **ODM** adding schemas, validation and middleware on top of MongoDB.
- A **Schema** defines structure; a **Model** is the constructor used to query.
- Update methods need `new: true` and `runValidators: true` — neither is the default.
- `.lean()` makes read queries much faster by returning plain objects.
- **Middleware** (`pre`/`post`) is where password hashing and cascading deletes belong — but `save` hooks do not run on `findOneAndUpdate`.
- **Virtuals** are computed fields not stored in the database.
- `populate()` is a second query, not a real join — select only the fields you need.
- Handle error code **11000** separately; `unique` is an index, not a validator.
