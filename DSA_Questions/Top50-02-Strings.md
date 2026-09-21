# Top 50 DSA — Part 2: Strings (Q13–Q22)

📄 [Back to the index](README.md) · [← Part 1: Arrays](Top50-01-Arrays.md)

> **Remember:** JavaScript strings are **immutable**. `str[0] = "x"` does nothing. Any "modification" creates a new string, so building a string in a loop with `+=` can be O(n²). Push to an array and `join("")` instead.

---

## Q13. Reverse a String

**Problem:** Reverse a string.

**Example:** `"hello"` → `"olleh"`

### Approach 1 — Built-in methods

```js
function reverseBuiltIn(str) {
  return str.split("").reverse().join("");
}
```
**Time:** O(n) · **Space:** O(n)
*Interviewers often ban this — they want to see the loop.*

### Approach 2 — Loop backwards

```js
function reverseLoop(str) {
  let result = "";
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 3 — Two Pointers (optimal for arrays) ✅

**Idea:** Swap the outermost characters and move inwards until the pointers meet. On a **character array** this is O(1) extra space.

```js
function reverseTwoPointer(str) {
  const arr = str.split("");
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];   // swap
    left++;
    right--;
  }
  return arr.join("");
}
```
**Time:** O(n) · **Space:** O(1) extra on the array itself

**How it works** on `"hello"`: `h↔o` → `"oellh"` · `e↔l` → `"olleh"` · pointers meet → done ✅

**⚠️ Unicode warning:** all of these break emoji and combined characters, because they operate on UTF-16 code units.
```js
"👍".split("").reverse().join("");    // ❌ broken output
[..."👍"].reverse().join("");         // ✅ spread iterates real characters
```

---

## Q14. Valid Palindrome

**Problem:** Check whether a string is a palindrome, ignoring case and non-alphanumeric characters.

**Example:** `"A man, a plan, a canal: Panama"` → `true`

### Approach 1 — Clean and Reverse

```js
function isPalindromeSimple(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Two Pointers (optimal) ✅

**Idea:** Compare characters from both ends moving inward, skipping anything that is not alphanumeric. No extra string is built.

```js
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;

  const isAlphaNum = (c) => /[a-z0-9]/i.test(c);

  while (left < right) {
    while (left < right && !isAlphaNum(str[left])) left++;    // skip junk
    while (left < right && !isAlphaNum(str[right])) right--;

    if (str[left].toLowerCase() !== str[right].toLowerCase()) return false;

    left++;
    right--;
  }
  return true;
}
```
**Time:** O(n) · **Space:** O(1) ✅

**Key insight:** Two pointers avoid creating a cleaned copy of the string, which matters for very long inputs.

---

## Q15. Valid Anagram

**Problem:** Two strings are anagrams if one is a rearrangement of the other.

**Example:** `"anagram"`, `"nagaram"` → `true`

### Approach 1 — Sorting

```js
function isAnagramSort(s, t) {
  if (s.length !== t.length) return false;
  return s.split("").sort().join("") === t.split("").sort().join("");
}
```
**Time:** O(n log n) · **Space:** O(n)

### Approach 2 — Frequency Map (optimal) ✅

**Idea:** Count how many times each character appears in the first string, then subtract using the second. If every count reaches zero, they are anagrams.

```js
function isAnagram(s, t) {
  if (s.length !== t.length) return false;     // quick rejection

  const count = new Map();

  for (const char of s) {
    count.set(char, (count.get(char) ?? 0) + 1);       // count up
  }

  for (const char of t) {
    if (!count.has(char)) return false;                // char not in s at all
    count.set(char, count.get(char) - 1);              // count down

    if (count.get(char) === 0) count.delete(char);
  }

  return count.size === 0;      // everything cancelled out
}
```
**Time:** O(n) ✅ · **Space:** O(k) where k = distinct characters

**How it works** on `"anagram"` / `"nagaram"`: counting gives `{a:3, n:1, g:1, r:1, m:1}`, and the second string decrements each one to zero → `true` ✅

**Key insight:** The length check first is a free O(1) rejection that interviewers like to see.

---

## Q16. First Non-Repeating Character

**Problem:** Return the index of the first character that appears exactly once, or -1.

**Example:** `"leetcode"` → `0` (the `l`) · `"loveleetcode"` → `2` (the `v`)

### Approach 1 — Nested Loop

```js
function firstUniqCharBrute(s) {
  for (let i = 0; i < s.length; i++) {
    let isUnique = true;
    for (let j = 0; j < s.length; j++) {
      if (i !== j && s[i] === s[j]) { isUnique = false; break; }
    }
    if (isUnique) return i;
  }
  return -1;
}
```
**Time:** O(n²) · **Space:** O(1)

### Approach 2 — Two Pass with a Map (optimal) ✅

**Idea:** You cannot know if a character is unique until you have seen the whole string. So count everything first, then scan again for the first character with a count of 1.

```js
function firstUniqChar(s) {
  const count = new Map();

  // Pass 1: count every character
  for (const char of s) {
    count.set(char, (count.get(char) ?? 0) + 1);
  }

  // Pass 2: find the first with count === 1 (order matters, so scan the string)
  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) return i;
  }

  return -1;
}
```
**Time:** O(n) ✅ · **Space:** O(k)

**Key insight:** Two passes is still O(n). Do not try to force it into one pass — you need the complete count before you can decide.

---

## Q17. Longest Substring Without Repeating Characters

**Problem:** Find the length of the longest substring with all distinct characters.

**Example:** `"abcabcbb"` → `3` (the substring `"abc"`)

### Approach 1 — Brute Force

```js
function lengthOfLongestSubstringBrute(s) {
  let max = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) break;
      seen.add(s[j]);
      max = Math.max(max, j - i + 1);
    }
  }
  return max;
}
```
**Time:** O(n²) · **Space:** O(k)

### Approach 2 — Sliding Window (optimal) ✅

**Definition of the Sliding Window:** A window defined by two pointers that expands on the right and shrinks on the left, so each element is visited at most twice — giving O(n).

**Idea:** Grow the window with `right`. If the new character is already inside the window, jump `left` past its previous occurrence.

```js
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();     // char → its last index
  let left = 0;
  let max = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // If we've seen it INSIDE the current window, shrink from the left
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }

    lastSeen.set(char, right);
    max = Math.max(max, right - left + 1);
  }

  return max;
}
```
**Time:** O(n) ✅ · **Space:** O(k)

**How it works** on `"abcabcbb"`:

| right | char | left | window | max |
|---|---|---|---|---|
| 0 | a | 0 | "a" | 1 |
| 1 | b | 0 | "ab" | 2 |
| 2 | c | 0 | "abc" | **3** |
| 3 | a | 1 | "bca" | 3 |
| 4 | b | 2 | "cab" | 3 |
| 5 | c | 3 | "abc" | 3 |
| 6 | b | 5 | "cb" | 3 |
| 7 | b | 7 | "b" | 3 |

**Key insight:** The `>= left` check is essential. Without it, a character seen *before* the window starts would wrongly move `left` backwards.

---

## Q18. Longest Common Prefix

**Problem:** Find the longest common prefix among an array of strings.

**Example:** `["flower", "flow", "flight"]` → `"fl"`

### Approach 1 — Vertical Scanning (optimal) ✅

**Idea:** Compare character by character across **all** strings at the same position. Stop at the first mismatch.

```js
function longestCommonPrefix(strs) {
  if (!strs || strs.length === 0) return "";

  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];

    for (let j = 1; j < strs.length; j++) {
      // Stop if a string is too short OR the character differs
      if (i === strs[j].length || strs[j][i] !== char) {
        return strs[0].slice(0, i);
      }
    }
  }
  return strs[0];       // the first string IS the prefix
}
```
**Time:** O(S) where S = total characters · **Space:** O(1) ✅

### Approach 2 — Sort and compare the ends

**Idea:** After sorting alphabetically, only the **first** and **last** strings need comparing — they are the most different, so their common prefix is the answer for all.

```js
function longestCommonPrefixSort(strs) {
  if (!strs.length) return "";

  strs.sort();
  const first = strs[0];
  const last = strs[strs.length - 1];

  let i = 0;
  while (i < first.length && first[i] === last[i]) i++;

  return first.slice(0, i);
}
```
**Time:** O(n log n · m) · **Space:** O(1) — clever, but slower

**Key insight:** Vertical scanning exits early. If the first two strings share nothing, it returns immediately without touching the rest.

---

## Q19. String Compression (Run-Length Encoding)

**Problem:** Compress a string by replacing runs of repeated characters with the character followed by the count. Return the original if the compressed version is not shorter.

**Example:** `"aabcccccaaa"` → `"a2b1c5a3"`

### Approach — Two Pointers ✅

```js
function compress(str) {
  if (!str) return str;

  const parts = [];       // build in an array, NOT with += (avoids O(n²))
  let i = 0;

  while (i < str.length) {
    const char = str[i];
    let count = 0;

    // Count how long this run of the same character is
    while (i < str.length && str[i] === char) {
      count++;
      i++;
    }

    parts.push(char, count);
  }

  const compressed = parts.join("");
  return compressed.length < str.length ? compressed : str;
}
```
**Time:** O(n) · **Space:** O(n)

**How it works** on `"aabcccccaaa"`: `a×2` → `"a2"` · `b×1` → `"b1"` · `c×5` → `"c5"` · `a×3` → `"a3"` → `"a2b1c5a3"` (8 chars < 11) ✅

**Key insight:** Using `parts.push()` + `join("")` instead of `result += char` is the performance point interviewers watch for — string concatenation in a loop creates a new string every time.

---

## Q20. Check if One String is a Rotation of Another

**Problem:** Is `s2` a rotation of `s1`?

**Example:** `"waterbottle"`, `"erbottlewat"` → `true`

### Approach — The Concatenation Trick ✅

**Idea:** Every rotation of `s1` appears as a substring of `s1 + s1`.

```js
function isRotation(s1, s2) {
  if (s1.length !== s2.length) return false;
  return (s1 + s1).includes(s2);
}
```
**Time:** O(n) with an efficient substring search · **Space:** O(n)

**How it works:**
```
s1 + s1 = "waterbottlewaterbottle"
                 └──────────┘
                 "erbottlewat" is inside it  ✅
```

**Key insight:** This is the classic "aha" question. Doubling the string contains every possible rotation exactly once.

---

## Q21. Reverse Words in a String

**Problem:** Reverse the order of words. Remove leading, trailing and duplicate spaces.

**Example:** `"  the   sky  is blue  "` → `"blue is sky the"`

### Approach 1 — Built-ins

```js
function reverseWords(s) {
  return s
    .trim()                 // remove leading/trailing spaces
    .split(/\s+/)           // split on ONE OR MORE spaces
    .reverse()
    .join(" ");
}
```
**Time:** O(n) · **Space:** O(n)

### Approach 2 — Manual (when built-ins are banned)

```js
function reverseWordsManual(s) {
  const words = [];
  let current = "";

  for (const char of s) {
    if (char === " ") {
      if (current) { words.push(current); current = ""; }   // end of a word
    } else {
      current += char;
    }
  }
  if (current) words.push(current);       // the last word

  // Reverse the array in place with two pointers
  let left = 0, right = words.length - 1;
  while (left < right) {
    [words[left], words[right]] = [words[right], words[left]];
    left++; right--;
  }

  return words.join(" ");
}
```
**Time:** O(n) · **Space:** O(n)

**Key insight:** `split(/\s+/)` (regex) handles multiple spaces; `split(" ")` would produce empty strings.

---

## Q22. Group Anagrams

**Problem:** Group strings that are anagrams of each other.

**Example:**
```
Input:  ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
```

### Approach 1 — Sorted string as the key ✅

**Idea:** All anagrams produce the **same string when sorted**, so the sorted form is a perfect grouping key.

```js
function groupAnagrams(strs) {
  const groups = new Map();

  for (const str of strs) {
    const key = str.split("").sort().join("");    // "eat" → "aet", "tea" → "aet"

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }

  return [...groups.values()];
}
```
**Time:** O(n · k log k) where k = average word length · **Space:** O(n·k)

### Approach 2 — Character count as the key (faster for long words)

**Idea:** Avoid sorting by building a count signature instead: `"a2e1t1"`.

```js
function groupAnagramsCount(strs) {
  const groups = new Map();

  for (const str of strs) {
    const count = new Array(26).fill(0);

    for (const char of str) {
      count[char.charCodeAt(0) - 97]++;     // 'a' is char code 97
    }

    const key = count.join("#");            // "#" prevents 1,11 vs 11,1 collisions
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }

  return [...groups.values()];
}
```
**Time:** O(n · k) ✅ — no sorting · **Space:** O(n·k)

**Key insight:** Choosing the right **hash key** is the whole problem. The `"#"` separator matters: without it, counts `[1,11]` and `[11,1]` would both become `"111"`.

---

## String patterns summary

| Pattern | When to use it | Questions here |
|---|---|---|
| **Two pointers** | Palindromes, reversing, in-place work | Q13, Q14 |
| **Frequency map** | Anagrams, counting, uniqueness | Q15, Q16, Q22 |
| **Sliding window** | Longest/shortest substring with a condition | Q17 |
| **Character-by-character scan** | Prefixes, compression | Q18, Q19 |
| **Concatenation trick** | Rotations | Q20 |
| **Hash key design** | Grouping related items | Q22 |
| **Array + join** | Building strings in a loop | Q19, Q21 |

---

**Next:** [Part 3 — HashMap, Searching & Sorting (Q23–Q32)](Top50-03-HashMap-Search-Sort.md) · [Index](README.md)
