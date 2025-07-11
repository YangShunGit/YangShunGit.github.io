在多Bundle架构的React Native中，**使用`ReactFragment`（Android）或`RCTRootView`（iOS）可以实现Bundle间的数据传递**。这种方案通过原生层承载RN组件，利用Fragment/View的生命周期管理和参数传递机制，更适合需要深度集成原生UI的场景。以下是详细实现方案：


### 一、核心原理与架构
1. **ReactFragment的作用**：  
   `ReactFragment`（Android）或`RCTRootView`（iOS）是RN提供的原生容器组件，可将JS Bundle渲染为原生视图。通过在创建Fragment/View时传递初始参数，实现数据注入。
2. **数据传递路径**：  
   ```
   发送方Bundle → 原生层（Activity/Fragment） → ReactFragment/RCTRootView → 目标Bundle
   ```


### 二、Android端实现方案（ReactFragment）
#### 1. 创建可接收参数的ReactFragment
```java
// 自定义ReactFragment，支持接收初始参数
public class MyReactFragment extends ReactFragment {
    private static final String ARG_MODULE_NAME = "moduleName";
    private static final String ARG_INIT_PROPS = "initialProps";
    
    // 创建带参数的Fragment实例
    public static MyReactFragment newInstance(String moduleName, Bundle initialProps) {
        MyReactFragment fragment = new MyReactFragment();
        Bundle args = new Bundle();
        args.putString(ARG_MODULE_NAME, moduleName);
        args.putBundle(ARG_INIT_PROPS, initialProps);
        fragment.setArguments(args);
        return fragment;
    }
    
    @Override
    protected String getMainComponentName() {
        return getArguments().getString(ARG_MODULE_NAME);
    }
    
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(getActivity(), getMainComponentName()) {
            @Override
            protected Bundle getLaunchOptions() {
                // 返回初始参数给JS层
                return getArguments().getBundle(ARG_INIT_PROPS);
            }
        };
    }
}
```

#### 2. 在原生Activity中加载Fragment并传递数据
```java
// 在发送方Activity中
public class SenderActivity extends AppCompatActivity {
    public void launchReceiverBundle() {
        // 创建传递参数的Bundle
        Bundle initialProps = new Bundle();
        initialProps.putString("message", "来自Sender的数据");
        initialProps.putInt("code", 123);
        
        // 创建并加载目标Bundle的Fragment
        MyReactFragment fragment = MyReactFragment.newInstance(
            "ReceiverBundle", // JS层注册的模块名
            initialProps
        );
        
        getSupportFragmentManager()
            .beginTransaction()
            .replace(R.id.container, fragment)
            .commit();
    }
}
```

#### 3. 在JS层接收参数（目标Bundle）
```javascript
// ReceiverBundle.js（目标Bundle的入口组件）
import React from 'react';
import { View, Text, NativeModules } from 'react-native';

const ReceiverComponent = (props) => {
  // 通过props获取初始参数
  const { message, code } = props;
  
  return (
    <View>
      <Text>接收到的参数：{message} ({code})</Text>
    </View>
  );
};

// 注册模块（需与原生层的moduleName一致）
AppRegistry.registerComponent('ReceiverBundle', () => ReceiverComponent);
```


### 三、iOS端实现方案（RCTRootView）
#### 1. 在原生视图控制器中加载RCTRootView并传递数据
```objective-c
// SenderViewController.m（发送方）
#import <React/RCTRootView.h>

- (void)launchReceiverBundle {
    // 创建初始参数
    NSDictionary *initialProps = @{
        @"message": @"来自Sender的数据",
        @"code": @(123)
    };
    
    // 创建RCTRootView加载目标Bundle
    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/ReceiverBundle.bundle"];
    RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                         moduleName:@"ReceiverBundle" // JS层注册的模块名
                                                  initialProperties:initialProps
                                                      launchOptions:nil];
    
    // 创建视图控制器并显示
    UIViewController *vc = [[UIViewController alloc] init];
    vc.view = rootView;
    [self.navigationController pushViewController:vc animated:YES];
}
```

#### 2. 在JS层接收参数（与Android相同）
```javascript
// ReceiverBundle.js（目标Bundle）
const ReceiverComponent = (props) => {
  const { message, code } = props;
  
  return (
    <View>
      <Text>iOS接收到的参数：{message} ({code})</Text>
    </View>
  );
};

AppRegistry.registerComponent('ReceiverBundle', () => ReceiverComponent);
```


### 四、进阶方案：双向通信与状态管理
#### 1. 从JS层返回数据给原生层
```javascript
// 在目标Bundle中（JS层）
import { NativeModules } from 'react-native';

// 通过原生模块回调数据
const sendDataBack = () => {
  NativeModules.BundleBridge.sendResultToNative({
    result: '处理完成',
    timestamp: Date.now()
  });
};
```

#### 2. 在原生层接收返回数据
```java
// 在原生模块中添加回调方法（Android）
public class BundleBridgeModule extends ReactContextBaseJavaModule {
    // ...已有代码
    
    @ReactMethod
    public void sendResultToNative(ReadableMap result) {
        // 获取JS层返回的数据
        String resultMsg = result.getString("result");
        long timestamp = result.getDouble("timestamp");
        
        // 通知Activity或Fragment
        Activity currentActivity = getCurrentActivity();
        if (currentActivity instanceof MyActivity) {
            ((MyActivity) currentActivity).onResultReceived(resultMsg, timestamp);
        }
    }
}
```


### 五、优缺点与适用场景
#### 1. **优点**
- **原生集成度高**：适合需要与原生UI深度结合的场景（如混合开发）。
- **参数传递安全**：通过原生层传递，避免JS层序列化/反序列化的性能损耗。
- **生命周期可控**：Fragment/View的生命周期管理更灵活，可避免内存泄漏。

#### 2. **缺点**
- **开发复杂度高**：需同时维护原生层和JS层代码。
- **跨平台适配**：Android/iOS实现方式不同，需分别处理。
- **Bundle加载延迟**：每次跳转都需重新加载Bundle，可能影响性能。

#### 3. **适用场景**
- 大型应用的模块化拆分（如主App与插件Bundle）。
- 需要原生权限或资源的场景（如相机、文件系统）。
- 对性能要求较高的页面跳转。


### 六、注意事项
1. **Bundle加载优化**：  
   - 使用`AppRegistry.registerComponent`预注册Bundle，减少加载时间。
   - 对常用Bundle进行内存缓存，避免重复加载。

2. **参数类型限制**：  
   - 传递的参数必须是可序列化的（如基本类型、JSON对象），避免传递复杂对象。

3. **版本兼容性**：  
   - 确保各Bundle使用相同版本的React Native，避免API不兼容。


通过`ReactFragment`/`RCTRootView`实现多Bundle数据传递，本质是利用原生容器组件作为中间层，将参数注入到目标Bundle中。这种方案适合需要深度集成原生能力的场景，但开发成本较高，需权衡性能与维护成本。在实际应用中，建议结合导航库（如`@react-navigation`）和状态管理（如Redux），构建更高效的跨Bundle通信架构。