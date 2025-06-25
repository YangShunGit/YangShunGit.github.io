### XSS 攻击（跨站脚本攻击）：原理、类型与防御方案  


#### **一、什么是 XSS 攻击？**  
**定义**：攻击者通过在网页中注入恶意脚本（如 JavaScript），当用户访问该页面时，脚本被浏览器执行，从而窃取用户数据、会话信息或执行恶意操作。  
**核心本质**：利用网站对用户输入过滤不足的漏洞，将恶意代码混入合法页面。  


#### **二、XSS 攻击的三大类型**  
| **类型**       | **攻击原理**                                                                 | **常见场景**                          |
|----------------|-----------------------------------------------------------------------------|---------------------------------------|
| **反射型 XSS** | 恶意代码嵌入在 URL 或表单中，服务器直接返回包含恶意代码的响应，用户访问时触发。 | 钓鱼链接、恶意搜索参数、虚假登录页面。|
| **存储型 XSS** | 恶意代码被存储在服务器数据库中（如评论、用户资料），所有访问该页面的用户都会触发。 | 论坛恶意评论、社交平台虚假内容。      |
| **DOM 型 XSS** | 恶意代码通过修改页面 DOM 结构触发，不经过服务器，仅在前端执行。               | 利用前端 JS 解析漏洞（如 `innerHTML`）。|  


#### **三、XSS 攻击的危害**  
1. **窃取用户信息**：  
   - 利用 `document.cookie` 窃取会话 Cookie，实现会话劫持（如登录状态盗用）。  
   - 通过 `localStorage`/`sessionStorage` 窃取用户敏感数据（如 token、支付信息）。  
2. **伪造用户操作**：  
   - 自动提交表单（如转账、发布恶意内容）、重定向到钓鱼网站。  
3. **破坏页面功能**：  
   - 篡改页面内容、植入广告、隐藏真实按钮（如虚假支付按钮）。  


#### **四、XSS 攻击的经典案例**  
1. **反射型 XSS 示例**：  
   恶意 URL：`https://example.com/search?q=<script>alert('XSS');</script>`  
   若服务器未过滤 `q` 参数，用户访问时浏览器会执行 `<script>` 标签中的代码。  

2. **存储型 XSS 示例**：  
   用户在论坛发布评论：`这条评论很棒！<script>document.cookie='hacked=true';</script>`  
   其他用户查看该评论时，脚本被执行，Cookie 被篡改。  


#### **五、XSS 防御的核心策略**  
##### **1. 输入输出双重过滤（最基础）**  
- **输入过滤**：对用户输入的内容（如表单、URL 参数）进行严格校验，禁止非法字符（如 `<`, `>`, `script` 等）。  
- **输出转义**：在 HTML、JS、CSS 中对特殊字符进行转义，防止被解析为代码。  
  - **HTML 转义**：将 `<` 转为 `&lt;`，`>` 转为 `&gt;`，`"` 转为 `&quot;`。  
  - **JS 转义**：使用 `JSON.stringify()` 对动态插入的内容进行转义。  
  ```javascript
  // 错误示例（直接插入未转义内容）
  document.getElementById('content').innerHTML = userInput;
  
  // 正确示例（使用 DOMPurify 库过滤）
  const sanitizedHTML = DOMPurify.sanitize(userInput);
  document.getElementById('content').innerHTML = sanitizedHTML;
  ```

##### **2. 利用 CSP（内容安全策略）**  
通过 HTTP 响应头或 `<meta>` 标签限制页面可执行的脚本来源，阻止恶意脚本运行。  
```html
<!-- 示例：只允许加载本站 JS，禁止内联脚本和 eval -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self'; object-src 'none'; style-src 'self'">
```

##### **3. 使用 HttpOnly Cookie**  
- 将敏感 Cookie（如会话令牌）标记为 `HttpOnly`，禁止 JS 访问，防止通过 `document.cookie` 窃取。  
```php
// PHP 设置 HttpOnly Cookie
setcookie('session_id', $session_id, time() + 3600, '/', '', true, true); // 最后一个参数为 HttpOnly
```

##### **4. 输入验证与白名单机制**  
- 对特定输入场景（如富文本编辑器）使用白名单，仅允许合法标签和属性。  
  ```javascript
  // 白名单示例：只允许 p、a、strong 标签，且 a 标签必须有 href 属性
  const whitelist = {
    p: [],
    a: ['href'],
    strong: []
  };
  ```

##### **5. 前端框架的安全特性**  
- **React/Vue 等框架**：默认对动态插入的内容进行转义（如 `React.createElement` 自动转义），降低 XSS 风险。  
- **避免使用危险 API**：如 `innerHTML`、`eval()`、`document.write()`，改用安全的 API（如 `textContent`）。  


#### **六、XSS 攻击的进阶防御手段**  
1. **SRI（子资源完整性）**：  
   验证外部脚本的哈希值，防止脚本被篡改。  
   ```html
   <script src="https://example.com/script.js" integrity="sha256-abc123def456..." crossorigin="anonymous"></script>
   ```

2. **X-XSS-Protection 响应头**：  
   现代浏览器支持该头，可自动检测并阻止反射型 XSS 攻击。  
   ```http
   X-XSS-Protection: 1; mode=block
   ```

3. **双因素认证（2FA）**：  
   即使 Cookie 被窃取，攻击者也无法绕过短信/邮箱验证码，降低账户被盗风险。  


#### **七、总结：XSS 防御的核心原则**  
1. **不信任任何用户输入**：无论是前端还是后端，必须对输入进行过滤和转义。  
2. **最小权限原则**：限制脚本的执行范围（如 CSP），减少攻击面。  
3. **多层防护**：结合输入过滤、CSP、HttpOnly Cookie 等多种手段，而非单一方案。  
4. **持续监控与更新**：及时修补框架漏洞（如 jQuery 旧版本的 XSS 漏洞），定期进行安全测试（如渗透测试）。  

XSS 攻击的本质是“代码注入”，防御的核心是将“用户输入”与“代码执行”隔离，通过技术手段和安全规范切断攻击链条。