function deepClone(obj){
    return JSON.parse(JSON.stringify(obj))
}

let obj={
    name:'himmu',
    age:22,
    address:{
        city:'mzn'
    }
}

let ans=deepClone(obj)
console.log(ans)



// function deepClone(obj) {
//     // Serialize the object to JSON and then parse it back
//     return JSON.parse(JSON.stringify(obj));
//   }
  
//   // Example usage:
//   const originalObject = {
//     name: 'himanshu',
//     age: 22,
//     address: {
//       city: 'mzn',
//       zip: '10001'
//     }
//   };
  
//   const clonedObject = deepClone(originalObject);
//   console.log(clonedObject);
  