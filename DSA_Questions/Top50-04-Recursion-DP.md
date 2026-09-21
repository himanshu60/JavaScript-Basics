# Top 50 DSA — Part 4: Recursion & Dynamic Programming (Q33–Q40)

📄 [Back to the index](README.md) · [← Part 3: HashMap & Search](Top50-03-HashMap-Search-Sort.md)

---

## Recursion refresher

**Definition:** Recursion is a function calling itself on a smaller version of the problem until it reaches a **base case** that can be answered directly.

**Every recursive function needs two things:**
1. A **base case** — when to stop (without it: stack overflow)
2. A **recursive case** — how to shrink the problem toward the base case

**Definition of Dynamic Programming (DP):** Solving a problem by breaking it into overlapping subproblems and **storing** each result so it is computed only once.

**Two DP styles:**

| Style | Definition |
|---|---|
| **Memoization (top-down)** | Recursion + a cache of results |
| **Tabulation (bottom-up)** | A loop that fills a table from the smallest subproblem upward |

---

## Q33. Fibonacci Number

**Problem:** Return the nth Fibonacci number, where `F(0)=0`, `F(1)=1`, `F(n)=F(n-1)+F(n-2)`.

**Example:** `n = 10` → `55`

### Approach 1 — Plain Recursion (very slow)

```js
function fibSlow(n) {
  if (n <= 1) return n;                  // base case
  return fibSlow(n - 1) + fibSlow(n - 2);
}
```
**Time:** O(2ⁿ) ❌ · **Space:** O(n) call stack

**Why it is so slow** — the same values are recomputed again and again:
```
                fib(5)
            /            \
        fib(4)            fib(3)
       /      \          /      \
   fib(3)   fib(2)   fib(2)   fib(1)
   /    \
fib(2) fib(1)        ← fib(3) computed twice, fib(2) three times
```
`fib(50)` would take **years**.

### Approach 2 — Memoization (top-down DP) ✅

**Idea:** Cache each result the first time it is computed. Every value is then calculated exactly once.

```js
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);        // already computed → reuse

  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);                        // store before returning
  return result;
}
```
**Time:** O(n) ✅ · **Space:** O(n)

### Approach 3 — Tabulation (bottom-up DP)

```js
function fibTable(n) {
  if (n <= 1) return n;

  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];      // build upward from the base cases
  }
  return dp[n];
}
```
**Time:** O(n) · **Space:** O(n) — no recursion, so no stack overflow risk

### Approach 4 — Two Variables (optimal) ✅

**Idea:** You only ever need the **last two** values, so the whole array is unnecessary.

```js
function fib(n) {
  if (n <= 1) return n;

  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**Key insight:** This four-step progression — brute recursion → memoize → tabulate → optimise space — is the standard path for **every** DP problem.

---

## Q34. Climbing Stairs

**Problem:** You can climb 1 or 2 steps at a time. How many distinct ways are there to reach step `n`?

**Example:** `n = 3` → `3` (1+1+1, 1+2, 2+1)

### The insight

To reach step `n`, your final move came either from step `n-1` (a 1-step) or step `n-2` (a 2-step). So:

```
ways(n) = ways(n-1) + ways(n-2)
```

That is Fibonacci in disguise.

### Approach — Bottom-up, O(1) space ✅

```js
function climbStairs(n) {
  if (n <= 2) return n;

  let oneStepBefore = 2;      // ways to reach step 2
  let twoStepsBefore = 1;     // ways to reach step 1

  for (let i = 3; i <= n; i++) {
    const current = oneStepBefore + twoStepsBefore;
    twoStepsBefore = oneStepBefore;
    oneStepBefore = current;
  }

  return oneStepBefore;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**Variation — you can climb 1, 2 or 3 steps:**
```js
function climbStairs3(n) {
  const dp = [1, 1, 2];
  for (let i = 3; i <= n; i++) dp[i] = dp[i-1] + dp[i-2] + dp[i-3];
  return dp[n];
}
```

**Key insight:** Recognising that a problem reduces to a known recurrence is most of the work. Always ask: *"What was the last move, and what states could it have come from?"*

---

## Q35. Power of a Number (Fast Exponentiation)

**Problem:** Compute `x^n` efficiently, where `n` can be negative.

**Example:** `x = 2, n = 10` → `1024`

### Approach 1 — Simple loop

```js
function powerSlow(x, n) {
  let result = 1;
  for (let i = 0; i < Math.abs(n); i++) result *= x;
  return n < 0 ? 1 / result : result;
}
```
**Time:** O(n) — too slow for `n = 10⁹`

### Approach 2 — Binary Exponentiation (optimal) ✅

**Idea:** `x^10 = (x^5)² ` and `x^5 = x · (x^2)²`. Halving the exponent each time gives O(log n).

```js
function power(x, n) {
  if (n < 0) return 1 / power(x, -n);      // handle negatives
  if (n === 0) return 1;                   // base case

  const half = power(x, Math.floor(n / 2));

  return n % 2 === 0
    ? half * half            // even: x^n = (x^(n/2))²
    : half * half * x;       // odd:  x^n = (x^(n/2))² · x
}
```
**Time:** O(log n) ✅ · **Space:** O(log n) call stack

**How it works** for `2^10`:
```
power(2,10) → half = power(2,5)
  power(2,5) → half = power(2,2)
    power(2,2) → half = power(2,1)
      power(2,1) → half = power(2,0) = 1 → 1·1·2 = 2
    → 2·2 = 4
  → 4·4·2 = 32     (5 is odd, so multiply by x)
→ 32·32 = 1024  ✅
```
Only **4** multiplications instead of 10.

**Iterative version (O(1) space):**
```js
function powerIterative(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }

  let result = 1;
  while (n > 0) {
    if (n % 2 === 1) result *= x;    // odd bit → multiply in
    x *= x;                           // square the base
    n = Math.floor(n / 2);            // halve the exponent
  }
  return result;
}
```

**Key insight:** Halving instead of decrementing turns O(n) into O(log n). The same idea powers fast matrix exponentiation and modular arithmetic in cryptography.

---

## Q36. Flatten a Nested Array

**Problem:** Flatten an arbitrarily nested array into a single-level array.

**Example:** `[1, [2, [3, [4]], 5]]` → `[1, 2, 3, 4, 5]`

### Approach 1 — Built-in

```js
const flat = arr.flat(Infinity);
```

### Approach 2 — Recursion ✅

**Idea:** For each element: if it is an array, recurse into it; otherwise add it to the result.

```js
function flatten(arr) {
  const result = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));     // recurse and spread the result
    } else {
      result.push(item);                  // base case: a plain value
    }
  }

  return result;
}
```
**Time:** O(n) where n = total elements · **Space:** O(d) stack, d = nesting depth

### Approach 3 — Reduce (functional style)

```js
const flattenReduce = (arr) =>
  arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flattenReduce(item) : item),
    []
  );
```

### Approach 4 — Iterative with a Stack (no recursion limit)

**Idea:** Replace the call stack with an explicit stack. This never overflows, however deep the nesting.

```js
function flattenIterative(arr) {
  const stack = [...arr];
  const result = [];

  while (stack.length) {
    const item = stack.pop();

    if (Array.isArray(item)) {
      stack.push(...item);      // push its contents back for processing
    } else {
      result.push(item);
    }
  }

  return result.reverse();      // pop() reverses the order, so flip it back
}
```

**With a depth limit:**
```js
function flattenDepth(arr, depth = 1) {
  if (depth < 1) return arr.slice();
  return arr.reduce(
    (acc, item) =>
      acc.concat(Array.isArray(item) ? flattenDepth(item, depth - 1) : item),
    []
  );
}
```

**Key insight:** Any recursive solution can be rewritten iteratively with an explicit stack. Interviewers ask for this when the input could be 10,000 levels deep.

---

## Q37. Deep Clone an Object

**Problem:** Create a completely independent copy of a nested object.

### Approach 1 — structuredClone (modern) ✅

```js
const clone = structuredClone(original);
```
Handles `Date`, `Map`, `Set`, `RegExp` and **circular references**. Cannot clone functions or DOM nodes.

### Approach 2 — JSON (the old trick, with limits)

```js
const clone = JSON.parse(JSON.stringify(original));
```
❌ Loses `undefined`, functions and Symbols; converts `Date` to a string; breaks `Map`/`Set`; throws on circular references.

### Approach 3 — Manual Recursion (what interviewers want) ✅

```js
function deepClone(value, seen = new WeakMap()) {
  // Base case 1: primitives and null are returned as-is
  if (value === null || typeof value !== "object") return value;

  // Base case 2: circular reference - return the copy we already made
  if (seen.has(value)) return seen.get(value);

  // Handle special object types
  if (value instanceof Date) return new Date(value);
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)));
    return copy;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(deepClone(v, seen)));
    return copy;
  }

  // Arrays and plain objects
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);          // register BEFORE recursing (handles cycles)

  for (const key of Reflect.ownKeys(value)) {    // includes Symbol keys
    copy[key] = deepClone(value[key], seen);
  }

  return copy;
}
```
**Time:** O(n) · **Space:** O(n)

**Key insight:** The `WeakMap` is the interview point. Without it, a circular structure (`obj.self = obj`) causes infinite recursion. Registering the copy **before** recursing is what breaks the cycle.

---

## Q38. Generate All Permutations

**Problem:** Return every possible ordering of the elements.

**Example:** `[1,2,3]` → `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`

### Approach — Backtracking ✅

**Definition of Backtracking:** Build a solution step by step; when a branch is complete or invalid, **undo the last choice** and try the next one.

```js
function permute(nums) {
  const result = [];

  function backtrack(current, remaining) {
    // Base case: nothing left to place → we have a complete permutation
    if (remaining.length === 0) {
      result.push([...current]);        // copy! current keeps changing
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);                              // CHOOSE

      backtrack(current, [                                     // EXPLORE
        ...remaining.slice(0, i),
        ...remaining.slice(i + 1),
      ]);

      current.pop();                                           // UN-CHOOSE
    }
  }

  backtrack([], nums);
  return result;
}
```
**Time:** O(n! · n) · **Space:** O(n!) for the output

**The decision tree** for `[1,2,3]`:
```
                    []
        /            |            \
      [1]           [2]           [3]
     /   \         /   \         /   \
  [1,2] [1,3]   [2,1] [2,3]   [3,1] [3,2]
    |     |       |     |       |     |
 [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]
```

**Variation — swap-based (O(1) extra space per level):**
```js
function permuteSwap(nums) {
  const result = [];

  function backtrack(start) {
    if (start === nums.length) { result.push([...nums]); return; }

    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]];   // swap in
      backtrack(start + 1);
      [nums[start], nums[i]] = [nums[i], nums[start]];   // swap back
    }
  }

  backtrack(0);
  return result;
}
```

**Key insight:** The **choose → explore → un-choose** pattern is the template for every backtracking problem: permutations, subsets, N-Queens, Sudoku and word search.

---

## Q39. Generate All Subsets (Power Set)

**Problem:** Return every possible subset.

**Example:** `[1,2,3]` → `[[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]]`

### Approach 1 — Backtracking ✅

**Idea:** For each element there are exactly two choices: include it, or skip it.

```js
function subsets(nums) {
  const result = [];

  function backtrack(start, current) {
    result.push([...current]);        // EVERY state is a valid subset

    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);          // CHOOSE to include
      backtrack(i + 1, current);      // EXPLORE further (only forward)
      current.pop();                  // UN-CHOOSE
    }
  }

  backtrack(0, []);
  return result;
}
```
**Time:** O(2ⁿ · n) · **Space:** O(n) recursion depth

### Approach 2 — Iterative (doubling)

**Idea:** Start with `[[]]`. For each new number, duplicate every existing subset and add that number to the copies.

```js
function subsetsIterative(nums) {
  let result = [[]];

  for (const num of nums) {
    result = [...result, ...result.map((subset) => [...subset, num])];
  }

  return result;
}
```

**How it works:**
```
start:        [[]]
add 1:        [[], [1]]
add 2:        [[], [1], [2], [1,2]]
add 3:        [[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]]
```

### Approach 3 — Bit Manipulation (elegant)

**Idea:** With `n` elements there are `2ⁿ` subsets. Each number from `0` to `2ⁿ−1` is a bitmask where bit `i` means "include element i".

```js
function subsetsBits(nums) {
  const n = nums.length;
  const result = [];

  for (let mask = 0; mask < (1 << n); mask++) {    // 1<<n === 2^n
    const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(nums[i]);   // is bit i set?
    }
    result.push(subset);
  }

  return result;
}
```

```
mask 000 → []        mask 100 → [3]
mask 001 → [1]       mask 101 → [1,3]
mask 010 → [2]       mask 110 → [2,3]
mask 011 → [1,2]     mask 111 → [1,2,3]
```

**Key insight:** Subsets = 2ⁿ, permutations = n!. Recognising which one a problem needs tells you the expected complexity immediately.

---

## Q40. Coin Change

**Problem:** Given coin denominations and an amount, return the **fewest** coins needed. Return -1 if it is impossible.

**Example:** `coins = [1,2,5], amount = 11` → `3` (5 + 5 + 1)

### Approach 1 — Greedy (WRONG — a classic trap)

```js
// ❌ Take the largest coin each time
// coins = [1, 3, 4], amount = 6
// Greedy: 4 + 1 + 1 = 3 coins
// Optimal: 3 + 3   = 2 coins
```
**Greedy fails** unless the coin system has a special structure. Interviewers ask this to see if you spot it.

### Approach 2 — Recursion + Memoization (top-down) ✅

```js
function coinChangeMemo(coins, amount, memo = new Map()) {
  if (amount === 0) return 0;                // base: no coins needed
  if (amount < 0) return -1;                 // base: overshot
  if (memo.has(amount)) return memo.get(amount);

  let min = Infinity;

  for (const coin of coins) {
    const result = coinChangeMemo(coins, amount - coin, memo);
    if (result >= 0) min = Math.min(min, result + 1);   // +1 for this coin
  }

  const answer = min === Infinity ? -1 : min;
  memo.set(amount, answer);
  return answer;
}
```
**Time:** O(amount × coins) · **Space:** O(amount)

### Approach 3 — Tabulation (bottom-up, optimal) ✅

**Idea:** `dp[i]` = the fewest coins to make amount `i`. Build up from 0 to the target.

```js
function coinChange(coins, amount) {
  // Infinity means "not reachable yet"
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;                                 // 0 coins make amount 0

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```
**Time:** O(amount × coins) ✅ · **Space:** O(amount)

**How it works** for `coins = [1,2,5]`, amount 11:

| amount | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| dp | 0 | 1 | 1 | 2 | 2 | 1 | 2 | 2 | 3 | 3 | 2 | **3** |

For `dp[11]`: try coin 1 → `dp[10]+1 = 3`; coin 2 → `dp[9]+1 = 4`; coin 5 → `dp[6]+1 = 3`. Minimum = **3** ✅

### Related — House Robber

**Problem:** Rob houses for maximum money, but never two adjacent ones.

```js
function rob(nums) {
  let prev2 = 0;    // best up to house i-2
  let prev1 = 0;    // best up to house i-1

  for (const num of nums) {
    const current = Math.max(prev1, prev2 + num);   // skip this house, or rob it
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}
```
**Time:** O(n) · **Space:** O(1)

**Key insight:** Every DP problem comes down to defining the **state** (`dp[i]` means…) and the **transition** (how `dp[i]` is built from earlier states). Write those two sentences before writing any code.

---

## Recursion & DP patterns summary

| Pattern | When to use it | Questions |
|---|---|---|
| **Memoization** | Recursive solution with repeated subproblems | Q33, Q40 |
| **Tabulation** | Bottom-up, avoids stack overflow | Q33, Q34, Q40 |
| **Space optimisation** | Only the last few states are needed | Q33, Q34, Q40 |
| **Divide and conquer** | Halving the problem each step | Q35 |
| **Tree recursion** | Nested/hierarchical structures | Q36, Q37 |
| **Backtracking** | Generate all combinations/arrangements | Q38, Q39 |
| **Bit manipulation** | Subsets, state compression | Q39 |

**How to spot DP in an interview:**
- The question asks for a **maximum, minimum, or count of ways**
- Choices at each step affect future options
- A brute force solution recomputes the same subproblem
- The answer builds on answers to smaller inputs

---

**Next:** [Part 5 — Linked List, Stack, Queue & Tree (Q41–Q50)](Top50-05-LinkedList-Stack-Tree.md) · [Index](README.md)
