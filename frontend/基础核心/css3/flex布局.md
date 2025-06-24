Flexbox（Flexible Box Layout）是CSS3引入的一种一维布局模型，专为高效分配和对齐容器内的元素而设计。它解决了传统布局中的痛点（如垂直居中困难、自适应布局复杂等），成为现代前端开发的核心技术之一。


### **一、基本概念**
#### 1. **两根轴线**
- **主轴（main axis）**：元素排列的主要方向，由`flex-direction`决定。
- **交叉轴（cross axis）**：与主轴垂直的方向。

#### 2. **容器与项目**
- **Flex容器（Flex Container）**：应用`display: flex`或`display: inline-flex`的元素。
- **Flex项目（Flex Item）**：容器内的直接子元素。


### **二、容器属性（作用于父元素）**
#### 1. **display**
```css
.container {
  display: flex;      /* 块级弹性容器 */
  display: inline-flex; /* 行内弹性容器 */
}
```

#### 2. **flex-direction**
定义主轴方向：
```css
.container {
  flex-direction: row;      /* 默认：水平从左到右 */
  flex-direction: row-reverse; /* 水平从右到左 */
  flex-direction: column;   /* 垂直从上到下 */
  flex-direction: column-reverse; /* 垂直从下到上 */
}
```

#### 3. **flex-wrap**
控制元素是否换行：
```css
.container {
  flex-wrap: nowrap;    /* 默认：不换行，可能溢出 */
  flex-wrap: wrap;      /* 换行，元素会另起一行 */
  flex-wrap: wrap-reverse; /* 换行，但方向相反 */
}
```

#### 4. **flex-flow**
`flex-direction`和`flex-wrap`的简写：
```css
.container {
  flex-flow: row wrap; /* 等价于上面两个属性的组合 */
}
```

#### 5. **justify-content**
定义主轴上的对齐方式：
```css
.container {
  justify-content: flex-start;  /* 默认：左对齐 */
  justify-content: flex-end;    /* 右对齐 */
  justify-content: center;      /* 居中对齐 */
  justify-content: space-between; /* 两端对齐，间距均匀 */
  justify-content: space-around; /* 每个元素两侧间距相等 */
  justify-content: space-evenly; /* 所有间距完全相等 */
}
```

#### 6. **align-items**
定义交叉轴上的对齐方式：
```css
.container {
  align-items: stretch;   /* 默认：拉伸填满容器 */
  align-items: flex-start; /* 交叉轴起点对齐 */
  align-items: flex-end;   /* 交叉轴终点对齐 */
  align-items: center;     /* 交叉轴居中对齐 */
  align-items: baseline;   /* 基线对齐（文字底部对齐） */
}
```

#### 7. **align-content**
定义多行元素在交叉轴上的对齐方式（仅当`flex-wrap: wrap`时有效）：
```css
.container {
  align-content: stretch;   /* 默认：拉伸填满交叉轴 */
  align-content: flex-start; /* 交叉轴起点对齐 */
  align-content: flex-end;   /* 交叉轴终点对齐 */
  align-content: center;     /* 交叉轴居中对齐 */
  align-content: space-between; /* 两端对齐 */
  align-content: space-around; /* 间距均匀分布 */
}
```


### **三、项目属性（作用于子元素）**
#### 1. **order**
定义元素的排列顺序（默认值为0）：
```css
.item {
  order: -1; /* 负值排在前面 */
  order: 1;  /* 正值排在后面 */
}
```

#### 2. **flex-grow**
定义元素的放大比例（默认值为0，即不放大）：
```css
.item {
  flex-grow: 1; /* 平均分配剩余空间 */
  flex-grow: 2; /* 分配的空间是其他元素的2倍 */
}
```

#### 3. **flex-shrink**
定义元素的缩小比例（默认值为1，即空间不足时会缩小）：
```css
.item {
  flex-shrink: 0; /* 空间不足时不缩小 */
}
```

#### 4. **flex-basis**
定义元素在主轴上的初始大小（默认值为`auto`，即元素的内容大小）：
```css
.item {
  flex-basis: 200px; /* 固定宽度 */
  flex-basis: 50%;   /* 占容器宽度的50% */
}
```

#### 5. **flex**
`flex-grow`、`flex-shrink`和`flex-basis`的简写（推荐使用）：
```css
.item {
  flex: 1;        /* 等价于：flex-grow: 1; flex-shrink: 1; flex-basis: 0; */
  flex: 1 200px;  /* 等价于：flex-grow: 1; flex-shrink: 1; flex-basis: 200px; */
  flex: 0 0 auto; /* 默认值 */
}
```

#### 6. **align-self**
覆盖容器的`align-items`属性，单独定义元素在交叉轴上的对齐方式：
```css
.item {
  align-self: flex-start; /* 单独顶部对齐 */
  align-self: center;     /* 单独居中对齐 */
}
```


### **四、常见应用场景**
#### 1. **水平垂直居中**
```css
.container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
}
```

#### 2. **等高列布局**
```css
.container {
  display: flex;
}

.column {
  flex: 1; /* 所有列平均分配宽度，且高度自动相等 */
}
```

#### 3. **自适应导航栏**
```css
.nav {
  display: flex;
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center;
}

.logo {
  /* 左侧logo */
}

.menu {
  display: flex;
  gap: 20px; /* 菜单项间距 */
}
```

#### 4. **圣杯布局（三栏布局）**
```css
.container {
  display: flex;
}

.sidebar {
  flex: 0 0 200px; /* 固定宽度200px */
}

.main {
  flex: 1; /* 中间内容区自适应 */
}
```

#### 5. **响应式网格**
```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.item {
  flex: 1 1 calc(25% - 10px); /* 每行4个，减去间距 */
  
  @media (max-width: 768px) {
    flex: 1 1 calc(50% - 10px); /* 移动端每行2个 */
  }
}
```


### **五、注意事项与兼容性**
1. **浏览器支持**  
   主流浏览器（Chrome 21+、Firefox 22+、Safari 6.1+）均支持，IE10+部分支持（需添加`-ms-`前缀）。

2. **与浮动的区别**  
   - Flexbox是为一维布局设计（水平或垂直），浮动是为文本环绕设计。
   - Flexbox不会触发BFC（块级格式化上下文），浮动会。

3. **性能考量**  
   - Flexbox的性能优于浮动和表格布局，但在极端复杂的布局中可能不如Grid。


### **六、总结**
Flexbox的核心思想是**弹性分配空间**，通过容器和项目的属性组合，可以高效解决各种布局问题。推荐记忆以下口诀：
- **容器属性**：方向（`flex-direction`）、换行（`flex-wrap`）、主轴对齐（`justify-content`）、交叉轴对齐（`align-items`）。
- **项目属性**：顺序（`order`）、放大（`flex-grow`）、缩小（`flex-shrink`）、基准（`flex-basis`）。

结合现代CSS（如`gap`属性、`min/max-width`），Flexbox能实现更简洁的布局代码。