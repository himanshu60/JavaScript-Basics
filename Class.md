// Define a class called 'Person'
class Person {
  // Constructor method to initialize object properties
  constructor(firstName, lastName, age) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }

  // Method to display the full name of the person
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Method to check if the person is an adult
  isAdult() {
    return this.age >= 18;
  }
}

// Create an instance of the 'Person' class
const person1 = new Person("Himanshu", "Choudhary", 30);

// Access properties and methods of the instance
console.log(person1.firstName); // Output: "Himanshu"
console.log(person1.fullName()); // Output: "Himanshu Choudhary"
console.log(person1.isAdult()); // Output: true

// Example 2

class Car {
  constructor(make, type, year) {
    this.make = make;
    this.type = type;
    this.year = year;
    this.speed = 0;
  }
  acceleration() {
    this.speed += 10;
  }
  break() {
    this.speed -= 5;
  }
  getStatus() {
    return `${this.make} ${this.type} model is ${this.year} at travelling ${this.speed} km/h`;
  }
}

const myCar = new Car("suzuki", "Maruti", 2010);
myCar.acceleration();
myCar.acceleration();
myCar.break();
console.log(myCar.getStatus());
