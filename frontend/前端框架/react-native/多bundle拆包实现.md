### **Metro 多 Bundle 配置实现及原理**

#### **一、核心原理**

Metro 是 React Native 的 JavaScript 打包工具，其多 Bundle 原理基于：
1. **模块图分析**：Metro 通过分析模块间的依赖关系，构建完整的依赖图。
2. **入口点隔离**：为不同的入口文件生成独立的 Bundle，共享模块可选择性地排除或提取。
3. **模块 ID 管理**：为每个模块分配唯一 ID，确保多 Bundle 间引用一致性。


#### **二、配置实现步骤**

##### **1. 创建基础 Metro 配置**
```javascript
// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// 自定义模块 ID 生成器（确保多 Bundle 间模块 ID 一致性）
defaultConfig.serializer.createModuleIdFactory = () => {
  const moduleIds = new Map();
  let nextId = 0;
  
  return (path) => {
    // 规范化路径以确保一致性
    const modulePath = path.endsWith('.js') ? path : `${path}.js`;
    
    if (!moduleIds.has(modulePath)) {
      moduleIds.set(modulePath, nextId++);
    }
    
    return moduleIds.get(modulePath);
  };
};
// processModuleFilter 是一个关键的钩子函数，用于控制哪些模块会被包含在最终的 Bundle 中,返回 true：模块会被包含在 Bundle 中,返回 false：模块会被排除。(打包业务包时需要剔除公共包)
defaultConfig.serializer.processModuleFilter = (module) => {
  // 示例：排除测试文件
  if (module.path.includes('.test.')) {
    return false;
  }
  
  // 示例：只在开发环境包含调试工具
  if (module.path.includes('debug-tool') && !__DEV__) {
    return false;
  }
  
  // 默认包含其他所有模块
  return true;
};

module.exports = defaultConfig;
```

##### **2. 配置多 Bundle 入口**
扩展配置以支持多个 Bundle：
```javascript
// metro.config.js (续)
const path = require('path');

// 主 Bundle 配置
const mainBundleConfig = {
  ...defaultConfig,
  entry: 'index.js',
  out: 'main.bundle',
  // 主 Bundle 包含所有核心模块
};

// 业务模块 Bundle 配置（示例：用户模块）
const userBundleConfig = {
  ...defaultConfig,
  entry: path.resolve(__dirname, 'src/modules/user/index.js'),
  out: 'user.bundle',
  // 排除主 Bundle 已包含的模块
  resolver: {
    ...defaultConfig.resolver,
    blacklistRE: new RegExp(
      '(' +
        [
          'node_modules/react/',
          'node_modules/react-native/',
          // 主 Bundle 已包含的其他模块
        ].join('|') +
        ')'
    ),
  },
};

// 商品模块 Bundle 配置
const productsBundleConfig = {
  ...defaultConfig,
  entry: path.resolve(__dirname, 'src/modules/products/index.js'),
  out: 'products.bundle',
  resolver: {
    ...defaultConfig.resolver,
    blacklistRE: userBundleConfig.resolver.blacklistRE,
  },
};

// 导出所有 Bundle 配置
module.exports = {
  ...defaultConfig,
  bundles: {
    main: mainBundleConfig,
    user: userBundleConfig,
    products: productsBundleConfig,
  },
};
```

##### **3. 编写 Bundle 构建脚本**
创建 `build-bundles.js` 自动化构建过程：
```javascript
const { execSync } = require('child_process');
const config = require('./metro.config');

// 构建所有 Bundle
Object.keys(config.bundles).forEach((bundleName) => {
  const bundleConfig = config.bundles[bundleName];
  const command = `npx react-native bundle \
    --entry-file ${bundleConfig.entry} \
    --bundle-output ${bundleConfig.out} \
    --platform ios \
    --dev false \
    --reset-cache`;
  
  console.log(`正在构建 ${bundleName} Bundle...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${bundleName} Bundle 构建完成`);
  } catch (error) {
    console.error(`构建 ${bundleName} Bundle 失败:`, error);
  }
});
```


#### **三、动态加载实现**

##### **1. 使用 `requireAsync` 加载 Bundle**
```javascript
// DynamicBundleLoader.js
import { requireAsync } from 'expo-asset';

export async function loadBundle(bundleName) {
  try {
    // 从服务器或本地加载 Bundle
    const bundleUrl = getBundleUrl(bundleName); // 自定义获取 URL 函数
    await requireAsync(bundleUrl);
    console.log(`${bundleName} Bundle 加载成功`);
    return true;
  } catch (error) {
    console.error(`加载 ${bundleName} Bundle 失败:`, error);
    return false;
  }
}

// 获取 Bundle URL（示例：从服务器下载）
function getBundleUrl(bundleName) {
  // 生产环境从远程服务器获取
  if (process.env.NODE_ENV === 'production') {
    return `https://your-server.com/bundles/${bundleName}.bundle`;
  }
  // 开发环境从本地获取
  return `${bundleName}.bundle`;
}
```

##### **2. 在应用中使用动态加载**
```javascript
// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { loadBundle } from './DynamicBundleLoader';

const App = () => {
  const [userModuleLoaded, setUserModuleLoaded] = useState(false);
  const [userComponent, setUserComponent] = useState(null);

  useEffect(() => {
    // 预加载主 Bundle 外的核心模块
    preloadEssentialBundles();
  }, []);

  const loadUserModule = async () => {
    if (!userModuleLoaded) {
      const success = await loadBundle('user');
      if (success) {
        // 加载成功后获取模块导出
        const UserComponent = require('src/modules/user/UserScreen').default;
        setUserComponent(UserComponent);
        setUserModuleLoaded(true);
      }
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>主应用界面</Text>
      
      {userComponent ? (
        <userComponent />
      ) : (
        <Button title="加载用户模块" onPress={loadUserModule} />
      )}
      
      {userModuleLoaded && userComponent ? null : (
        <ActivityIndicator animating={userModuleLoaded} />
      )}
    </View>
  );
};

export default App;
```


#### **四、关键配置参数解析**

1. **`createModuleIdFactory`**
   - 作用：生成全局唯一的模块 ID，确保多 Bundle 间模块引用一致性。
   - 注意：必须在所有 Bundle 配置中使用相同的 ID 生成逻辑。

2. **`resolver.blacklistRE`**
   - 作用：排除特定模块，避免重复打包。
   - 示例：排除主 Bundle 已包含的 React 和 React Native。

3. **`transformer` 配置**
   - 可针对不同 Bundle 使用不同的转换规则（如 Babel 插件）。

4. **`serializer` 选项**
   - `processModuleFilter`：过滤不需要包含的模块。
   - `getRunModuleStatement`：自定义模块执行逻辑。


#### **五、调试与优化建议**

1. **调试技巧**
   - 使用 `--dev true` 选项构建开发环境 Bundle，保留源码映射。
   - 在 Chrome DevTools 中调试多个 Bundle。

2. **性能优化**
   - 提取公共依赖到单独的 `vendor.bundle`。
   - 使用 `metro-bundler-cache` 加速构建过程。

3. **错误处理**
   - 实现 Bundle 加载失败重试机制。
   - 提供离线缓存策略（如使用 `AsyncStorage` 缓存 Bundle）。


#### **六、局限性与注意事项**

1. **模块循环依赖**
   - 多 Bundle 架构可能加剧循环依赖问题，需严格控制模块间依赖关系。

2. **资源管理**
   - 确保资源文件（如图片）正确关联到对应 Bundle。

3. **React Context 隔离**
   - 不同 Bundle 中的 React Context 实例可能不共享，需特殊处理。


通过以上配置，你可以实现基于 Metro 的多 Bundle 架构，将应用拆分为更小、更独立的单元，从而优化加载性能和开发效率。