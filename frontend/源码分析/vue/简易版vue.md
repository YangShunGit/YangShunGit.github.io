### 简易版Vue框架实现

下面我们来实现一个简化版的Vue框架，包含核心的响应式系统、模板编译和虚拟DOM功能。这个简易框架将帮助我们更深入理解Vue的工作原理。

#### 1. 整体结构设计

我们的简易Vue框架将包含以下核心模块：
- `Vue`：主类，负责初始化和协调各模块
- 响应式系统：实现数据劫持和依赖收集
- 模板编译：将模板转换为渲染函数
- 虚拟DOM：实现VNode创建和diff算法

#### 2. 具体实现代码

```javascript
// 1. 依赖收集与派发更新
class Dep {
  constructor() {
    this.subscribers = []; // 存储所有依赖
  }
  
  // 添加依赖
  depend() {
    if (Watcher.target) {
      this.subscribers.push(Watcher.target);
    }
  }
  
  // 通知所有依赖更新
  notify() {
    this.subscribers.forEach(sub => sub.update());
  }
}

// 2. 观察者：负责更新视图
class Watcher {
  static target = null;
  
  constructor(vm, key, updateFn) {
    this.vm = vm;
    this.key = key;
    this.updateFn = updateFn;
    
    // 记录当前Watcher实例，用于依赖收集
    Watcher.target = this;
    // 触发getter，完成依赖收集
    this.vm[this.key];
    Watcher.target = null;
  }
  
  // 更新视图
  update() {
    this.updateFn.call(this.vm, this.vm[this.key]);
  }
}

// 3. 实现响应式系统
function defineReactive(obj, key, value) {
  // 递归处理嵌套对象
  observe(value);
  
  const dep = new Dep();
  
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      dep.depend();
      return value;
    },
    set(newValue) {
      if (newValue !== value) {
        value = newValue;
        observe(newValue); // 新值也需要变成响应式
        // 派发更新
        dep.notify();
      }
    }
  });
}

// 将对象的所有属性变为响应式
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  
  Object.keys(obj).forEach(key => {
    defineReactive(obj, key, obj[key]);
  });
}

// 4. 模板编译
function compileTemplate(vm, el) {
  const dom = document.querySelector(el);
  const fragment = document.createDocumentFragment();
  
  // 将DOM节点移动到文档片段
  let child;
  while (child = dom.firstChild) {
    fragment.appendChild(child);
  }
  
  // 编译文本节点中的{{}}
  function compile(node) {
    if (node.nodeType === 3) { // 文本节点
      const text = node.textContent;
      const reg = /\{\{(.*?)\}\}/g;
      
      if (reg.test(text)) {
        const key = RegExp.$1.trim();
        
        // 创建Watcher，当数据变化时更新文本
        new Watcher(vm, key, (newValue) => {
          node.textContent = text.replace(reg, newValue);
        });
        
        // 初始化文本内容
        node.textContent = text.replace(reg, vm[key]);
      }
    } 
    // 处理元素节点的指令
    else if (node.nodeType === 1) { 
      const attributes = node.attributes;
      Array.from(attributes).forEach(attr => {
        if (attr.name.startsWith('v-')) {
          const directive = attr.name.slice(2);
          const key = attr.value;
          
          if (directive === 'text') {
            new Watcher(vm, key, (newValue) => {
              node.textContent = newValue;
            });
            node.textContent = vm[key];
          }
          
          if (directive === 'model') {
            // 视图更新数据
            node.addEventListener('input', (e) => {
              vm[key] = e.target.value;
            });
            // 数据更新视图
            new Watcher(vm, key, (newValue) => {
              node.value = newValue;
            });
            node.value = vm[key];
          }
        }
      });
    }
    
    // 递归处理子节点
    if (node.children && node.children.length) {
      Array.from(node.children).forEach(child => compile(child));
    }
  }
  
  compile(fragment);
  dom.appendChild(fragment);
}

// 3. 虚拟DOM实现
class VNode {
  constructor(tag, data, children, text) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
  }
}

// 创建VNode
function createElement(tag, data = {}, children = []) {
  return new VNode(tag, data, children);
}

// 创建文本节点VNode
function createTextVNode(text) {
  return new VNode(undefined, undefined, undefined, text);
}

// 简化版patch方法：将VNode渲染到真实DOM
function patch(oldVNode, newVNode) {
  // 如果是首次渲染
  if (!oldVNode) {
    return createElm(newVNode);
  }
  
  // 如果节点类型不同，直接替换
  if (oldVNode.tag !== newVNode.tag) {
    const newElm = createElm(newVNode);
    oldVNode.el.parentNode.replaceChild(newElm, oldVNode.el);
    return newElm;
  }
  
  // 处理文本节点
  if (newVNode.text) {
    oldVNode.el.textContent = newVNode.text;
    return oldVNode.el;
  }
  
  // 更新属性
  updateProps(oldVNode.el, oldVNode.data, newVNode.data);
  
  // 处理子节点
  patchChildren(oldVNode.el, oldVNode.children, newVNode.children);
  
  return oldVNode.el;
}

// 创建真实DOM元素
function createElm(vnode) {
  let el;
  
  if (vnode.tag) {
    el = document.createElement(vnode.tag);
    updateProps(el, {}, vnode.data);
  } else {
    el = document.createTextNode(vnode.text);
  }
  
  // 递归创建子节点
  if (vnode.children && vnode.children.length) {
    vnode.children.forEach(child => {
      el.appendChild(createElm(child));
    });
  }
  
  vnode.el = el;
  return el;
}

// 更新元素属性
function updateProps(el, oldProps, newProps) {
  // 移除旧属性
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key);
    }
  }
  
  // 添加或更新新属性
  for (let key in newProps) {
    el.setAttribute(key, newProps[key]);
  }
}

// 处理子节点
function patchChildren(el, oldChildren, newChildren) {
  // 简化版：直接清空并重新渲染（真实Vue会使用更复杂的diff算法）
  el.innerHTML = '';
  newChildren.forEach(child => {
    el.appendChild(createElm(child));
  });
}

// 4. 主Vue类
class Vue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    this.$el = options.el;
    
    // 将data中的属性代理到Vue实例上
    this.proxyData(this.$data);
    
    // 实现响应式
    observe(this.$data);
    
    // 如果有模板，进行编译
    if (this.$el) {
      compileTemplate(this, this.$el);
    }
    
    // 调用created生命周期钩子
    if (options.created) {
      options.created.call(this);
    }
  }
  
  // 代理数据：使得可以通过this.key访问this.$data.key
  proxyData(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(newValue) {
          data[key] = newValue;
        }
      });
    });
  }
  
  // 渲染函数：创建虚拟DOM
  render() {
    if (this.$options.render) {
      return this.$options.render.call(this, createElement);
    }
    return null;
  }
  
  // 挂载方法
  $mount(el) {
    this.$el = el;
    const vnode = this.render();
    patch(null, vnode);
    
    // 调用mounted生命周期钩子
    if (this.$options.mounted) {
      this.$options.mounted.call(this);
    }
  }
}
```

#### 3. 使用示例

```html
<!-- HTML -->
<div id="app">
  <h1 v-text="title"></h1>
  <p>{{ message }}</p>
  <input type="text" v-model="message">
  <button onclick="app.message = 'Hello again!'">Change Message</button>
</div>

<script>
// 使用我们实现的简易Vue
const app = new Vue({
  el: '#app',
  data: {
    title: '简易Vue框架',
    message: 'Hello World!'
  },
  created() {
    console.log('实例创建完成');
  },
  mounted() {
    console.log('实例挂载完成');
  }
});
</script>
```

#### 4. 核心功能说明

1. **响应式系统**：
   - 通过`Object.defineProperty`实现数据劫持
   - `Dep`类负责收集依赖和派发更新
   - `Watcher`类负责监听数据变化并更新视图

2. **模板编译**：
   - 处理`{{}}`插值表达式
   - 实现`v-text`和`v-model`指令
   - 将模板转换为可响应的DOM元素

3. **虚拟DOM**：
   - `VNode`类表示虚拟节点
   - `patch`方法负责将虚拟DOM转换为真实DOM
   - 实现基本的节点更新逻辑

4. **生命周期**：
   - 实现了`created`和`mounted`两个核心生命周期钩子

这个简易版Vue框架虽然功能有限，但包含了Vue的核心思想和工作原理。真实的Vue框架在这些基础上进行了大量优化和扩展，如更高效的diff算法、异步更新队列、组件系统等。