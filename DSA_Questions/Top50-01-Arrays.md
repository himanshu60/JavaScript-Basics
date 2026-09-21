# Top 50 DSA — Part 1: Arrays (Q1–Q12)

Every question has the **problem**, an **example**, a **brute force** approach, an **optimal** approach, complexity, and an explanation of *why* the optimal approach works.

📄 [Back to the index](README.md)

---

## Q1. Two Sum

**Problem:** Given an array of numbers and a target, return the **indices** of the two numbers that add up to the target. Exactly one solution exists.

**Example:**
```
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]        because nums[0] + nums[1] = 2 + 7 = 9
```

### Approach 1 — Brute Force (check every pair)

**Idea:** Try every possible pair with two nested loops.

```js
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}
```
**Time:** O(n²) — every pair is checked · **Space:** O(1)

### Approach 2 — Hash Map (optimal) ✅

**Idea:** Instead of searching for the partner, **remember what you have already seen**. For each number, the partner you need is `target - num`. A Map lets you check "have I seen that partner?" in O(1).

```js
function twoSum(nums, target) {
  const seen = new Map();          // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];      // the number we need

    if (seen.has(complement)) {               // have we seen it before?
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);                     // remember this number
  }
  return [];
}
```
**Time:** O(n) — one pass · **Space:** O(n) — the map

**How it works:** For `[2,7,11,15]`, target 9:
- `i=0`, num=2, need 7 → not seen → store `{2:0}`
- `i=1`, num=7, need 2 → **found at index 0** → return `[0, 1]`

**Key insight:** We traded space for time. This "store what you've seen in a Map" pattern solves a huge number of array problems.

### Approach 3 — Two Pointers (only if the array is SORTED) ✅

**The follow-up interviewers always ask:** *"What if the array is already sorted?"*

**Idea:** Put one pointer at each end. If the sum is too big, the only way to shrink it is to move `right` inward. If the sum is too small, move `left` inward. Each step eliminates one possibility, so it is O(n) with **O(1) space** — better than the hash map.

```js
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) return [left, right];
    if (sum < target) left++;      // need a BIGGER sum → move left up
    else right--;                   // need a SMALLER sum → move right down
  }
  return [];
}
```
**Time:** O(n) · **Space:** O(1) ✅ — beats the hash map on space

**How it works** on `[2,7,11,15]`, target 18:
- `L=0(2), R=3(15)` → 17 < 18 → too small → `left++`
- `L=1(7), R=3(15)` → 22 > 18 → too big → `right--`
- `L=1(7), R=2(11)` → 18 → **found** ✅

> ⚠️ Only valid on a **sorted** array. Sorting an unsorted array first costs O(n log n) *and* destroys the original indices — so for the unsorted version, the hash map is still the right answer.

### Variation — 3Sum (the most asked two-pointer question)

**Problem:** Find all **unique** triplets that sum to zero.

**Idea:** Sort the array. Fix one number, then the problem becomes Two Sum on the remaining sorted portion — solved with two pointers.

```js
function threeSum(nums) {
  nums.sort((a, b) => a - b);          // sorting enables two pointers
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;                        // sorted → no way to reach 0
    if (i > 0 && nums[i] === nums[i - 1]) continue; // skip duplicate anchors

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicates on BOTH sides
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++;                        // need a bigger sum
      } else {
        right--;                       // need a smaller sum
      }
    }
  }

  return result;
}
```
**Time:** O(n²) — one loop × two pointers · **Space:** O(1) excluding the output

**Key insight:** The duplicate-skipping is what interviewers grade. Without those three `while`/`continue` checks you return duplicate triplets like `[-1,0,1]` twice.

---

## Q2. Best Time to Buy and Sell Stock

**Problem:** Given daily prices, find the maximum profit from **one** buy and one later sell. If no profit is possible, return 0.

**Example:**
```
Input:  [7, 1, 5, 3, 6, 4]
Output: 5        buy at 1 (day 1), sell at 6 (day 4)
```

### Approach 1 — Brute Force

```js
function maxProfitBrute(prices) {
  let max = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      max = Math.max(max, prices[j] - prices[i]);
    }
  }
  return max;
}
```
**Time:** O(n²) · **Space:** O(1)

### Approach 2 — Single Pass (optimal) ✅

**Idea:** To sell at today's price for maximum profit, you must have bought at the **lowest price seen so far**. So track two things while walking through the array once: the minimum price so far, and the best profit so far.

```js
function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);         // cheapest day so far
    maxProfit = Math.max(maxProfit, price - minPrice); // sell today?
  }
  return maxProfit;
}
```
**Time:** O(n) · **Space:** O(1)

**How it works** on `[7,1,5,3,6,4]`:

| price | minPrice | price − minPrice | maxProfit |
|---|---|---|---|
| 7 | 7 | 0 | 0 |
| 1 | **1** | 0 | 0 |
| 5 | 1 | 4 | 4 |
| 3 | 1 | 2 | 4 |
| 6 | 1 | **5** | **5** |
| 4 | 1 | 3 | 5 |

**Key insight:** You never need to look backwards. Carrying the minimum forward gives you the answer in one pass.

---

## Q3. Maximum Subarray (Kadane's Algorithm)

**Problem:** Find the contiguous subarray with the largest sum, and return that sum.

**Example:**
```
Input:  [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6        the subarray [4, -1, 2, 1]
```

### Approach 1 — Brute Force

```js
function maxSubArrayBrute(nums) {
  let max = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      max = Math.max(max, sum);
    }
  }
  return max;
}
```
**Time:** O(n²) · **Space:** O(1)

### Approach 2 — Kadane's Algorithm (optimal) ✅

**Idea:** At each element ask one question: *"Is it better to extend the previous subarray, or start fresh from here?"* If the running sum has gone negative, it can only hurt you — drop it and start again.

```js
function maxSubArray(nums) {
  let currentSum = nums[0];
  let maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    // Either extend the previous subarray, or start a new one at nums[i]
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
```
**Time:** O(n) · **Space:** O(1)

**How it works** on `[-2,1,-3,4,-1,2,1,-5,4]`:

| num | currentSum | maxSum |
|---|---|---|
| -2 | -2 | -2 |
| 1 | max(1, -1) = **1** (restart) | 1 |
| -3 | max(-3, -2) = -2 | 1 |
| 4 | max(4, 2) = **4** (restart) | 4 |
| -1 | 3 | 4 |
| 2 | 5 | 5 |
| 1 | 6 | **6** |
| -5 | 1 | 6 |
| 4 | 5 | 6 |

**Key insight:** A negative running sum is always worth discarding. This "extend or restart" decision is the core of Kadane's algorithm.

**Variation — also return the subarray:**
```js
function maxSubArrayWithIndices(nums) {
  let curr = nums[0], max = nums[0], start = 0, bestStart = 0, bestEnd = 0;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > curr + nums[i]) { curr = nums[i]; start = i; }
    else curr += nums[i];
    if (curr > max) { max = curr; bestStart = start; bestEnd = i; }
  }
  return { sum: max, subarray: nums.slice(bestStart, bestEnd + 1) };
}
```

---

## Q4. Move Zeroes

**Problem:** Move all `0`s to the end while keeping the order of the non-zero elements. Modify the array **in place**.

**Example:**
```
Input:  [0, 1, 0, 3, 12]
Output: [1, 3, 12, 0, 0]
```

### Approach 1 — Extra Array

```js
function moveZeroesExtra(nums) {
  const result = nums.filter((n) => n !== 0);
  while (result.length < nums.length) result.push(0);
  return result;
}
```
**Time:** O(n) · **Space:** O(n) — but the question asked for **in place**

### Approach 2 — Two Pointers (optimal) ✅

**Idea:** Keep a pointer `insertPos` marking where the next non-zero belongs. Walk through the array; every time you find a non-zero, place it at `insertPos` and advance. Afterwards, fill the rest with zeros.

```js
function moveZeroes(nums) {
  let insertPos = 0;

  // Step 1: move all non-zeros forward, preserving order
  for (const num of nums) {
    if (num !== 0) nums[insertPos++] = num;
  }

  // Step 2: fill the remaining slots with zeros
  while (insertPos < nums.length) nums[insertPos++] = 0;

  return nums;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `[0,1,0,3,12]`:
- 0 → skip. 1 → `nums[0]=1`, insertPos=1. 0 → skip. 3 → `nums[1]=3`, insertPos=2. 12 → `nums[2]=12`, insertPos=3.
- Array is now `[1,3,12,3,12]` → fill from index 3 → `[1,3,12,0,0]`

**Variation — single pass with swapping:**
```js
function moveZeroesSwap(nums) {
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] !== 0) {
      [nums[left], nums[right]] = [nums[right], nums[left]];
      left++;
    }
  }
  return nums;
}
```

**Key insight:** The two-pointer pattern — one pointer scans, the other marks where to write — solves most in-place array rearrangement problems.

---

## Q5. Remove Duplicates from Sorted Array

**Problem:** Remove duplicates **in place** from a sorted array and return the new length.

**Example:**
```
Input:  [1, 1, 2, 2, 3]
Output: 3, array becomes [1, 2, 3, ...]
```

### Approach 1 — Using a Set

```js
function removeDuplicatesSet(nums) {
  return [...new Set(nums)];
}
```
**Time:** O(n) · **Space:** O(n) — not in place

### Approach 2 — Two Pointers (optimal) ✅

**Idea:** Because the array is **sorted**, duplicates are always adjacent. Keep a slow pointer at the last unique element; move the fast pointer forward and copy a value only when it differs from the last unique one.

```js
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0;                             // index of the last unique element

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {        // found a new unique value
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;                          // length = index + 1
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `[1,1,2,2,3]`:
- fast=1: `1 === 1` → skip
- fast=2: `2 !== 1` → slow=1, `nums[1]=2` → `[1,2,2,2,3]`
- fast=3: `2 === 2` → skip
- fast=4: `3 !== 2` → slow=2, `nums[2]=3` → `[1,2,3,2,3]`
- return 3 → the first 3 elements are `[1,2,3]` ✅

**Key insight:** "Sorted" is the hint. It means duplicates are neighbours, so one pass is enough.

---

## Q6. Rotate Array

**Problem:** Rotate an array to the right by `k` steps, in place.

**Example:**
```
Input:  [1,2,3,4,5,6,7], k = 3
Output: [5,6,7,1,2,3,4]
```

### Approach 1 — Extra Array

```js
function rotateExtra(nums, k) {
  const n = nums.length;
  k = k % n;                                   // k may be larger than n
  const result = [...nums.slice(-k), ...nums.slice(0, -k)];
  for (let i = 0; i < n; i++) nums[i] = result[i];
  return nums;
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Reversal Algorithm (optimal) ✅

**Idea:** A rotation is three reversals. Reverse the whole array, then reverse the first `k` elements, then reverse the rest.

```js
function rotate(nums, k) {
  const n = nums.length;
  k = k % n;                        // 7 rotations on a 7-element array = 0

  reverse(nums, 0, n - 1);          // reverse everything
  reverse(nums, 0, k - 1);          // reverse the first k
  reverse(nums, k, n - 1);          // reverse the rest

  return nums;
}

function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `[1,2,3,4,5,6,7]`, k=3:
```
Original:            [1,2,3,4,5,6,7]
Reverse all:         [7,6,5,4,3,2,1]
Reverse first k=3:   [5,6,7,4,3,2,1]
Reverse rest:        [5,6,7,1,2,3,4]  ✅
```

**Key insight:** `k % n` is essential — rotating a 7-element array 10 times is the same as rotating it 3 times.

---

## Q7. Merge Two Sorted Arrays

**Problem:** Merge two sorted arrays into one sorted array.

**Example:**
```
Input:  [1, 3, 5], [2, 4, 6]
Output: [1, 2, 3, 4, 5, 6]
```

### Approach 1 — Concatenate and Sort

```js
function mergeSort2(a, b) {
  return [...a, ...b].sort((x, y) => x - y);
}
```
**Time:** O((n+m) log(n+m)) — the sort dominates · **Space:** O(n+m)

### Approach 2 — Two Pointers (optimal) ✅

**Idea:** Both arrays are already sorted, so you never need to re-sort. Compare the front of each array and take the smaller one.

```js
function merge(a, b) {
  const result = [];
  let i = 0, j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) result.push(a[i++]);
    else result.push(b[j++]);
  }

  // One array may still have leftovers - append them
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);

  return result;
}
```
**Time:** O(n + m) ✅ · **Space:** O(n + m) for the output

**How it works** on `[1,3,5]` and `[2,4,6]`:
`1<2→take 1` · `3>2→take 2` · `3<4→take 3` · `5>4→take 4` · `5<6→take 5` · leftover `6`

**Key insight:** Sorting already-sorted data is wasted work. This merge step is exactly what powers **merge sort**.

---

## Q8. Find the Missing Number

**Problem:** An array contains `n` distinct numbers from the range `0..n`. Find the one that is missing.

**Example:**
```
Input:  [3, 0, 1]      (n = 3, so the range is 0..3)
Output: 2
```

### Approach 1 — Sorting

```js
function missingNumberSort(nums) {
  nums.sort((a, b) => a - b);
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i) return i;
  }
  return nums.length;
}
```
**Time:** O(n log n) · **Space:** O(1)

### Approach 2 — Sum Formula (optimal) ✅

**Idea:** The sum of `0..n` is known from Gauss's formula: `n(n+1)/2`. Subtract the actual sum, and the difference **is** the missing number.

```js
function missingNumber(nums) {
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((sum, num) => sum + num, 0);
  return expectedSum - actualSum;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `[3,0,1]`: n=3 → expected = 3×4/2 = 6. Actual = 3+0+1 = 4. Missing = 6−4 = **2** ✅

### Approach 3 — XOR (avoids integer overflow)

**Idea:** XOR has two useful properties: `a ^ a = 0` and `a ^ 0 = a`. XOR-ing all indices with all values cancels every pair, leaving only the missing number.

```js
function missingNumberXOR(nums) {
  let xor = nums.length;
  for (let i = 0; i < nums.length; i++) {
    xor ^= i ^ nums[i];       // every present number cancels itself out
  }
  return xor;
}
```
**Time:** O(n) · **Space:** O(1) — and it never overflows

**Key insight:** Mathematical properties (sum formula, XOR cancellation) often beat data structures entirely.

---

## Q9. Find the Duplicate Number

**Problem:** An array of `n+1` integers where each value is in `1..n`. Exactly one value is repeated. Find it **without modifying the array** and using O(1) space.

**Example:**
```
Input:  [1, 3, 4, 2, 2]
Output: 2
```

### Approach 1 — Hash Set

```js
function findDuplicateSet(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return num;
    seen.add(num);
  }
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Floyd's Cycle Detection (optimal) ✅

**Idea:** Treat the array as a linked list where `i → nums[i]`. Because a value is duplicated, two indices point to the same place — creating a **cycle**. Floyd's tortoise-and-hare finds the cycle entrance, which is the duplicate.

```js
function findDuplicate(nums) {
  // Phase 1: find the meeting point inside the cycle
  let slow = nums[0];
  let fast = nums[0];

  do {
    slow = nums[slow];          // 1 step
    fast = nums[nums[fast]];    // 2 steps
  } while (slow !== fast);

  // Phase 2: find the cycle entrance = the duplicate
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];          // both now move 1 step
  }
  return slow;
}
```
**Time:** O(n) · **Space:** O(1) ✅ — and the array is untouched

**Key insight:** Recognising a hidden linked-list structure in an array is what makes O(1) space possible here. This is a classic "hard" interview question.

---

## Q10. Container With Most Water

**Problem:** Given heights of vertical lines, find two lines that together with the x-axis hold the most water.

**Example:**
```
Input:  [1, 8, 6, 2, 5, 4, 8, 3, 7]
Output: 49        lines at index 1 (height 8) and index 8 (height 7), width 7
```

### Approach 1 — Brute Force

```js
function maxAreaBrute(height) {
  let max = 0;
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      max = Math.max(max, Math.min(height[i], height[j]) * (j - i));
    }
  }
  return max;
}
```
**Time:** O(n²) · **Space:** O(1)

### Approach 2 — Two Pointers (optimal) ✅

**Idea:** Start with the widest possible container (both ends). The area is limited by the **shorter** line, so moving the taller one inward can never help — the width shrinks and the height is still capped by the short line. So always move the **shorter** pointer inward.

```js
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let max = 0;

  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    max = Math.max(max, area);

    // Move the SHORTER line - it is the limiting factor
    if (height[left] < height[right]) left++;
    else right--;
  }
  return max;
}
```
**Time:** O(n) ✅ · **Space:** O(1)

**How it works** on `[1,8,6,2,5,4,8,3,7]`:
- `L=0(h=1), R=8(h=7)` → area = 1×8 = 8 → move L (shorter)
- `L=1(h=8), R=8(h=7)` → area = 7×7 = **49** → move R
- ...no larger area is found → **49** ✅

**Key insight:** The proof that you can safely discard the shorter line is what turns O(n²) into O(n).

### Variation — Trapping Rain Water (the harder sibling)

**Problem:** Given an elevation map, how much rainwater is trapped between the bars?

```
Input:  [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
```

**Idea:** The water sitting above any bar is `min(tallestOnLeft, tallestOnRight) - ownHeight`. Using two pointers, you always know the smaller of the two maxima, so you can commit to that side immediately.

```js
function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      // The left bar is shorter → leftMax is the limiting wall
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];      // water above this bar
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}
```
**Time:** O(n) · **Space:** O(1) ✅ (the prefix-array version needs O(n))

**Why it works:** if `height[left] < height[right]`, then whatever is on the right is at least as tall, so `leftMax` is definitely the limiting wall — you can safely calculate the water at `left` without knowing the exact right maximum.

**Key insight:** Same two-pointer skeleton as Container With Most Water, but you *accumulate* instead of taking a maximum. These two questions are asked as a pair constantly.

---

## Q11. Product of Array Except Self

**Problem:** Return an array where `result[i]` is the product of all elements **except** `nums[i]`. **Division is not allowed.**

**Example:**
```
Input:  [1, 2, 3, 4]
Output: [24, 12, 8, 6]
```

### Approach 1 — Brute Force

```js
function productExceptSelfBrute(nums) {
  return nums.map((_, i) =>
    nums.reduce((product, num, j) => (i === j ? product : product * num), 1)
  );
}
```
**Time:** O(n²) · **Space:** O(n)

### Approach 2 — Prefix and Suffix Products (optimal) ✅

**Idea:** The answer for index `i` is (product of everything to the **left**) × (product of everything to the **right**). Compute both with two passes.

```js
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // Pass 1 (left → right): result[i] = product of everything LEFT of i
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    result[i] = leftProduct;
    leftProduct *= nums[i];
  }

  // Pass 2 (right → left): multiply by the product of everything RIGHT of i
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i];
  }

  return result;
}
```
**Time:** O(n) ✅ · **Space:** O(1) extra (the output does not count)

**How it works** on `[1,2,3,4]`:
```
After pass 1 (left products):   [1, 1, 2,  6]
Pass 2 (right products):         ×24 ×12 ×4 ×1
Final:                          [24, 12, 8, 6]  ✅
```

**Key insight:** Whenever division is banned, think **prefix and suffix accumulations**. The same pattern solves "sum except self" and many range problems.

---

## Q12. Find the Second Largest Element

**Problem:** Find the second largest **distinct** element in an array.

**Example:**
```
Input:  [10, 5, 10, 8, 3]
Output: 8        (10 is largest; the duplicate 10 does not count)
```

### Approach 1 — Sorting

```js
function secondLargestSort(nums) {
  const unique = [...new Set(nums)].sort((a, b) => b - a);
  return unique.length >= 2 ? unique[1] : null;
}
```
**Time:** O(n log n) · **Space:** O(n)

### Approach 2 — Single Pass (optimal) ✅

**Idea:** Track two variables. When a new maximum appears, the old maximum becomes the second largest.

```js
function secondLargest(nums) {
  let first = -Infinity;
  let second = -Infinity;

  for (const num of nums) {
    if (num > first) {
      second = first;      // the old max is demoted
      first = num;
    } else if (num > second && num !== first) {   // skip duplicates of the max
      second = num;
    }
  }
  return second === -Infinity ? null : second;
}
```
**Time:** O(n) ✅ · **Space:** O(1)

**How it works** on `[10,5,10,8,3]`:

| num | first | second |
|---|---|---|
| 10 | 10 | -∞ |
| 5 | 10 | 5 |
| 10 | 10 | 5 (equal to first → skipped) |
| 8 | 10 | **8** |
| 3 | 10 | 8 |

**Key insight:** The `num !== first` check is what interviewers look for — without it, a duplicated maximum wrongly becomes the second largest.

---

## Array patterns summary

| Pattern | When to use it | Questions here |
|---|---|---|
| **Hash Map** | "Have I seen this before?" | Q1 |
| **Running min/max** | Best profit, best so far | Q2, Q12 |
| **Kadane's** | Maximum contiguous sum | Q3 |
| **Two pointers (same direction)** | In-place rearranging | Q4, Q5 |
| **Two pointers (opposite ends)** | Sorted arrays, area, pairs | Q10 |
| **Reversal trick** | Rotation | Q6 |
| **Merge pattern** | Two sorted inputs | Q7 |
| **Math (sum / XOR)** | Missing or duplicate numbers | Q8, Q9 |
| **Prefix / suffix products** | "Except self", range queries | Q11 |
| **Fast & slow pointers** | Cycle detection | Q9 |

---

**Next:** [Part 2 — Strings (Q13–Q22)](Top50-02-Strings.md) · [Index](README.md)
