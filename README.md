# 物流小车路径规划可视化系统 - 2027工创赛

## 📐 项目概述

基于 PC 串口通信的路径规划可视化页面，用于与下位机交互实现物流小车的避障路径规划功能。

**项目路径**: `E:\Learning\Competition\GC_Competition\2027_GC_C\path-planning-visualization`

## 🚀 快速启动

```bash
cd E:\Learning\Competition\GC_Competition\2027_GC_C\path-planning-visualization
npm install
npm run dev
```

访问 `http://localhost:3000`

## 📐 场地规格（2027工创赛标准）

| 元素 | 尺寸 | 位置 |
|------|------|------|
| 场地 | 2400×2400mm | 48×48格（每格50mm） |
| 加工台×4 | 450×450mm (9×9格) | 场地中央四角分布 |
| 十字通道 | 400mm宽 (8格) | 加工台之间 |
| 启停区×2 | 300×300mm (6×6格) | 右上/右下角 |
| 二维码区 | 400×1400mm (8×28格) | 右侧（车体可进入） |
| 原料区 | 400×200mm | 顶部中央 |
| 暂存区 | 200×1000mm | 左侧 |
| 粗加工区 | 600×200mm | 底部中央 |
| 小车 | 300×300mm | 安全膨胀150mm(3格) |
| 障碍物 | φ50×100mm | 通道中央候选位置 |

## 🏁 比赛流程路径（8段）

1. **启停区→二维码区**：读取任务码
2. **二维码区→原料区**：前往抓取第一批物料
3. **原料区→粗加工区**：运送第一批物料
4. **粗加工区→暂存区**：转运第一批物料
5. **暂存区→原料区**：返回抓取第二批物料
6. **原料区→粗加工区**：运送第二批物料
7. **粗加工区→暂存区**：码垛第二批物料
8. **暂存区→启停区**：完成任务返回

## 🔑 关键技术实现

### 二维码区可进入
- 二维码区标记为 `isObstacle: false`，车体可以驶入
- 膨胀算法排除二维码区，确保路径可达
- 二维码读取路径点：(44, 24) — 区域中心

### 鲁棒路径规划
- `planPathRobust()`: 三级回退策略（直接→调终点→调起终点）
- `findNearestPassableCell()`: 螺旋搜索最近可达点
- A* 对角线穿墙检测

### 障碍物验证
- 只在通道中央21个候选位置生成
- 放置后验证所有关键路径点之间的可达性
- 角点检测避免三面围堵

## 🔌 串口通信协议

**上位机→下位机：**
```json
{"cmd":"set_target","x":10,"y":10}
{"cmd":"plan_path"}
```

**下位机→上位机：**
```json
{"type":"status","x":0,"y":0,"status":"moving"}
{"type":"path","path":[{"x":0,"y":0},...],"timeCost":10}
```

## 📂 文件结构

```
src/
├── types/index.ts       # 类型定义（含RaceStep）
├── utils/astar.ts       # A*算法 + 膨胀 + 鲁棒规划
├── utils/serial.ts      # Web Serial API封装
├── components/
│   ├── GridMap.tsx      # 网格地图（含路径点标记+分段颜色）
│   ├── ControlPanel.tsx # 控制面板（含出发位置选择）
│   ├── SerialPanel.tsx  # 串口面板
│   └── LogPanel.tsx     # 日志面板
├── App.tsx              # 主应用
├── main.tsx             # 入口
└── index.css            # 样式
```
