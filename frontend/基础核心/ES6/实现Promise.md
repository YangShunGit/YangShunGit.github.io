实现一个符合 Promise/A+ 规范的 Promise 核心在于模拟其 **状态管理**、**异步回调执行** 和 **链式调用机制**。以下是详细的实现思路和核心代码解析：


### **一、Promise 核心特性**
在实现前，先明确 Promise 的核心规则：
1. **三种状态**：`pending`（初始）、`fulfilled`（成功）、`rejected`（失败）。状态一旦改变（从 `pending` → `fulfilled` 或 `pending` → `rejected`），就不可再变。
2. **回调异步执行**：`then` 方法注册的回调（`onFulfilled`/`onRejected`）必须在本轮事件循环结束后执行（微任务）。
3. **链式调用**：`then` 方法必须返回一个新的 Promise，以支持链式调用（前一个 Promise 的结果会传递给下一个）。
4. **值穿透**：如果 `then` 没有提供对应状态的回调（如只传了 `onFulfilled`），则结果会“穿透”到下一个 `then`。


### **二、实现步骤与核心代码**
#### **1. 定义状态常量与基本结构**
首先用常量定义三种状态，避免魔法值；Promise 类的构造函数接收一个 `executor` 函数（立即执行），并初始化状态、结果和回调队列。

```javascript
// 定义状态常量
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    // 初始状态为 pending
    this.status = PENDING;
    // 存储成功结果
    this.value = undefined;
    // 存储失败原因
    this.reason = undefined;
    // 存储 pending 状态时注册的回调（支持多个 then 调用）
    this.onFulfilledCallbacks = []; // 成功回调队列
    this.onRejectedCallbacks = [];  // 失败回调队列

    // 定义 resolve 方法（改变状态为成功）
    const resolve = (value) => {
      // 状态只能从 pending 改变
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        // 执行所有缓存的成功回调（异步）
        this.onFulfilledCallbacks.forEach(cb => cb());
      }
    };

    // 定义 reject 方法（改变状态为失败）
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        // 执行所有缓存的失败回调（异步）
        this.onRejectedCallbacks.forEach(cb => cb());
      }
    };

    // 立即执行 executor，捕获执行中的错误
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error); // 若 executor 执行出错，直接 reject
    }
  }
}
```


#### **2. 实现 then 方法（核心）**
`then` 方法是 Promise 链式调用的核心，需要处理三种情况：
- 当状态为 `pending`：缓存回调，等待状态改变后执行。
- 当状态为 `fulfilled`/`rejected`：直接异步执行对应回调。
- 返回一个新的 Promise，以支持链式调用。

```javascript
class MyPromise {
  // ... 构造函数部分省略 ...

  then(onFulfilled, onRejected) {
    // 处理回调未传递的情况（值穿透）
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // then 必须返回新的 Promise，实现链式调用
    const newPromise = new MyPromise((resolve, reject) => {
      // 封装回调执行逻辑（处理异步和结果传递）
      const executeCallback = (callback, result) => {
        // 回调必须异步执行（这里用 queueMicrotask 模拟微任务）
        queueMicrotask(() => {
          try {
            const callbackResult = callback(result);
            // 关键：根据回调返回值，决定新 Promise 的状态
            this.resolvePromise(newPromise, callbackResult, resolve, reject);
          } catch (error) {
            // 回调执行出错，直接 reject 新 Promise
            reject(error);
          }
        });
      };

      // 根据当前状态执行对应逻辑
      if (this.status === FULFILLED) {
        // 状态已成功，直接执行 onFulfilled
        executeCallback(onFulfilled, this.value);
      } else if (this.status === REJECTED) {
        // 状态已失败，直接执行 onRejected
        executeCallback(onRejected, this.reason);
      } else {
        // 状态为 pending，缓存回调（等待 resolve/reject 触发）
        this.onFulfilledCallbacks.push(() => {
          executeCallback(onFulfilled, this.value);
        });
        this.onRejectedCallbacks.push(() => {
          executeCallback(onRejected, this.reason);
        });
      }
    });

    return newPromise;
  }

  // 处理回调返回值与新 Promise 的关系（核心逻辑）
  resolvePromise(newPromise, callbackResult, resolve, reject) {
    // 避免循环引用（如回调返回 newPromise 本身）
    if (newPromise === callbackResult) {
      return reject(new TypeError('Chaining cycle detected for promise'));
    }

    // 如果回调返回的是一个 Promise
    if (callbackResult instanceof MyPromise) {
      // 新 Promise 的状态跟随返回的 Promise
      callbackResult.then(resolve, reject);
    } else {
      // 否则直接 resolve 新 Promise
      resolve(callbackResult);
    }
  }
}
```


#### **3. 实现 catch 方法（语法糖）**
`catch` 本质是 `then(null, onRejected)` 的简写，用于捕获前序 Promise 的错误。

```javascript
class MyPromise {
  // ... 其他方法省略 ...

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
```


#### **4. 实现静态方法（如 resolve/reject）**
提供快速创建已决议/已拒绝 Promise 的工具方法。

```javascript
class MyPromise {
  // ... 其他方法省略 ...

  // 创建一个已成功的 Promise
  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  // 创建一个已失败的 Promise
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}
```


### **三、核心逻辑解析**
1. **状态管理**：  
   通过 `status` 属性控制状态，`resolve`/`reject` 只能在 `pending` 状态下改变状态，且一旦改变不可逆转。

2. **异步回调**：  
   回调通过 `queueMicrotask` 放入微任务队列，确保在本轮同步代码执行完后再执行（符合规范）。

3. **链式调用**：  
   每个 `then` 返回新的 `MyPromise`，新 Promise 的状态由前一个 `then` 的回调返回值决定：  
   - 若返回普通值：新 Promise 立即 `fulfilled` 该值。  
   - 若返回 Promise：新 Promise 状态跟随其状态。  
   - 若回调抛出错误：新 Promise 立即 `rejected` 该错误。

4. **值穿透**：  
   当 `then` 未提供 `onFulfilled` 或 `onRejected` 时，默认回调会把结果/错误传递给下一个 `then`（如 `value => value` 或 `reason => { throw reason }`）。


### **四、测试验证**
实现后可通过以下代码验证基本功能：

```javascript
// 测试 1：基本使用
new MyPromise((resolve, reject) => {
  setTimeout(() => resolve(1), 1000);
})
  .then(value => {
    console.log(value); // 1（1秒后输出）
    return value * 2;
  })
  .then(value => {
    console.log(value); // 2
    throw new Error('出错了');
  })
  .catch(error => {
    console.log(error.message); // 出错了
  });

// 测试 2：值穿透
MyPromise.resolve(10)
  .then() // 未传 onFulfilled，值穿透
  .then(value => console.log(value)); // 10
```


### **五、总结**
Promise 的实现核心是：  
- 用状态机管理 `pending`/`fulfilled`/`rejected` 转换；  
- 用回调队列缓存异步状态下的 `then` 回调；  
- 用新 Promise 承接链式调用，通过回调返回值关联状态；  
- 确保回调异步执行（微任务）。  

这一机制解决了传统回调地狱问题，使异步代码更易读、易维护。实际开发中，浏览器原生 Promise 已完全遵循规范，此处实现仅用于理解其底层原理。