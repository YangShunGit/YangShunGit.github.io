在 React 函数组件中，`ref` 的使用方式与类组件有所不同，主要通过 `useRef` Hook 或 `forwardRef` 来实现。以下是函数组件中 `ref` 的核心用法和注意事项：


### **1. 使用 `useRef` 创建 Ref**
`useRef` 可以创建一个可变的 ref 对象，其 `.current` 属性在组件的整个生命周期内保持不变。

#### **基本用法**
```jsx
import { useRef } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus(); // 获取 DOM 节点并调用方法
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>聚焦输入框</button>
    </div>
  );
}
```

#### **特点**
- **保存可变值**：可用于存储定时器 ID、DOM 节点等。
- **不触发重渲染**：修改 `.current` 不会导致组件重新渲染。


### **2. Ref 转发（Forwarding Refs）**
使用 `forwardRef` 可以将 ref 从父组件传递到子组件的 DOM 节点，常用于封装组件。

#### **示例：转发 ref 到 DOM 元素**
```jsx
import { forwardRef, useRef } from 'react';

// 子组件：接收并转发 ref
const FancyInput = forwardRef((props, ref) => (
  <div>
    <input ref={ref} {...props} />
  </div>
));

// 父组件：使用 ref 访问子组件的 input
function Parent() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <div>
      <FancyInput ref={inputRef} />
      <button onClick={focusInput}>聚焦</button>
    </div>
  );
}
```


### **3. 使用 `useImperativeHandle` 自定义暴露给父组件的 API**
`useImperativeHandle` 可以限制父组件通过 ref 访问子组件的内容，只暴露指定的方法。

#### **示例：自定义暴露方法**
```jsx
import { forwardRef, useRef, useImperativeHandle } from 'react';

const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);

  // 自定义暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    scrollIntoView: () => {
      inputRef.current.scrollIntoView();
    },
  }));

  return <input ref={inputRef} {...props} />;
});
```


### **4. Ref 的其他应用场景**
#### **存储 previous 值**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef();

  useEffect(() => {
    prevCountRef.current = count; // 保存上一次的值
  }, [count]);

  const prevCount = prevCountRef.current;
  return <div>Now: {count}, before: {prevCount}</div>;
}
```

#### **在副作用中访问 DOM**
```jsx
function App() {
  const divRef = useRef(null);

  useEffect(() => {
    // 组件挂载后访问 DOM
    const div = divRef.current;
    if (div) {
      // 操作 DOM，如测量尺寸
      const rect = div.getBoundingClientRect();
      console.log('Div width:', rect.width);
    }
  }, []);

  return <div ref={divRef}>Hello World</div>;
}
```


### **5. 注意事项**
1. **函数组件没有实例**：不能直接给函数组件添加 ref（除非使用 `forwardRef`）。
2. **ref 更新时机**：`ref` 在 `componentDidMount` 和 `componentDidUpdate` 之后才会更新。
3. **避免在渲染阶段访问 ref**：可能导致性能问题或循环更新。
4. **类组件与函数组件的 ref 区别**：
   - 类组件：ref 指向组件实例。
   - 函数组件：ref 需要通过 `forwardRef` 或 `useImperativeHandle` 转发到 DOM 节点。


### **总结**
- **`useRef`**：创建可变的 ref 对象，用于存储 DOM 节点或任意值。
- **`forwardRef`**：将 ref 从父组件传递到子组件的 DOM 节点。
- **`useImperativeHandle`**：自定义暴露给父组件的 ref 方法，限制访问范围。

通过这些方式，函数组件可以灵活处理 ref，实现与类组件类似的功能，同时保持函数式的设计模式。