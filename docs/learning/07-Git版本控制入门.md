# Git 版本控制入门

> 📚 **前置知识**：需要了解基本的命令行操作
> ⏱️ **学习时间**：约 1-2 小时
> 🎯 **学习目标**：掌握 Git 基础操作，能够管理代码版本、推送到 GitHub

---

## 目录

1. [什么是版本控制？](#1-什么是版本控制)
2. [Git 基础概念](#2-git-基础概念)
3. [安装和配置](#3-安装和配置)
4. [基础操作](#4-基础操作)
5. [分支管理](#5-分支管理)
6. [远程仓库（GitHub）](#6-远程仓库github)
7. [实战：项目工作流](#7-实战项目工作流)
8. [常见问题](#8-常见问题)

---

## 1. 什么是版本控制？

### 1.1 没有版本控制的痛苦

**场景**：你在写一个项目，改了代码后发现问题，想回到昨天的版本...

❌ **错误做法**：
```
项目-最终版.doc
项目-最终版2.doc
项目-真的最后版.doc
项目-绝对不改版.doc
```

**问题**：
- 不知道每个版本改了什么
- 无法多人协作
- 误删代码无法恢复

### 1.2 Git 的解决方案

**Git 是什么？**
- 分布式版本控制系统
- 记录代码的每一次修改
- 可以随时回到任意版本
- 支持多人协作

**类比**：
- 没有 Git = 写论文不保存版本，只有一份文件
- 使用 Git = 每改一段就保存一个版本，还能写备注（"改了引言部分"）

---

## 2. Git 基础概念

### 2.1 三个区域

Git 有 **3 个重要区域**：

```
工作区（Working Directory） → 暂存区（Staging Area） → 版本库（Repository）
         ↓                           ↓                         ↓
      你正在编辑的文件          准备提交的改动            已保存的版本
```

**类比**：
- 工作区 = 你的桌面（正在写的文档）
- 暂存区 = 草稿箱（准备提交的修改）
- 版本库 = 档案室（已保存的版本）

### 2.2 文件状态

文件在 Git 中有 **4 种状态**：

| 状态 | 说明 | 如何查看 |
|------|------|----------|
| 未跟踪（Untracked） | 新文件，Git 还没管理 | `git status` 显示红色 |
| 已修改（Modified） | 文件改了，但没提交 | `git status` 显示红色 |
| 已暂存（Staged） | 文件在暂存区，准备提交 | `git status` 显示绿色 |
| 已提交（Committed） | 文件已保存到版本库 | `git status` 显示 "nothing to commit" |

### 2.3 提交（Commit）

**提交 = 保存一个版本**。

每次提交包含：
- 唯一的 ID（SHA-1 哈希）
- 提交信息（你写的备注）
- 修改内容（哪些文件改了）

**类比**：
- 提交 = 玩游戏时保存进度
- 提交信息 = 给存档起名字（"打完第一章 boss"）

---

## 3. 安装和配置

### 3.1 安装 Git

**Windows**：
1. 下载：[Git 官网](https://git-scm.com/)
2. 安装：一路 "Next" 即可
3. 验证：打开命令提示符，输入 `git --version`

**macOS**：
```bash
# 使用 Homebrew 安装
brew install git
```

**Linux（树莓派）**：
```bash
sudo apt update
sudo apt install git
```

### 3.2 配置用户信息

**重要**：安装后必须配置用户名和邮箱（提交时会用到）。

```bash
# 配置全局用户信息（所有项目都用这个）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 查看配置
git config --list
```

### 3.3 配置 SSH 密钥（推荐）

使用 SSH 密钥可以避免每次推送都输入密码。

```bash
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "你的邮箱"

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 3. 复制公钥，添加到 GitHub
# GitHub → Settings → SSH and GPG keys → New SSH key
```

---

## 4. 基础操作

### 4.1 初始化仓库

```bash
# 方式一：创建新仓库
mkdir my-project
cd my-project
git init

# 方式二：克隆现有仓库
git clone https://github.com/用户名/仓库名.git
```

### 4.2 查看状态

```bash
# 查看当前状态（最常用！）
git status

# 输出示例：
# On branch main
# Changes not staged for commit:
#   modified:   src/App.tsx
#
# Untracked files:
#   new-file.txt
```

### 4.3 添加到暂存区

```bash
# 添加单个文件
git add src/App.tsx

# 添加所有改动
git add .

# 添加所有 .ts 文件
git add *.ts
```

### 4.4 提交

```bash
# 提交（必须写提交信息）
git commit -m "feat: 添加登录功能"

# 提交信息规范（推荐）：
# feat: 新功能
# fix: 修复 bug
# docs: 文档修改
# style: 代码格式（不影响功能）
# refactor: 重构
# test: 测试相关
```

### 4.5 查看历史

```bash
# 查看提交历史
git log

# 简洁模式
git log --oneline

# 查看某次提交的详情
git show <提交ID>
```

### 4.6 撤销修改

```bash
# 撤销工作区的修改（危险！不可恢复）
git checkout -- src/App.tsx

# 撤销暂存区的修改（文件还在，只是不在暂存区了）
git reset HEAD src/App.tsx

# 撤销上一次提交（会保留修改内容）
git reset --soft HEAD~1
```

---

## 5. 分支管理

### 5.1 什么是分支？

**分支 = 独立开发线**。

**类比**：
- 主分支（main）= 大树的主干
- 新分支（feature/login）= 从主干分出来的树枝
- 合并（merge）= 把树枝合并回主干

**为什么要用分支？**
- 开发新功能时不影响主分支
- 多人协作时每个人用自己的分支
- 方便实验（实验失败可以删除分支）

### 5.2 分支操作

```bash
# 查看所有分支
git branch

# 创建新分支
git branch feature/login

# 切换到某分支
git checkout feature/login
# 或（Git 2.23+）
git switch feature/login

# 创建并切换分支（常用）
git checkout -b feature/login
# 或
git switch -c feature/login

# 合并分支（先切换到主分支）
git switch main
git merge feature/login

# 删除分支
git branch -d feature/login
```

### 5.3 解决冲突

**冲突场景**：两个人改了同一行代码，Git 不知道听谁的。

**解决步骤**：
1. Git 会标记冲突的地方：
   ```typescript
   <<<<<<< HEAD
   const a = 1; // 你的代码
   =======
   const a = 2; // 别人的代码
   >>>>>>> feature/login
   ```

2. 手动编辑文件，保留想要的代码：
   ```typescript
   const a = 1; // 保留这一行
   ```

3. 标记冲突已解决：
   ```bash
   git add src/App.tsx
   git commit -m "fix: 解决冲突"
   ```

---

## 6. 远程仓库（GitHub）

### 6.1 添加远程仓库

```bash
# 添加远程仓库（通常叫 origin）
git remote add origin https://github.com/用户名/仓库名.git

# 查看远程仓库
git remote -v
```

### 6.2 推送到远程

```bash
# 第一次推送（设置上游分支）
git push -u origin main

# 之后推送（简化）
git push

# 推送新分支
git push -u origin feature/login
```

### 6.3 拉取更新

```bash
# 拉取远程更新并合并（推荐）
git pull

# 等同于：
git fetch   # 下载远程更新
git merge   # 合并到当前分支

# 如果你想要更干净的提交历史，用 rebase：
git pull --rebase
```

### 6.4 克隆仓库

```bash
# 克隆别人的仓库（下载到本地）
git clone https://github.com/用户名/仓库名.git

# 克隆到指定目录
git clone https://github.com/用户名/仓库名.git my-project
```

---

## 7. 实战：项目工作流

### 7.1 标准工作流

```bash
# 1. 拉取最新代码
git pull

# 2. 创建功能分支
git switch -c feature/new-feature

# 3. 开发功能（多次提交）
git add .
git commit -m "feat: 添加 XX 功能"
git add .
git commit -m "fix: 修复 XX bug"

# 4. 推送到远程
git push -u origin feature/new-feature

# 5. 在 GitHub 上创建 Pull Request（PR）
# （让队友审查代码）

# 6. 审查通过后，合并到主分支
git switch main
git pull
git merge feature/new-feature

# 7. 删除功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### 7.2 本项目的工作流

```bash
# 1. 克隆项目
git clone https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System.git
cd Logistics-Cart-Path-Planning-Visualization-System

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 修改代码后提交
git add .
git commit -m "fix: 修复启动器界面"
git push

# 5. 构建并部署
npm run build
# 启动 server.cjs
```

---

## 8. 常见问题

### 8.1 提交信息写错了

```bash
# 修改最后一次提交信息
git commit --amend -m "新的提交信息"
```

### 8.2 想回到昨天的版本

```bash
# 查看提交历史，找到昨天的提交 ID
git log --oneline

# 回到昨天的版本（会创建一个新提交）
git revert <提交ID>

# 或者：临时回到某个版本（不创建新提交）
git checkout <提交ID>
```

### 8.3 误删了文件

```bash
# 恢复单个文件
git checkout HEAD -- src/App.tsx

# 恢复所有文件
git checkout HEAD -- .
```

### 8.4 想撤销已经推送的提交

```bash
# ⚠️ 危险！如果多人协作，不要这么做
git reset --hard HEAD~1
git push --force
```

**正确做法**（如果已经推送）：
```bash
# 用 revert（创建一个新提交来撤销）
git revert <提交ID>
git push
```

### 8.5 .gitignore 文件

**作用**：告诉 Git 哪些文件不要管理（如 `node_modules/`、`.env`）。

```
# .gitignore 示例
node_modules/
dist/
.env
*.log
.DS_Store
```

---

## 总结

✅ **你已经学会了**：
- Git 的基础概念（三个区域、文件状态）
- 基础操作（`add`, `commit`, `status`, `log`）
- 分支管理（`branch`, `checkout`, `merge`）
- 远程仓库操作（`push`, `pull`, `clone`）
- 标准工作流

🎯 **下一步**：
- 在自己的项目中使用 Git
- 尝试创建分支、合并、解决冲突
- 推送到 GitHub，体验多人协作

📚 **扩展阅读**：
- [Git 官方教程](https://git-scm.com/book/zh/v2)
- [GitHub 官方指南](https://guides.github.com/)
- [图解 Git](https://marklodato.github.io/visual-git-guide/index-zh-cn.html)

---

## 附录：常用命令速查表

| 命令 | 说明 |
|------|------|
| `git init` | 初始化仓库 |
| `git clone <url>` | 克隆仓库 |
| `git status` | 查看状态 |
| `git add .` | 添加所有改动到暂存区 |
| `git commit -m "消息"` | 提交 |
| `git log --oneline` | 查看历史（简洁） |
| `git push` | 推送到远程 |
| `git pull` | 拉取并合并 |
| `git branch` | 查看分支 |
| `git checkout -b <分支名>` | 创建并切换分支 |
| `git merge <分支名>` | 合并分支 |
| `git reset --hard HEAD~1` | 撤销上一次提交（危险） |
