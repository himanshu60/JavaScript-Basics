//   Method 2


let arr1=[1,2,2,3,4,5];
let arr2=[3,4,4,5,6,7];

let distSet=new Set();

for(let el of arr1){
    distSet.add(el)
}

for(let el of arr2){
    distSet.add(el)
}

let ans=[...distSet];
console.log(ans)








// Two arrays with some duplicate elements
// const arr1 = [1, 2, 2, 3, 4, 5];
// const arr2 = [3, 4, 4, 5, 6, 7];

// // Create a Set to store distinct elements
// const distinctSet = new Set();

// // Iterate through the first array and add elements to the Set
// for (const element of arr1) {
//   distinctSet.add(element);
// }

// // Iterate through the second array and add elements to the Set
// for (const element of arr2) {
//   distinctSet.add(element);
// }

// // Convert the Set back to an array
// const distinctArray = [...distinctSet];

// console.log(distinctArray);
