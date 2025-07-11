参考项目：https://github.com/smallnew/react-native-multibundler


多 Bundle 架构是 React Native 中一种高级拆包策略，它将应用代码分割为多个独立的 JavaScript 包（Bundle），每个 Bundle 可以独立加载和执行。这种架构特别适合大型应用，可以显著优化应用的启动时间和内存占用。以下是多 Bundle 架构的核心实现方案：


### **1. 基础架构设计**
多 Bundle 架构通常包含：
- **主 Bundle**：包含应用启动必需的代码（如导航、基础组件）。
- **业务 Bundle**：按业务模块拆分的独立 Bundle（如用户模块、商品模块）。
- **共享 Bundle**：可选，用于存放公共依赖（如 React、第三方库）。


### **2. 实现方案**

#### **方案一：手动拆分 + 动态加载**
手动配置 Metro 生成多个 Bundle，并通过 `requireAsync` 动态加载。

**步骤：**
1. **配置 Metro 生成多 Bundle**：
```javascript
// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// 主 Bundle 配置
defaultConfig.serializer.createModuleIdFactory = () => {
  const nextId = {};
  return (path) => {
    if (!nextId[path]) nextId[path] = Object.keys(nextId).length;
    return nextId[path];
  };
};

// 业务 Bundle 配置（示例：用户模块）
const userBundleConfig = {
  ...defaultConfig,
  entry: 'src/modules/user/index.js',
  out: 'user.bundle',
};

module.exports = {
  ...defaultConfig,
  bundles: {
    main: defaultConfig,
    user: userBundleConfig,
  },
};
```

2. **动态加载 Bundle**：
```javascript
// 主应用中动态加载用户模块
import { requireAsync } from 'expo-asset';

async function loadUserModule() {
  try {
    // 加载用户模块 Bundle
    await requireAsync('user.bundle');
    // 加载完成后渲染用户模块组件
    const UserComponent = require('src/modules/user/UserComponent').default;
    return <UserComponent />;
  } catch (error) {
    console.error('加载用户模块失败:', error);
    return <ErrorComponent />;
  }
}
```


#### **方案二：使用第三方工具（如 Haul）**
`Haul` 是专门为多 Bundle 设计的打包工具，支持更灵活的配置。

**步骤：**
1. **安装 Haul**：
```bash
npm install -g haul-cli
haul init
```

2. **配置 `haul.config.js`**：
```javascript
const { createConfig } = require('@haul-bundler/core');

module.exports = createConfig({
  bundles: {
    main: {
      entry: 'index.js',
      platform: 'ios',
      transform: {
        experimentalImportSupport: true,
      },
    },
    user: {
      entry: 'src/modules/user/index.js',
      platform: 'ios',
      dependsOn: ['main'], // 依赖主 Bundle
    },
    products: {
      entry: 'src/modules/products/index.js',
      platform: 'ios',
      dependsOn: ['main'],
    },
  },
});
```

3. **构建多 Bundle**：
```bash
haul bundle --config=haul.config.js --bundle-name=main
haul bundle --config=haul.config.js --bundle-name=user
haul bundle --config=haul.config.js --bundle-name=products
```


#### **方案三：混合架构（主 Bundle + 插件化）**
将核心功能放在主 Bundle，扩展功能通过插件 Bundle 加载。

**示例代码：**
```javascript
// 主应用（主 Bundle）
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
  const [plugins, setPlugins] = React.useState([]);

  React.useEffect(() => {
    // 动态加载插件 Bundle
    loadPlugins().then((loadedPlugins) => setPlugins(loadedPlugins));
  }, []);

  return (
    <NavigationContainer>
      <MainScreen />
      {plugins.map((plugin) => plugin.render())}
    </NavigationContainer>
  );
};

// 插件管理模块
async function loadPlugins() {
  const pluginManifests = await fetchPluginManifests(); // 获取插件清单
  const loadedPlugins = [];

  for (const manifest of pluginManifests) {
    try {
      // 动态加载插件 Bundle
      await requireAsync(manifest.bundleUrl);
      // 实例化插件
      const Plugin = require(manifest.moduleName).default;
      loadedPlugins.push(new Plugin());
    } catch (error) {
      console.error(`加载插件 ${manifest.name} 失败:`, error);
    }
  }

  return loadedPlugins;
}
```


### **3. 关键点与挑战**

#### **3.1 共享依赖管理**
- **问题**：多个 Bundle 可能重复包含相同依赖（如 React）。
- **解决方案**：
  - 将共享依赖提取到单独的 Bundle（如 `vendor.bundle`）。
  - 使用 Metro 的 `sharedBlacklist` 配置排除重复模块。

```javascript
// metro.config.js
defaultConfig.resolver.blacklistRE = new RegExp(
  '(' +
    [
      // 排除在主 Bundle 中已包含的模块
      'node_modules/react/',
      'node_modules/react-native/',
    ].join('|') +
    ')'
);
```


#### **3.2 资源与样式管理**
- **资源**：使用 `react-native-asset` 确保资源正确打包到对应 Bundle。
- **样式**：优先使用内联样式或 CSS-in-JS 方案（如 `styled-components`），避免全局样式冲突。


#### **3.3 运行时通信**
- **事件总线**：使用自定义事件系统实现 Bundle 间通信。
```javascript
// EventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }

  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach((callback) => callback(data));
    }
  }
}

export const eventBus = new EventBus();
```


### **4. 部署与更新策略**
- **主 Bundle**：通过应用商店更新。
- **业务 Bundle**：通过热更新服务（如 CodePush）动态下发。

```javascript
// 更新检查逻辑
async function checkForUpdates() {
  const update = await CodePush.checkForUpdate();
  if (update) {
    await CodePush.sync({
      updateDialog: true,
      installMode: CodePush.InstallMode.IMMEDIATE,
    });
  }
}
```


### **5. 优缺点**

#### **优点**
- **启动速度提升**：主 Bundle 体积更小，加载更快。
- **按需加载**：用户仅在需要时下载对应业务模块。
- **团队协作**：不同团队可独立开发和部署业务 Bundle。

#### **缺点**
- **复杂度增加**：架构和构建流程更复杂。
- **调试难度**：多 Bundle 调试需要额外工具支持。
- **兼容性风险**：动态加载可能导致某些 API 在特定环境下失效。


### **总结**
多 Bundle 架构适合大型 React Native 应用，通过合理拆分代码，可以显著提升应用性能和可维护性。实现时需重点关注共享依赖管理、运行时通信和部署策略，同时权衡架构复杂度与收益。