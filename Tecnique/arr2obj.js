let arr=[1,2,2,3,3,4,4,4,4,5]
let obj={};

arr.forEach((item)=>{
    obj[item]=(obj[item]||0)+1
})
console.log(obj)