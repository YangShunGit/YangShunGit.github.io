`useEffect` 内部函数和返回的清理函数的执行逻辑是 React Hooks 中较难理解的部分，它们的行为与依赖项、闭包和组件生命周期密切相关。以下从几个关键角度详细解析：


### **1. 基本执行流程**
#### **内部函数（副作用函数）**
- **首次渲染后**：无论依赖项如何，副作用函数都会执行。
- **后续渲染时**：
  - **依赖项变化**：先执行上一次的清理函数（如果有），再执行新的副作用函数。
  - **依赖项不变**：跳过整个 `useEffect`（不执行清理函数和副作用函数）。

#### **返回的清理函数**
- **组件卸载前**：必定执行一次清理函数。
- **更新时**：仅当依赖项变化时，在执行新副作用前，先执行旧副作用的清理函数。


### **2. 闭包陷阱与依赖项**
副作用函数和清理函数会捕获定义时的 props/state，形成闭包。若依赖项未正确声明，可能导致闭包陷阱：

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 闭包捕获的是旧的 count 值
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 依赖项为空，副作用只执行一次

  return <button onClick={() => setCount(count + 1)}>Click</button>;
}
```

**问题**：定时器回调中捕获的 `count` 始终是初始值（0），因为副作用函数只在挂载时执行一次。

**解决方案**：
- 将 `count` 添加到依赖项数组：`[count]`
- 使用函数式更新（若不需要依赖外部状态）：
  ```jsx
  setCount(prev => prev + 1); // 不依赖闭包中的 count
  ```


### **3. 清理函数的闭包捕获**
清理函数同样会捕获定义时的 props/state：

```jsx
useEffect(() => {
  const id = subscribe(props.id); // 捕获当前 props.id
  return () => {
    unsubscribe(id); // 清理时使用捕获的 id
  };
}, [props.id]); // 依赖 props.id，变化时重新订阅
```

**执行逻辑**：
1. 首次渲染：`subscribe(1)`
2. `props.id` 变为 2：
   - 执行清理函数：`unsubscribe(1)`
   - 执行新副作用：`subscribe(2)`
3. 组件卸载：`unsubscribe(2)`


### **4. 依赖项数组的不同情况**
#### **空数组 `[]`**
- **副作用函数**：仅在挂载时执行一次。
- **清理函数**：仅在卸载时执行一次。
- **场景**：初始化一次性操作（如初始化第三方库）。

```jsx
useEffect(() => {
  initLibrary(); // 只在挂载时执行
  return () => destroyLibrary(); // 只在卸载时执行
}, []);
```

#### **包含依赖项 `[dep1, dep2]`**
- **副作用函数**：挂载时执行，依赖项变化时重新执行。
- **清理函数**：依赖项变化时和卸载时执行。
- **场景**：依赖外部状态的操作（如数据订阅）。

#### **无依赖项数组**
- **副作用函数**：每次渲染后执行。
- **清理函数**：每次渲染前执行上一次的清理函数。
- **场景**：需要跟踪所有变化的场景（谨慎使用，可能导致性能问题）。


### **5. 执行顺序示例**
```jsx
function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Mount with count:', count);
    return () => console.log('Unmount/cleanup count:', count);
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Update</button>;
}
```

**执行日志**：
1. 初始渲染：`Mount with count: 0`
2. 点击按钮（count → 1）：
   ```
   Unmount/cleanup count: 0
   Mount with count: 1
   ```
3. 再次点击（count → 2）：
   ```
   Unmount/cleanup count: 1
   Mount with count: 2
   ```
4. 组件卸载：`Unmount/cleanup count: 2`


### **6. 优化建议**
1. **使用 `useRef` 保存可变值**：避免闭包陷阱。
   ```jsx
   const countRef = useRef(count);
   countRef.current = count; // 在副作用中使用 countRef.current
   ```

2. **使用 `useCallback` 稳定回调函数**：
   ```jsx
   const fetchData = useCallback(() => {
     // 依赖 props.id 的逻辑
   }, [props.id]);

   useEffect(() => {
     fetchData();
   }, [fetchData]); // fetchData 引用不变时，副作用不会重新执行
   ```

3. **避免不必要的依赖**：若副作用不依赖外部状态，可通过空数组优化。


### **总结**
- **副作用函数**：在依赖项变化时执行，捕获当前闭包状态。
- **清理函数**：在依赖项变化或组件卸载前执行，捕获的是上一次副作用的闭包状态。
- **闭包陷阱**：通过正确声明依赖项或使用 `useRef` 解决。
- **性能优化**：合理使用依赖项数组和 `useCallback` 减少不必要的执行。

理解这些执行逻辑是编写高效、无 Bug 的 React Hooks 代码的关键。