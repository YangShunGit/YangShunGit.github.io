这是现代浏览器（Chrome 98+、Firefox 94+、Safari 15.4+）提供的原生深拷贝 API，支持**流对象（ReadableStream/WritableStream）**和**更多复杂数据类型**，且**自动处理循环引用**。以下是详细介绍：


### **一、`structuredClone()` 基本用法**
```javascript
const original = {
  a: 1,
  b: new Set([2, 3]),
  c: new Date()
};

// 深拷贝（支持流、循环引用等）
const clone = structuredClone(original);

// 修改副本不影响原对象
clone.b.add(4);
console.log(original.b); // Set(2) { 2, 3 }
```


### **二、核心特性**
#### **1. 支持更多数据类型**
| **数据类型**          | **是否支持** |
|-----------------------|--------------|
| 普通对象/数组         | ✅           |
| Date/RegExp           | ✅           |
| Set/Map               | ✅           |
| Blob/File/FileList    | ✅           |
| ImageData             | ✅           |
| **ReadableStream**    | ✅           |
| **MessagePort**       | ✅           |
| 函数/WeakMap/WeakSet  | ❌           |
| Symbol                | ❌           |

#### **2. 自动处理循环引用**
```javascript
const obj = {};
obj.self = obj; // 循环引用

const clone = structuredClone(obj);
console.log(clone.self === clone); // true（正确处理循环引用）
```

#### **3. 支持 Transferable 对象**
通过第三个参数可转移所有权（如 `ArrayBuffer`），提高性能：
```javascript
const buffer = new ArrayBuffer(1024);
const clone = structuredClone(buffer, { transfer: [buffer] });

console.log(buffer.byteLength); // 0（原对象已失去所有权）
```


### **三、与其他深拷贝方法的对比**
| **方法**               | **循环引用** | **流对象** | **特殊对象（Date/Set）** | **函数/Symbol** | **性能** |
|------------------------|--------------|------------|--------------------------|------------------|----------|
| `structuredClone()`    | ✅           | ✅         | ✅                       | ❌               | 高       |
| `JSON.parse(JSON.stringify())` | ❌         | ❌         | ❌（Date 变字符串）      | ❌               | 中       |
| Lodash `_.cloneDeep()` | ✅           | ❌         | ✅                       | ❌               | 中       |
| 手动递归实现           | ✅           | ❌         | ❌（需手动处理）         | ❌               | 低       |


### **四、流对象的深拷贝示例**
```javascript
async function cloneStreamExample() {
  const originalStream = new ReadableStream({
    start(controller) {
      controller.enqueue('Hello');
      controller.enqueue('World');
      controller.close();
    }
  });

  // 深拷贝流
  const clonedStream = structuredClone(originalStream);

  // 消费原流
  const originalReader = originalStream.getReader();
  console.log(await originalReader.read()); // { value: 'Hello', done: false }

  // 消费克隆流（独立于原流）
  const clonedReader = clonedStream.getReader();
  console.log(await clonedReader.read()); // { value: 'Hello', done: false }
}
```


### **五、注意事项**
1. **兼容性**：  
   - 浏览器支持率约 80%（[CanIUse](https://caniuse.com/structured-clone)），Node.js 需 v17+。  
   - 不支持 IE 和旧版 Edge。

2. **不可克隆类型**：  
   - 函数、WeakMap/WeakSet、DOM 节点等会抛出错误。  
   - Symbol、`undefined` 会被忽略。

3. **性能优化**：  
   - 对大型数据（如包含流的对象），优先使用 `structuredClone()` 而非手动递归。  
   - 转移 Transferable 对象可避免内存复制。


### **六、面试加分回答**
**问：如何在现代 JS 中高效深拷贝包含流的对象？**  
**答**：  
1. **优先使用 `structuredClone()`**：  
   - 原生支持流对象（ReadableStream/WritableStream）和循环引用。  
   - 自动处理常见复杂类型（Date、Set、Blob 等）。  
   ```javascript
   const clone = structuredClone(original, { transfer: [stream] });
   ```

2. **兼容性处理**：  
   - 对不支持的环境，使用 `lodash.cloneDeep()` 处理普通对象，手动处理流。  
   - 或通过 `stream.tee()` 复制流（但生成的流与原流共享数据）。

3. **性能考量**：  
   - 转移 Transferable 对象（如 `ArrayBuffer`）可避免数据复制。  
   - 避免深拷贝整个流，而是复制流的引用并分别消费。


### **七、总结**
`structuredClone()` 是现代 JS 中处理复杂对象深拷贝的最佳选择，尤其适合包含**流、循环引用、特殊数据类型**的场景。相比传统方法，它更高效、更安全，且减少了手动实现的复杂度。在兼容性允许的情况下，推荐优先使用该 API。