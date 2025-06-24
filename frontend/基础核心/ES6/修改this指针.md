`bind`、`call`、`apply` 是 JavaScript 中用于改变函数上下文（`this` 指向）的三个核心方法，常用于函数复用、继承和高阶函数开发。以下是详细解析：


### **一、核心概念与区别**
| 方法   | 立即执行？ | 参数传递方式               | 返回值                 |
|--------|------------|----------------------------|------------------------|
| `call` | ✅          | 逐个参数传入（如 `fn.call(obj, a, b)`） | 函数执行结果           |
| `apply`| ✅          | 数组形式传入（如 `fn.apply(obj, [a, b])`） | 函数执行结果           |
| `bind` | ❌          | 逐个参数传入（如 `fn.bind(obj, a, b)`） | 绑定 `this` 后的新函数 |


### **二、代码示例与应用场景**
#### **1. `call` 方法**
```javascript
// 语法：fn.call(thisArg, arg1, arg2, ...)
const person = { name: 'Alice' };

function greet(message) {
  console.log(`${message}, ${this.name}`);
}

greet.call(person, 'Hello'); // 输出：Hello, Alice
```
**应用场景**：
- **继承**：子类调用父类构造函数。
```javascript
function Animal(name) {
  this.name = name;
}

function Dog(name, breed) {
  Animal.call(this, name); // 继承 Animal 的属性
  this.breed = breed;
}

const dog = new Dog('Buddy', 'Labrador');
console.log(dog.name); // 输出：Buddy
```

#### **2. `apply` 方法**
```javascript
// 语法：fn.apply(thisArg, [argsArray])
const numbers = [5, 6, 2, 3, 7];

// 求数组最大值（利用 Math.max）
const max = Math.max.apply(null, numbers);
console.log(max); // 输出：7
```
**应用场景**：
- **数组操作**：将数组作为参数传递给可变参数函数。
- **类数组转换**：将类数组对象转为真正的数组。
```javascript
function sum() {
  const args = Array.prototype.slice.apply(arguments); // 转为数组
  return args.reduce((acc, val) => acc + val, 0);
}

sum(1, 2, 3); // 输出：6
```

#### **3. `bind` 方法**
```javascript
// 语法：fn.bind(thisArg, arg1, arg2, ...)
const button = {
  text: 'Click me',
  click() {
    console.log(`Button ${this.text} clicked`);
  }
};

const boundClick = button.click.bind(button);
document.querySelector('button').addEventListener('click', boundClick);
```
**应用场景**：
- **事件处理**：确保回调函数的 `this` 指向正确对象。
- **偏函数（Partial Application）**：预设部分参数。
```javascript
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2); // 预设第一个参数为 2
console.log(double(5)); // 输出：10
```


### **三、手写实现（面试高频）**
#### **1. 实现 `call` 方法**
```javascript
Function.prototype.myCall = function(context = window, ...args) {
  // 1. 将函数挂载到 context 上（this 指向调用 myCall 的函数）
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // 2. 执行函数并获取结果
  const result = context[fnSymbol](...args);
  
  // 3. 删除临时属性并返回结果
  delete context[fnSymbol];
  return result;
};

// 测试
function greet(msg) {
  console.log(`${msg}, ${this.name}`);
}
const obj = { name: 'Bob' };
greet.myCall(obj, 'Hi'); // 输出：Hi, Bob
```

#### **2. 实现 `apply` 方法**
```javascript
Function.prototype.myApply = function(context = window, args = []) {
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  const result = context[fnSymbol](...args);
  delete context[fnSymbol];
  return result;
};

// 测试
const numbers = [1, 2, 3];
Math.max.myApply(null, numbers); // 输出：3
```

#### **3. 实现 `bind` 方法**
```javascript
Function.prototype.myBind = function(context = window, ...args) {
  const self = this;
  
  // 返回一个新函数
  return function(...newArgs) {
    // 支持 new 调用（若作为构造函数，this 应指向新实例）
    if (this instanceof self) {
      return new self(...args, ...newArgs);
    }
    
    // 普通调用，绑定 context
    return self.apply(context, [...args, ...newArgs]);
  };
};

// 测试
function Person(name) {
  this.name = name;
}
const CreatePerson = Person.myBind(null);
const person = new CreatePerson('Charlie');
console.log(person.name); // 输出：Charlie
```


### **四、常见面试问题**
1. **`call` 和 `apply` 的区别是什么？**
   - 答：参数传递方式不同，`call` 逐个传参，`apply` 传数组。

2. **为什么需要 `bind` 方法？**
   - 答：用于创建一个永久绑定 `this` 的新函数，常用于异步回调或事件处理中保持上下文。

3. **手写 `bind` 时如何处理 `new` 调用的情况？**
   - 答：通过 `instanceof` 判断函数是否作为构造函数调用，若是则使用 `new` 执行原函数。


### **五、总结**
- **`call/apply`**：适合需要立即执行函数并临时改变 `this` 的场景。
- **`bind`**：适合创建一个固定 `this` 上下文的新函数，延迟执行（如回调函数）。
