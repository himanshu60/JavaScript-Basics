# Top 50 DSA — Part 3: HashMap, Searching & Sorting (Q23–Q32)

📄 [Back to the index](README.md) · [← Part 2: Strings](Top50-02-Strings.md)

---

## Q23. Majority Element

**Problem:** Find the element appearing more than `n/2` times. It is guaranteed to exist.

**Example:** `[2, 2, 1, 1, 1, 2, 2]` → `2`

### Approach 1 — Frequency Map

```js
function majorityElementMap(nums) {
  const count = new Map();

  for (const num of nums) {
    count.set(num, (count.get(num) ?? 0) + 1);
    if (count.get(num) > nums.length / 2) return num;    // early exit
  }
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Boyer–Moore Voting (optimal) ✅

**Idea:** Imagine every occurrence of the majority element cancelling out one occurrence of anything else. Because the majority appears more than half the time, it **must** survive the cancellation.

```js
function majorityElement(nums) {
  let candidate = null;
  let count = 0;

  for (const num of nums) {
    if (count === 0) candidate = num;            // no candidate → adopt this one
    count += (num === candidate) ? 1 : -1;       // vote for or against
  }

  return candidate;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `[2,2,1,1,1,2,2]`:

| num | candidate | count |
|---|---|---|
| 2 | 2 | 1 |
| 2 | 2 | 2 |
| 1 | 2 | 1 |
| 1 | 2 | 0 |
| 1 | **1** | 1 (count hit 0, new candidate) |
| 2 | 1 | 0 |
| 2 | **2** | 1 → answer ✅ |

**Key insight:** This only works because a majority is guaranteed. If it is not, add a second pass to verify the candidate.

---

## Q24. Intersection of Two Arrays

**Problem:** Return the elements that appear in both arrays (unique values).

**Example:** `[1,2,2,1]`, `[2,2]` → `[2]`

### Approach 1 — Nested Loops

```js
function intersectionBrute(a, b) {
  return [...new Set(a.filter((x) => b.includes(x)))];
}
```
**Time:** O(n·m) — `includes` scans every time · **Space:** O(n)

### Approach 2 — Set (optimal) ✅

**Idea:** Put the smaller array into a `Set` for O(1) lookups, then filter the other one.

```js
function intersection(a, b) {
  const setA = new Set(a);
  const result = new Set();

  for (const num of b) {
    if (setA.has(num)) result.add(num);      // O(1) lookup instead of O(n)
  }

  return [...result];
}
```
**Time:** O(n + m) ✅ · **Space:** O(n)

**Variation — keep duplicates (intersection with counts):**

```js
function intersect(a, b) {
  const count = new Map();
  for (const num of a) count.set(num, (count.get(num) ?? 0) + 1);

  const result = [];
  for (const num of b) {
    if (count.get(num) > 0) {
      result.push(num);
      count.set(num, count.get(num) - 1);   // consume one occurrence
    }
  }
  return result;
}
```

### Approach 3 — Two Pointers (if both arrays are SORTED) ✅

**The follow-up:** *"What if both arrays are already sorted and you cannot use extra space?"*

**Idea:** Walk both arrays at once. Whichever value is smaller, advance that pointer — it can never match anything further along the other array. When they are equal, you have found a match.

```js
function intersectionSorted(a, b) {
  const result = [];
  let i = 0, j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      // Avoid pushing duplicates
      if (result[result.length - 1] !== a[i]) result.push(a[i]);
      i++;
      j++;
    } else if (a[i] < b[j]) {
      i++;                  // a[i] is too small - it cannot match anything ahead in b
    } else {
      j++;                  // b[j] is too small
    }
  }

  return result;
}
```
**Time:** O(n + m) · **Space:** O(1) ✅ excluding the output — beats the Set on space

**How it works** on `[1,2,2,4]` and `[2,3,4]`:
- `1 < 2` → `i++` · `2 === 2` → push 2, both advance · `2 < 3` → `i++` · `4 > 3` → `j++` · `4 === 4` → push 4
- Result: `[2, 4]` ✅

**Key insight:** The same merge-style two-pointer walk solves union, intersection and difference of sorted arrays — and it is exactly the merge step of merge sort.

**Key insight (overall):** `Array.includes()` is O(n) but `Set.has()` is O(1). Converting to a Set is the single most common optimisation in interviews — but if the input is **already sorted**, two pointers beats it on space.

---

## Q25. Subarray Sum Equals K

**Problem:** Count how many contiguous subarrays sum to exactly `k`.

**Example:** `[1, 1, 1]`, k = 2 → `2` (the subarrays `[1,1]` at indices 0-1 and 1-2)

### Approach 1 — Brute Force

```js
function subarraySumBrute(nums, k) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      if (sum === k) count++;
    }
  }
  return count;
}
```
**Time:** O(n²) · **Space:** O(1)

### Approach 2 — Prefix Sum + Hash Map (optimal) ✅

**Definition of a Prefix Sum:** The running total from the start of the array to index `i`.

**Idea:** The sum of a subarray from `i` to `j` equals `prefix[j] − prefix[i−1]`. So if the current prefix sum is `S` and we want a subarray summing to `k`, we need an earlier prefix equal to `S − k`. Store every prefix sum seen so far in a Map and look it up in O(1).

```js
function subarraySum(nums, k) {
  const prefixCount = new Map();
  prefixCount.set(0, 1);         // crucial: an empty prefix has sum 0

  let sum = 0;
  let count = 0;

  for (const num of nums) {
    sum += num;                            // running prefix sum

    // How many earlier prefixes make (sum - thatPrefix) === k?
    if (prefixCount.has(sum - k)) {
      count += prefixCount.get(sum - k);
    }

    prefixCount.set(sum, (prefixCount.get(sum) ?? 0) + 1);
  }

  return count;
}
```
**Time:** O(n) ✅ · **Space:** O(n)

**How it works** on `[1,1,1]`, k=2:

| num | sum | need (sum−k) | found? | count | map |
|---|---|---|---|---|---|
| — | 0 | — | — | 0 | `{0:1}` |
| 1 | 1 | -1 | no | 0 | `{0:1, 1:1}` |
| 1 | 2 | 0 | **yes (1×)** | 1 | `{0:1, 1:1, 2:1}` |
| 1 | 3 | 1 | **yes (1×)** | **2** | ... |

**Key insight:** `prefixCount.set(0, 1)` handles subarrays that start at index 0. Forgetting it is the most common bug in this problem.

> ⚠️ A sliding window does **not** work here if the array can contain negative numbers — the sum is not monotonic. Prefix sums do work.

---

## Q26. Binary Search

**Problem:** Find the index of a target in a **sorted** array, or return -1.

**Example:** `[-1, 0, 3, 5, 9, 12]`, target 9 → `4`

### Approach — Binary Search ✅

**Idea:** Look at the middle element. Because the array is sorted, you can discard **half** the search space with every comparison.

```js
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {                       // <= because left can equal right
    const mid = Math.floor(left + (right - left) / 2);  // avoids overflow

    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;     // target is in the right half
    else right = mid - 1;                        // target is in the left half
  }

  return -1;
}
```
**Time:** O(log n) ✅ · **Space:** O(1)

**How it works** on `[-1,0,3,5,9,12]`, target 9:
- `L=0, R=5, mid=2 (3)` → 3 < 9 → search right → `L=3`
- `L=3, R=5, mid=4 (9)` → **found at index 4** ✅

**Three details interviewers check:**
1. `left <= right`, not `<` — otherwise a single remaining element is never checked.
2. `left + (right - left) / 2` instead of `(left + right) / 2` — prevents integer overflow in other languages.
3. `mid + 1` / `mid - 1`, not `mid` — using `mid` creates an infinite loop.

**Recursive version:**
```js
function binarySearchRec(nums, target, left = 0, right = nums.length - 1) {
  if (left > right) return -1;                      // base case
  const mid = Math.floor((left + right) / 2);

  if (nums[mid] === target) return mid;
  return nums[mid] < target
    ? binarySearchRec(nums, target, mid + 1, right)
    : binarySearchRec(nums, target, left, mid - 1);
}
```
**Space:** O(log n) due to the call stack — the iterative version is better.

---

## Q27. Find First and Last Position of an Element

**Problem:** In a sorted array with duplicates, find the first and last index of a target.

**Example:** `[5,7,7,8,8,10]`, target 8 → `[3, 4]`

### Approach — Two Binary Searches ✅

**Idea:** Run a modified binary search twice. When you find the target, do not stop — keep searching **left** for the first occurrence, and **right** for the last.

```js
function searchRange(nums, target) {
  return [findBound(nums, target, true), findBound(nums, target, false)];
}

function findBound(nums, target, isFirst) {
  let left = 0, right = nums.length - 1, result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      result = mid;                       // record it, but keep going
      if (isFirst) right = mid - 1;       // look further LEFT
      else left = mid + 1;                // look further RIGHT
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
}
```
**Time:** O(log n) ✅ · **Space:** O(1)

**Key insight:** Do not scan linearly after finding the target — that makes it O(n) when there are many duplicates. Continuing the binary search keeps it logarithmic.

---

## Q28. Search in a Rotated Sorted Array

**Problem:** A sorted array was rotated at an unknown point. Find a target in O(log n).

**Example:** `[4,5,6,7,0,1,2]`, target 0 → `4`

### Approach — Modified Binary Search ✅

**Idea:** After a rotation, at least **one half is always properly sorted**. Work out which half is sorted, check whether the target lies inside it, and discard the other half.

```js
function search(nums, target) {
  let left = 0, right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    if (nums[left] <= nums[mid]) {
      // LEFT half is sorted
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;        // target is inside the sorted left half
      } else {
        left = mid + 1;
      }
    } else {
      // RIGHT half is sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;         // target is inside the sorted right half
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
```
**Time:** O(log n) ✅ · **Space:** O(1)

**How it works** on `[4,5,6,7,0,1,2]`, target 0:
- `L=0,R=6,mid=3 (7)` → left half `[4,5,6,7]` is sorted, but 0 is not in `[4,7)` → go right → `L=4`
- `L=4,R=6,mid=5 (1)` → left half `[0,1]` is sorted, and 0 is in `[0,1)` → go left → `R=4`
- `L=4,R=4,mid=4 (0)` → **found at index 4** ✅

**Key insight:** Comparing `nums[left] <= nums[mid]` is how you detect which side is sorted. That single check is the whole trick.

---

## Q29. Find Peak Element

**Problem:** A peak is an element strictly greater than its neighbours. Return the index of **any** peak. Assume `nums[-1] = nums[n] = -∞`.

**Example:** `[1, 2, 3, 1]` → `2` (the value 3)

### Approach — Binary Search on the slope ✅

**Idea:** Compare the middle element with its right neighbour. If you are on an **ascending** slope, a peak must exist to the right. If descending, a peak must exist to the left (or be `mid` itself).

```js
function findPeakElement(nums) {
  let left = 0, right = nums.length - 1;

  while (left < right) {                   // note: < not <=
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] < nums[mid + 1]) {
      left = mid + 1;        // ascending → a peak lies to the right
    } else {
      right = mid;           // descending or equal → mid could BE the peak
    }
  }

  return left;               // left === right → the peak
}
```
**Time:** O(log n) ✅ · **Space:** O(1)

**Key insight:** Binary search does not require a fully sorted array — it only needs a rule that lets you safely discard half the search space.

---

## Q30. Sort Colors (Dutch National Flag)

**Problem:** Sort an array of 0s, 1s and 2s in **one pass** with O(1) space.

**Example:** `[2,0,2,1,1,0]` → `[0,0,1,1,2,2]`

### Approach 1 — Counting Sort (two passes)

```js
function sortColorsCount(nums) {
  const count = [0, 0, 0];
  for (const num of nums) count[num]++;

  let i = 0;
  for (let color = 0; color < 3; color++) {
    for (let j = 0; j < count[color]; j++) nums[i++] = color;
  }
  return nums;
}
```
**Time:** O(n) but **two passes** · **Space:** O(1)

### Approach 2 — Dutch National Flag (optimal, one pass) ✅

**Idea:** Use three pointers. `low` marks the boundary of the 0s, `high` marks the boundary of the 2s, and `mid` scans. Everything before `low` is 0, everything after `high` is 2.

```js
function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;                 // the swapped-in value is already processed
    } else if (nums[mid] === 1) {
      mid++;                 // 1s belong in the middle - leave it
    } else {                 // nums[mid] === 2
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // do NOT advance mid - the swapped-in value is unexamined
    }
  }
  return nums;
}
```
**Time:** O(n), **one pass** ✅ · **Space:** O(1)

**Key insight:** The asymmetry is the exam question. When you swap with `low` you advance `mid`, but when you swap with `high` you do **not** — because the value pulled from the right has not been examined yet.

---

## Q31. Merge Intervals

**Problem:** Merge all overlapping intervals.

**Example:** `[[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`

### Approach — Sort then Merge ✅

**Idea:** Sort by start time. Then walk through: if the current interval starts before the previous one ends, they overlap — extend the previous end. Otherwise start a new interval.

```js
function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;

  // Step 1: sort by start time - this is what makes one pass possible
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      // They overlap - extend the end to whichever is further
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);        // no overlap - start a new interval
    }
  }

  return merged;
}
```
**Time:** O(n log n) — the sort dominates · **Space:** O(n)

**How it works** on `[[1,3],[2,6],[8,10],[15,18]]`:
- `[1,3]` starts the result
- `[2,6]`: 2 ≤ 3 → overlap → extend to `[1,6]`
- `[8,10]`: 8 > 6 → no overlap → push
- `[15,18]`: 15 > 10 → push → `[[1,6],[8,10],[15,18]]` ✅

**Key insight:** `Math.max` on the end is essential for a **fully contained** interval like `[[1,10],[2,3]]` — without it you would shrink the range to `[1,3]`.

---

## Q32. Kth Largest Element

**Problem:** Find the kth largest element in an unsorted array.

**Example:** `[3,2,1,5,6,4]`, k = 2 → `5`

### Approach 1 — Sorting

```js
function findKthLargestSort(nums, k) {
  return nums.sort((a, b) => b - a)[k - 1];
}
```
**Time:** O(n log n) · **Space:** O(1) — simple and perfectly acceptable for most cases

### Approach 2 — Min Heap (optimal for large n, small k) ✅

**Definition of a Min Heap:** A tree structure whose smallest element is always at the root, with O(log n) insert and remove.

**Idea:** Keep a heap of only the **k largest** elements seen so far. If the heap grows past k, remove the smallest. At the end, the root is the kth largest.

```js
class MinHeap {
  constructor() { this.heap = []; }
  size() { return this.heap.length; }
  peek() { return this.heap[0]; }

  push(val) {
    this.heap.push(val);
    let i = this.heap.length - 1;
    while (i > 0) {                                  // bubble up
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = last;
      let i = 0;
      while (true) {                                 // bubble down
        const l = 2 * i + 1, r = 2 * i + 2;
        let smallest = i;
        if (l < this.heap.length && this.heap[l] < this.heap[smallest]) smallest = l;
        if (r < this.heap.length && this.heap[r] < this.heap[smallest]) smallest = r;
        if (smallest === i) break;
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
        i = smallest;
      }
    }
    return top;
  }
}

function findKthLargest(nums, k) {
  const heap = new MinHeap();

  for (const num of nums) {
    heap.push(num);
    if (heap.size() > k) heap.pop();     // drop the smallest, keep the top k
  }

  return heap.peek();                    // the root is the kth largest
}
```
**Time:** O(n log k) ✅ · **Space:** O(k)

**Why this wins for streaming data:** you never hold more than `k` elements, so it works even on a stream of a billion numbers where sorting is impossible.

**Key insight:** To find the **k largest**, use a **min** heap (so you can cheaply evict the smallest). To find the **k smallest**, use a **max** heap. This inversion trips people up constantly.

---

## Patterns summary

| Pattern | When to use it | Questions |
|---|---|---|
| **Boyer–Moore voting** | Majority element, O(1) space | Q23 |
| **Set for O(1) lookup** | Membership tests, intersections | Q24 |
| **Prefix sum + Map** | Subarray sums (works with negatives) | Q25 |
| **Binary search** | Any sorted array, or a "discard half" rule | Q26–Q29 |
| **Three pointers** | Partitioning into 3 groups | Q30 |
| **Sort then scan** | Intervals, scheduling | Q31 |
| **Heap** | Top-k, streaming data | Q32 |

**Sorting algorithm complexities for reference:**

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | **O(n²)** | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ |

---

**Next:** [Part 4 — Recursion & DP (Q33–Q40)](Top50-04-Recursion-DP.md) · [Index](README.md)
