Webpack 中 Loader 的执行顺序是**从右到左（或从下到上）**，这一设计源于其**管道（Pipeline）模型**和 **Unix 哲学**。理解这一机制的核心在于把握其设计目标和实现方式：


### **1. 设计初衷：模拟 Unix 管道**
Loader 的链式执行借鉴了 **Unix 管道（Pipeline）** 的概念：
- 在 Unix 中，`command1 | command2 | command3` 的执行顺序是 **从左到右**
- 但在编程中，函数组合的自然顺序是 **从内到外**（如 `f(g(h(x)))`）

Webpack 选择了**函数组合的方向**，因为这更符合编程逻辑：
```javascript
// Webpack 配置
use: ['loader3', 'loader2', 'loader1']

// 等价于函数调用
loader3(loader2(loader1(source)))
```


### **2. 技术实现：栈式调用**
Webpack 内部通过**栈结构**处理 Loader 链：
1. **入栈阶段**：按配置顺序将 Loader 压入栈（`['loader1', 'loader2', 'loader3']`）
2. **执行阶段**：从栈顶弹出 Loader 依次执行（`loader3 → loader2 → loader1`）

**源码简化示意**：
```javascript
// 简化的 Webpack Loader 执行逻辑
function runLoaders(loaders, source) {
  const loaderStack = [...loaders]; // 复制配置的 Loader 数组
  
  function processNextLoader(currentSource) {
    if (loaderStack.length === 0) {
      return currentSource; // 所有 Loader 处理完毕
    }
    
    const loader = loaderStack.pop(); // 从栈顶取出 Loader
    const newSource = loader(currentSource); // 执行当前 Loader
    
    return processNextLoader(newSource); // 递归处理下一个 Loader
  }
  
  return processNextLoader(source);
}
```


### **3. 实际场景：符合使用习惯**
这种顺序在实际开发中更加直观：
#### **场景 1：CSS 处理链**
```javascript
use: [
  'style-loader',  // 3. 将 CSS 注入 DOM
  'css-loader',    // 2. 解析 CSS 依赖
  'postcss-loader' // 1. 添加浏览器前缀
]

// 执行顺序：postcss-loader → css-loader → style-loader
```

#### **场景 2：图片处理**
```javascript
use: [
  'url-loader',    // 2. 小文件转 Base64
  'image-webpack-loader' // 1. 压缩图片
]

// 执行顺序：image-webpack-loader → url-loader
```


### **4. 与其他工具的对比**
#### **（1）与 Gulp 的对比**
- **Gulp**：基于流（Stream），执行顺序是 **从左到右**
  ```javascript
  gulp.src('src/*.js')
    .pipe(babel())    // 1. 转译 ES6
    .pipe(uglify())   // 2. 压缩代码
    .pipe(gulp.dest('dist'));
  ```

#### **（2）与 Babel 的对比**
- **Babel**：插件/预设执行顺序是 **从右到左**（与 Webpack 一致）
  ```javascript
  {
    plugins: ['plugin1', 'plugin2', 'plugin3'] // 执行顺序：3 → 2 → 1
  }
  ```



### **总结**
Webpack 选择从右到左的执行顺序，主要基于：
1. **函数组合的自然逻辑**：符合编程中嵌套函数的调用顺序
2. **实现简单高效**：通过栈结构即可实现
3. **避免配置与执行顺序的冲突**：保持配置顺序的直观性

理解这一设计有助于你更好地组织 Loader 链，解决复杂场景下的资源处理问题。