### NVM：Node.js 版本管理的终极解决方案

nvm（Node Version Manager）是一个强大的工具，允许开发者在同一台机器上轻松切换不同版本的 Node.js。对于需要兼容多个 Node 版本的项目或开发者来说，nvm 是必备工具。


### **一、核心功能与优势**
1. **多版本共存**  
   - 同时安装并切换 Node.js 的不同版本（如 v14、v16、v18）。

2. **项目级版本控制**  
   - 通过 `.nvmrc` 文件为项目指定特定的 Node 版本。

3. **快速切换**  
   - 秒级切换 Node 版本，无需重新安装。

4. **npm 自动迁移**  
   - 切换版本时保留全局安装的 npm 包。


### **二、安装与基本使用**
#### 1. **安装 nvm**
```bash
# 使用 curl 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# 或使用 wget
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# 安装后，重启终端或执行：
source ~/.nvm/nvm.sh
```

#### 2. **验证安装**
```bash
nvm --version  # 输出如 0.39.3
```

#### 3. **安装 Node.js**
```bash
nvm install node        # 安装最新 LTS 版本
nvm install 18.16.0     # 安装指定版本
nvm install --lts       # 安装最新 LTS 版本
```

#### 4. **切换版本**
```bash
nvm use 16.17.0         # 临时使用指定版本
nvm alias default 18    # 设置默认版本
```

#### 5. **查看已安装版本**
```bash
nvm list                # 列出本地安装的所有版本
nvm list-remote         # 列出所有可用的远程版本
```


### **三、高级用法**
#### 1. **项目级版本控制**
在项目根目录创建 `.nvmrc` 文件：
```bash
echo "18.16.0" > .nvmrc
```
进入项目目录时，自动切换到指定版本：
```bash
nvm use  # 无需指定版本，自动读取 .nvmrc
```

#### 2. **全局 npm 包迁移**
安装新版本时保留现有全局包：
```bash
nvm install 18.16.0 --reinstall-packages-from=16.17.0
```

#### 3. **版本别名**
```bash
nvm alias my-node 18.16.0  # 创建别名
nvm use my-node            # 使用别名切换
```

#### 4. **卸载版本**
```bash
nvm uninstall 16.17.0      # 卸载指定版本
```


### **四、配置与优化**
#### 1. **加速下载**
配置 Node.js 镜像源：
```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
```
可将上述配置添加到 `~/.bashrc` 或 `~/.zshrc` 中。

#### 2. **自动加载 .nvmrc**
在 shell 配置文件中添加：
```bash
# 自动加载 .nvmrc
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc && -r .nvmrc ]]; then
    nvm use
  elif [[ $(nvm version) != $(nvm version default) ]]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc  # 初始化
```


### **五、常见问题与解决方案**
#### 1. **npm 命令找不到**
- **问题**：切换 Node 版本后，npm 命令失效。  
- **解决方案**：  
  ```bash
  nvm unalias default    # 清除默认别名
  nvm alias default 18   # 重新设置默认版本
  ```

#### 2. **nvm 命令未找到**
- **问题**：重启终端后，nvm 命令失效。  
- **解决方案**：  
  确保 shell 配置文件（如 `.bashrc`、`.zshrc`）正确加载 nvm：  
  ```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  ```

#### 3. **与系统 Node 冲突**
- **问题**：nvm 与系统预装的 Node 冲突。  
- **解决方案**：  
  卸载系统 Node，或使用 `nvm unload` 临时禁用 nvm。


### **六、与其他工具的对比**
| **工具**   | **特点**                     | **适用场景**               |
|------------|------------------------------|----------------------------|
| nvm        | 功能全面，支持多平台         | 大多数 Node.js 开发者       |
| n          | 简单轻量，依赖 npm           | 仅需快速切换版本           |
| fnm        | 基于 Rust，启动速度极快      | 性能敏感的开发者           |
| Volta      | 自动版本管理，无需显式切换   | CI/CD 环境或团队协作       |


### **七、总结**
nvm 是管理 Node.js 版本的首选工具，尤其适合：
- 需要同时维护多个项目的开发者。
- 参与需要特定 Node 版本的开源项目。
- 测试代码在不同 Node 版本下的兼容性。

通过合理配置和使用，nvm 可以显著提升开发效率，减少版本相关的问题。安装和掌握 nvm 是成为专业 Node.js 开发者的必备技能之一。