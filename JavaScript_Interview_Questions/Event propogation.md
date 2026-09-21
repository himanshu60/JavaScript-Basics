# In JavaScript, event propagation refers to the process by which events are handled and propagated through the DOM (Document Object Model) tree. When an event is triggered on an element, it can be handled at that specific element, and then it may propagate up to its parent elements (bubbling) or propagate down from the topmost ancestor to the target element (capturing).

## There are three phases of event propagation:

Capturing phase: The event is captured from the topmost ancestor down to the target element.
Target phase: The event reaches the target element.
Bubbling phase: The event bubbles up from the target element to the topmost ancestor.
The event propagation is controlled by the addEventListener method, which takes an optional third parameter that specifies the event's propagation phase:

Use true to add the event listener in the capturing phase.
Use false (default) or omit the third parameter to add the event listener in the bubbling phase.
