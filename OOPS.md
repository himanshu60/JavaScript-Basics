# OOPS:-
Object-Oriented Programming (OOP) is a programming paradigm that organizes code into objects, which are instances of classes. OOP encourages the use of objects to represent real-world entities and their interactions. It's based on several key principles, known as the "four pillars" of OOP:

# 1.Simple words OOPS:-
These OOP concepts help you organize and structure your code by modeling real-world entities as objects and defining their attributes and behaviors through classes. This approach enhances code reusability, readability, and maintainability while making it easier to manage complex systems.

# 2.Simple words OOPS:-
Object-Oriented Programming is like organizing and modeling your code to work with objects, just as you interact with objects in everyday life. It helps you build software by breaking it into manageable pieces (objects and classes) that have their own characteristics (attributes) and actions (methods). This approach makes your code easier to understand, maintain, and reuse.


**1. Objects:**
   - **Technical Explanation:** An object is an instance of a class. It's a self-contained unit that combines data (attributes) and code (methods/functions) to represent a real-world entity or concept in your program.
   - **Example:** Imagine a "Car" class. An object of this class would represent a specific car with attributes like "color" and "speed," and methods like "start" and "stop."

**2. Classes:**
   - **Technical Explanation:** A class is a blueprint or template that defines the structure and behavior of objects. It specifies what attributes and methods objects of that class will have.
   - **Example:** The "Car" class defines that all cars will have attributes like "color" and "speed" and methods like "start" and "stop."

**3. Encapsulation:**
   - **Technical Explanation:** Encapsulation is the practice of bundling data (attributes) and the methods that operate on that data into a single unit (an object or class). It protects data from unauthorized access and modification.
   - **Example:** In the "Car" class, you can have a private attribute called "fuelLevel," and only the class's methods can access or modify it.

**4. Inheritance:**
   - **Technical Explanation:** Inheritance allows you to create a new class (subclass or child class) based on an existing class (superclass or parent class). The child class inherits attributes and methods from the parent class and can also add its own.
   - **Example:** You can create a "SportsCar" class that inherits from the "Car" class. It gets all the "Car" class's attributes and methods and can add new ones like "turboBoost."

**5. Polymorphism:**
   - **Technical Explanation:** Polymorphism means that different objects can respond to the same method or function name in a way that's appropriate for their specific type. It allows you to write code that works with objects generically.
   - **Example:** Both a "Car" object and a "Truck" object can have a "drive" method, but they perform driving differently based on their types.

**6. Abstraction:**
   - **Technical Explanation:** Abstraction is the process of simplifying complex systems by modeling classes based on their essential features and hiding unnecessary details. It provides a clear and simplified view of objects.
   - **Example:** When using a "RemoteControl" class, you don't need to understand the inner workings of each device you control (TV, DVD player). You abstract away those details and interact with the remote control's methods like "powerOn" and "volumeUp."


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

