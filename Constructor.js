// A constructor , in simple language, is like a blueprint for creating object in programming.
// Imagine you want to make many houses in a video game. Instead of building each one from scractch ,
// you can create a blueprint(constructor) for a house with all its characteristics.

// Example

// Constructor for creating house objects
function House(color, rooms) {
  this.color = color;
  this.rooms = rooms;
}

// Now you can create houses using the constructor
const myHouse = new House("blue", 3);
const padosiHouse = new House("skyblue", 4);

console.log(myHouse.color);
console.log(padosiHouse.color);
console.log(padosiHouse.rooms);
console.log(myHouse);
