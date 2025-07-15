在 TypeScript 中，`declare` 关键字用于告诉编译器“这个变量或类型存在，但定义在其他地方”。它主要用于以下场景：


### **1. 声明全局变量**
告诉 TypeScript 某个全局变量的类型，即使它在运行时才存在（如通过 `<script>` 引入的库）。

```typescript
// 声明一个全局变量
declare var jQuery: (selector: string) => any;

// 使用全局变量
jQuery("#app").hide();
```


### **2. 声明全局函数**
为全局函数提供类型定义，无需实现。

```typescript
// 声明全局函数
declare function greet(name: string): void;

// 使用全局函数
greet("Alice");
```


### **3. 声明全局类型**
在全局作用域中声明类型、接口或枚举。

```typescript
// 声明全局接口
declare interface Window {
  myApp: {
    version: string;
  };
}

// 使用全局接口
console.log(window.myApp.version);
```


### **4. 声明命名空间**
为全局命名空间提供类型结构。

```typescript
// 声明命名空间
declare namespace MyLib {
  export interface Config {
    url: string;
  }
  
  export function init(config: Config): void;
}

// 使用命名空间
MyLib.init({ url: "https://example.com" });
```


### **5. 声明模块**
为外部模块（如 npm 包）提供类型定义。

```typescript
// 声明整个模块
declare module "lodash" {
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number
  ): T;
}

// 使用模块
import { debounce } from "lodash";
const debounced = debounce(() => console.log("Debounced"), 300);
```


### **6. 声明模块中的命名空间**
为模块内部的命名空间提供类型。

```typescript
// 声明模块中的命名空间
declare module "my-module" {
  export namespace Utils {
    function formatDate(date: Date): string;
  }
}

// 使用模块中的命名空间
import { Utils } from "my-module";
Utils.formatDate(new Date());
```


### **7. 声明文件（.d.ts）**
将 `declare` 语句放入单独的 `.d.ts` 文件中，为现有 JavaScript 代码提供类型定义。

```typescript
// my-library.d.ts
declare module "my-library" {
  export interface User {
    name: string;
    age: number;
  }
  
  export function fetchUser(id: string): Promise<User>;
}
```


### **8. 声明类**
为现有类提供类型定义（如原生 DOM 类）。

```typescript
// 声明类
declare class MyClass {
  constructor(options: any);
  render(): void;
}

// 使用类
const instance = new MyClass({});
instance.render();
```


### **关键点总结**
1. **仅用于类型声明**：`declare` 只提供类型信息，不生成运行时代码。
2. **适用于外部代码**：主要用于为 JavaScript 库、全局变量或运行时注入的代码提供类型支持。
3. **与 `.d.ts` 文件结合**：通常将声明放在 `.d.ts` 文件中，便于管理和复用。
4. **自动全局声明**：如果 `.d.ts` 文件没有 `import/export`，其中的声明会自动成为全局类型。


### **示例：为第三方库创建声明文件**
假设你使用一个未提供类型定义的库 `legacy-library`，可以创建 `legacy-library.d.ts`：

```typescript
// legacy-library.d.ts
declare module "legacy-library" {
  export function processData(data: string): string;
  export const VERSION: string;
}
```

然后在代码中使用：

```typescript
import { processData, VERSION } from "legacy-library";

console.log(VERSION); // 类型安全
const result = processData("input"); // 类型检查
```


### **与 `export` 结合使用**
在模块内部声明类型并导出：

```typescript
// types.d.ts
export declare interface Point {
  x: number;
  y: number;
}

export declare function distance(p1: Point, p2: Point): number;
```

使用时：

```typescript
import { Point, distance } from "./types";

const p1: Point = { x: 0, y: 0 };
const p2: Point = { x: 3, y: 4 };
console.log(distance(p1, p2)); // 5
```


### **注意事项**
- **不要重复定义**：如果库已经有官方类型定义（如 `@types/xxx`），不要重复创建声明。
- **保持声明准确**：错误的声明可能导致类型检查失效，反而增加风险。
- **优先使用官方类型**：大多数流行库都有官方或社区维护的类型定义。

通过合理使用 `declare`，可以在不修改原有 JavaScript 代码的情况下，为其提供类型支持，提升开发体验和代码质量。