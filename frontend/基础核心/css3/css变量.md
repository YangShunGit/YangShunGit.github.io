CSS变量（Custom Properties）是CSS3引入的一项强大特性，允许开发者定义可复用的变量，提升样式的可维护性和灵活性。以下是关于CSS变量的核心知识点和实践技巧：


### **一、基本语法与使用**
#### 1. **定义变量**
使用`--`前缀声明变量，作用域由选择器决定：
```css
:root {
  --primary-color: #3498db; /* 全局变量 */
  --font-size: 16px;
}

.container {
  --local-width: 80%; /* 局部变量，仅在.container内有效 */
}
```

#### 2. **使用变量**
通过`var()`函数引用变量：
```css
body {
  color: var(--primary-color);
  font-size: var(--font-size);
}

.container {
  width: var(--local-width);
}
```

#### 3. **变量的默认值**
```css
.element {
  /* 如果--text-color未定义，则使用#333作为默认值 */
  color: var(--text-color, #333);
}
```


### **二、变量的作用域**
1. **全局变量**  
   在`:root`伪类中定义，可在整个文档中访问：
   ```css
   :root {
     --max-width: 1200px;
   }
   ```

2. **局部变量**  
   在特定选择器中定义，仅在该选择器及其子元素中有效：
   ```css
   .card {
     --card-padding: 20px;
   }

   .card-content {
     padding: var(--card-padding);
   }
   ```


### **三、动态修改变量**
通过JavaScript动态修改变量值，实现实时样式更新：
```javascript
// 获取DOM元素
const root = document.documentElement;

// 修改全局变量
root.style.setProperty('--primary-color', '#2ecc71');

// 修改局部变量
const card = document.querySelector('.card');
card.style.setProperty('--card-padding', '30px');
```


### **四、变量的继承与级联**
1. **继承特性**  
   CSS变量会被后代元素继承：
   ```css
   body {
     --text-color: blue;
   }

   p {
     color: var(--text-color); /* 继承自body */
   }
   ```

2. **级联规则**  
   变量遵循CSS的层叠规则，优先级高的选择器会覆盖低优先级的：
   ```css
   :root {
     --color: red;
   }

   .special {
     --color: blue; /* 覆盖全局变量 */
   }

   .element {
     color: var(--color); /* 取决于.element是否有.special类 */
   }
   ```


### **五、实际应用场景**
#### 1. **主题切换**
```css
:root {
  --bg-color: white;
  --text-color: #333;
}

.dark-mode {
  --bg-color: #333;
  --text-color: white;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```
```javascript
// 切换主题
document.body.classList.toggle('dark-mode');
```

#### 2. **响应式设计**
```css
:root {
  --sidebar-width: 240px;
}

@media (max-width: 768px) {
  :root {
    --sidebar-width: 100px; /* 移动端调整侧边栏宽度 */
  }
}

.sidebar {
  width: var(--sidebar-width);
}
```

#### 3. **组件样式复用**
```css
.button {
  --button-bg: #3498db;
  --button-text: white;
  
  background-color: var(--button-bg);
  color: var(--button-text);
}

.button-danger {
  --button-bg: #e74c3c; /* 仅修改需要变化的变量 */
}
```


### **六、与预处理器变量的对比**
| **特性**         | **CSS变量**                     | **Sass/Less变量**               |
|------------------|---------------------------------|----------------------------------|
| **动态性**       | 运行时动态修改（支持JS交互）    | 编译时静态替换                   |
| **作用域**       | 基于DOM树的CSS选择器            | 基于文件或声明顺序               |
| **继承性**       | 支持CSS继承规则                 | 不支持，仅静态替换               |
| **浏览器支持**   | 现代浏览器（IE不支持）          | 需要编译为CSS                   |
| **使用场景**     | 动态主题、响应式设计            | 静态样式复用、嵌套结构           |


### **七、浏览器兼容性与回退方案**
1. **兼容性**  
   主流浏览器（Chrome 49+、Firefox 42+、Safari 9.1+）均支持，IE不支持。

2. **检测支持**  
   ```javascript
   if (window.CSS && window.CSS.supports('color', 'var(--primary)')) {
     // 支持CSS变量
   } else {
     // 不支持，使用回退方案
   }
   ```

3. **回退值**  
   ```css
   .element {
     color: var(--text-color, #333); /* 第二个参数为默认值 */
   }
   ```


### **八、性能注意事项**
1. **频繁修改变量可能影响性能**  
   与直接修改CSS属性相比，频繁通过JS修改变量可能导致更多重绘。

2. **合理使用作用域**  
   避免在全局定义过多变量，优先使用局部变量减少作用域查找。


### **九、总结**
CSS变量是现代CSS的重要特性，适用于：
- **动态样式**：主题切换、实时交互。
- **响应式设计**：根据媒体查询调整变量值。
- **大型项目**：提升样式可维护性和复用性。

结合JavaScript使用，能实现强大的动态样式系统，同时保持CSS的声明式优势。