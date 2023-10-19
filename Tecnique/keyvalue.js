let arr=[1,2,2,3,3,3,4,4];

let obj={};

for(let item of arr){
    if(obj[item]){
      obj[item]++
    }else{
        obj[item]=1
    }
}

// for(let i=0;i<arr.length;i++){
//     if(obj[arr[i]]){
//         obj[arr[i]]++
//     }else{
//         obj[arr[i]]=1
//     }
// }
console.log(obj)