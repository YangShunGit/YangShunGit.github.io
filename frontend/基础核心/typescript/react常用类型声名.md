以下是 React 中常用的 TypeScript 类型声明汇总，涵盖组件、Hooks、事件处理、上下文等核心场景：


### **1. 函数组件类型**
使用 `React.FC`（或 `React.FunctionComponent`）定义函数组件，自动包含 `children` 类型：

```typescript
import React from 'react';

// 基础组件
const MyComponent: React.FC = () => {
  return <div>Hello World</div>;
};

// 带 props 的组件
type MyComponentProps = {
  name: string;
  age?: number;
  onClick?: () => void;
};

const MyComponentWithProps: React.FC<MyComponentProps> = ({
  name,
  age = 0,
  onClick,
}) => {
  return (
    <div onClick={onClick}>
      Name: {name}, Age: {age}
    </div>
  );
};
```


### **2. 无 `children` 的组件**
使用 `React.VoidFunctionComponent`（或 `React.VFC`）创建不含 `children` 的组件：

```typescript
type Props = { message: string };
const MyComponent: React.VFC<Props> = ({ message }) => (
  <div>{message}</div>
);
```


### **3. 类组件类型**
使用 `React.Component` 或 `React.PureComponent` 定义类组件：

```typescript
type Props = { name: string };
type State = { count: number };

class MyClassComponent extends React.Component<Props, State> {
  state: State = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        {this.props.name}: {this.state.count}
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```


### **4. useState Hook 类型**
显式指定状态类型：

```typescript
import React, { useState } from 'react';

// 自动推断类型
const [count, setCount] = useState(0); // number 类型

// 显式指定类型
const [name, setName] = useState<string | null>(null);

// 复杂类型
type User = { id: number; name: string };
const [user, setUser] = useState<User>({ id: 1, name: 'Alice' });
```


### **5. useEffect Hook 类型**
依赖项数组需与回调函数中使用的变量类型匹配：

```typescript
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理逻辑
  };
}, [dependency]); // dependency 必须是稳定的类型
```


### **6. useReducer Hook 类型**
为 reducer 和初始状态定义类型：

```typescript
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET', payload: number };

type State = number;

const initialState: State = 0;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'SET':
      return action.payload;
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```


### **7. useContext Hook 类型**
为上下文创建强类型：

```typescript
// 创建上下文
type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

// 使用上下文
const theme = useContext(ThemeContext); // ThemeContextType | undefined
```


### **8. 事件处理函数类型**
为 DOM 事件指定类型：

```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.id);
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

<button onClick={handleClick}>Click me</button>
<input type="text" onChange={handleChange} />
```


### **9. Ref 类型**
使用 `React.RefObject` 或 `React.MutableRefObject`：

```typescript
// DOM ref
const inputRef = useRef<HTMLInputElement>(null);

// 访问 ref
const focusInput = () => {
  inputRef.current?.focus();
};

// 非 DOM ref
const timerRef = useRef<NodeJS.Timeout | null>(null);
```


### **10. 高阶组件（HOC）类型**
使用泛型保持类型安全：

```typescript
type PropsWithLoading = { isLoading: boolean };

function withLoading<T extends object>(
  WrappedComponent: React.ComponentType<T>
): React.ComponentType<T & PropsWithLoading> {
  return (props: T & PropsWithLoading) => {
    const { isLoading, ...rest } = props;
    return isLoading ? <div>Loading...</div> : <WrappedComponent {...rest} />;
  };
}
```


### **11. 自定义 Hook 类型**
为返回值定义类型：

```typescript
type UseCounterResult = {
  count: number;
  increment: () => void;
  decrement: () => void;
};

function useCounter(initialValue: number = 0): UseCounterResult {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  return { count, increment, decrement };
}
```


### **12. 组件 prop 类型工具**
- `React.ComponentProps`：获取组件的 props 类型
- `React.ComponentPropsWithoutRef`：获取组件的 props 类型（不含 ref）
- `React.ElementType`：表示组件类型

```typescript
// 获取 Button 组件的 props 类型
type ButtonProps = React.ComponentProps<'button'>;

// 创建接受任意组件的高阶组件
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// 使用示例
const Box = <C extends React.ElementType = 'div'>(
  props: PolymorphicComponentProps<C>
) => {
  const { as = 'div', ...rest } = props;
  return <as {...rest} />;
};
```


### **13. 严格模式类型**
在 `tsconfig.json` 中启用 `strict: true` 以获得更严格的类型检查：

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx"
  }
}
```


### **14. React Router 类型**
为路由组件添加类型：

```typescript
import { useParams, useLocation } from 'react-router-dom';

// 使用路由参数
type RouteParams = {
  id: string;
};

const MyComponent = () => {
  const params = useParams<RouteParams>();
  const location = useLocation();
  return <div>ID: {params.id}</div>;
};
```


### **总结**
React 与 TypeScript 结合时，核心是通过泛型和接口为组件、状态、事件等提供类型定义。主要注意点：
- 使用 `React.FC` 或直接定义 props 接口
- 为 Hooks（如 `useState`、`useReducer`）显式指定类型
- 事件处理函数使用 `React.*Event` 类型
- Ref 使用 `React.RefObject` 或 `React.MutableRefObject`
- 高阶组件和自定义 Hook 使用泛型保持类型安全

合理的类型定义能极大提升代码的可维护性和可靠性。