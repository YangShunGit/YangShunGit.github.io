自定义 Loader 是扩展 Webpack 功能的重要方式，它允许你自定义处理各种类型的文件。以下从实现方法、核心原理到注意事项进行详细解析：


### **1. 自定义 Loader 基础结构**
Loader 本质上是一个 **函数**，接收源文件内容作为参数，返回转换后的内容。

**最简 Loader 示例**（将文本转为大写）：
```javascript
// upper-loader.js
module.exports = function(source) {
  return source.toUpperCase();
};
```

**配置使用**：
```javascript
// webpack.config.js
{
  test: /\.txt$/,
  use: 'upper-loader'
}
```


### **2. 核心实现模式**
#### **同步 Loader**
适用于简单转换，直接返回处理结果：
```javascript
module.exports = function(source) {
  // 同步处理逻辑
  return source.replace(/hello/g, 'hi');
};
```

#### **异步 Loader**
适用于异步操作（如 API 请求、文件读取）：
```javascript
module.exports = function(source) {
  const callback = this.async(); // 获取异步回调
  
  setTimeout(() => {
    const result = source.replace(/hello/g, 'hi');
    callback(null, result); // 第一个参数为错误信息
  }, 1000);
};
```

#### **链式 Loader**
多个 Loader 按顺序处理，执行顺序从后往前：
```javascript
// webpack.config.js
{
  test: /\.js$/,
  use: ['loader3', 'loader2', 'loader1'] // 执行顺序：1 → 2 → 3
}
```


### **3. Loader API 与工具**
#### **常用 Loader 上下文属性**
- `this.callback`：返回多个结果（内容、source map 等）
- `this.async`：异步处理
- `this.resourcePath`：当前文件路径
- `this.addDependency`：添加额外依赖（如配置文件）

#### **常用工具库**
- **loader-utils**：获取 Loader 选项、解析资源路径
  ```javascript
  const { getOptions } = require('loader-utils');
  
  module.exports = function(source) {
    const options = getOptions(this) || {};
    return source.replace(new RegExp(options.search, 'g'), options.replace);
  };
  ```

- **schema-utils**：校验 Loader 选项
  ```javascript
  const { validate } = require('schema-utils');
  
  const schema = {
    type: 'object',
    properties: {
      search: { type: 'string' },
      replace: { type: 'string' }
    }
  };
  
  module.exports = function(source) {
    const options = getOptions(this) || {};
    validate(schema, options, { name: 'Replace Loader' });
    // ...
  };
  ```


### **4. 高级 Loader 实现**
#### **处理资源路径（如 url()）**
使用 `this.resolve` 解析相对路径：
```javascript
const { getOptions } = require('loader-utils');
const { parse } = require('path');

module.exports = function(source) {
  const callback = this.async();
  const options = getOptions(this) || {};
  
  // 替换所有 url(...)
  const result = source.replace(/url\(([^)]+)\)/g, (match, url) => {
    const filePath = url.replace(/['"]/g, '');
    this.resolve(this.context, filePath, (err, resolvedPath) => {
      if (err) return callback(err);
      // 处理 resolvedPath...
    });
    return `url(${newUrl})`;
  });
  
  callback(null, result);
};
```

#### **生成 Source Map**
使用 `this.callback` 返回 source map：
```javascript
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');

module.exports = function(source, inputSourceMap) {
  const callback = this.async();
  
  // 处理 source...
  
  // 如果有输入的 source map，则合并
  if (inputSourceMap) {
    const generator = SourceMapGenerator.fromSourceMap(
      new SourceMapConsumer(inputSourceMap)
    );
    // 更新 generator...
    const outputSourceMap = generator.toJSON();
    callback(null, source, outputSourceMap);
  } else {
    callback(null, source);
  }
};
```


### **5. 开发注意事项**
#### **核心原则**
1. **单一职责**：每个 Loader 只做一件事，通过链式组合实现复杂功能
2. **无状态**：相同输入必须产生相同输出，不依赖外部状态
3. **异步优先**：涉及 I/O 或耗时操作时使用异步模式

#### **性能优化**
- **缓存结果**：使用 `this.cacheable(false)` 禁用缓存（默认启用）
- **处理大文件**：使用流式处理（stream）避免内存溢出

#### **错误处理**
- 同步模式：直接抛出错误 `throw new Error('Invalid format')`
- 异步模式：通过回调传递错误 `callback(new Error('...'))`

#### **调试技巧**
- 使用 `console.log` 输出中间结果
- 使用 `loader-runner` 单独测试 Loader：
  ```javascript
  const { runLoaders } = require('loader-runner');
  
  runLoaders({
    resource: '/path/to/file.js',
    loaders: ['upper-loader'],
    context: { minimize: true },
    readResource: fs.readFile.bind(fs)
  }, (err, result) => {
    // 处理结果
  });
  ```


### **6. 常见 Loader 场景**
#### **1. 模板编译（如 Pug → HTML）**
```javascript
const pug = require('pug');

module.exports = function(source) {
  const callback = this.async();
  
  try {
    const html = pug.compile(source)({});
    callback(null, `module.exports = ${JSON.stringify(html)}`);
  } catch (err) {
    callback(err);
  }
};
```

#### **2. 注入全局变量**
```javascript
module.exports = function(source) {
  return `const ENV = '${process.env.NODE_ENV}';\n${source}`;
};
```

#### **3. 图片压缩**
```javascript
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

module.exports = function(source) {
  const callback = this.async();
  
  imagemin.buffer(source, {
    plugins: [imageminPngquant()]
  }).then(buffer => {
    callback(null, buffer);
  }).catch(err => {
    callback(err);
  });
};
```


### **7. 发布与维护**
1. **发布到 npm**：编写 `package.json`，添加必要字段
2. **版本控制**：遵循语义化版本（SemVer）
3. **文档完善**：说明功能、配置选项和使用示例


### **8. 面试高频问题**
1. **Loader 的执行顺序是怎样的？**  
   从后往前执行（如 `use: ['loader3', 'loader2', 'loader1']` → 1 → 2 → 3）。

2. **如何在 Loader 中处理异步操作？**  
   使用 `this.async()` 获取异步回调，处理完成后调用 `callback(err, result)`。

3. **Loader 和 Plugin 的区别是什么？**  
   - Loader：处理特定类型的文件（如 `.css`、`.js`）。  
   - Plugin：基于事件钩子，在构建流程的特定阶段执行自定义逻辑。

