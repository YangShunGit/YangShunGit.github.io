在 React 中，Context API 用于跨层级传递数据，避免 props drilling。Class 组件和函数组件使用 Context 的方式有所不同，以下是它们的多种用法及示例：


### **1. 创建 Context**
首先需要创建一个 Context 对象，通常在单独的文件中定义：

```jsx
// MyContext.js
import React from 'react';

const MyContext = React.createContext(defaultValue); // defaultValue 可选

export const MyProvider = MyContext.Provider;
export const MyConsumer = MyContext.Consumer; // 类组件使用
export default MyContext; // 函数组件使用 useContext
```


### **2. Class 组件中使用 Context**
#### **方式一：使用 Consumer（旧版）**
```jsx
import React from 'react';
import { MyConsumer } from './MyContext';

class ChildComponent extends React.Component {
  render() {
    return (
      <MyConsumer>
        {(contextValue) => (
          <div>Value from context: {contextValue}</div>
        )}
      </MyConsumer>
    );
  }
}
```

#### **方式二：使用 static contextType（新版）**
```jsx
import React from 'react';
import MyContext from './MyContext';

class ChildComponent extends React.Component {
  static contextType = MyContext; // 绑定 Context

  render() {
    return <div>Value from context: {this.context}</div>;
  }
}
```

#### **Provider 使用示例**
```jsx
import React from 'react';
import { MyProvider } from './MyContext';

class ParentComponent extends React.Component {
  state = { theme: 'light' };

  render() {
    return (
      <MyProvider value={this.state.theme}>
        <ChildComponent />
      </MyProvider>
    );
  }
}
```


### **3. 函数组件中使用 Context**
#### **方式一：使用 useContext Hook（推荐）**
```jsx
import React, { useContext } from 'react';
import MyContext from './MyContext';

function ChildComponent() {
  const contextValue = useContext(MyContext); // 获取 context 值
  return <div>Value from context: {contextValue}</div>;
}
```

#### **方式二：使用 Consumer（不常用）**
```jsx
import React from 'react';
import { MyConsumer } from './MyContext';

const ChildComponent = () => (
  <MyConsumer>
    {(contextValue) => <div>Value from context: {contextValue}</div>}
  </MyConsumer>
);
```


### **4. 多层 Context 嵌套**
可以嵌套多个 Provider，每个组件可以消费不同的 Context：

```jsx
// UserContext.js
export const UserProvider = React.createContext().Provider;

// ThemeContext.js
export const ThemeProvider = React.createContext().Provider;

// 嵌套使用
function App() {
  const user = { name: 'John' };
  const theme = { color: 'blue' };

  return (
    <UserProvider value={user}>
      <ThemeProvider value={theme}>
        <ChildComponent />
      </ThemeProvider>
    </UserProvider>
  );
}

// 函数组件中消费多个 Context
function ChildComponent() {
  const user = useContext(UserContext);
  const theme = useContext(ThemeContext);
  return (
    <div style={{ color: theme.color }}>
      Hello, {user.name}
    </div>
  );
}
```


### **5. 更新 Context 值**
通常将修改 Context 的方法也放在 Context 中传递：

```jsx
// AuthContext.js
import React, { useState } from 'react';

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username) => {
    setUser({ username });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```

```jsx
// 使用 Context 的组件
function LoginButton() {
  const { login } = useContext(AuthContext);
  return <button onClick={() => login('John')}>Login</button>;
}

function LogoutButton() {
  const { logout } = useContext(AuthContext);
  return <button onClick={logout}>Logout</button>;
}
```


### **6. 性能优化：useMemo 包裹 Provider**
当 Context 值频繁变化时，可能导致所有消费组件不必要的重渲染。可以使用 `useMemo` 优化：

```jsx
function App() {
  const [count, setCount] = useState(0);
  
  // 仅当 count 变化时才重新创建 contextValue
  const contextValue = useMemo(() => ({ count, setCount }), [count]);

  return (
    <MyContext.Provider value={contextValue}>
      <ChildComponent />
    </MyContext.Provider>
  );
}
```


### **总结**
| **场景**               | **Class 组件**                     | **函数组件**                     |
|------------------------|------------------------------------|----------------------------------|
| **消费 Context**       | `static contextType` 或 `<Consumer>` | `useContext` Hook                |
| **传递 Context**       | 使用 `<Provider>` 包裹子组件       | 同上                             |
| **更新 Context 值**   | 将 setState 方法通过 Context 传递  | 同上                             |
| **性能优化**           | 无特殊优化                         | 使用 `useMemo` 包裹 Provider     |

Context 是解决多层级数据传递的有效方式，但应避免过度使用（可能导致组件复用性降低）。建议仅在确实需要跨层级共享数据时使用。