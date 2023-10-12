"Prop drilling" in React is a situation where you have to pass data from one component to another through many intermediary (middle) components. It's like a message relay race in which each runner passes the baton to the next runner until it reaches the final runner.

Here's a simple explanation:

Imagine you have three components: Grandparent, Parent, and Child.

- The Grandparent has some data.
- The Parent needs that data to do something.
- The Child also needs that data but can't get it directly from the Grandparent.

In this scenario, you pass the data from the Grandparent to the Parent and then from the Parent to the Child. This process of passing the data through the Parent, which doesn't use the data itself, is called "prop drilling."

In code, it looks something like this:

```jsx
// Grandparent.js
function Grandparent() {
  const data = 'Hello from Grandparent!';
  return <Parent data={data} />;
}

// Parent.js
function Parent({ data }) {
  return <Child data={data} />;
}

// Child.js
function Child({ data }) {
  return <div>{data}</div>;
}
```

In this example, the data flows from the Grandparent through the Parent to the Child via props, even though the Parent doesn't actually use the data. This can make the code more complex and harder to manage when you have many components in between passing the data, which is why it's called "prop drilling."