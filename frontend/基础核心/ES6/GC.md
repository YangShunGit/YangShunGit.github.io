### JavaScript GC（垃圾回收）：机制、策略与性能优化


### **一、JavaScript GC 的核心机制**
**定义**：JavaScript 引擎自动回收不再使用的内存空间，无需手动管理（如 `delete` 仅删除引用，不直接回收内存）。  
**核心原理**：  
- **可达性分析**：通过根对象（如全局变量、当前调用栈中的变量）出发，递归标记所有可达对象，未被标记的对象视为垃圾。  
- **分代假设**：多数对象生命周期短暂，少数对象长期存活（如闭包）。


### **二、主流浏览器的 GC 实现**
#### **1. V8 引擎（Chrome、Node.js）**
- **分代垃圾回收**：  
  - **新生代（Young Generation）**：  
    - 小对象（小于1MB）初始分配区，分为 **From** 和 **To** 两个空间（各16MB）。  
    - 使用 **Scavenge 算法**（复制算法）：GC 时将存活对象复制到 To 区，清空 From 区，交换 From/To。  
    - 优点：速度极快（仅处理少量存活对象）。  
  - **老年代（Old Generation）**：  
    - 长期存活的对象（如闭包、DOM 节点）或大对象（>1MB）直接进入老年代。  
    - 使用 **标记-清除（Mark-Sweep）** 和 **标记-整理（Mark-Compact）** 算法：  
      - **并发标记**：主线程暂停期间，多线程并行标记可达对象。  
      - **延迟清理**：标记完成后，逐步清理垃圾对象，减少 STW（Stop The World）。  

- **增量标记（Incremental Marking）**：  
  将长时间的标记过程拆分为多个小步骤，穿插在主线程任务之间，减少卡顿（如每执行 5ms 脚本，执行 1ms GC）。

- **写屏障（Write Barrier）**：  
  监控对象引用变化，确保在并发标记期间新创建或修改的引用不被遗漏。

#### **2. Firefox 的 GC**
- **分代+并发标记**：类似 V8，但采用 **位图标记（BitMap Marking）** 提高标记效率。  
- **惰性清理（Lazy Sweeping）**：标记完成后不立即清理，而是在分配新对象时按需清理。

#### **3. Safari 的 GC**
- **Boehm-Demers-Weiser GC**：基于保守式 GC，兼容 C 语言嵌入的 JavaScript 对象。  
- **低延迟优化**：通过启发式算法预测内存峰值，提前触发 GC。


### **三、常见的内存泄漏场景**
#### 1. **全局变量**：  
   ```javascript
   function leak() {
     leakedVar = 'This is a global variable'; // 未声明的变量会挂载到 window
   }
   ```

#### 2. **未清理的定时器/回调**：  
   ```javascript
   const intervalId = setInterval(() => {
     // 未调用 clearInterval(intervalId)
   }, 1000);
   ```

#### 3. **闭包捕获变量**：  
   ```javascript
   function createLeak() {
     const largeArray = new Array(1000000).fill(1);
     return () => console.log(largeArray.length); // 闭包持有 largeArray 的引用
   }
   ```

#### 4. **DOM 引用未释放**：  
   ```javascript
   const ref = document.getElementById('element');
   document.body.removeChild(document.getElementById('element'));
   // ref 仍持有 DOM 引用，导致内存无法回收
   ```

#### 5. **WeakMap/WeakSet 误用**：  
   ```javascript
   const map = new Map(); // 使用 WeakMap 避免强引用
   const obj = {};
   map.set(obj, 'data'); // obj 无法被回收，即使外部无引用
   ```


### **四、GC 性能优化策略**
#### 1. **减少全局变量**：  
   - 使用 `const`/`let` 替代 `var`，避免意外创建全局变量。  
   - 使用模块系统（如 ES6 Modules）隔离作用域。

#### 2. **及时释放引用**：  
   ```javascript
   function cleanup() {
     if (intervalId) clearInterval(intervalId); // 清理定时器
     element = null; // 释放 DOM 引用
   }
   ```

#### 3. **避免闭包滥用**：  
   - 减少闭包捕获大对象，或在不需要时手动置空：  
     ```javascript
     function createClosure() {
       let data = new Array(1000);
       const closure = () => console.log(data.length);
       // 使用后释放引用
       data = null;
       return closure;
     }
     ```

#### 4. **使用弱引用（WeakMap/WeakSet）**：  
   - 仅在需要临时关联数据且不阻止对象回收时使用：  
     ```javascript
     const weakMap = new WeakMap();
     const obj = {};
     weakMap.set(obj, 'temporary data'); // obj 可以被正常回收
     ```

#### 5. **批量操作 DOM**：  
   - 减少频繁操作 DOM 导致的垃圾对象（如频繁创建 `DocumentFragment`）。

#### 6. **优化大数组/对象**：  
   - 复用数组而非频繁创建新数组：  
     ```javascript
     const arr = [];
     function process() {
       arr.length = 0; // 清空数组而非创建新数组
       // 重新填充数据
     }
     ```


### **五、内存分析工具**
#### 1. **Chrome DevTools - Memory 面板**：  
   - **Heap Snapshot**：拍摄堆内存快照，分析对象引用关系（如查找未释放的 DOM 节点）。  
   - **Allocation Timeline**：记录对象分配时间线，定位频繁创建的对象。  
   - **Memory Profiler**：监控内存增长趋势，检测内存泄漏。

#### 2. **Node.js - heapdump 模块**：  
   ```javascript
   const heapdump = require('heapdump');
   // 手动触发堆快照
   process.on('SIGUSR2', () => heapdump.writeSnapshot());
   ```

#### 3. **Lighthouse**：  
   - 检测内存泄漏和不合理的内存使用模式（如频繁的 GC 触发）。


### **六、GC 与性能的权衡**
- **过早优化**：避免过度关注 GC，优先优化业务逻辑和算法。  
- **监控指标**：关注 GC 频率、STW 时间、内存增长率而非绝对 GC 次数。  
- **现代引擎优化**：V8 的 TurboFan 编译器会内联函数、消除死代码，减少 GC 压力。


### **七、总结：JavaScript GC 的最佳实践**
#### 1. **遵循引用管理原则**：  
   - 避免不必要的强引用，优先使用弱引用（WeakMap/WeakSet）。  
   - 及时清理不再需要的对象和定时器。  

#### 2. **了解引擎特性**：  
   - 利用 V8 的分代优化（如短生命周期对象优先分配到新生代）。  
   - 避免触发 Full GC（如控制老年代增长速度）。  

#### 3. **持续监控与调优**：  
   - 使用工具定期分析内存快照，识别潜在泄漏点。  
   - 在性能敏感场景（如游戏、视频处理）中，手动管理对象池。  

通过合理的代码设计和工具辅助，可将 GC 对应用性能的影响降到最低。