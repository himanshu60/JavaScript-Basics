// Example API data
const apiData = [
    { name: "Item 1", year: 1915 },
    { name: "Item 2", year: 1920 },
    { name: "Item 3", year: 1915 },
    // ... more data
  ];
  
// let filterdata=apiData.filter((item)=>item.year!==1915);
// console.log(filterdata)
  
fetch(apiData)
.then((res)=>{
    if(!res.ok){
        throw new Error(`res is not ok`)
    }else{
        return res.json()
    }
})
.then((data)=>{
    let ans=data.filter((item)=>item.year===1915)
    console.log(ans)
})
.catch((err)=>{
    console.log(err)
})

