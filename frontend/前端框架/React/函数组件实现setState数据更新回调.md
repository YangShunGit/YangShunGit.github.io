在 React 函数组件中，`useState` 本身没有像类组件 `setState` 那样的直接回调参数，但可以通过几种方式实现类似的回调效果。以下是常见的解决方案：


### **1. 使用 `useEffect` 监听状态变化**
最常用的方式是使用 `useEffect` 监听状态变化，在依赖项数组中包含目标状态：

```jsx
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // 类似 componentDidUpdate
  useEffect(() => {
    // 状态更新后执行的回调逻辑
    console.log('Count updated:', count);
  }, [count]); // 仅在 count 变化时执行

  const increment = () => {
    setCount(prev => prev + 1);
    // 这里无法立即获取更新后的 count 值
  };

  return <button onClick={increment}>Count: {count}</button>;
}
```


### **2. 自定义 Hook 封装回调逻辑**
创建一个自定义 Hook 来模拟带回调的 `setState`：

```jsx
import { useState, useEffect, useRef } from 'react';

function useCallbackState(initialState) {
  const [state, setState] = useState(initialState);
  const callbackRef = useRef(null);

  const setStateWithCallback = (newState, callback) => {
    callbackRef.current = callback; // 保存回调函数
    setState(newState);
  };

  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current(state); // 状态更新后执行回调
      callbackRef.current = null; // 重置回调
    }
  }, [state]);

  return [state, setStateWithCallback];
}

// 使用示例
function Example() {
  const [count, setCount] = useCallbackState(0);

  const increment = () => {
    setCount(prev => prev + 1, (newCount) => {
      console.log('Callback after update:', newCount);
    });
  };

  return <button onClick={increment}>Count: {count}</button>;
}
```


### **3. 使用 Promise 和 async/await（高级方案）**
将回调封装为 Promise，使状态更新可以等待：

```jsx
import { useState, useRef } from 'react';

function usePromiseState(initialState) {
  const [state, setState] = useState(initialState);
  const resolvers = useRef([]);

  const setStateAsync = (newState) => {
    return new Promise((resolve) => {
      resolvers.current.push(resolve);
      setState((prev) =>
        typeof newState === 'function' ? newState(prev) : newState
      );
    });
  };

  // 状态更新后执行所有等待的 resolve
  useState(() => {
    resolvers.current.forEach((resolve) => resolve(state));
    resolvers.current = [];
  }, [state]);

  return [state, setStateAsync];
}

// 使用示例
async function handleClick() {
  await setCount(prev => prev + 1);
  // 此时 count 已更新
  console.log('Count is now:', count);
}
```


### **4. 在 `useEffect` 中处理副作用**
如果回调是为了执行副作用（如 API 请求），直接在 `useEffect` 中处理：

```jsx
function Example() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 状态变化时触发副作用
  useEffect(() => {
    if (data) {
      // 处理数据更新后的逻辑
      console.log('Data loaded:', data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchDataFromAPI();
    setData(result); // 数据更新后，上面的 useEffect 会触发
  };

  return <button onClick={fetchData}>{loading ? 'Loading...' : 'Fetch'}</button>;
}
```


### **注意事项**
1. **异步特性**：React 的状态更新是异步的，无论使用哪种方式，都无法在 `setState` 后立即获取更新后的值。
2. **依赖项数组**：`useEffect` 的依赖项数组必须正确设置，否则可能导致无限循环或回调不执行。
3. **性能考虑**：自定义 Hook 或 Promise 方案会增加额外的开销，仅在必要时使用。


### **总结**
| **方法**                     | **适用场景**                     | **示例代码**                                                                 |
|------------------------------|----------------------------------|-----------------------------------------------------------------------------|
| **useEffect**               | 简单监听状态变化                 | `useEffect(() => { /* 回调逻辑 */ }, [state])`                              |
| **自定义 Hook**              | 需要类似类组件的回调语法         | `setState(newValue, callback)`                                              |
| **Promise/async**            | 需要链式调用或异步操作           | `await setStateAsync(newValue)`                                             |
| **直接在 useEffect 中处理**  | 状态变化后执行副作用（如 API 请求） | `useEffect(() => { /* 副作用逻辑 */ }, [state])`                            |

选择哪种方式取决于具体场景。大多数情况下，`useEffect` 已经足够处理状态更新后的逻辑。