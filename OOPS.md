# "OOP," which stands for Object-Oriented Programming. Object-Oriented Programming is a fundamental programming paradigm that is widely used in JavaScript and many other programming languages.

Here's a simple explanation of Object-Oriented Programming (OOP) in JavaScript:

1. **Objects:** In OOP, you organize your code into objects. Objects are like containers that can hold both data (called properties or attributes) and functions (called methods). These objects are designed to model real-world entities or concepts.

2. **Classes:** Classes are like blueprints for creating objects. They define the structure and behavior of objects. In JavaScript, classes were introduced in ECMAScript 6 (ES6), making it easier to create and work with objects.

3. **Encapsulation:** Encapsulation is the concept of bundling data (properties) and the methods (functions) that operate on that data together within an object. This helps in hiding the internal details of an object and providing a clean interface for interacting with it.

4. **Inheritance:** Inheritance allows you to create new classes based on existing classes. This is a way to reuse code and create a hierarchy of objects. In JavaScript, you can achieve inheritance using the `extends` keyword.

5. **Polymorphism:** Polymorphism means that different objects can respond to the same method or function call in a way that's specific to their individual types. This is achieved through method overriding and dynamic dispatch.

Here's a simple example of OOP in JavaScript:

```javascript
// Define a class
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound.`);
  }
}

// Create objects based on the class
const dog = new Animal("Dog");
const cat = new Animal("Cat");

// Call methods on objects
dog.speak(); // Output: "Dog makes a sound."
cat.speak(); // Output: "Cat makes a sound."
```

In this example, `Animal` is a class, and `dog` and `cat` are objects created from that class. They have a `speak` method that can be called on each object to make them produce a sound. This is a simple illustration of OOP principles in JavaScript.


<------------------------------------------------------------------------------------------------------------------>
# Example:-

Let's create a simple JavaScript example that demonstrates Object-Oriented Programming (OOP) concepts with a "Car" class and a "SportsCar" subclass. In this example, we'll cover inheritance, encapsulation, and polymorphism.

```javascript
// Base class "Car"
class Car {
  constructor(make, model) {
    this.make = make;
    this.model = model;
    this.speed = 0; // Encapsulated attribute
  }

  // Encapsulated method to get speed
  getSpeed() {
    return this.speed;
  }

  // Method to start the car
  start() {
    console.log(`${this.make} ${this.model} is starting.`);
  }

  // Method to stop the car
  stop() {
    console.log(`${this.make} ${this.model} is stopping.`);
  }

  // Polymorphic method for driving
  drive() {
    console.log(`${this.make} ${this.model} is driving at ${this.speed} mph.`);
  }
}

// Subclass "SportsCar" inheriting from "Car"
class SportsCar extends Car {
  constructor(make, model) {
    super(make, model); // Call the parent class constructor
    this.isTurboEnabled = false;
  }

  // Method to enable turbo boost
  enableTurboBoost() {
    this.isTurboEnabled = true;
    console.log(`${this.make} ${this.model} turbo boost is enabled.`);
  }

  // Override the drive method to include turbo if enabled
  drive() {
    if (this.isTurboEnabled) {
      console.log(`${this.make} ${this.model} is driving FAST at ${this.speed} mph with turbo!`);
    } else {
      super.drive(); // Call the parent class's drive method
    }
  }
}

// Create instances of "Car" and "SportsCar"
const myCar = new Car("Toyota", "Camry");
const mySportsCar = new SportsCar("Ferrari", "488 GTB");

// Access and modify attributes
myCar.speed = 60;
mySportsCar.speed = 120;

// Using methods
myCar.start();
mySportsCar.start();

myCar.drive();
mySportsCar.drive();

myCar.stop();
mySportsCar.stop();

// Enable turbo boost for the sports car
mySportsCar.enableTurboBoost();
mySportsCar.drive();
```

In this example:

- We have a base class "Car" with attributes like "make," "model," and "speed." The "speed" attribute is encapsulated and can be accessed using the `getSpeed` method.

- The "Car" class has methods like "start," "stop," and "drive." The "drive" method demonstrates polymorphism.

- We create a subclass "SportsCar" that inherits from "Car." It adds its own attribute "isTurboEnabled" and methods like "enableTurboBoost." We override the "drive" method in the "SportsCar" class to include turbo when it's enabled.

- We create instances of both "Car" and "SportsCar" and showcase how methods and attributes are used for each.

This example illustrates inheritance, encapsulation, and polymorphism in a simple JavaScript OOP context with "Car" and "SportsCar" classes.

