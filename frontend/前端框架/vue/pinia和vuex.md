Pinia 和 Vuex 都是 Vue 生态中用于**状态管理**的库，用于解决组件间共享状态的问题。其中，Vuex 是 Vue 早期官方推荐的状态管理方案，而 Pinia 是 Vue 3 推出后官方推荐的替代品（目前 Vuex 已停止维护，Pinia 成为官方首选）。


### 一、核心区别与特点对比
| 特性                | Vuex（以 Vuex 3 为例，Vuex 4 为 Vue 3 适配版） | Pinia |
|---------------------|----------------------------------------------|-------|
| 发布时间            | 2015 年（早期）                               | 2021 年（Vue 3 时代） |
| 核心概念            | State、Getter、Mutation、Action、Module       | State、Getter、Action（移除 Mutation） |
| 模块化              | 需要通过 `modules` 配置，支持命名空间          | 天然模块化（每个 store 就是一个模块） |
| 响应式处理          | 依赖 Vue 2 的 `Object.defineProperty`，需手动处理新属性（如 `Vue.set`） | 基于 Vue 3 的 `reactive`，自动响应式 |
| TypeScript 支持     | 需额外配置类型，体验较差                       | 原生支持 TS，类型推断友好 |
| 写法简洁性          | 较繁琐（需通过 `commit` 调用 Mutation）        | 更简洁（直接修改状态，Action 可同步/异步） |
| 官方状态            | 已停止维护（推荐迁移到 Pinia）                 | 官方推荐，持续维护 |


### 二、核心概念与用法对比

#### 1. 基本结构与创建方式
**Vuex**：  
需通过 `createStore` 创建单一 store 实例，包含 `state`、`mutations`、`actions`、`getters`、`modules` 等选项。  
Mutation 是修改状态的唯一途径（同步操作），Action 用于处理异步逻辑（需通过 `commit` 调用 Mutation）。

```javascript
// Vuex 示例（Vue 2）
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  // 状态
  state: {
    count: 0,
    user: { name: 'John' }
  },
  
  // 计算属性（类似组件的 computed）
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  },
  
  // 同步修改状态（唯一途径）
  mutations: {
    increment(state, payload) {
      state.count += payload || 1;
    }
  },
  
  // 处理异步逻辑（通过 commit 调用 mutation）
  actions: {
    async incrementAsync({ commit }, payload) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      commit('increment', payload); // 必须通过 mutation 修改状态
    }
  },
  
  // 模块化（解决单一 store 臃肿问题）
  modules: {
    cart: {
      namespaced: true, // 命名空间，避免冲突
      state: { items: [] },
      mutations: { addItem(state, item) { state.items.push(item); } }
    }
  }
});
```


**Pinia**：  
通过 `defineStore` 创建多个独立的 store（天然模块化），移除了 Mutation，可直接在 Action 中修改状态（支持同步和异步）。

```javascript
// Pinia 示例（Vue 3）
import { defineStore } from 'pinia';

// 创建一个 store（命名为 "counter"）
export const useCounterStore = defineStore('counter', {
  // 状态（函数返回对象，确保每个实例独立）
  state: () => ({
    count: 0,
    user: { name: 'John' }
  }),
  
  // 计算属性（类似 Vuex 的 getters）
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  },
  
  // 方法（同步/异步均可，直接修改状态）
  actions: {
    increment(payload = 1) {
      this.count += payload; // 直接修改状态，无需 mutation
    },
    async incrementAsync(payload = 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.count += payload; // 异步操作后直接修改
    }
  }
});

// 再创建一个 store（天然模块化，无需额外配置）
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    addItem(item) {
      this.items.push(item);
    }
  }
});
```


#### 2. 状态访问与修改
**Vuex**：  
需通过 `this.$store.state` 访问状态，通过 `this.$store.commit` 调用 Mutation，`this.$store.dispatch` 调用 Action。

```vue
<!-- Vuex 组件中使用 -->
<template>
  <div>
    <p>Count: {{ $store.state.count }}</p>
    <p>Double: {{ $store.getters.doubleCount }}</p>
    <button @click="$store.commit('increment')">+1</button>
    <button @click="$store.dispatch('incrementAsync')">Async +1</button>
  </div>
</template>
```


**Pinia**：  
通过创建的 store 函数获取实例，直接访问状态和方法，支持解构（需用 `storeToRefs` 保持响应性）。

```vue
<!-- Pinia 组件中使用 -->
<template>
  <div>
    <p>Count: {{ counterStore.count }}</p>
    <p>Double: {{ counterStore.doubleCount }}</p>
    <button @click="counterStore.increment()">+1</button>
    <button @click="counterStore.incrementAsync()">Async +1</button>
  </div>
</template>

<script setup>
import { useCounterStore } from './stores/counter';
import { storeToRefs } from 'pinia';

// 获取 store 实例
const counterStore = useCounterStore();

// 解构状态（需用 storeToRefs 保持响应性）
const { count, doubleCount } = storeToRefs(counterStore);
</script>
```


#### 3. 模块化与命名空间
**Vuex**：  
单一 store 中通过 `modules` 拆分模块，需手动开启 `namespaced: true` 避免命名冲突，访问模块内状态需拼接路径（如 `$store.state.cart.items`）。

```javascript
// Vuex 访问模块状态
this.$store.state.cart.items; // 访问 cart 模块的 items
this.$store.commit('cart/addItem', item); // 调用 cart 模块的 mutation（需命名空间）
```


**Pinia**：  
每个 `defineStore` 创建的 store 就是一个独立模块，无需配置命名空间，直接通过 store 实例访问，天然隔离。

```javascript
// Pinia 访问其他模块
import { useCartStore } from './stores/cart';

const cartStore = useCartStore();
cartStore.items; // 直接访问 cart 模块的 items
cartStore.addItem(item); // 直接调用 cart 模块的方法
```


#### 4. TypeScript 支持
**Vuex**：  
对 TS 支持较弱，需手动定义状态类型、配置模块类型，写法繁琐。

```typescript
// Vuex 的 TS 配置（繁琐）
import { Store } from 'vuex';

interface State {
  count: number;
}

// 需手动扩展 Vue 类型
declare module 'vue/types/vue' {
  interface Vue {
    $store: Store<State>;
  }
}
```


**Pinia**：  
原生支持 TS，类型自动推断，无需额外配置，体验更流畅。

```typescript
// Pinia 的 TS 支持（自动推断）
import { defineStore } from 'pinia';

// 状态类型自动推断
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0, // 类型为 number
    user: { name: 'John' } // 类型为 { name: string }
  }),
  // ...
});
```


### 三、为什么 Pinia 替代了 Vuex？
1. **更简洁的 API**：移除了 Mutation，Action 可直接修改状态，减少模板代码。  
2. **更好的 TypeScript 支持**：原生 TS 友好，无需额外配置。  
3. **天然模块化**：多个 store 替代 Vuex 的 `modules`，结构更清晰。  
4. **更灵活的状态修改**：支持直接修改状态（如 `store.count++`），也可通过 `$patch` 批量修改。  
5. **官方推荐**：Vue 核心团队维护，Vue 3 官方文档优先推荐 Pinia。  


### 四、如何选择？
- **新项目**：优先使用 **Pinia**（官方推荐，更现代、简洁，支持 Vue 2 和 Vue 3）。  
- **旧项目**：若已使用 Vuex 且稳定运行，可继续维护；若需升级，建议逐步迁移到 Pinia（Pinia 提供迁移工具）。  


总结：Pinia 是 Vuex 的升级替代品，解决了 Vuex 的历史问题（如繁琐的 Mutation、较差的 TS 支持），更适合现代 Vue 项目的状态管理需求。