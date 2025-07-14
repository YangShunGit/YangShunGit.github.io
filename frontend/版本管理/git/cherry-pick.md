`git cherry-pick` 是 Git 中用于将特定提交应用到当前分支的命令。它允许你从一个分支中选择一个或多个提交，并将它们复制到另一个分支上，而不必合并整个分支的所有更改。

### 基本用法
以下是 `git cherry-pick` 的基本用法和常见场景：

#### 1. 应用单个提交
```bash
git cherry-pick <commit-hash>
```
这会将指定哈希值的提交应用到当前分支。Git 会尝试在当前分支上重新创建该提交的更改。

#### 2. 应用多个提交
```bash
git cherry-pick <commit-hash1> <commit-hash2> ...
```
可以指定多个提交哈希值，Git 会按顺序依次应用这些提交。

#### 3. 应用一个范围内的提交
```bash
git cherry-pick <start-commit>..<end-commit>
```
这会应用从 `<start-commit>` 之后到 `<end-commit>` 之间的所有提交（不包括 `<start-commit>` 本身）。

#### 4. 应用一个范围并包含起始提交
```bash
git cherry-pick <start-commit>^..<end-commit>
```
使用 `^` 符号表示包含 `<start-commit>` 本身。

### 常用选项
- `-e`, `--edit`：在应用提交前编辑提交信息。
- `-n`, `--no-commit`：应用更改但不自动创建提交，允许你在提交前进行额外修改。
- `-x`：在提交信息中添加原提交的哈希值，表明这是一个 cherry-pick 的提交。
- `-m parent-number`：当处理合并提交时，指定保留哪个父提交的主线（用于解决冲突）。

### 处理冲突
如果 cherry-pick 过程中发生冲突，Git 会暂停操作并标记冲突文件。你需要手动解决冲突，然后执行以下命令继续：
```bash
git add <resolved-files>
git cherry-pick --continue
```
若要放弃 cherry-pick 操作，可以使用：
```bash
git cherry-pick --abort
```

### 典型场景
1. **修复 bug**：在开发分支上修复了一个 bug，但需要将该修复快速应用到生产分支，可以 cherry-pick 该修复提交到生产分支。
2. **选择性合并**：只需要某个分支上的部分提交，而不是整个分支的所有更改。

### 注意事项
- Cherry-pick 会创建新的提交对象，即使更改内容相同，提交哈希值也会不同。
- 频繁使用 cherry-pick 可能导致提交历史分散，建议在合适的场景下使用，避免滥用。
- 如果提交依赖于其他提交的更改，cherry-pick 可能会失败或产生意外结果。