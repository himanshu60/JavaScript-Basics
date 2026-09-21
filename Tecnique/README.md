# Technique — JavaScript Practice Problems

Small standalone scripts solving common JavaScript interview tasks. Run any of them with `node filename.js`.

> The filenames are short, so this table says what each one actually solves.

| File | Problem | Key technique |
|---|---|---|
| [arr2obj.js](arr2obj.js) | Convert an array into an object | `reduce` / index as key |
| [async.js](async.js) | Async/await practice | Promises, `await` |
| [clone.js](clone.js) | Deep clone a nested object | `JSON.parse(JSON.stringify())` |
| [count2.js](count2.js) | Count occurrences of each element | Frequency map with an object |
| [dublicateGreater1.js](dublicateGreater1.js) | Find elements appearing more than once | Frequency count + filter |
| [eventListner.html](eventListner.html) | DOM event handling | `addEventListener` |
| [filter.js](filter.js) | Filter an array by a condition | `Array.filter` |
| [keyvalue.js](keyvalue.js) | Iterate over object keys and values | `Object.entries` |
| [matchArray.js](matchArray.js) | Compare two arrays for common items | Includes / filter |
| [mergeArray.js](mergeArray.js) | Merge two arrays | Spread / `concat` |
| [mergeFuncArray.js](mergeFuncArray.js) | Merge arrays inside a function | Spread, rest parameters |
| [n.js](n.js) | Small number/logic exercise | Basic loops |
| [promise.js](promise.js) | Promise chaining and resolution | `.then`, `.catch` |
| [splitArr.js](splitArr.js) | Split an array into chunks | `slice` in a loop |
| [unsortArray.js](unsortArray.js) | Work with an unsorted array | Sorting / iteration |
| [yearfilter.js](yearfilter.js) | Filter records by year | `filter` + date handling |

---

## Worth knowing about these solutions

A few of these use approaches that work but have caveats an interviewer would raise:

**`clone.js` — the JSON deep clone trick**
`JSON.parse(JSON.stringify(obj))` works for plain data, but it silently loses `undefined`, functions and `Symbol` values, turns `Date` into a string, breaks `Map`/`Set`, and throws on circular references. The modern answer is **`structuredClone(obj)`**.
→ Full comparison: [ShallowVsDeepCopy.md](../JavaScript_Interview_Questions/ShallowVsDeepCopy.md)

**`count2.js` — frequency counting**
Using a plain object works, but `new Map()` is the better answer for dynamic keys — it accepts any key type, keeps insertion order, and has no inherited properties to collide with.
→ [MapSetWeakMapWeakSet.md](../JavaScript_Interview_Questions/MapSetWeakMapWeakSet.md)

**`matchArray.js` — comparing arrays**
If the solution uses `arr.includes()` inside a `filter`, that is **O(n×m)**. Converting one array to a `Set` first makes lookups O(1) and the whole thing O(n+m). This is the single most common optimisation asked for.
→ [Q24 Intersection of Two Arrays](../DSA_Questions/Top50-03-HashMap-Search-Sort.md)

---

## Related practice

| Where | What |
|---|---|
| [../DSA_Questions/](../DSA_Questions/) | **Top 50 questions** with brute force + optimal solutions and complexity |
| [../JavaScript_Interview_Questions/](../JavaScript_Interview_Questions/) | The concepts behind these techniques |
| [../Python_Interview_Questions/](../Python_Interview_Questions/) | `Palindrome.py`, `Prime.py` |
