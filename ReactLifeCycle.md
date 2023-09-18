# what is the React lifecycle?

Ans- Here's a simple explanation of the React lifecycle:
1. Mounting: This phase occurs when a component is being created and inserted into the DOM.
   - `constructor()`: Called when the component is being initialized, used for setting initial state and binding methods.
   - `render()`: Renders the component's UI.
   - `componentDidMount()`: Invoked after the component is mounted in the DOM. Used for performing side effects, such as fetching data from an API.

2. Updating: This phase occurs when a component's state or props are updated.
   - `render()`: Re-renders the updated UI.
   - `componentDidUpdate(prevProps, prevState)`: Invoked after the component is updated. Used for handling side effects based on the updated props or state.

3. Unmounting: This phase occurs when a component is being removed from the DOM.
   - `componentWillUnmount()`: Invoked just before the component is unmounted. Used for cleanup tasks, such as removing event listeners or cancelling timers.
