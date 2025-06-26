在Spring Boot 2中实现Server-Sent Events（SEE）接口非常便捷，以下是完整的实现方案：


### **1. 添加依赖**
在`pom.xml`中添加Spring Web依赖：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```


### **2. 创建SEE控制器**
使用`SseEmitter`类处理长连接和事件推送：
```java
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
public class SseController {

    // 存储所有客户端的SseEmitter
    private final ConcurrentHashMap<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    // 客户端订阅接口
    @GetMapping(path = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        // 创建SseEmitter，超时时间设为30分钟
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        
        // 生成唯一客户端ID（实际项目中可使用用户ID或UUID）
        String clientId = String.valueOf(System.currentTimeMillis());
        emitters.put(clientId, emitter);

        // 发送心跳包保持连接
        scheduler.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event()
                    .id(String.valueOf(System.currentTimeMillis()))
                    .name("heartbeat")
                    .data("ping"));
            } catch (IOException e) {
                // 发送失败，移除客户端
                emitter.completeWithError(e);
                emitters.remove(clientId);
            }
        }, 0, 15, TimeUnit.SECONDS);

        // 设置回调
        emitter.onCompletion(() -> emitters.remove(clientId));
        emitter.onTimeout(() -> emitters.remove(clientId));
        emitter.onError(e -> emitters.remove(clientId));

        return emitter;
    }

    // 向所有客户端推送消息
    public void pushToAll(String event, String data) {
        emitters.forEach((clientId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                    .id(String.valueOf(System.currentTimeMillis()))
                    .name(event)
                    .data(data));
            } catch (IOException e) {
                emitter.completeWithError(e);
                emitters.remove(clientId);
            }
        });
    }
}
```


### **3. 配置异步支持**
确保Spring MVC支持异步请求处理，在配置类中添加：
```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        // 设置异步请求超时时间（可选）
        configurer.setDefaultTimeout(30 * 60 * 1000L);
    }
}
```


### **4. 客户端使用示例**
```javascript
const eventSource = new EventSource('/sse');

// 监听默认事件
eventSource.onmessage = (event) => {
  console.log('Received:', event.data);
};

// 监听自定义事件（如heartbeat）
eventSource.addEventListener('heartbeat', (event) => {
  console.log('Heartbeat:', event.data);
});

// 错误处理
eventSource.onerror = (error) => {
  console.error('EventSource failed:', error);
  // 可添加重连逻辑
};
```


### **5. 主动推送消息示例**
在Service中注入`SseController`并调用推送方法：
```java
@Service
public class NotificationService {
    @Autowired
    private SseController sseController;

    public void sendNotification(String message) {
        sseController.pushToAll("notification", message);
    }
}
```


### **6. 关键配置说明**
- **心跳机制**：通过定时发送`heartbeat`事件保持连接活跃
- **异常处理**：在`onError`、`onTimeout`中移除失效的`SseEmitter`
- **并发安全**：使用`ConcurrentHashMap`存储客户端连接
- **超时设置**：根据业务需求调整`SseEmitter`的超时时间


### **7. 生产环境优化建议**
1. **连接管理**：
   - 使用用户ID关联`SseEmitter`，实现定向推送
   - 添加连接数限制，防止资源耗尽

2. **错误处理**：
   - 添加重试机制（客户端自动重连）
   - 实现优雅降级（如推送失败时转短信通知）

3. **性能优化**：
   - 使用`ThreadPoolTaskScheduler`替代`Executors`
   - 结合Redis实现集群环境下的消息广播

4. **安全加固**：
   - 添加权限验证（如JWT认证）
   - 使用HTTPS协议（wss://）
   - 实现请求频率限制


### **8. 完整示例代码**
```java
// 完整的SSE控制器示例
@RestController
@RequestMapping("/api/sse")
public class SseController {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final Logger logger = LoggerFactory.getLogger(SseController.class);

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestHeader("Authorization") String token) {
        // 1. 身份验证
        String userId = validateToken(token);
        
        // 2. 创建SseEmitter，超时时间设为30分钟
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        
        // 3. 存储emitter并设置回调
        emitters.put(userId, emitter);
        
        emitter.onCompletion(() -> {
            logger.info("SSE connection completed for user: {}", userId);
            emitters.remove(userId);
        });
        
        emitter.onTimeout(() -> {
            logger.info("SSE connection timed out for user: {}", userId);
            emitter.complete();
            emitters.remove(userId);
        });
        
        emitter.onError(e -> {
            logger.error("SSE error for user: {}", userId, e);
            emitter.completeWithError(e);
            emitters.remove(userId);
        });
        
        // 4. 发送初始连接确认
        try {
            emitter.send(SseEmitter.event()
                .id("0")
                .name("connected")
                .data("Connection established"));
        } catch (IOException e) {
            logger.error("Failed to send initial event to user: {}", userId, e);
            emitter.completeWithError(e);
            emitters.remove(userId);
        }
        
        return emitter;
    }

    // 推送消息到指定用户
    public void pushToUser(String userId, String event, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .id(UUID.randomUUID().toString())
                    .name(event)
                    .data(data, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                logger.error("Failed to send event to user: {}", userId, e);
                emitter.completeWithError(e);
                emitters.remove(userId);
            }
        }
    }

    // 推送消息到所有用户
    public void pushToAll(String event, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                    .id(UUID.randomUUID().toString())
                    .name(event)
                    .data(data, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                logger.error("Failed to send event to user: {}", userId, e);
                emitter.completeWithError(e);
                emitters.remove(userId);
            }
        });
    }
    
    private String validateToken(String token) {
        // JWT验证逻辑，返回用户ID
        return "user123";
    }
}
```


### **9. 客户端高级用法**
```javascript
// 带重连机制的客户端实现
class EventSourceClient {
    constructor(url) {
        this.url = url;
        this.eventSource = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000; // 初始重试延迟(ms)
    }

    connect() {
        this.eventSource = new EventSource(this.url);

        this.eventSource.onopen = () => {
            console.log('Connected to SSE server');
            this.retryCount = 0;
        };

        this.eventSource.onmessage = (event) => {
            console.log('Received message:', event.data);
            // 处理消息逻辑
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, this.retryCount);
                console.log(`Reconnecting in ${delay/1000} seconds...`);
                
                setTimeout(() => {
                    this.eventSource.close();
                    this.connect();
                }, delay);
            } else {
                console.error('Max retries exceeded. Giving up.');
                // 可添加额外处理逻辑，如通知用户
            }
        };
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// 使用示例
const client = new EventSourceClient('/api/sse');
client.connect();
```


### **10. 常见问题与解决方案**
1. **跨域问题**：
   ```java
   @Bean
   public WebMvcConfigurer corsConfigurer() {
       return new WebMvcConfigurer() {
           @Override
           public void addCorsMappings(CorsRegistry registry) {
               registry.addMapping("/sse").allowedOrigins("http://your-client-domain.com");
           }
       };
   }
   ```

2. **Nginx配置优化**：
   ```nginx
   location /sse {
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       proxy_http_version 1.1;
       proxy_set_header Connection "";  # 关闭keepalive
       proxy_read_timeout 86400;        # 延长超时时间
   }
   ```

3. **大规模连接处理**：
   - 使用Reactor模式（如Spring WebFlux的`SseEmitter`替代方案）
   - 考虑使用专门的消息中间件（如Redis Pub/Sub、Kafka）


通过以上方案，你可以在Spring Boot 2中高效实现Server-Sent Events接口，满足实时数据推送需求。