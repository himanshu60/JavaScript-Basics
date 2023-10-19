
const arr = [1, 2, 2,2,2,2, 3, 4, 4, 4, 5, 6, 6, 7];
 
let obj={};

for(let key of arr){
  if(obj[key]){
    obj[key]++;
  }else{
    obj[key]=1
  }
}
// console.log(obj)
let ans=obj[2];
console.log(`the number apperear 2  ${ans}times`)