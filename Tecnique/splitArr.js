let arr=[1,2,3,4,5,6,7,8,9,10]

function splitArray(arr){
    let sp=3;
    let res=[];
    for(let i=0;i<arr.length;i+=sp){
    res.push(arr.slice(i,i+sp))
    }
    return res
}

let data=splitArray(arr);
console.log(data)