# In Js closure is a concept that describe how functions remember and can access variables  from their containing or outer scopes, even after the outer function has finished executing. closure allow you to create and maintain private data within functions and are a fundamental part of Javascript 


## Example-1
```
function outerFunc(){
    // This variable is part of the outer function's scope.
    var outVariable="I am from outer function";
    // Inner function declared inside the outer function.
    function innerFunc(){
        // The inner function can access the outerVariable, creating a closure.
        console.log(outVariable);
    }
    // Return the inner function, which still has access to outerVariable.
    return innerFunc;
}
// Create a closure by calling outerFunction and storing the result in a variable.
var closure=outerFunc();
```
## Now, you can use the closure to access outerVariable even though outerFunction has finished executing.
```
closure();// Outputs: "I am from the outer function"

```


## Example2

```
function counter(){
    let count=0;
    function increment(){
        count++;
        console.log(count);
    }
    return increment;
}

var res=counter();
var ans=counter();

res();//1
res();//2

ans();//1
res();//3
ans();//2
```

