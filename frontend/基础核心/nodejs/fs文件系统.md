Node.js的`fs`模块（文件系统模块）提供了与文件系统交互的API，是服务器端编程的核心组件。以下从基础操作到高级应用，全面解析`fs`模块的用法和最佳实践：


### **一、核心API分类**
`fs`模块提供了**同步、异步（回调式）和Promise**三种API风格：

1. **同步API**（阻塞式，以`Sync`结尾）  
   - 示例：`fs.readFileSync(path, options)`  
   - 适用于初始化配置等必须同步执行的场景。

2. **异步回调API**  
   - 示例：`fs.readFile(path, options, callback)`  
   - 传统方式，需注意回调地狱问题。

3. **Promise API**（Node.js 10+推荐）  
   - 通过`fs/promises`模块导入：  
     ```javascript
     const fs = require('fs/promises');
     async function readFile() {
       const data = await fs.readFile('example.txt', 'utf8');
       console.log(data);
     }
     ```


### **二、常用文件操作**

#### **1. 读取文件**
```javascript
const fs = require('fs/promises');

// 异步读取（推荐）
async function readAsync() {
  try {
    const data = await fs.readFile('example.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error('读取失败:', err);
  }
}

// 同步读取
function readSync() {
  try {
    const data = fs.readFileSync('example.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error('读取失败:', err);
  }
}
```

#### **2. 写入文件**
```javascript
// 覆盖写入
fs.writeFile('output.txt', 'Hello World!', 'utf8')
  .then(() => console.log('写入成功'))
  .catch(err => console.error('写入失败:', err));

// 追加写入
fs.appendFile('output.txt', '\n追加内容', 'utf8')
  .then(() => console.log('追加成功'))
  .catch(err => console.error('追加失败:', err));
```

#### **3. 文件/目录操作**
```javascript
// 检查文件是否存在（异步）
fs.access('example.txt', fs.constants.F_OK)
  .then(() => console.log('文件存在'))
  .catch(() => console.log('文件不存在'));

// 创建目录（递归创建）
fs.mkdir('new/dir/path', { recursive: true })
  .then(() => console.log('目录创建成功'))
  .catch(err => console.error('目录创建失败:', err));

// 重命名/移动文件
fs.rename('old.txt', 'new.txt')
  .then(() => console.log('重命名成功'))
  .catch(err => console.error('重命名失败:', err));

// 删除文件
fs.unlink('temp.txt')
  .then(() => console.log('文件删除成功'))
  .catch(err => console.error('文件删除失败:', err));
```


### **三、流式处理大文件**
处理大文件时，使用`stream`避免内存溢出：

#### **1. 读写流示例**
```javascript
const fs = require('fs');

// 创建可读流
const readStream = fs.createReadStream('large_input.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 缓冲区大小：64KB
});

// 创建可写流
const writeStream = fs.createWriteStream('large_output.txt');

// 管道传输（高效处理大文件）
readStream.pipe(writeStream);

// 监听事件
readStream.on('data', (chunk) => {
  console.log(`读取了 ${chunk.length} 字节`);
});

readStream.on('end', () => {
  console.log('文件处理完成');
});
```

#### **2. 自定义转换流**
```javascript
const { Transform } = require('stream');

// 创建转换流（将文本转为大写）
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// 管道链：读取 → 转换 → 写入
fs.createReadStream('input.txt')
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream('output.txt'));
```


### **四、文件监视（File Watch）**
使用`fs.watch`或`fs.watchFile`监控文件变化：

#### **1. fs.watch（推荐）**
基于操作系统的文件系统通知机制，更高效：
```javascript
const fs = require('fs');

const watcher = fs.watch('target.txt', (eventType, filename) => {
  console.log(`事件: ${eventType}，文件: ${filename}`);
  
  if (eventType === 'change') {
    console.log('文件内容已更新');
  }
});

// 停止监视
setTimeout(() => {
  watcher.close();
  console.log('停止监视');
}, 10000);
```

#### **2. fs.watchFile（轮询方式）**
定期检查文件状态，开销较大：
```javascript
fs.watchFile('target.txt', (curr, prev) => {
  console.log(`文件修改时间: ${curr.mtime}`);
  if (curr.size !== prev.size) {
    console.log(`文件大小变化: ${prev.size} → ${curr.size} 字节`);
  }
});
```


### **五、文件元信息与权限**
#### **1. 获取文件状态**
```javascript
fs.stat('example.txt')
  .then(stat => {
    console.log('是否为文件:', stat.isFile());
    console.log('是否为目录:', stat.isDirectory());
    console.log('文件大小:', stat.size, '字节');
    console.log('创建时间:', stat.birthtime);
    console.log('修改时间:', stat.mtime);
  })
  .catch(err => console.error('获取状态失败:', err));
```

#### **2. 修改文件权限**
```javascript
// 修改文件权限为 755
fs.chmod('script.sh', 0o755)
  .then(() => console.log('权限修改成功'))
  .catch(err => console.error('权限修改失败:', err));
```


### **六、目录遍历**
递归读取目录下的所有文件：

#### **1. 同步递归遍历**
```javascript
const fs = require('fs');
const path = require('path');

function readDirRecursive(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readDirRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

const allFiles = readDirRecursive('./my-directory');
console.log(allFiles);
```

#### **2. 异步递归遍历（Promise）**
```javascript
const fs = require('fs/promises');
const path = require('path');

async function readDirRecursiveAsync(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readDirRecursiveAsync(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

readDirRecursiveAsync('./my-directory')
  .then(files => console.log(files))
  .catch(err => console.error('遍历失败:', err));
```


### **七、最佳实践与注意事项**
1. **优先使用异步API**  
   - 同步API会阻塞主线程，仅在初始化阶段必要时使用。

2. **处理大文件使用流**  
   - 读取/写入大文件时，`fs.createReadStream`和`fs.createWriteStream`比`readFile`更高效。

3. **错误处理**  
   - 文件操作可能因权限、文件不存在等失败，务必进行错误处理：  
     ```javascript
     fs.readFile('non_existent.txt')
       .catch(err => {
         if (err.code === 'ENOENT') {
           console.log('文件不存在');
         } else {
           console.error('其他错误:', err);
         }
       });
     ```

4. **路径处理**  
   - 使用`path`模块处理跨平台路径问题：  
     ```javascript
     const filePath = path.join(__dirname, 'data', 'file.txt');
     ```

5. **避免竞态条件**  
   - 在检查文件是否存在后再操作时，可能存在竞态条件（如文件被其他进程删除）：  
     ```javascript
     // 错误示例
     if (fs.existsSync('file.txt')) {
       fs.unlinkSync('file.txt'); // 此时文件可能已被删除
     }
     
     // 正确做法：直接尝试操作，处理错误
     fs.unlink('file.txt').catch(err => {
       if (err.code !== 'ENOENT') {
         console.error('删除失败:', err);
       }
     });
     ```

