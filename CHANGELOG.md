# 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 新增
- 树莓派部署支持（`scripts/` 目录）
- Windows 离线启动工具（`tools/` 目录）
- 7 份前端学习文档（`docs/learning/`）
- 串口通信协议文档（基于实际代码）

### 修复
- 修复 `server.cjs` 重复的 `DIST` 变量声明
- 修复 `启动器.hta` 在 IE 引擎下的路径解析问题
- 修复树莓派脚本的路径引用（`scripts/` → 项目根目录）

### 优化
- 整理项目文件结构（`docs/`、`scripts/`、`tools/` 分离）
- 完善 README.md（协议、部署、学习资源）

---

## [1.0.0] - 2026-06-10

### 新增
- 48×48 格栅地图 Canvas 渲染
- A* 路径规划算法（含膨胀安全半径）
- 实时小车位姿渲染（麦轮、车头方向）
- 串口通信（Web Serial API）
- 深色/浅色主题切换
- 可拖拽浮动日志面板
- 性能监控（FPS 显示）
- 8 段比赛流程规划
- 动态障碍物设置与可达性验证
- 启停区高亮与车体位置精确对齐

---
