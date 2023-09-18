# what is debouncing?

Debouncing can be applied to input events as well, allowing you to delay the execution of a function until the user has finished typing or made a pause in their input. This can be useful for scenarios like live search suggestions or real-time filtering of data.
Here's an example of debouncing an input event in JavaScript:


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debouncing</title>
</head>
<body>
    <input type="text" id="search" placeholder="enter data">
    <ul id="output"></ul>
</body>
</html>
<script>
    const search=document.getElementById("search");
    const output=document.getElementById("output")
    search.addEventListener("input",handle)
    let timer;
    function handle(){
        clearTimeout(timer)
        timer=setTimeout(()=>{
        // console.log(search.value)
        show()
        },700)
    }
    function show(){
        let res=search.value;
        output.innerHTML='';
        
            const li=document.createElement('li')
            li.textContent=res;
            output.appendChild(li)
        
    }
