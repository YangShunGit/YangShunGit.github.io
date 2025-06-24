Event Loop（事件循环）是 JavaScript 并发模型的核心机制，用于处理异步任务（如定时器、网络请求、DOM 事件）。理解 Event Loop 是掌握 JS 异步编程的关键，也是面试中的高频考点。


### **一、基础概念**
#### **1. 执行栈（Call Stack）**
- 同步代码的执行环境，遵循“后进先出”原则。
- 函数调用时入栈，返回时出栈。

#### **2. 任务队列（Task Queue）**
- **宏任务队列（MacroTask Queue）**：  
  包含 `setTimeout`、`setInterval`、`setImmediate`（Node.js）、I/O 操作、UI 渲染等。
- **微任务队列（MicroTask Queue）**：  
  包含 `Promise.then`、`MutationObserver`、`process.nextTick`（Node.js）等。

#### **3. 事件循环核心流程**
1. 执行栈清空后，检查微任务队列。
2. 依次执行微任务队列中的所有任务，直到队列为空。
3. 执行一个宏任务（如 `setTimeout` 回调）。
4. 重复步骤 1-3。


### **二、执行流程示例**
```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  Promise.resolve().then(() => console.log('5'));
});

console.log('6');
```
**执行顺序解析**：
1. 同步代码：`console.log('1')` → 输出 `1`。
2. `setTimeout` 放入宏任务队列。
3. `Promise.then` 放入微任务队列。
4. 同步代码：`console.log('6')` → 输出 `6`。
5. 执行栈清空，处理微任务队列：
   - 执行 `Promise.then` 回调 → 输出 `4`。
   - 新的 `Promise.then` 放入微任务队列，继续执行 → 输出 `5`。
6. 微任务队列清空，执行一个宏任务：
   - 执行 `setTimeout` 回调 → 输出 `2`。
   - 回调中的 `Promise.then` 放入微任务队列，立即执行 → 输出 `3`。

**最终输出**：`1 → 6 → 4 → 5 → 2 → 3`


### **三、浏览器 vs Node.js 的差异**
#### **1. 浏览器 Event Loop**
- **宏任务**：`setTimeout`、`setInterval`、`requestAnimationFrame`、UI 渲染等。
- **微任务**：`Promise.then`、`MutationObserver`。
- **执行流程**：  
  执行栈 → 清空微任务队列 → 执行一个宏任务 → 重复。

#### **2. Node.js Event Loop**
- **阶段划分**：  
  `timers` → `I/O callbacks` → `idle, prepare` → `poll` → `check` → `close callbacks`。
- **微任务**：  
  - `process.nextTick`：在每个阶段结束后立即执行。
  - `Promise.then`：在 `poll` 阶段结束后执行。
- **宏任务**：  
  `setTimeout`、`setInterval`、`setImmediate`（在 `check` 阶段执行）。

#### **3. 关键差异示例**
```javascript
setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});
```
- **浏览器**：输出顺序不确定（取决于线程调度）。
- **Node.js**：  
  - 在 **I/O 回调**中，`setImmediate` 总是先执行。  
  - 在 **主模块**中，输出顺序不确定（取决于初始化时间）。


### **四、进阶概念**
#### **1. 阻塞与非阻塞**
- **同步操作**：阻塞 Event Loop（如 `while(true)`）。
- **异步操作**：通过回调函数非阻塞执行（如 `fetch`、`fs.readFile`）。

#### **2. 任务优先级**
- **微任务 > 宏任务**：微任务队列会在每个宏任务执行前被清空。
- **特殊情况**：  
  - `process.nextTick` 在 Node.js 中优先级高于 `Promise.then`。
  - `requestAnimationFrame` 在浏览器渲染前执行。

#### **3. 渲染时机**
- 浏览器在 **宏任务执行后、微任务执行前** 可能进行渲染。
- 使用 `requestAnimationFrame` 可在渲染前执行回调。


### **五、常见面试问题**
1. **解释 Event Loop 的工作原理**  
   - 答：  
     1. 同步代码在执行栈中执行。  
     2. 异步任务完成后，回调放入任务队列。  
     3. 执行栈清空后，优先处理微任务队列。  
     4. 微任务队列清空后，执行一个宏任务。  
     5. 重复上述过程。

2. **微任务和宏任务的区别是什么？**  
   - 答：  
     - **微任务**：`Promise.then`、`MutationObserver` 等，在每个宏任务后立即执行。  
     - **宏任务**：`setTimeout`、`setInterval` 等，每次只执行一个。

3. **分析以下代码的输出顺序**  
   ```javascript
   async function async1() {
     console.log('async1 start');
     await async2();
     console.log('async1 end');
   }

   async function async2() {
     console.log('async2');
   }

   console.log('script start');

   setTimeout(() => {
     console.log('setTimeout');
   }, 0);

   async1();

   Promise.resolve().then(() => {
     console.log('promise1');
   });

   console.log('script end');
   ```
   **输出顺序**：  
   `script start → async1 start → async2 → script end → async1 end → promise1 → setTimeout`

   **解析**：  
   - `async1` 中 `await` 会暂停执行，将后续代码放入微任务队列。  
   - `Promise.resolve().then` 也放入微任务队列。  
   - 微任务队列在同步代码执行后、`setTimeout` 前执行。


### **六、总结**
- **Event Loop 是 JS 异步的核心机制**，负责协调同步和异步代码的执行。
- **微任务优先于宏任务**，每次宏任务执行后会清空微任务队列。
- **浏览器和 Node.js 的 Event Loop 存在差异**，尤其在定时器和阶段处理上。
- **理解 Event Loop 有助于编写高性能、无阻塞的异步代码**，并解决复杂的执行顺序问题。