CSS加载是前端性能优化的关键环节，合理控制CSS的加载顺序和方式可以显著提升页面加载速度和用户体验。以下是关于CSS加载的核心知识点和优化策略：


### **一、CSS加载的基本特性**
1. **阻塞渲染**  
   - 默认情况下，CSS是**渲染阻塞资源**（render-blocking），浏览器必须解析完所有CSS才能渲染页面。
   - 原因：CSS决定元素的样式，若未加载完成就渲染，可能导致页面闪烁（FOUC）。

2. **加载优先级**  
   - 浏览器会优先加载关键CSS（如首屏所需的样式），延迟加载非关键CSS。
   - 可通过`media`属性控制加载优先级（见下文）。

3. **与HTML并行加载**  
   - CSS加载不会阻塞HTML解析，但会阻塞JavaScript执行（若JS依赖CSSOM）。


### **二、CSS加载的常用方式**
#### 1. **外部样式表（推荐）**
```html
<link rel="stylesheet" href="styles.css">
```
- **优点**：可缓存，利于维护。
- **缺点**：需额外HTTP请求。

#### 2. **内联样式（首屏优化）**
```html
<style>
  /* 首屏关键CSS */
  body { margin: 0; }
  .header { background: #333; }
</style>
```
- **优点**：无需额外请求，减少渲染阻塞。
- **缺点**：无法缓存，增大HTML体积。

#### 3. **媒体查询加载**
```html
<link rel="stylesheet" href="print.css" media="print">
<link rel="stylesheet" href="mobile.css" media="(max-width: 768px)">
```
- **特性**：媒体不匹配时，CSS仍会下载，但不会阻塞渲染。


### **三、CSS加载优化策略**
#### 1. **关键CSS内联（Critical CSS）**
- 将首屏可见区域的CSS直接嵌入HTML，避免等待外部文件：
  ```html
  <style>
    /* 首屏关键样式 */
    .hero { background-image: url(hero.jpg); }
    .nav { height: 60px; }
  </style>
  ```
- **工具**：
  - [Critical](https://github.com/addyosmani/critical)：自动提取关键CSS。
  - [Penthouse](https://github.com/pocketjoso/penthouse)：生成首屏关键CSS。

#### 2. **延迟加载非关键CSS**
- 使用`rel="preload"`强制优先加载：
  ```html
  <link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
  ```
- 使用`media`属性延迟加载：
  ```html
  <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
  ```

#### 3. **资源分割与优先级**
- 将CSS按优先级拆分：
  ```html
  <!-- 关键CSS -->
  <link rel="stylesheet" href="critical.css">
  <!-- 延迟加载的CSS -->
  <link rel="stylesheet" href="non-critical.css" media="(min-width: 1024px)">
  ```

#### 4. **压缩与合并**
- 压缩CSS文件（移除注释、空格、缩短属性名）：
  ```bash
  # 使用cssnano
  npx cssnano input.css output.min.css
  ```
- 合并多个CSS文件，减少HTTP请求。

#### 5. **CDN加速**
- 使用CDN（如Cloudflare、Google Fonts）分发CSS：
  ```html
  <link rel="stylesheet" href="https://cdn.example.com/styles.css">
  ```

#### 6. **HTTP/2与资源提示**
- 利用HTTP/2的多路复用特性并行加载资源。
- 使用`rel="preconnect"`和`rel="dns-prefetch"`优化CDN连接：
  ```html
  <link rel="preconnect" href="https://cdn.example.com">
  ```


### **四、处理第三方CSS**
1. **Google Fonts优化**
   - 使用`rel="preload"`提前加载字体：
     ```html
     <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter" as="style" onload="this.rel='stylesheet'">
     ```
   - 本地托管字体文件，避免依赖第三方服务。

2. **外部CSS延迟加载**
   ```html
   <link rel="stylesheet" href="https://cdn.example.com/external.css" media="print" onload="this.media='all'">
   ```


### **五、性能监控工具**
1. **Chrome DevTools**  
   - 在Network面板查看CSS加载时间和优先级。
   - 使用Coverage面板分析未使用的CSS代码。

2. **Lighthouse**  
   - 检查"Eliminate render-blocking resources"建议。
   - 评估"First Contentful Paint"和"Speed Index"等指标。

3. **WebPageTest**  
   - 分析CSS加载瀑布图，识别瓶颈。


### **六、总结**
1. **关键原则**：  
   - **减少渲染阻塞**：内联关键CSS，延迟加载非关键资源。  
   - **优化加载顺序**：优先加载首屏所需样式。  
   - **减少请求体积**：压缩、合并CSS文件。

2. **推荐方案**：  
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <!-- 关键CSS内联 -->
     <style>
       /* 首屏必需样式 */
       body { font-family: 'Inter', sans-serif; }
       .header { background: #333; color: white; }
     </style>
     <!-- 预加载字体 -->
     <link rel="preload" href="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_0ew.woff2" as="font" crossorigin>
     <!-- 延迟加载非关键CSS -->
     <link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
   </head>
   <body>
     <!-- 页面内容 -->
   </body>
   </html>
   ```

通过合理控制CSS加载，可显著提升页面性能和用户体验。