自定义 Webpack Plugin 是扩展 Webpack 功能的强大方式，它允许你在构建流程的特定阶段执行自定义逻辑。以下从基础结构、核心原理到实战案例，全面解析如何开发自定义 Plugin：


### **1. Plugin 基础结构**
Webpack Plugin 是一个**带有 `apply` 方法的类**，该方法会在 Webpack 启动时被调用，并传入 `compiler` 对象。

**最简 Plugin 示例**（构建完成后打印日志）：
```javascript
class BuildEndPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    // 监听 'done' 钩子，在构建完成后执行
    compiler.hooks.done.tap('BuildEndPlugin', stats => {
      console.log(`✨ 构建完成！耗时：${stats.endTime - stats.startTime}ms`);
    });
  }
}

module.exports = BuildEndPlugin;
```

**配置使用**：
```javascript
// webpack.config.js
const BuildEndPlugin = require('./BuildEndPlugin');

module.exports = {
  plugins: [
    new BuildEndPlugin({ /* 配置选项 */ })
  ]
};
```


### **2. 核心原理：Tapable 钩子系统**
Webpack 通过 **Tapable** 库实现事件钩子机制，Plugin 通过监听特定钩子来介入构建流程：

#### **钩子类型**
- **同步钩子**：`tap`（普通同步）、`tapPromise`（Promise 异步）
- **异步钩子**：`tapAsync`（回调异步）、`tapPromise`（Promise 异步）

#### **常见钩子**
| 钩子名称           | 触发时机                     | 类型    |
|--------------------|------------------------------|---------|
| `compiler.hooks.entryOption` | 解析入口配置后               | 同步    |
| `compiler.hooks.beforeRun`   | 开始编译前                   | 异步    |
| `compilation.hooks.optimize` | 优化模块时                   | 同步    |
| `compiler.hooks.emit`        | 生成文件到输出目录前         | 异步    |
| `compiler.hooks.done`        | 构建完成后                   | 同步    |


### **3. 开发实战：文件压缩 Plugin**
#### **需求**：在文件输出前压缩 JS 文件
```javascript
const { minify } = require('terser');

class MinifyPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    // 监听 emit 钩子，此时文件尚未写入磁盘
    compiler.hooks.emit.tapAsync('MinifyPlugin', (compilation, callback) => {
      // 获取所有输出文件
      const assets = compilation.assets;
      const assetNames = Object.keys(assets);

      // 遍历处理每个 JS 文件
      const tasks = assetNames.map(assetName => {
        if (!assetName.endsWith('.js')) return;

        const source = assets[assetName].source(); // 获取文件内容
        
        return minify(source, this.options).then(minified => {
          // 更新文件内容
          assets[assetName] = {
            source: () => minified.code,
            size: () => minified.code.length
          };
        });
      });

      // 等待所有任务完成后继续
      Promise.all(tasks).then(() => callback()).catch(err => callback(err));
    });
  }
}

module.exports = MinifyPlugin;
```


### **4. 访问和修改模块/资源**
Plugin 可以通过 `compilation` 对象访问和修改模块、依赖及输出资源：

#### **（1）访问模块信息**
```javascript
compiler.hooks.compilation.tap('MyPlugin', compilation => {
  // 遍历所有模块
  compilation.modules.forEach(module => {
    console.log(`模块: ${module.resource}`);
  });
});
```

#### **（2）修改输出资源**
```javascript
compiler.hooks.emit.tap('MyPlugin', compilation => {
  // 添加新文件
  compilation.assets['new-file.txt'] = {
    source: () => '这是一个新文件',
    size: () => 15
  };

  // 修改现有文件
  if (compilation.assets['main.js']) {
    const original = compilation.assets['main.js'].source();
    compilation.assets['main.js'] = {
      source: () => original + '\n// 追加内容',
      size: () => original.length + 12
    };
  }
});
```


### **5. 高级技巧**
#### **（1）异步钩子处理**
使用 `tapPromise` 处理异步操作：
```javascript
compiler.hooks.emit.tapPromise('MyPlugin', compilation => {
  return new Promise((resolve, reject) => {
    // 异步操作...
    setTimeout(() => {
      // 完成后 resolve
      resolve();
    }, 1000);
  });
});
```

#### **（2）错误处理**
```javascript
compiler.hooks.thisCompilation.tap('MyPlugin', compilation => {
  // 添加编译错误
  compilation.errors.push(new Error('这是一个自定义错误'));
});
```

#### **（3）多 Compiler 支持**
```javascript
class MultiCompilerPlugin {
  apply(multiCompiler) {
    multiCompiler.compilers.forEach(compiler => {
      // 为每个 compiler 注册钩子
      compiler.hooks.done.tap('MultiCompilerPlugin', () => {
        console.log(`Compiler ${compiler.name} 完成`);
      });
    });
  }
}
```


### **6. 调试与测试**
#### **（1）调试技巧**
- 使用 `console.log` 输出关键信息
- 通过 `debug` 模块添加调试日志
- 在 Webpack 配置中添加 `--debug` 参数

#### **（2）单元测试**
使用 `jest` 或 `mocha` 测试 Plugin：
```javascript
const { Compiler, Compilation } = require('webpack');
const MyPlugin = require('./MyPlugin');

describe('MyPlugin', () => {
  it('should add a banner', () => {
    const compiler = new Compiler();
    const plugin = new MyPlugin({ banner: 'Test Banner' });
    
    // 模拟 compilation
    const compilation = new Compilation(compiler);
    jest.spyOn(compilation, 'fileDependencies');
    
    // 应用插件
    plugin.apply(compiler);
    compiler.hooks.emit.callAsync(compilation, () => {
      // 断言...
    });
  });
});
```


### **7. 常见 Plugin 场景**
#### **（1）生成 HTML 文件**
```javascript
class HtmlGeneratorPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('HtmlGeneratorPlugin', compilation => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <script src="main.js"></script>
          </body>
        </html>
      `;
      
      compilation.assets['index.html'] = {
        source: () => html,
        size: () => html.length
      };
    });
  }
}
```

#### **（2）清理构建目录**
```javascript
const fs = require('fs');
const path = require('path');

class CleanPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tap('CleanPlugin', () => {
      const outputPath = compiler.options.output.path;
      
      // 删除目录内容
      fs.readdirSync(outputPath).forEach(file => {
        const filePath = path.join(outputPath, file);
        fs.unlinkSync(filePath);
      });
    });
  }
}
```


### **8. 发布与维护**
1. **编写 `package.json`**：指定入口文件、版本等
2. **添加 TypeScript 支持**（如果需要）
3. **完善文档**：说明功能、配置选项和使用示例
4. **遵循 SemVer 版本规范**


### **9. 面试高频问题**
1. **Loader 和 Plugin 的区别是什么？**  
   - Loader：处理特定类型的文件（如 `.css`、`.js`）。  
   - Plugin：基于事件钩子，在构建流程的特定阶段执行自定义逻辑。

2. **如何在 Plugin 中监听异步钩子？**  
   使用 `tapAsync`（回调方式）或 `tapPromise`（Promise 方式）。

3. **`compiler` 和 `compilation` 的区别是什么？**  
   - `compiler`：全局单例，包含 Webpack 环境的所有配置信息。  
   - `compilation`：每次构建的上下文，包含当前模块、依赖和输出文件信息。

