# DSA — Top 50 Most Asked Interview Questions

Every question includes: the **problem statement**, an **example**, a **brute force** approach, an **optimal** approach (often 3–4 solutions), **time and space complexity**, a step-by-step **walkthrough**, and the **key insight** interviewers are testing.

## The five parts

| Part | File | Questions |
|---|---|---|
| 1 | [Arrays](Top50-01-Arrays.md) | Q1–Q12 |
| 2 | [Strings](Top50-02-Strings.md) | Q13–Q22 |
| 3 | [HashMap, Searching & Sorting](Top50-03-HashMap-Search-Sort.md) | Q23–Q32 |
| 4 | [Recursion & Dynamic Programming](Top50-04-Recursion-DP.md) | Q33–Q40 |
| 5 | [Linked List, Stack, Queue & Tree](Top50-05-LinkedList-Stack-Tree.md) | Q41–Q50 |

---

## All 50 questions

### Part 1 — Arrays ([open](Top50-01-Arrays.md))

| # | Question | Optimal | Key pattern |
|---|---|---|---|
| 1 | Two Sum (+ sorted variant, **3Sum**) | O(n) / O(n²) | Hash Map · Two pointers |
| 2 | Best Time to Buy and Sell Stock | O(n) | Running minimum |
| 3 | Maximum Subarray | O(n) | Kadane's algorithm |
| 4 | Move Zeroes | O(n), O(1) space | Two pointers |
| 5 | Remove Duplicates from Sorted Array | O(n), O(1) space | Slow/fast pointers |
| 6 | Rotate Array | O(n), O(1) space | Triple reversal |
| 7 | Merge Two Sorted Arrays | O(n+m) | Merge pattern |
| 8 | Find the Missing Number | O(n), O(1) space | Sum formula / XOR |
| 9 | Find the Duplicate Number | O(n), O(1) space | Floyd's cycle detection |
| 10 | Container With Most Water (+ **Trapping Rain Water**) | O(n) | Two pointers from the ends |
| 11 | Product of Array Except Self | O(n), no division | Prefix/suffix products |
| 12 | Second Largest Element | O(n) | Single pass tracking |

### Part 2 — Strings ([open](Top50-02-Strings.md))

| # | Question | Optimal | Key pattern |
|---|---|---|---|
| 13 | Reverse a String | O(n) | Two pointers |
| 14 | Valid Palindrome | O(n), O(1) space | Two pointers with skipping |
| 15 | Valid Anagram | O(n) | Frequency map |
| 16 | First Non-Repeating Character | O(n) | Two-pass counting |
| 17 | Longest Substring Without Repeating Characters | O(n) | **Sliding window** |
| 18 | Longest Common Prefix | O(S) | Vertical scanning |
| 19 | String Compression | O(n) | Run-length encoding |
| 20 | Check String Rotation | O(n) | Concatenation trick |
| 21 | Reverse Words in a String | O(n) | Split / reverse / join |
| 22 | Group Anagrams | O(n·k) | Hash key design |

### Part 3 — HashMap, Searching & Sorting ([open](Top50-03-HashMap-Search-Sort.md))

| # | Question | Optimal | Key pattern |
|---|---|---|---|
| 23 | Majority Element | O(n), O(1) space | Boyer–Moore voting |
| 24 | Intersection of Two Arrays | O(n+m) | Set lookup · Two pointers if sorted |
| 25 | Subarray Sum Equals K | O(n) | **Prefix sum + Map** |
| 26 | Binary Search | O(log n) | Binary search |
| 27 | First and Last Position of an Element | O(log n) | Two binary searches |
| 28 | Search in Rotated Sorted Array | O(log n) | Modified binary search |
| 29 | Find Peak Element | O(log n) | Binary search on slope |
| 30 | Sort Colors (0s, 1s, 2s) | O(n), one pass | Dutch National Flag |
| 31 | Merge Intervals | O(n log n) | Sort then scan |
| 32 | Kth Largest Element | O(n log k) | **Min heap** |

### Part 4 — Recursion & DP ([open](Top50-04-Recursion-DP.md))

| # | Question | Optimal | Key pattern |
|---|---|---|---|
| 33 | Fibonacci Number | O(n), O(1) space | Memoization → tabulation |
| 34 | Climbing Stairs | O(n), O(1) space | DP recurrence |
| 35 | Power of a Number | O(log n) | Binary exponentiation |
| 36 | Flatten a Nested Array | O(n) | Tree recursion / stack |
| 37 | Deep Clone an Object | O(n) | Recursion + WeakMap |
| 38 | Generate All Permutations | O(n!·n) | **Backtracking** |
| 39 | Generate All Subsets | O(2ⁿ·n) | Backtracking / bitmask |
| 40 | Coin Change | O(amount × coins) | Bottom-up DP |

### Part 5 — Linked List, Stack, Queue & Tree ([open](Top50-05-LinkedList-Stack-Tree.md))

| # | Question | Optimal | Key pattern |
|---|---|---|---|
| 41 | Reverse a Linked List | O(n), O(1) space | Three-pointer reversal |
| 42 | Detect a Cycle in a Linked List | O(n), O(1) space | **Floyd's tortoise & hare** |
| 43 | Find the Middle of a Linked List | O(n), one pass | Fast & slow pointers |
| 44 | Merge Two Sorted Lists | O(n+m) | Dummy node |
| 45 | Remove Nth Node From End | O(n), one pass | Two pointers with a gap |
| 46 | Valid Parentheses | O(n) | **Stack** |
| 47 | Implement a Queue using Stacks | Amortised O(1) | Two stacks |
| 48 | Min Stack | O(1) for all ops | Auxiliary stack |
| 49 | Binary Tree Traversals | O(n) | DFS + BFS |
| 50 | Max Depth & Invert a Binary Tree | O(n) | Tree recursion |

---

## The Two Pointer technique (used in 15 of the 50 questions)

**Definition:** Two Pointers means using two index variables that move through the data according to a rule, so you solve in **one pass** what would otherwise need nested loops. It typically turns **O(n²) → O(n)** and often needs **O(1) space**.

There are **four variants**, and knowing which one a problem needs is most of the battle:

### 1. Opposite ends (converging)

Start at both ends and move inward. **Requires sorted data** (or a property that lets you safely discard one side).

```js
let left = 0, right = arr.length - 1;
while (left < right) {
  if (condition) left++;
  else right--;
}
```
**Use when:** finding a pair with a target sum, palindromes, area/container problems, reversing.
**Questions:** Q1 (sorted variant + 3Sum), Q10 (+ Trapping Rain Water), Q13, Q14, Q6 (inside `reverse`)

### 2. Same direction (slow / fast writer)

Both start at the left. The **fast** pointer scans; the **slow** pointer marks where to write. This is how you edit an array **in place**.

```js
let slow = 0;
for (let fast = 0; fast < arr.length; fast++) {
  if (keepThisValue) arr[slow++] = arr[fast];
}
```
**Use when:** removing or moving elements in place, deduplicating a sorted array, partitioning.
**Questions:** Q4, Q5, Q30 (three pointers)

### 3. Fast & slow (tortoise and hare)

One pointer moves 1 step, the other 2 steps. Used on **linked lists and implicit cycles**.

```js
let slow = head, fast = head;
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
}
```
**Use when:** detecting a cycle, finding the middle, nth-from-end, palindrome lists.
**Questions:** Q9, Q42, Q43, Q45

### 4. Sliding window (a two-pointer variant)

Both pointers move **forward only**. `right` expands the window, `left` shrinks it when a condition breaks. Each element is visited at most twice.

```js
let left = 0;
for (let right = 0; right < arr.length; right++) {
  // expand with arr[right]
  while (windowIsInvalid) left++;    // shrink
  // record the answer
}
```
**Use when:** longest/shortest substring or subarray satisfying a condition.
**Questions:** Q17

### Two separate arrays (the merge walk)

A pointer in each array, always advancing the one pointing at the smaller value.

**Questions:** Q7, Q24 (sorted variant), Q44

---

### How to spot a two-pointer problem

| Signal in the question | Likely variant |
|---|---|
| "sorted array" + "find a pair/triplet" | Opposite ends |
| "in place" / "O(1) extra space" | Same direction |
| "linked list" + "cycle / middle / nth from end" | Fast & slow |
| "longest / shortest substring or subarray" | Sliding window |
| "two sorted arrays" | Merge walk |
| A brute force with nested loops over the same array | Try two pointers first |

> **The trade-off to state in an interview:** a hash map gives O(n) time with O(n) space and works on **unsorted** data. Two pointers gives O(n) time with **O(1)** space but usually needs **sorted** data. Say this out loud — it is exactly what the interviewer is listening for.

---

## The 12 patterns that cover most interview questions

| Pattern | Recognise it when... | Questions |
|---|---|---|
| **Hash Map / Set** | "Have I seen this?", counting, grouping | 1, 15, 16, 22, 23, 24, 25 |
| **Two Pointers (opposite ends)** | Sorted array, pairs, area, palindrome | 10, 13, 14 |
| **Two Pointers (same direction)** | In-place rearranging, removing | 4, 5, 30 |
| **Fast & Slow Pointers** | Cycles, middle, nth-from-end | 9, 42, 43, 45 |
| **Sliding Window** | Longest/shortest substring or subarray | 17 |
| **Prefix Sum** | Range sums, "sum equals k" | 11, 25 |
| **Binary Search** | Sorted input, or "discard half" logic | 26, 27, 28, 29, 32 |
| **Sorting first** | Intervals, grouping, anagrams | 22, 31 |
| **Stack** | Matching, nesting, undo, monotonic | 46, 47, 48 |
| **Queue / BFS** | Level order, shortest path | 47, 49, 50 |
| **Backtracking** | Generate all combinations/arrangements | 38, 39 |
| **Dynamic Programming** | Max/min/count of ways, overlapping subproblems | 33, 34, 40 |

---

## Big-O quick reference

| Complexity | Name | n = 1,000,000 | Example |
|---|---|---|---|
| O(1) | Constant | instant | Hash lookup, array index |
| O(log n) | Logarithmic | ~20 steps | Binary search |
| O(n) | Linear | 1,000,000 | Single loop |
| O(n log n) | Linearithmic | ~20,000,000 | Merge sort, efficient sorting |
| O(n²) | Quadratic | 10¹² — too slow | Nested loops |
| O(2ⁿ) | Exponential | impossible | Naive recursion, subsets |
| O(n!) | Factorial | impossible | Permutations |

**Rough rule for interviews:** if `n ≤ 10⁸` you need O(n) or better; if `n ≤ 10⁴` then O(n²) is acceptable; if `n ≤ 20` then O(2ⁿ) or O(n!) is expected.

---

## How to approach any DSA question in an interview

1. **Clarify** — ask about input size, duplicates, empty input, negative numbers, sorted or not.
2. **Examples** — write one normal case and one edge case by hand.
3. **Brute force first** — say it out loud with its complexity. Never stay silent.
4. **Find the bottleneck** — what is the repeated work? That is what to optimise.
5. **Match a pattern** — sorted → binary search / two pointers; "seen before" → hash map; substring → sliding window; "all combinations" → backtracking.
6. **Code it** — talk while you type.
7. **Trace it** — walk through your example line by line.
8. **Edge cases** — empty input, one element, all identical, overflow.
9. **State the complexity** — both time and space, without being asked.

---

## Other files in this folder

| File | Covers |
|---|---|
| [Time-complexity-Array-Object.md](Time-complexity-Array-Object.md) | Big-O of array and object operations |
| [MergeSort.md](MergeSort.md) | Merge sort explained |
| [LookUp.md](LookUp.md) | Lookup techniques and complexity |
| [reverseWord.md](reverseWord.md) | String reversal |
| [NumberToBinary.md](NumberToBinary.md) · [Convert-Number-Binary.md](Convert-Number-Binary.md) | Decimal to binary |

**Practice files (JavaScript):** [../Tecnique/](../Tecnique/) · **Python:** [../Python_Interview_Questions/](../Python_Interview_Questions/) · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
