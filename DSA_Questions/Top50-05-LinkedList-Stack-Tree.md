# Top 50 DSA — Part 5: Linked List, Stack, Queue & Tree (Q41–Q50)

📄 [Back to the index](README.md) · [← Part 4: Recursion & DP](Top50-04-Recursion-DP.md)

---

## Setup — the Node classes

```js
// Linked List node
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Binary Tree node
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

**Definition of a Linked List:** A chain of nodes where each node holds a value and a pointer to the next node. Unlike an array, elements are not stored contiguously.

| | Array | Linked List |
|---|---|---|
| Access by index | **O(1)** | O(n) |
| Insert/delete at start | O(n) | **O(1)** |
| Insert/delete at end | O(1) amortised | O(n), or O(1) with a tail pointer |
| Memory | Contiguous | Scattered + pointer overhead |

---

## Q41. Reverse a Linked List

**Problem:** Reverse a singly linked list.

**Example:** `1→2→3→4→5` → `5→4→3→2→1`

### Approach 1 — Iterative (optimal) ✅

**Idea:** Walk the list, flipping each `next` pointer to point backwards. You need three pointers so you do not lose the rest of the list.

```js
function reverseList(head) {
  let prev = null;
  let current = head;

  while (current) {
    const next = current.next;   // 1. SAVE the rest of the list
    current.next = prev;         // 2. REVERSE this pointer
    prev = current;              // 3. MOVE prev forward
    current = next;              // 4. MOVE current forward
  }

  return prev;                   // prev is the new head
}
```
**Time:** O(n) · **Space:** O(1) ✅

**How it works** on `1→2→3`:
```
Start:      null    1→2→3
             prev  curr

Step 1:     null←1    2→3
                 prev curr

Step 2:   null←1←2      3
                 prev  curr

Step 3: null←1←2←3     null
                 prev  curr → loop ends, return prev (node 3) ✅
```

### Approach 2 — Recursive

```js
function reverseListRec(head) {
  if (!head || !head.next) return head;      // base case: 0 or 1 node

  const newHead = reverseListRec(head.next); // reverse everything after head

  head.next.next = head;    // make the next node point BACK to head
  head.next = null;         // break the old forward link

  return newHead;           // the new head bubbles up unchanged
}
```
**Time:** O(n) · **Space:** O(n) call stack — the iterative version is better

**Key insight:** Saving `next` **before** overwriting `current.next` is the entire trick. Forget it and you lose the rest of the list permanently.

---

## Q42. Detect a Cycle in a Linked List

**Problem:** Does the list contain a loop?

### Approach 1 — Hash Set

```js
function hasCycleSet(head) {
  const seen = new Set();
  let current = head;

  while (current) {
    if (seen.has(current)) return true;    // visited this node before
    seen.add(current);
    current = current.next;
  }
  return false;
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Floyd's Tortoise and Hare (optimal) ✅

**Idea:** Move one pointer 1 step and another 2 steps. On a straight list, fast reaches the end. In a loop, fast keeps lapping slow and **must** eventually land on it — like two runners on a circular track.

```js
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;            // 1 step
    fast = fast.next.next;       // 2 steps

    if (slow === fast) return true;   // they met → there is a cycle
  }

  return false;                  // fast hit the end → no cycle
}
```
**Time:** O(n) · **Space:** O(1) ✅

**Finding where the cycle starts:**

```js
function detectCycleStart(head) {
  let slow = head, fast = head;

  // Phase 1: find the meeting point
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      // Phase 2: reset slow to head; both now move 1 step
      slow = head;
      while (slow !== fast) {
        slow = slow.next;
        fast = fast.next;
      }
      return slow;               // this node is the cycle entrance
    }
  }
  return null;
}
```

**Why phase 2 works:** the distance from the head to the cycle start equals the distance from the meeting point to the cycle start. It is a proven mathematical property of Floyd's algorithm.

---

## Q43. Find the Middle of a Linked List

**Problem:** Return the middle node. For an even count, return the second middle.

**Example:** `1→2→3→4→5` → node `3`

### Approach 1 — Two passes

```js
function middleNodeTwoPass(head) {
  let count = 0;
  for (let n = head; n; n = n.next) count++;      // pass 1: count

  let mid = head;
  for (let i = 0; i < Math.floor(count / 2); i++) mid = mid.next;  // pass 2
  return mid;
}
```
**Time:** O(n) but two passes

### Approach 2 — Fast and Slow Pointers (optimal) ✅

**Idea:** When the fast pointer (2 steps) reaches the end, the slow pointer (1 step) is exactly halfway.

```js
function middleNode(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```
**Time:** O(n), **one pass** ✅ · **Space:** O(1)

**Key insight:** The fast/slow pattern solves middle-finding, cycle detection, palindrome checking and nth-from-end in one pass each.

---

## Q44. Merge Two Sorted Linked Lists

**Problem:** Merge two sorted lists into one sorted list.

**Example:** `1→2→4` and `1→3→4` → `1→1→2→3→4→4`

### Approach — Dummy Node + Two Pointers ✅

**Definition of a Dummy Node:** A throwaway node placed before the real head, so you never need a special case for "is this the first node?".

```js
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);      // placeholder - avoids null checks
  let tail = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      tail.next = l1;
      l1 = l1.next;
    } else {
      tail.next = l2;
      l2 = l2.next;
    }
    tail = tail.next;
  }

  tail.next = l1 ?? l2;    // attach whatever remains - no loop needed

  return dummy.next;       // skip the dummy and return the real head
}
```
**Time:** O(n + m) · **Space:** O(1) — nodes are relinked, not copied ✅

**Key insight:** `tail.next = l1 ?? l2` works because the leftover list is **already sorted** — just attach the whole thing.

---

## Q45. Remove the Nth Node From the End

**Problem:** Remove the nth node counting from the end, in one pass.

**Example:** `1→2→3→4→5`, n=2 → `1→2→3→5`

### Approach — Two Pointers with a Gap ✅

**Idea:** Move a `fast` pointer `n` steps ahead. Then move both pointers together. When `fast` reaches the end, `slow` is sitting just before the node to delete.

```js
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);    // handles deleting the head itself
  let slow = dummy;
  let fast = dummy;

  // Step 1: give fast an n-node head start
  for (let i = 0; i <= n; i++) fast = fast.next;

  // Step 2: move both until fast falls off the end
  while (fast) {
    slow = slow.next;
    fast = fast.next;
  }

  // Step 3: slow.next is the node to remove
  slow.next = slow.next.next;

  return dummy.next;
}
```
**Time:** O(n), **one pass** ✅ · **Space:** O(1)

**Why the dummy node matters:** for `[1]` with n=1 you must delete the head. Without a dummy you would need a separate special case.

**Key insight:** A fixed gap between two pointers converts "count from the end" into a single forward pass.

---

## Q46. Valid Parentheses

**Problem:** Given a string of `()[]{}`, determine whether the brackets are correctly matched and nested.

**Example:** `"()[]{}"` → `true` · `"(]"` → `false` · `"([)]"` → `false`

### Approach — Stack ✅

**Definition of a Stack:** A LIFO (Last In, First Out) structure. In JavaScript, an array with `push()` and `pop()` is a stack.

**Idea:** Push every opening bracket. On a closing bracket, the top of the stack **must** be its matching pair — that enforces correct nesting.

```js
function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);                      // opening → remember it
    } else {
      // Closing bracket: the top must be its match
      if (stack.pop() !== pairs[char]) return false;
    }
  }

  return stack.length === 0;   // any leftovers = unclosed brackets
}
```
**Time:** O(n) · **Space:** O(n)

**How it works** on `"([)]"`:
- `(` → push → `["("]`
- `[` → push → `["(", "["]`
- `)` → pop gives `"["`, but we need `"("` → **false** ✅ (correctly rejected)

**Key insight:** The final `stack.length === 0` check is essential — `"((("` would otherwise pass. Interviewers deliberately test this.

---

## Q47. Implement a Queue using Stacks

**Problem:** Build a FIFO queue using only two LIFO stacks.

**Definition of a Queue:** FIFO — First In, First Out, like a queue at a shop.

### Approach — Two Stacks with Amortised O(1) ✅

**Idea:** One stack for input, one for output. When the output stack is empty, pour the input stack into it — this **reverses** the order, turning LIFO into FIFO.

```js
class MyQueue {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }

  push(x) {
    this.inStack.push(x);        // always O(1)
  }

  pop() {
    this.transfer();
    return this.outStack.pop();
  }

  peek() {
    this.transfer();
    return this.outStack[this.outStack.length - 1];
  }

  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }

  transfer() {
    // Only pour when out is empty - this preserves the correct order
    if (this.outStack.length === 0) {
      while (this.inStack.length) {
        this.outStack.push(this.inStack.pop());   // reverses the order
      }
    }
  }
}
```
**Time:** `push` O(1), `pop`/`peek` **amortised** O(1) · **Space:** O(n)

**Definition of Amortised O(1):** A single `pop` may cost O(n) when it transfers, but each element is moved **at most once**, so the average cost over many operations is O(1).

**How it works:** push 1,2,3 → `inStack=[1,2,3]`. First pop transfers → `outStack=[3,2,1]` → pops `1` ✅ (FIFO). Next pops give 2, then 3, with no further transfers.

**Key insight:** Transferring **only when the output stack is empty** is what makes it correct. Transferring every time would scramble the order.

---

## Q48. Min Stack

**Problem:** Design a stack supporting `push`, `pop`, `top` and `getMin` — all in **O(1)**.

### Approach — Two Stacks ✅

**Idea:** Keep a second stack whose top is always the minimum of the current elements. Push the new minimum alongside every push.

```js
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];      // minStack[i] = min of stack[0..i]
  }

  push(val) {
    this.stack.push(val);
    const currentMin = this.minStack.length
      ? Math.min(val, this.getMin())
      : val;
    this.minStack.push(currentMin);
  }

  pop() {
    this.minStack.pop();     // keep both stacks in sync
    return this.stack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.minStack[this.minStack.length - 1];   // O(1) ✅
  }
}
```
**Time:** all operations O(1) ✅ · **Space:** O(n)

**How it works:** push 5, 3, 7, 2 →
```
stack:    [5, 3, 7, 2]
minStack: [5, 3, 3, 2]   ← the running minimum at each depth
```
`getMin()` returns 2. After `pop()`, minStack returns to `[5,3,3]` → `getMin()` is 3 ✅

**Key insight:** The naive approach — scanning the stack for the minimum — is O(n). Storing the history of minimums trades O(n) space for O(1) time. This space-for-time trade is a recurring theme.

---

## Q49. Binary Tree Traversals

**Definition of a Binary Tree:** A structure where each node has at most two children — `left` and `right`.

**The four traversals:**

| Traversal | Order | Typical use |
|---|---|---|
| **Inorder** | Left → **Root** → Right | Gives **sorted order** in a BST |
| **Preorder** | **Root** → Left → Right | Copying/serialising a tree |
| **Postorder** | Left → Right → **Root** | Deleting a tree, evaluating expressions |
| **Level order (BFS)** | Level by level | Shortest path, printing by depth |

```
        1
      /   \
     2     3
    / \
   4   5

Inorder:    4 2 5 1 3
Preorder:   1 2 4 5 3
Postorder:  4 5 2 3 1
Level order: 1 2 3 4 5
```

### Recursive traversals (DFS)

```js
function inorder(root, result = []) {
  if (!root) return result;            // base case
  inorder(root.left, result);          // LEFT
  result.push(root.val);               // ROOT
  inorder(root.right, result);         // RIGHT
  return result;
}

function preorder(root, result = []) {
  if (!root) return result;
  result.push(root.val);               // ROOT first
  preorder(root.left, result);
  preorder(root.right, result);
  return result;
}

function postorder(root, result = []) {
  if (!root) return result;
  postorder(root.left, result);
  postorder(root.right, result);
  result.push(root.val);               // ROOT last
  return result;
}
```
**Time:** O(n) · **Space:** O(h) where h = height

### Iterative inorder (using an explicit stack)

```js
function inorderIterative(root) {
  const result = [];
  const stack = [];
  let current = root;

  while (current || stack.length) {
    while (current) {           // go as far LEFT as possible
      stack.push(current);
      current = current.left;
    }

    current = stack.pop();      // process this node
    result.push(current.val);

    current = current.right;    // then go RIGHT
  }

  return result;
}
```

### Level Order Traversal (BFS with a queue) ✅

**Definition of BFS:** Breadth-First Search visits all nodes at the current depth before going deeper. It uses a **queue**.

```js
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;    // how many nodes at THIS level
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();      // dequeue
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);     // enqueue children
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);         // [[1], [2,3], [4,5]]
  }

  return result;
}
```
**Time:** O(n) · **Space:** O(w) where w = maximum width

**Key insight:** Capturing `levelSize` **before** the inner loop is what separates the levels. Without it you get one flat list instead of level-by-level groups.

> ⚠️ `queue.shift()` is O(n) in JavaScript. For large trees, use an index pointer instead of shifting: `let head = 0; const node = queue[head++];`

---

## Q50. Maximum Depth & Invert a Binary Tree

### Part A — Maximum Depth

**Problem:** Find the number of nodes on the longest root-to-leaf path.

```js
function maxDepth(root) {
  if (!root) return 0;          // base case: an empty tree has depth 0

  // Depth = 1 (this node) + the deeper of the two subtrees
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```
**Time:** O(n) · **Space:** O(h)

**How it works:** each node asks its children "how deep are you?", takes the larger answer, and adds 1 for itself. The answers bubble up to the root.

**Iterative version (BFS — count the levels):**
```js
function maxDepthBFS(root) {
  if (!root) return 0;
  let depth = 0;
  const queue = [root];

  while (queue.length) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    depth++;                     // one full level processed
  }
  return depth;
}
```

### Part B — Invert a Binary Tree

**Problem:** Mirror the tree — swap every node's left and right children.

```
     4              4
   /   \          /   \
  2     7   →    7     2
 / \   / \      / \   / \
1   3 6   9    9   6 3   1
```

```js
function invertTree(root) {
  if (!root) return null;                       // base case

  [root.left, root.right] = [root.right, root.left];   // swap this node

  invertTree(root.left);                        // recurse into both sides
  invertTree(root.right);

  return root;
}
```
**Time:** O(n) · **Space:** O(h)

**Iterative version (BFS):**
```js
function invertTreeBFS(root) {
  if (!root) return null;
  const queue = [root];

  while (queue.length) {
    const node = queue.shift();
    [node.left, node.right] = [node.right, node.left];

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return root;
}
```

### Bonus — Validate a Binary Search Tree

**Definition of a BST:** For every node, all values in the left subtree are smaller and all values in the right subtree are larger.

```js
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;

  // The value must fit inside the allowed range
  if (root.val <= min || root.val >= max) return false;

  // Left subtree: max becomes this node's value
  // Right subtree: min becomes this node's value
  return isValidBST(root.left, min, root.val) &&
         isValidBST(root.right, root.val, max);
}
```

**The classic mistake:** only comparing a node with its immediate children. This tree passes that check but is **not** a valid BST:
```
    5
   / \
  1   7
     / \
    3   8      ← 3 is in the right subtree of 5, but 3 < 5 ❌
```
Passing a valid `(min, max)` range down the recursion is the correct solution.

---

## Patterns summary

| Pattern | When to use it | Questions |
|---|---|---|
| **Three-pointer reversal** | Reversing a linked list | Q41 |
| **Fast & slow pointers** | Cycles, middle node, nth from end | Q42, Q43, Q45 |
| **Dummy node** | Any list where the head might change | Q44, Q45 |
| **Stack (LIFO)** | Matching, nesting, undo, iterative DFS | Q46, Q47, Q48 |
| **Queue (FIFO)** | Level-order, BFS, shortest path | Q47, Q49 |
| **Auxiliary stack** | O(1) min/max tracking | Q48 |
| **DFS recursion** | Tree depth, paths, validation | Q49, Q50 |
| **BFS with level size** | Level-by-level grouping | Q49, Q50 |

**Complexity reference:**

| Structure | Access | Search | Insert | Delete |
|---|---|---|---|---|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1)* | O(1)* |
| Stack | O(n) | O(n) | O(1) | O(1) |
| Queue | O(n) | O(n) | O(1) | O(1) |
| Hash Table | — | O(1) | O(1) | O(1) |
| BST (balanced) | O(log n) | O(log n) | O(log n) | O(log n) |
| BST (worst, skewed) | O(n) | O(n) | O(n) | O(n) |

\* once you already hold a reference to the node

---

**[← Back to the index](README.md)** · [Part 1: Arrays](Top50-01-Arrays.md)
