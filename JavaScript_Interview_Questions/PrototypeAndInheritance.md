# Prototype and Prototypal Inheritance in JavaScript

## 1. What is a Prototype?

**Definition:** A prototype is an **object** that another object inherits properties and methods from. Every JavaScript object has a hidden internal link pointing to its prototype.

**In simple words:** A prototype is like a "parent" object. If a child does not have something, it asks the parent.

---

## 2. What is the Prototype Chain?

**Definition:** The prototype chain is the series of linked prototype objects that JavaScript searches through when it looks for a property. It keeps going up one level at a time until it finds the property or reaches `null` (the end of the chain).

**In simple words:** You ask a child for a toy. If the child does not have it, they ask their parent. If the parent does not have it, they ask the grandparent. The search stops when someone has it, or when there is nobody left.

```js
const animal = {
  eats: true,
  walk() {
    console.log("Animal walks");
  },
};

const dog = Object.create(animal);   // dog's prototype is animal
dog.barks = true;

console.log(dog.barks); // true            → own property, found immediately
console.log(dog.eats);  // true            → not own, found on the prototype
dog.walk();             // "Animal walks"  → method found on the prototype
console.log(dog.fly);   // undefined       → not found anywhere in the chain
```

**The chain here:** `dog` → `animal` → `Object.prototype` → `null`

---

## 3. What is `__proto__` vs `prototype`?

These two are constantly confused, so learn them separately.

**Definition of `__proto__`:** A property present on **every object** that points to the object it inherits from (its actual prototype). The modern, correct way to read it is `Object.getPrototypeOf(obj)`.

**Definition of `prototype`:** A property present only on **functions and classes**. It is the object that will become the `__proto__` of every object created with `new` from that function.

```js
function Person(name) {
  this.name = name;
}

const p = new Person("Himanshu");

console.log(p.__proto__ === Person.prototype);                 // true
console.log(Object.getPrototypeOf(p) === Person.prototype);    // true (modern way)
console.log(Person.prototype.__proto__ === Object.prototype);  // true
console.log(Object.prototype.__proto__);                       // null ← end of chain
```

| Term | Exists on | Meaning |
|---|---|---|
| `__proto__` | Every object | The object this one inherits FROM |
| `prototype` | Only functions / classes | The object that instances will inherit from |

---

## 4. What is `Object.create()`?

**Definition:** `Object.create(protoObject)` creates a brand-new object and sets `protoObject` as its prototype. It is the most direct way to do prototypal inheritance.

```js
const vehicle = {
  start() {
    console.log("Engine started");
  },
};

const car = Object.create(vehicle);
car.wheels = 4;

car.start();                                    // "Engine started"
console.log(Object.getPrototypeOf(car) === vehicle); // true

// Create an object with NO prototype at all (a clean dictionary)
const dict = Object.create(null);
console.log(dict.toString); // undefined ← no inherited methods
```

---

## 5. What is a Constructor Function?

**Definition:** A constructor function is a normal function meant to be called with the `new` keyword to create objects. By convention its name starts with a capital letter.

**What the `new` keyword actually does (4 steps):**
1. Creates an empty object `{}`.
2. Sets that object's `__proto__` to the function's `prototype`.
3. Runs the function with `this` pointing to the new object.
4. Returns the object automatically (unless you return another object).

```js
function Person(name, age) {
  this.name = name;              // own property → copied into EVERY object
  this.age = age;
}

// Shared method → stored ONCE on the prototype, not repeated per object
Person.prototype.greet = function () {
  console.log("Hello, I am " + this.name);
};

const p1 = new Person("Himanshu", 25);
const p2 = new Person("Rahul", 30);

p1.greet();                          // "Hello, I am Himanshu"
console.log(p1.greet === p2.greet);  // true → same function in memory (saves RAM)
```

**Why put methods on the prototype?** If you write methods inside the constructor, a **new copy** of the function is created for every object. With 1000 objects that is 1000 copies of the same function. On the prototype there is only one.

---

## 6. What is Prototypal Inheritance?

**Definition:** Prototypal inheritance is the mechanism where one object gets access to the properties and methods of another object through the prototype chain, instead of through classes copying definitions (as in Java or C++).

### Inheritance with constructor functions (old way)

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  console.log(this.name + " makes a sound");
};

function Dog(name, breed) {
  Animal.call(this, name);     // STEP 1: borrow the parent constructor
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype); // STEP 2: link the chain
Dog.prototype.constructor = Dog;                 // STEP 3: fix the constructor

Dog.prototype.speak = function () {              // override the parent method
  console.log(this.name + " barks");
};

const d = new Dog("Tommy", "Labrador");
d.speak();                         // "Tommy barks"
console.log(d instanceof Animal);  // true
```

**Terms used:**
- **`Animal.call(this, name)`** — runs the parent constructor with `this` set to the new Dog object, so `name` gets copied in.
- **`instanceof`** — checks whether a constructor's `prototype` appears anywhere in the object's prototype chain.

---

## 7. ES6 Classes (modern syntax, same prototypes underneath)

**Definition:** A `class` is **syntactic sugar** — a nicer syntax over prototypes. It does not add a new inheritance model; underneath, JavaScript still uses prototype chains.

```js
class Animal {
  constructor(name) {           // runs when you use "new"
    this.name = name;
  }

  speak() {                     // automatically goes on Animal.prototype
    console.log(`${this.name} makes a sound`);
  }

  static info() {               // static → belongs to the class, not instances
    return "This is the Animal class";
  }
}

class Dog extends Animal {      // extends → sets up the prototype chain
  constructor(name, breed) {
    super(name);                // super() → calls the parent constructor
    this.breed = breed;
  }

  speak() {
    super.speak();              // call the parent version
    console.log(`${this.name} barks`);
  }
}

const d = new Dog("Tommy", "Labrador");
d.speak();
// "Tommy makes a sound"
// "Tommy barks"

console.log(Animal.info());     // static method is called on the class itself
```

**Keywords explained:**

| Keyword | Definition |
|---|---|
| `class` | A blueprint for creating objects |
| `constructor` | A special method that runs automatically when `new` is used |
| `extends` | Makes one class inherit from another |
| `super()` | Calls the parent class constructor (must run before using `this`) |
| `super.method()` | Calls the parent version of an overridden method |
| `static` | Defines a method/property on the class itself, not on instances |
| `#field` | A truly private field, accessible only inside the class |

```js
class BankAccount {
  #balance = 0;                       // private field

  deposit(amount) {
    this.#balance += amount;
  }
  get balance() {                     // getter → read like a property
    return this.#balance;
  }
}

const acc = new BankAccount();
acc.deposit(500);
console.log(acc.balance);   // 500
// console.log(acc.#balance); // SyntaxError - truly private
```

---

## 8. Useful prototype-related methods

| Method | Definition |
|---|---|
| `Object.getPrototypeOf(obj)` | Returns the prototype of an object |
| `Object.setPrototypeOf(obj, proto)` | Changes an object's prototype (slow, avoid) |
| `Object.create(proto)` | Creates a new object with the given prototype |
| `obj.hasOwnProperty(key)` | `true` only if the key is the object's OWN, not inherited |
| `Object.hasOwn(obj, key)` | Modern, safer replacement for `hasOwnProperty` |
| `obj instanceof Constructor` | Checks if a constructor appears in the prototype chain |
| `Constructor.prototype.isPrototypeOf(obj)` | Checks the chain from the other direction |

```js
const dog = Object.create({ eats: true });
dog.barks = true;

console.log(Object.hasOwn(dog, "barks")); // true
console.log(Object.hasOwn(dog, "eats"));  // false ← inherited, not own

for (const key in dog) console.log(key);  // "barks", "eats" ← for-in includes inherited
console.log(Object.keys(dog));            // ["barks"]     ← only own keys
```

---

## Key points

- JavaScript does inheritance through **prototype links**, not class copying.
- `prototype` is on functions; `__proto__` is on objects.
- Put shared **methods** on the prototype to save memory.
- The chain always ends at `Object.prototype` → `null`.
- `class` is only nicer syntax — prototypes are still working underneath.
- `for...in` walks the whole chain; `Object.keys()` gives only own keys.
