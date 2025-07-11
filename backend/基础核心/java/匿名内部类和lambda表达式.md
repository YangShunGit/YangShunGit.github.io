### 一、概念对比

#### **1. 匿名内部类（Anonymous Inner Class）**
- **定义**：一种没有显式命名的局部内部类，必须在声明的同时创建实例
- **语法**：
  ```java
  new 父类构造器([参数列表])|接口() {
      // 类体（实现父类方法或接口方法）
  };
  ```
- **核心特点**：
  - 可以继承类或实现接口，但不能同时实现多个接口
  - 可以访问外部类的所有成员（包括私有成员）
  - 会隐式持有外部类的引用（可能导致内存泄漏）

#### **2. Lambda表达式**
- **定义**：Java 8引入的函数式编程特性，用于简化函数式接口的实现
- **语法**：
  ```java
  (参数列表) -> { 方法体 };
  ```
- **核心特点**：
  - 只能实现**函数式接口**（即只有一个抽象方法的接口）
  - 不需要显式声明接口类型，JVM会自动推断
  - 不会持有外部类的引用（除非显式使用外部变量）


### 二、语法对比

#### **场景1：实现Runnable接口**
```java
// 匿名内部类
new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println("匿名内部类实现");
    }
}).start();

// Lambda表达式
new Thread(() -> System.out.println("Lambda实现")).start();
```

#### **场景2：实现Comparator接口**
```java
List<String> list = Arrays.asList("apple", "banana", "cherry");

// 匿名内部类
Collections.sort(list, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.length() - b.length();
    }
});

// Lambda表达式
Collections.sort(list, (a, b) -> a.length() - b.length());

// Java 8+ 更简洁写法
list.sort(Comparator.comparingInt(String::length));
```


### 三、核心区别

| **对比维度**         | **匿名内部类**                     | **Lambda表达式**                     |
|----------------------|------------------------------------|--------------------------------------|
| **接口限制**         | 可实现任意接口或继承类             | 只能实现函数式接口（@FunctionalInterface） |
| **语法复杂度**       | 完整的类结构，代码冗余             | 极简语法，省略接口名和方法名         |
| **this引用**         | 指向匿名类实例本身                 | 指向外部类实例                       |
| **编译方式**         | 生成独立的.class文件（如Main$1.class） | 通过invokedynamic指令动态调用        |
| **性能**             | 每次创建新实例，开销稍大           | 可能被JVM优化为静态方法调用，性能更好 |
| **变量捕获**         | 捕获的变量必须声明为final或事实final | 同左，但对事实final的检查更宽松      |


### 四、变量捕获规则

#### **1. 匿名内部类**
- 必须显式声明捕获的局部变量为`final`（Java 8之前）
- Java 8+ 允许隐式的“事实final”（即变量实际上未被修改）
- 捕获的变量会复制到匿名内部类实例中

```java
final int x = 10; // Java 8之前必须显式声明final
int y = 20;       // Java 8+ 可以不显式声明，但不能被修改

new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println(x + y); // 捕获外部变量
        // y = 30; // 错误！不能修改捕获的变量
    }
}).start();
```

#### **2. Lambda表达式**
- 同样要求捕获的变量为final或事实final
- 直接引用外部变量，不会复制（但仍不能修改）

```java
int x = 10;
Runnable r = () -> System.out.println(x); // 直接引用外部变量
// x = 20; // 错误！修改会导致Lambda无法捕获该变量
```


### 五、适用场景

#### **建议使用Lambda的场景**
- 实现简单的函数式接口（如Runnable、Comparator、Consumer）
- 集合的流式操作（如forEach、map、filter）
- 需要传递函数式接口作为参数的场景

#### **建议使用匿名内部类的场景**
- 需要实现非函数式接口（如包含多个抽象方法的接口）
- 需要定义成员变量或额外方法
- 需要显式继承类并扩展其功能
- 需要在内部类中使用`this`引用当前实例


### 六、面试高频问题

#### **问题1：Lambda表达式和匿名内部类在处理`this`关键字时有什么不同？**
**回答**：  
- 匿名内部类中的`this`指向匿名类实例本身  
- Lambda表达式中的`this`指向外部类实例  

**示例**：
```java
public class ThisExample {
    public void test() {
        // 匿名内部类
        Runnable r1 = new Runnable() {
            @Override
            public void run() {
                System.out.println(this.getClass().getName()); // 输出ThisExample$1
            }
        };
        
        // Lambda表达式
        Runnable r2 = () -> {
            System.out.println(this.getClass().getName()); // 输出ThisExample
        };
    }
}
```

#### **问题2：Lambda表达式的性能一定比匿名内部类好吗？**
**回答**：  
- **通常情况下**：Lambda表达式通过invokedynamic指令实现，可能被JVM优化为静态方法调用，性能更优  
- **特殊情况**：若Lambda表达式被频繁创建，JVM可能无法充分优化，此时性能差异不明显  
- **建议**：优先考虑代码可读性，性能差异在大多数场景下可以忽略


### 七、Java 8+ 函数式接口

Lambda表达式主要用于实现Java 8引入的函数式接口，常见的有：

| **接口**          | **抽象方法**               | **示例用途**                 |
|-------------------|---------------------------|------------------------------|
| `Runnable`        | `void run()`              | 线程任务                     |
| `Supplier<T>`     | `T get()`                 | 提供数据                     |
| `Consumer<T>`     | `void accept(T t)`        | 消费数据                     |
| `Function<T, R>`  | `R apply(T t)`            | 数据转换                     |
| `Predicate<T>`    | `boolean test(T t)`       | 条件判断                     |
| `Comparator<T>`   | `int compare(T o1, T o2)` | 对象比较                     |


### 八、总结
| **维度**         | **匿名内部类**                     | **Lambda表达式**                     |
|------------------|------------------------------------|--------------------------------------|
| **代码风格**     | 面向对象，结构完整                 | 函数式编程，语法极简                 |
| **适用接口**     | 任意接口或类                       | 函数式接口                           |
| **this引用**     | 指向匿名类实例                     | 指向外部类实例                       |
| **变量捕获**     | 复制外部变量                       | 直接引用外部变量                     |
| **性能**         | 常规对象创建开销                   | 可能被优化为静态方法调用             |
| **Java版本**     | 从Java 1.1开始支持                 | Java 8+ 支持                         |

**选择原则**：  
- 若需要简洁表达函数逻辑且接口为函数式接口 → **Lambda**  
- 若需要复杂实现（如多方法、内部状态）或兼容旧代码 → **匿名内部类**