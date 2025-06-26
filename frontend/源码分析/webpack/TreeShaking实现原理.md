Tree Shaking 是现代前端构建工具（如 Webpack、Rollup）中用于消除未使用代码（Dead Code Elimination）的关键优化技术，其核心目标是**只打包代码中实际被使用的部分**，从而减小 bundle 体积。以下从原理、实现到注意事项进行详细解析：


### **一、核心原理：基于 ES6 静态导入的代码分析**
Tree Shaking 的实现依赖于 ES6 模块系统的**静态结构特性**：
1. **静态导入/导出**：ES6 模块的导入和导出语句（`import/export`）必须在顶层，不允许动态条件导入（如 `if` 语句中导入模块）。
2. **确定性**：模块依赖关系在编译时（而非运行时）即可确定，便于静态分析。

**对比其他模块系统**：
- **CommonJS**（`require/exports`）：动态导入，无法在编译时确定依赖关系。
- **AMD**：异步加载，依赖关系在运行时确定。


### **二、实现流程：静态分析 + 标记清除**
Tree Shaking 的完整流程分为三个关键阶段：

#### **1. 构建依赖图**
Webpack/Rollup 从入口文件开始，递归分析所有模块的 `import/export` 语句，构建出完整的**静态依赖图**。

**示例代码**：
```javascript
// utils.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// main.js
import { add } from './utils.js';
console.log(add(1, 2));
```

**依赖图分析结果**：
- `main.js` 依赖 `utils.js` 的 `add` 函数
- `subtract` 函数未被引用，属于 Dead Code


#### **2. 标记未使用的导出**
在依赖图基础上，标记所有**未被引用的导出**（如上述示例中的 `subtract`）。

**关键工具**：
- **静态分析器**：如 Acorn、Babel 等，将代码解析为 AST（抽象语法树），分析导入导出关系。
- **副作用标记**：通过 `package.json` 的 `sideEffects` 字段或 Webpack 配置，声明哪些模块有副作用（不可移除）。


#### **3. 清除未使用代码**
在最终打包阶段，移除被标记的未使用代码：
- **Webpack**：结合 Terser 等压缩工具，在 minify 阶段删除 Dead Code。
- **Rollup**：内置更高效的 Tree Shaking 算法，直接在打包时生成更精简的代码。


### **三、副作用（Side Effects）的影响**
**副作用**指模块执行时除导出变量外的其他影响（如全局变量修改、DOM 操作、定时器等）。Tree Shaking 默认会保留有副作用的代码。

#### **如何处理副作用？**
1. **显式声明无副作用**  
   在 `package.json` 中添加 `sideEffects: false`，告诉工具该模块无副作用，可安全 Tree Shaking：
   ```json
   {
     "name": "my-library",
     "sideEffects": false
   }
   ```

2. **声明特定文件有副作用**  
   如果部分文件有副作用，可列出例外：
   ```json
   {
     "sideEffects": [
       "./src/side-effect.js",
       "*.css" // CSS 文件通常有副作用
     ]
   }
   ```

3. **使用纯注释（Pure Annotations）**  
   在代码中标记无副作用的函数：
   ```javascript
   // 告诉 Tree Shaking 此函数无副作用
   /*#__PURE__*/ someFunctionThatDoesntMutate();
   ```


### **四、常见误区与限制**
1. **仅适用于 ES6 模块**  
   Tree Shaking 依赖 ES6 静态结构，CommonJS 模块（`require/exports`）无法完全支持。

2. **动态导入会破坏 Tree Shaking**  
   示例：
   ```javascript
   // 动态导入（无法 Tree Shaking）
   if (condition) {
     import('./module.js');
   }
   ```

3. **复杂的导出语法可能失效**  
   示例：
   ```javascript
   // 这种写法可能导致 Tree Shaking 失败
   export * from './utils';
   ```

4. **运行时依赖无法 Tree Shaking**  
   若模块依赖在运行时动态确定（如通过变量），静态分析工具无法处理。


### **五、Webpack 中的 Tree Shaking 配置**
1. **启用生产模式**  
   生产模式下，Webpack 会自动开启 Tree Shaking 和代码压缩：
   ```javascript
   module.exports = {
     mode: 'production', // 启用 Tree Shaking 和压缩
   };
   ```

2. **配置 Terser 插件**  
   确保使用支持 ES6 模块的压缩工具：
   ```javascript
   const TerserPlugin = require('terser-webpack-plugin');

   module.exports = {
     optimization: {
       minimizer: [
         new TerserPlugin({
           terserOptions: {
             compress: {
               dead_code: true, // 移除死代码
             },
           },
         }),
       ],
     },
   };
   ```

3. **配置 sideEffects**  
   在 `package.json` 或 Webpack 配置中声明副作用：
   ```javascript
   module.exports = {
     // ...
     optimization: {
       usedExports: true, // 标记未使用的导出
       sideEffects: true, // 尊重 sideEffects 配置
     },
   };
   ```


### **六、Rollup 的 Tree Shaking 优势**
Rollup 相比 Webpack 在 Tree Shaking 上更高效，原因在于：
1. **更专注于库打包**：Rollup 设计初衷是生成更简洁的库，Tree Shaking 算法更激进。
2. **ES 模块优先**：默认使用 ES6 模块语法，避免 CommonJS 带来的限制。
3. **更精细的控制**：通过插件（如 `@rollup/plugin-commonjs`）更好地处理混合模块系统。


### **总结**
Tree Shaking 的核心是**基于 ES6 静态模块结构的代码分析与优化**，通过三个关键步骤实现：
1. **构建静态依赖图**：分析模块间的导入导出关系。
2. **标记未使用代码**：识别并标记 Dead Code。
3. **清除未使用代码**：在打包或压缩阶段移除标记代码。

要充分利用 Tree Shaking，需遵循：
- 使用 ES6 模块语法（而非 CommonJS）
- 最小化副作用代码
- 正确配置 `sideEffects` 字段
- 使用支持 Tree Shaking 的构建工具（如 Webpack 生产模式、Rollup）