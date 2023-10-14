# neeted html pages

## 1 
<iframe src="child.html"></iframe>

## 2
// Using JavaScript to load a nested page into a <div> element
var container = document.getElementById("container");
var iframe = document.createElement("iframe");
iframe.src = "child.html";
container.appendChild(iframe);
