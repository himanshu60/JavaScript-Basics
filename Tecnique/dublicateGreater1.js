function countDuplicateElements(arr) {
    let obj={};
    for(let key of arr){
        if(obj[key]){
            obj[key]++;
        }else{
            obj[key]=1
        }
    }
    let duplicate={};
    for(let key in obj){
        if(obj[key]>1){
            duplicate[key]=obj[key]
        }
    }  
     return duplicate
  }
  
  const arr = [1, 2, 2, 3, 4, 4, 4, 5, 6, 6, 7];
  const duplicateElementCounts = countDuplicateElements(arr);
  
  console.log(duplicateElementCounts);
  