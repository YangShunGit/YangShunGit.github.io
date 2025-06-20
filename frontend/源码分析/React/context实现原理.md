# React Context 

## 作用
数据共享、深层传递参数

## 用法
```js 
import { createContext } from 'react';

// 1 createContext
const ThemeContext = createContext('light');

// 2 ThemeContext 注：19版本以前需要使用Provider <ThemeContext.Provider>
function App() {
  const [theme, setTheme] = useState('light');
  // ……
  return (
    <ThemeContext value={theme}>
      <Page />
    </ThemeContext>
  );
}

// 3 useContext
function Button() {
  // ✅ 推荐方式
  const theme = useContext(ThemeContext);
  return <button className={theme} />;
}
// 也可通过回调获取
function Button() {
  // 🟡 遗留方式 (不推荐)
  return (
    <ThemeContext.Consumer>
      {theme => (
        <button className={theme} />
      )}
    </ThemeContext.Consumer>
  );
}
```

## 设计模式
发布订阅Provider-Consumer 模式：Context 提供一个 Provider 组件和一个 Consumer 组件。Provider 用于提供数据，Consumer 用于消费数据。


## 实现简易Context 模型
```js
import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. 创建一个简单的 Context 模型
class SimpleContext {
  constructor(defaultValue) {
    this.defaultValue = defaultValue;
    this.consumers = new Set();
    this.value = defaultValue;
  }

  // 设置新值并通知所有消费者
  setValue(newValue) {
    this.value = newValue;
    this.consumers.forEach(consumer => consumer(this.value));
  }

  // 添加消费者
  subscribe(consumer) {
    this.consumers.add(consumer);
    return () => this.consumers.delete(consumer);
  }
}

// 2. 创建 Provider 组件
function SimpleProvider({ context, value, children }) {
  const [currentValue, setCurrentValue] = useState(value);
  
  useEffect(() => {
    // 更新 context 的值
    context.setValue(currentValue);
    
    // 监听外部传入的 value 变化
    const unsubscribe = context.subscribe(newValue => {
      setCurrentValue(newValue);
    });
    
    return unsubscribe;
  }, [context, value]);

  return <>{children}</>;
}

// 3. 创建 Consumer 组件
function SimpleConsumer({ context, children }) {
  const [value, setValue] = useState(context.value);
  
  useEffect(() => {
    // 订阅 context 的变化
    const unsubscribe = context.subscribe(newValue => {
      setValue(newValue);
    });
    
    return unsubscribe;
  }, [context]);

  // children 应该是一个函数，接收 context 值并返回 JSX
  return typeof children === 'function' 
    ? children(value) 
    : null;
}

// 4. 创建一个钩子函数来简化使用
function useSimpleContext(context) {
  const [value, setValue] = useState(context.value);
  
  useEffect(() => {
    const unsubscribe = context.subscribe(newValue => {
      setValue(newValue);
    });
    
    return unsubscribe;
  }, [context]);

  return value;
}

// 5. 创建一个工厂函数来生成 context 对象
function createSimpleContext(defaultValue) {
  const context = new SimpleContext(defaultValue);
  
  return {
    Provider: ({ value, children }) => (
      <SimpleProvider context={context} value={value}>
        {children}
      </SimpleProvider>
    ),
    Consumer: ({ children }) => (
      <SimpleConsumer context={context}>
        {children}
      </SimpleConsumer>
    ),
    useContext: () => useSimpleContext(context),
    defaultValue
  };
}

// 使用示例
function Example() {
  // 创建一个主题 context
  const ThemeContext = createSimpleContext('light');
  
  return (
    <ThemeContext.Provider value="dark">
      <div>
        <h2>使用 Consumer 组件</h2>
        <ThemeContext.Consumer>
          {theme => <p>当前主题: {theme}</p>}
        </ThemeContext.Consumer>
        
        <h2>使用 useContext 钩子</h2>
        <ThemeDisplay />
      </div>
    </ThemeContext.Provider>
  );
}

function ThemeDisplay() {
  const theme = useSimpleContext(Example.ThemeContext);
  return <p>钩子获取的主题: {theme}</p>;
}

export { createSimpleContext };

```

## context嵌套
覆盖来自上层的某些 context 的唯一方法是将子组件包裹到一个提供不同值的 context provider 中
### 嵌套 Provider 的工作原理
1. 当一个组件树中有多个嵌套的 Provider 时，每个 Provider 都会将自己的值推入栈中

2. 消费者组件总是获取栈顶的值，这代表最近的 Provider

3. 当一个 Provider 卸载时，它的值会从栈中弹出，消费者会自动获取下一个最近的 Provider 值

4. 如果没有找到任何 Provider，消费者会使用默认值

