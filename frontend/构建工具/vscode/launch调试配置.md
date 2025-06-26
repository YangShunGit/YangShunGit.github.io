
在VSCode中，`launch.json` 是调试配置的核心文件，其配置的准确性直接关系到调试功能能否正常运行。下面为你详细介绍如何针对不同场景设置正确的调试配置：

### 一、配置文件基础结构
`launch.json` 文件位于项目根目录下的 `.vscode` 文件夹中。首次创建时，可以按 `F5` 键，然后选择环境类型，VSCode会自动生成基础配置。其基本结构如下：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试配置名称",
      "type": "调试器类型",
      "request": "启动模式",
      // 其他配置选项
    }
  ]
}
```

### 二、常见场景配置示例
#### 1. **Node.js应用调试**
适用于Express、NestJS等后端项目。
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "program": "${workspaceFolder}/src/index.js", // 启动文件路径
      "args": [], // 传递给程序的参数
      "runtimeArgs": ["--nolazy", "--inspect-brk=9229"], // 运行时参数
      "sourceMaps": true, // 启用source map支持
      "cwd": "${workspaceFolder}", // 工作目录
      "skipFiles": ["<node_internals>/**"] // 跳过Node.js内部文件
    }
  ]
}
```

#### 2. **Chrome浏览器调试前端应用**
适用于React、Vue等框架项目。
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "启动Chrome并调试",
      "url": "http://localhost:3000", // 应用URL
      "webRoot": "${workspaceFolder}/src", // 源码根目录
      "sourceMapPathOverrides": {
        "webpack:///./src/*": "${webRoot}/*" // source map路径映射
      },
      "userDataDir": "${workspaceFolder}/.vscode/chrome" // Chrome用户数据目录
    }
  ]
}
```

#### 3. **TypeScript项目调试**
需要配合 `tsconfig.json` 中的 `sourceMap: true` 选项使用。
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "调试TypeScript",
      "runtimeArgs": ["--nolazy", "-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/index.ts"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**", "node_modules/**"]
    }
  ]
}
```

#### 4. **调试测试用例（Jest/Mocha）**
以Jest为例：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "调试Jest测试",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--watchAll=false"],
      "runtimeArgs": ["--nolazy", "--inspect-brk=9229"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

### 三、关键配置项说明
| 配置项               | 描述                                                                 |
|----------------------|----------------------------------------------------------------------|
| `type`               | 调试器类型，如 `node`、`chrome`、`firefox` 等。                     |
| `request`            | 启动模式：`launch`（启动新进程）或 `attach`（附加到现有进程）。     |
| `name`               | 调试配置的显示名称。                                                 |
| `program`            | 要调试的程序入口文件路径。                                           |
| `args`               | 传递给调试程序的命令行参数。                                         |
| `runtimeArgs`        | 传递给Node.js或浏览器的运行时参数，如 `--inspect-brk`。             |
| `webRoot`            | 源码根目录，用于映射source map。                                     |
| `sourceMapPathOverrides` | 自定义source map路径映射规则，解决路径不匹配问题。                   |
| `url`                | 浏览器调试时要打开的URL。                                             |
| `skipFiles`          | 调试时要跳过的文件，如Node.js内部文件或第三方库。                    |
| `env`                | 设置环境变量，如 `{"NODE_ENV": "development"}`。                     |

### 四、疑难解答技巧
1. **路径映射问题**
   - 使用 `${workspaceFolder}` 变量来引用项目根目录。
   - 调试TypeScript时，确保 `tsconfig.json` 中的 `outDir` 和 `rootDir` 配置正确。

2. **source map验证**
   - 在Chrome开发者工具中，查看 `Sources` 面板，确认能否看到原始源代码文件。
   - 检查生成的 `.map` 文件路径是否正确。

3. **多配置组合**
   可以在 `launch.json` 中添加多个配置，例如同时支持后端和前端调试：
   ```json
   "compounds": [
     {
       "name": "全栈调试",
       "configurations": ["启动服务器", "启动Chrome并调试"]
     }
   ]
   ```

4. **高级技巧**
   - 使用 `preLaunchTask` 配置调试前执行的任务，如编译代码。
   - 通过 `autoAttachChildProcesses` 自动附加到子进程。

### 五、常见错误及解决
| 错误现象               | 可能原因                     | 解决方法                                                                 |
|------------------------|------------------------------|--------------------------------------------------------------------------|
| 断点显示为灰色         | source map未生成或路径错误   | 检查 `devtool` 配置，确认 `sourceMapPathOverrides` 正确                 |
| 调试器无法启动         | 端口被占用或配置错误         | 修改 `port` 配置，检查程序是否已在运行                                   |
| 代码执行位置与断点不符 | source map版本不一致         | 清除缓存，重新编译代码                                                   |
| 无法附加到进程         | 目标进程未启用调试模式       | 使用 `--inspect` 或 `--inspect-brk` 参数启动程序                          |

配置完成后，按 `F5` 键即可开始调试。如果遇到问题，可以通过查看VSCode的调试控制台或Chrome开发者工具的控制台获取更多信息。