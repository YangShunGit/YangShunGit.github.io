# react diff算法

## 核心优化策略
1. `树比较策略`：
React 对树进行分层比较，不会跨层级移动节点;
当发现两个不同类型的元素时，会直接销毁旧元素并创建新元素.
2. `组件比较策略`：
对于同一类型的组件，保持实例不变，只更新 props 和 state;
对于不同类型的组件，直接销毁旧组件，创建新组件.
3. `元素比较策略`：
对于列表元素，React 默认按顺序比较;
当元素位置发生变化时，这种比较会导致性能问题;
通过提供唯一的 key 属性，React 可以识别每个元素，只移动需要移动的元素.


## 实现简易diff模型
```js
// 虚拟 DOM 节点类型
class VNode {
  constructor(type, props, children) {
    this.type = type;
    this.props = props || {};
    this.children = children || [];
  }
}

// 创建虚拟 DOM 节点的辅助函数
function createElement(type, props, ...children) {
  return new VNode(type, props, children);
}

// 简易的 Diff 算法实现
function diff(oldNode, newNode, parentDOM) {
  // 情况 1: 旧节点不存在，创建新节点
  if (!oldNode) {
    const newDOM = createDOM(newNode);
    parentDOM.appendChild(newDOM);
    return newDOM;
  }

  // 情况 2: 新节点不存在，删除旧节点
  if (!newNode) {
    parentDOM.removeChild(oldNode.dom);
    return null;
  }

  // 情况 3: 节点类型不同，替换旧节点
  if (oldNode.type !== newNode.type) {
    const newDOM = createDOM(newNode);
    parentDOM.replaceChild(newDOM, oldNode.dom);
    return newDOM;
  }

  // 情况 4: 节点类型相同，更新属性
  if (typeof oldNode.type === 'string') {
    updateDOMProperties(oldNode.dom, oldNode.props, newNode.props);
  }

  // 情况 5: 组件类型相同，更新组件
  else {
    // 对于组件，这里应该调用组件的更新方法
    // 简化处理，假设组件会自己更新
  }

  // 比较子节点
  updateChildren(oldNode.children, newNode.children, oldNode.dom);

  // 更新旧节点的引用
  oldNode.props = newNode.props;
  oldNode.children = newNode.children;
  
  return oldNode.dom;
}

// 更新子节点
function updateChildren(oldChildren, newChildren, parentDOM) {
  // 创建旧子节点的 key 到索引的映射
  const keyToIndexMap = {};
  oldChildren.forEach((child, index) => {
    if (child.props.key) {
      keyToIndexMap[child.props.key] = index;
    }
  });

  // 遍历新子节点，进行更新
  newChildren.forEach((newChild, newIndex) => {
    const key = newChild.props.key;
    
    // 如果有 key，查找对应的旧子节点
    if (key) {
      const oldIndex = keyToIndexMap[key];
      if (oldIndex !== undefined) {
        const oldChild = oldChildren[oldIndex];
        // 移动节点到正确位置
        if (oldIndex !== newIndex) {
          parentDOM.insertBefore(oldChild.dom, parentDOM.childNodes[newIndex] || null);
          // 更新旧子节点数组
          oldChildren.splice(oldIndex, 1);
          oldChildren.splice(newIndex, 0, oldChild);
        }
        // 递归比较
        diff(oldChild, newChild, parentDOM);
      } else {
        // 新节点，创建并插入
        const newDOM = createDOM(newChild);
        parentDOM.insertBefore(newDOM, parentDOM.childNodes[newIndex] || null);
      }
    } else {
      // 没有 key，按顺序比较
      const oldChild = oldChildren[newIndex];
      if (oldChild) {
        diff(oldChild, newChild, parentDOM);
      } else {
        // 新节点，创建并插入
        const newDOM = createDOM(newChild);
        parentDOM.appendChild(newDOM);
      }
    }
  });

  // 删除多余的旧节点
  while (oldChildren.length > newChildren.length) {
    const oldChild = oldChildren.pop();
    parentDOM.removeChild(oldChild.dom);
  }
}

// 创建真实 DOM
function createDOM(vnode) {
  let dom;
  
  if (typeof vnode.type === 'string') {
    // 创建元素节点
    dom = document.createElement(vnode.type);
    
    // 设置属性
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key === 'key') continue;
      if (key === 'children') continue;
      dom[key] = value;
    }
    
    // 添加子节点
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        dom.appendChild(document.createTextNode(child));
      } else {
        dom.appendChild(createDOM(child));
      }
    });
  } else {
    // 组件节点 - 简化处理
    dom = document.createElement('div');
  }
  
  // 存储真实 DOM 引用
  vnode.dom = dom;
  return dom;
}

// 更新 DOM 属性
function updateDOMProperties(dom, oldProps, newProps) {
  // 移除旧属性
  for (const [key, value] of Object.entries(oldProps)) {
    if (key === 'key') continue;
    if (key === 'children') continue;
    if (!(key in newProps)) {
      dom[key] = null;
    }
  }
  
  // 添加/更新新属性
  for (const [key, value] of Object.entries(newProps)) {
    if (key === 'key') continue;
    if (key === 'children') continue;
    dom[key] = value;
  }
}

```


