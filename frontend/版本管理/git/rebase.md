`git rebase` 是 Git 中用于整合分支更改的强大命令，它通过将一系列提交“移动”或“复制”到新的基准提交（base）上，使提交历史更加线性和清晰。与 `git merge` 创建合并提交不同，`git rebase` 会重写提交历史，使分支看起来像是按顺序依次创建的。

### 基本用法
以下是 `git rebase` 的基本用法和常见场景：

#### 1. 线性化提交历史
```bash
git checkout feature
git rebase main
```
这会将 `feature` 分支的所有提交移至 `main` 分支的最新提交之后，使提交历史变为线性结构。

#### 2. 交互式变基（修改提交历史）
```bash
git rebase -i <commit>
```
交互式变基允许你编辑、合并、删除或重新排序提交。例如，将最近 3 个提交合并为一个：
```bash
git rebase -i HEAD~3
```
在打开的编辑器中，将 `pick` 改为 `squash` 或 `fixup` 来合并提交。

#### 3. 应用补丁到特定分支
```bash
git rebase --onto main old-base feature
```
这会将 `feature` 分支中从 `old-base` 之后的提交应用到 `main` 分支上。

### 常用选项
- `-i`, `--interactive`：交互式变基，允许修改提交历史。
- `--onto`：指定新的基准提交。
- `-s`, `--strategy`：指定合并策略（如 `recursive`）。
- `-X`, `--strategy-option`：传递策略选项（如 `ours` 或 `theirs`）。
- `--continue`：解决冲突后继续变基。
- `--abort`：放弃变基并恢复到原始状态。
- `--skip`：跳过当前提交继续变基。

### 处理冲突
在变基过程中，如果发生冲突，Git 会暂停操作并标记冲突文件。你需要：
1. 手动解决冲突文件。
2. 使用 `git add` 标记冲突已解决。
3. 继续变基：
   ```bash
   git rebase --continue
   ```
若要放弃变基，使用：
```bash
git rebase --abort
```

### 典型场景
1. **保持提交历史线性**：在将 feature 分支合并到 main 之前进行变基，使提交历史更清晰。
2. **清理提交**：通过交互式变基合并小提交、修改提交信息或删除不必要的提交。
3. **同步多个分支**：将多个 feature 分支基于最新的 main 分支进行变基。

### 注意事项
- **不要对已发布的提交进行变基**：如果提交已经推送到远程仓库并被他人使用，变基会导致提交历史分叉，造成协作困难。
- **备份重要分支**：在执行复杂变基前，建议创建备份分支以防意外。
- **变基 vs 合并**：选择使用变基还是合并取决于团队的工作流程和对提交历史的偏好。变基使历史更线性，合并保留分支结构。

### 示例流程
假设你在 `feature` 分支上工作，而 `main` 分支已更新：
```bash
# 1. 切换到 feature 分支
git checkout feature

# 2. 基于 main 分支进行变基
git rebase main

# 3. 如果有冲突，解决后继续
git rebase --continue

# 4. 切换回 main 分支
git checkout main

# 5. 快进合并 feature 分支
git merge feature
```

通过 `git rebase`，你可以保持提交历史的整洁和线性，使代码审查和版本管理更加高效。