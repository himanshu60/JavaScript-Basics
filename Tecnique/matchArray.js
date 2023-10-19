let arr1 = [1, 2, 3, 4, 5];
let arr2 = [3, 4, 5, 6, 7];

function check(arr1,arr2){
    return arr1.filter((item)=>arr2.includes(item));
}

let ans=check(arr1,arr2)
console.log(ans)