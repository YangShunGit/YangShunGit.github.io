在 React 16.3 及以后的版本中，引入了两个新的生命周期方法，同时对原有的生命周期进行了一些调整。这两个新的生命周期方法主要用于替代被标记为不安全的旧方法（如 `componentWillReceiveProps`、`componentWillMount` 和 `componentWillUpdate`）。


### **1. `static getDerivedStateFromProps`**
这是一个**静态方法**，用于在**每次渲染前**根据新的 props 更新 state。它替代了 `componentWillReceiveProps` 和 `componentWillUpdate` 的部分场景。

#### **特点**
- **静态方法**：无法访问 `this`，只能通过参数获取 `props` 和 `state`。
- **返回值**：必须返回一个对象来更新 state，或返回 `null` 表示不更新。
- **执行时机**：
  - 首次渲染前。
  - 每次接收到新 props 或 state 变化时（包括父组件重渲染触发的子组件更新）。

#### **示例**
```jsx
class Example extends React.Component {
  state = {
    isScrollingDown: false,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    // 根据 props 更新 state
    if (nextProps.currentRow !== prevState.lastRow) {
      return {
        lastRow: nextProps.currentRow,
      };
    }
    return null; // 不更新 state
  }
}
```

#### **适用场景**
- 表单组件中根据外部值重置内部状态。
- 缓存 props 中的某些值到 state 中。


### **2. `getSnapshotBeforeUpdate`**
这是一个**实例方法**，用于在 DOM 更新前获取当前 DOM 的状态（如滚动位置），并将其传递给 `componentDidUpdate`。

#### **特点**
- **返回值**：返回一个值（如 DOM 信息），该值会作为第三个参数传递给 `componentDidUpdate`。
- **执行时机**：
  - DOM 更新前（但 state 和 props 已更新）。
  - `render` 之后，`componentDidUpdate` 之前。

#### **示例**
```jsx
class ScrollingList extends React.Component {
  listRef = React.createRef();

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 在更新前获取滚动位置
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 使用 snapshot 恢复滚动位置
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return <div ref={this.listRef}>{/* 列表内容 */}</div>;
  }
}
```

#### **适用场景**
- 保持滚动位置。
- 记录 DOM 更新前的某些状态（如选中的文本范围）。


### **新旧生命周期对比**
#### **旧生命周期（React 16.3 前）**
```
componentWillMount → render → componentDidMount
componentWillReceiveProps → shouldComponentUpdate → componentWillUpdate → render → componentDidUpdate
componentWillUnmount
```

#### **新生命周期（React 16.3+）**
```
static getDerivedStateFromProps → render → componentDidMount
static getDerivedStateFromProps → shouldComponentUpdate → render → getSnapshotBeforeUpdate → componentDidUpdate
componentWillUnmount
```


### **总结**
- **`getDerivedStateFromProps`**：在渲染前根据 props 更新 state，替代部分 `componentWillReceiveProps` 的功能。
- **`getSnapshotBeforeUpdate`**：在 DOM 更新前捕获状态并传递给 `componentDidUpdate`，用于处理滚动位置等场景。

这两个新方法的引入主要是为了避免旧生命周期中的**异步渲染**问题，使代码在未来的并发模式下更加安全可靠。