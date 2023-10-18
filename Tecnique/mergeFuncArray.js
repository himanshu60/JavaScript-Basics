function mergeArray(arr1, arr2) {
  let merge = [];

  function isElement(el) {
    return merge.includes(el);
  }

  for (let el of arr1) {
    if (!isElement(el)) {
      merge.push(el);
    }
  }

  for (let el of arr2) {
    if (!isElement(el)) {
      merge.push(el);
    }
  }
  // Bubble sort
  for (let i = 0; i < merge.length - 1; i++) {
    for (let j = 0; j < merge.length - i - 1; j++) {
      if (merge[j] > merge[j + 1]) {
        // Swap elements
        const temp = merge[j];
        merge[j] = merge[j + 1];
        merge[j + 1] = temp;
      }
    }
  }
  return merge;
}

let arr1 = [3, 1, 4, 2, 2];
let arr2 = [4, 5, 6, 3, 7];

let ans = mergeArray(arr1, arr2);
console.log(ans);
