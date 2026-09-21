# Streams and Buffers in Node.js

---

# PART 1 — Buffers

## 1. What is a Buffer?

**Definition:** A Buffer is a fixed-size chunk of memory that holds **raw binary data** outside the V8 heap. JavaScript strings cannot represent arbitrary binary data, so Node provides Buffers for files, network packets, images and encrypted data.

**In simple words:** A Buffer is a box of raw bytes. JavaScript normally works with text; a Buffer lets you work with the actual 0s and 1s.

```js
// Creating buffers
const buf1 = Buffer.from("Hello");                 // from a string
const buf2 = Buffer.from([72, 101, 108, 108, 111]); // from bytes
const buf3 = Buffer.alloc(10);                      // 10 zero-filled bytes (safe)
const buf4 = Buffer.allocUnsafe(10);                // faster, but contains old memory

console.log(buf1);                  // <Buffer 48 65 6c 6c 6f>   (hex)
console.log(buf1.toString());       // "Hello"
console.log(buf1.toString("hex"));  // "48656c6c6f"
console.log(buf1.toString("base64"));// "SGVsbG8="
console.log(buf1.length);           // 5 (bytes, NOT characters)
```

> ⚠️ **`Buffer.allocUnsafe()`** does not clear the memory it claims, so it may contain **old data from your application** — a potential security leak. Use `Buffer.alloc()` unless you immediately overwrite every byte.

**Length is in bytes, not characters:**

```js
Buffer.from("hello").length;   // 5
Buffer.from("héllo").length;   // 6  ← "é" takes 2 bytes in UTF-8
Buffer.from("नमस्ते").length;    // 18 ← multi-byte characters
```

---

# PART 2 — Streams

## 2. What is a Stream?

**Definition:** A stream is an abstraction for reading or writing data **piece by piece (in chunks)**, instead of loading everything into memory at once.

**In simple words:** Instead of carrying a whole swimming pool of water at once, you move it through a pipe, bucket by bucket.

### The problem streams solve

```js
// ❌ WITHOUT streams - a 2 GB file loads entirely into RAM
const fs = require("fs");
app.get("/video", (req, res) => {
  fs.readFile("big-video.mp4", (err, data) => {
    res.end(data);       // 2 GB in memory, PER REQUEST. 5 users = 10 GB. Crash.
  });
});

// ✅ WITH streams - a small constant amount of memory
app.get("/video", (req, res) => {
  fs.createReadStream("big-video.mp4").pipe(res);
  // Reads ~64 KB at a time and sends it immediately
});
```

**Benefits:**
- **Memory efficiency** — constant memory use regardless of file size
- **Time efficiency** — start processing the first chunk without waiting for the whole file
- **Composability** — chain operations together with `pipe()`

---

## 3. The four types of stream

| Type | Definition | Examples |
|---|---|---|
| **Readable** | A source you read data **from** | `fs.createReadStream()`, `req` (HTTP request) |
| **Writable** | A destination you write data **to** | `fs.createWriteStream()`, `res` (HTTP response) |
| **Duplex** | Both readable and writable, independently | TCP sockets, `net.Socket` |
| **Transform** | A Duplex that **modifies** the data passing through | `zlib.createGzip()`, `crypto.createCipheriv()` |

---

## 4. Readable streams

**Definition:** A stream that emits chunks of data. It has two modes: **flowing** (data is pushed automatically via the `data` event or `pipe`) and **paused** (you pull data manually with `read()`).

```js
const fs = require("fs");

const readStream = fs.createReadStream("large.txt", {
  encoding: "utf8",
  highWaterMark: 64 * 1024,   // chunk size - 64 KB is the default
});

readStream.on("data", (chunk) => {
  console.log("Received chunk of", chunk.length, "bytes");
});

readStream.on("end", () => console.log("Finished reading"));
readStream.on("error", (err) => console.error("Error:", err));
```

**Definition of `highWaterMark`:** The maximum amount of data buffered internally before the stream stops reading more. It controls the chunk size.

**Modern approach with `for await...of`:**

```js
async function readFile() {
  const stream = fs.createReadStream("large.txt", { encoding: "utf8" });

  for await (const chunk of stream) {     // cleaner, with try/catch support
    console.log("Chunk:", chunk.length);
  }
  console.log("Done");
}
```

---

## 5. Writable streams

**Definition:** A stream you write chunks into. `write()` returns `false` when the internal buffer is full — which is the signal to stop writing until the `drain` event fires.

```js
const writeStream = fs.createWriteStream("output.txt");

writeStream.write("Line 1\n");
writeStream.write("Line 2\n");
writeStream.end("Final line\n");        // end() writes and closes

writeStream.on("finish", () => console.log("All data flushed"));
writeStream.on("error", (err) => console.error(err));
```

---

## 6. `pipe()` — connecting streams

**Definition:** `pipe()` connects a readable stream to a writable stream, automatically handling the flow of data **and backpressure**.

```js
// Copy a file - constant memory, whatever the size
fs.createReadStream("input.txt").pipe(fs.createWriteStream("output.txt"));

// Chain multiple streams
const zlib = require("zlib");

fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())                    // Transform: compress
  .pipe(fs.createWriteStream("input.txt.gz")); // Writable: save
```

---

## 7. What is Backpressure?

**Definition:** Backpressure is what happens when the **readable** side produces data faster than the **writable** side can consume it. Without handling it, data piles up in memory until the process runs out of RAM.

**In simple words:** You are pouring water into a funnel faster than it drains. Backpressure handling means pausing the pour until the funnel catches up.

```js
// ❌ NO backpressure handling - memory grows without limit
readStream.on("data", (chunk) => {
  writeStream.write(chunk);     // ignores write() returning false!
});

// ✅ Manual backpressure handling
readStream.on("data", (chunk) => {
  const canContinue = writeStream.write(chunk);
  if (!canContinue) {
    readStream.pause();                              // stop reading
    writeStream.once("drain", () => readStream.resume()); // resume when ready
  }
});

// ✅ BEST - pipe() does all of this for you automatically
readStream.pipe(writeStream);
```

**This is the number one reason to use `pipe()` instead of manual `data` handlers.**

---

## 8. `pipeline()` — the production-safe way

**Definition:** `pipeline()` does what `pipe()` does, but also **propagates errors properly and cleans up all streams** if any of them fails. `pipe()` does not destroy the source stream on error, which leaks file descriptors.

```js
const { pipeline } = require("stream/promises");

async function compressFile() {
  try {
    await pipeline(
      fs.createReadStream("input.txt"),
      zlib.createGzip(),
      fs.createWriteStream("output.txt.gz")
    );
    console.log("Pipeline succeeded");
  } catch (err) {
    console.error("Pipeline failed:", err);   // all streams cleaned up
  }
}
```

**Always prefer `pipeline()` over `pipe()` in production code.**

---

## 9. Transform streams

**Definition:** A Transform stream reads input, changes it, and outputs the modified data. It is the basis of compression, encryption and parsing.

```js
const { Transform } = require("stream");

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());  // push the modified chunk
    callback();                                  // signal "done with this chunk"
  },
});

fs.createReadStream("input.txt")
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream("output.txt"));
```

**A real example — CSV line counter:**

```js
const lineCounter = new Transform({
  transform(chunk, enc, cb) {
    this.count = (this.count ?? 0) + chunk.toString().split("\n").length - 1;
    cb(null, chunk);          // pass the chunk through unchanged
  },
  flush(cb) {
    console.log("Total lines:", this.count);
    cb();
  },
});
```

---

## 10. Real-world stream use cases

```js
// 1. Streaming a file download
app.get("/download/:file", (req, res) => {
  const stream = fs.createReadStream(`./files/${req.params.file}`);
  res.setHeader("Content-Type", "application/octet-stream");
  stream.pipe(res);
  stream.on("error", () => res.status(404).end());
});

// 2. Video streaming with range requests (seeking)
app.get("/video", (req, res) => {
  const { size } = fs.statSync("video.mp4");
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = Number(startStr);
    const end = endStr ? Number(endStr) : size - 1;

    res.writeHead(206, {                           // 206 = Partial Content
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream("video.mp4", { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": size, "Content-Type": "video/mp4" });
    fs.createReadStream("video.mp4").pipe(res);
  }
});

// 3. Processing a huge CSV without loading it into memory
const readline = require("readline");

const rl = readline.createInterface({
  input: fs.createReadStream("10gb-data.csv"),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  processRow(line);          // one line at a time, constant memory
}

// 4. Piping between HTTP requests (proxying)
const https = require("https");
app.get("/proxy", (req, res) => {
  https.get("https://api.example.com/data", (apiRes) => apiRes.pipe(res));
});
```

---

## 11. Common stream mistakes

```js
// 1. Not handling errors → an unhandled "error" event CRASHES the process
stream.pipe(res);                        // ❌
pipeline(stream, res, (err) => {});      // ✅

// 2. Using readFile for large files → memory explosion
fs.readFile("2gb.mp4", cb);              // ❌
fs.createReadStream("2gb.mp4").pipe(res);// ✅

// 3. Ignoring the return value of write() → no backpressure
writeStream.write(chunk);                // ❌ if done in a tight loop
readStream.pipe(writeStream);            // ✅

// 4. Mixing "data" events and pipe() on the same stream
stream.on("data", handler);
stream.pipe(dest);                       // ❌ both consume the stream

// 5. Forgetting that chunks split mid-line / mid-character
// A chunk boundary can cut a UTF-8 character or a CSV row in half.
// Use readline, a proper parser, or StringDecoder.
```

---

## Key points

- A **Buffer** holds raw binary bytes; `.length` is bytes, not characters.
- Use `Buffer.alloc()`, not `Buffer.allocUnsafe()`, unless you overwrite everything.
- A **Stream** processes data in chunks, keeping memory constant regardless of size.
- Four types: **Readable, Writable, Duplex, Transform**.
- **Backpressure** is the reader outrunning the writer — `pipe()` handles it automatically.
- Use **`pipeline()`** in production: it propagates errors and cleans up all streams.
- Always attach an `error` handler — an unhandled stream error crashes the process.
