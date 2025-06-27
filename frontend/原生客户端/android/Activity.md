### Activity 核心知识点深度解析


#### **一、Activity 基础概念与生命周期**
1. **本质与作用**  
   - Activity 是 Android 四大组件之一，负责用户交互界面的展示与操作，是用户与应用交互的入口。
   - 每个 Activity 对应一个窗口（Window），由 WindowManager 管理其生命周期与界面层级。

2. **完整生命周期方法**  
   ```java
   // 典型生命周期调用顺序（正常启动→销毁）
   onCreate() → onStart() → onResume() → onPause() → onStop() → onDestroy()
   
   // 可见但非前台时（如弹窗覆盖）
   onPause() → onResume()
   
   // 后台切前台
   onRestart() → onStart() → onResume()
   
   // 配置变更（如横竖屏切换）
   onSaveInstanceState() → onDestroy() → onCreate() → onRestoreInstanceState() → ...
   ```
   - **关键方法说明**：  
     - `onCreate()`：初始化布局、绑定数据，不可做耗时操作（避免 ANR）。  
     - `onSaveInstanceState()`：在 Activity 被销毁前保存临时状态（如文本框内容），系统因内存不足回收进程时会调用。  
     - `onRestoreInstanceState()`：与 `onCreate()` 相比，更适合恢复 UI 状态（因参数 Bundle 保证非空）。

3. **异常场景生命周期**  
   - **配置变更（如横竖屏）**：默认会销毁并重建 Activity，可通过 `android:configChanges="orientation|screenSize"` 阻止重建，此时仅调用 `onConfigurationChanged()`。  
   - **系统回收后台 Activity**：通过 `onSaveInstanceState()` 保存数据，重新打开时 `onCreate()` 的 Bundle 参数携带保存的状态。


#### **二、启动模式（Launch Mode）与任务栈（Task）**
1. **四种启动模式对比**  
   | 模式         | 作用                                                                 | 任务栈行为                                                                 |
   |--------------|----------------------------------------------------------------------|----------------------------------------------------------------------------|
   | `standard`   | 标准模式（默认），每次启动都创建新实例。                             | 新实例放入启动它的任务栈中。                                               |
   | `singleTop`  | 栈顶复用，若目标 Activity 在栈顶则不创建新实例，调用 `onNewIntent()`。 | 适用于通知栏点击等需要重复启动但不想创建新实例的场景（如消息详情页）。     |
   | `singleTask` | 栈内唯一，清除栈中该 Activity 之上的所有 Activity，复用或创建实例。 | 常用于主界面（如启动 App 时清空其他任务栈）。                               |
   | `singleInstance` | 全局唯一，单独占用一个任务栈，其他 Activity 无法进入该栈。         | 适用于需要独立运行的组件（如来电界面）。                                   |

2. **任务栈（Task）核心概念**  
   - **栈结构特性**：后进先出（LIFO），一个 Task 可包含多个 Activity（属于同一应用或不同应用）。  
   - **FLAG_ACTIVITY_NEW_TASK**：相当于 `singleTask` 模式，常用于跨应用启动 Activity（如 `Context.startActivity()` 需配合此 Flag，因非 Activity 上下文无任务栈）。  
   - **多任务场景**：Android 14 支持任务栈分组（Task Groups），可通过 `ActivityOptions.setTaskGroup()` 管理相关 Activity 的分组显示。


#### **三、Activity 通信与数据传递**
1. **基础数据传递**  
   - **Intent 传递**：支持基本类型、Parcelable/Serializable 对象，大数据传递需注意内存限制（如 Bitmap 可通过 `Bundle#putParcelable()` 传递）。  
   - **ActivityResultContracts**：替代旧版 `startActivityForResult()`，通过契约模式处理结果回调，更安全高效：  
     ```java
     // 示例：申请权限
     val contract = ActivityResultContracts.RequestPermission()
     registerForActivityResult(contract) { isGranted ->
         if (isGranted) {
             // 权限获取成功
         }
     }
     ```

2. **跨 Activity 通信方案**  
   - **ViewModel + LiveData**：同一 ViewModel 可被多个 Activity 共享，适合父子 Activity 或同模块页面通信。  
   - **EventBus 或 LocalBroadcastManager**：适用于跨模块或解耦场景，但需注意内存泄漏（动态注册的广播需在 `onDestroy()` 中反注册）。  
   - **ContentProvider**：跨应用数据共享，需在 Manifest 中配置权限。


#### **四、性能优化与常见问题**
1. **内存泄漏场景与解决方案**  
   - **静态变量持有 Activity 引用**：  
     ```java
     // 错误示例（静态变量持有 Activity）
     private static Context sContext;
     onCreate() { sContext = this; } // 导致 Activity 无法被回收
     
     // 正确方案：使用 WeakReference
     private static WeakReference<Context> sContextRef;
     onCreate() { sContextRef = new WeakReference<>(this); }
     ```
   - **未取消的异步任务**：在 `onDestroy()` 中取消 RxJava 订阅、Handler 消息等。

2. **启动优化**  
   - **冷启动优化**：减少 `onCreate()` 中的耗时操作（如网络请求、数据库查询），使用 `WindowBackground` 主题加快窗口显示。  
   - **SplashScreen API**：Android 12+ 推荐使用 `SplashScreen` 实现启动页，支持动画、渐变背景等效果，避免白屏闪屏。

3. **ANR 预防**  
   - Activity 的主线程（UI 线程）处理事件超时（5秒未响应输入）会触发 ANR，需将耗时操作放入子线程（如协程、WorkManager）。


#### **五、Android 14+ 新特性与适配**
1. **任务栈与后台限制**  
   - Android 14 中，系统对缓存进程（Cached Processes）的 Activity 启动做了限制，隐式 Intent 启动 Activity 可能失败，需优先使用显式 Intent。  
   - 前台服务启动 Activity 需在 Manifest 中声明 `android:foregroundServiceType="activity"`，否则会抛出异常。

2. **权限与生命周期关联**  
   - 精确位置权限（ACCESS_FINE_LOCATION）获取时，若 Activity 处于后台，系统会限制回调，需确保在前台时处理权限结果。


#### **六、面试高频问题**
1. **Activity 横竖屏切换时的生命周期？**  
   - 默认情况下，切换屏幕会销毁并重建 Activity，依次调用 `onSaveInstanceState() → onDestroy() → onCreate() → onRestoreInstanceState()`。  
   - 若配置 `android:configChanges="orientation|screenSize"`，则仅调用 `onConfigurationChanged()`，Activity 不会重建。

2. **如何解决 Activity 重叠显示问题？**  
   - 原因：未正确处理启动模式或 Task 栈。  
   - 方案：使用 `singleTask` 模式或添加 `FLAG_ACTIVITY_CLEAR_TOP` Flag，确保启动时栈中只有一个实例。

3. **Activity A 启动 Activity B，B 销毁后 A 如何获取数据？**  
   - 旧方案：`startActivityForResult()` + `onActivityResult()`，但 Android 14 建议使用 `ActivityResultContracts` 契约模式（类型安全，避免回调混乱）。


#### **七、实战建议**
- **自定义 Activity 基类**：封装通用逻辑（如权限请求、加载框管理），减少代码重复。  
- **使用 ProcessLifecycleOwner**：监听应用前后台状态，配合 Activity 生命周期做资源释放（如后台时暂停视频播放）。  
- **监控 Activity 启动耗时**：通过 `adb shell am start -W package/activity` 命令分析启动时间，定位优化点。

通过深入理解 Activity 的生命周期、启动模式与任务栈机制，结合最新系统特性适配，可在面试中从容应对相关问题，并在实际开发中写出更健壮的代码。