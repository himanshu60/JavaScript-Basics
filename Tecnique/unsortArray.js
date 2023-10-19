let arr1=[1,2,2,5,4,3,4,5];
let arr2=[3,4,4,5,6,7];


function merge(arr1,arr2){
    let dist=new Set();

    for(let item of arr1){
        dist.add(item)
    }
    
    for(let item of arr2){
        dist.add(item)
    }
    
    // console.log(dist)
    
    let sorted=[...dist]
    // console.log(sorted)
    for(let i=0;i<sorted.length-1;i++){
        for(let j=0;j<sorted.length-i-1;j++){
            if(sorted[j]>sorted[j+1]){
                let temp=sorted[j];
                sorted[j]=sorted[j+1];
                sorted[j+1]=temp;
            }
        }
        
    }

    return sorted
}

let ans=merge(arr1,arr2);
console.log(ans)



