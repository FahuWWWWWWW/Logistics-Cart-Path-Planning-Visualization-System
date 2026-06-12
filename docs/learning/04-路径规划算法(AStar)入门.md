# 路径规划算法（A*）入门

> 本文档讲解 A* 路径规划算法的基本原理，以及本项目中的实现方式。

---

## 📚 目录

1. [什么是路径规划？](#1-什么是路径规划)
2. [A* 算法原理](#2-a-算法原理)
3. [项目中的 A* 实现](#3-项目中的-a-实现)
4. [算法优化与改进](#4-算法优化与改进)

---

## 1. 什么是路径规划？

### 1.1 简单理解

**路径规划** = 从起点到终点，找到一条**最优路径**

想象一下：
- 你在商场里，想从入口走到某个店铺
- 路径规划就是帮你找到**最短**、**最快**、或**最安全**的路线
- 同时要避开障碍物（如墙壁、货架）

### 1.2 常见应用场景

- **游戏开发**：NPC 自动寻路
- **机器人**：扫地机器人规划清扫路线
- **地图导航**：高德、百度地图的路线规划
- **本项目**：物流小车在比赛场地上规划行驶路线

### 1.3 常见算法

| 算法 | 优点 | 缺点 |
|------|------|------|
| **Dijkstra** | 保证找到最短路径 | 速度慢 |
| **A\*** | 速度快，保证最优 | 需要实现启发函数 |
| **BFS（广度优先）** | 简单，适合无权图 | 速度慢 |
| **DFS（深度优先）** | 简单 | 不一定找到最短路径 |

**本项目使用 A\* 算法**，因为它在速度和最优性之间取得了很好的平衡。

---

## 2. A* 算法原理

### 2.1 核心思想

A\* 算法通过一个**估价函数**来指导搜索方向：

```
f(n) = g(n) + h(n)
```

- **g(n)**：从起点到节点 n 的实际代价（已知）
- **h(n)**：从节点 n 到终点的预估代价（启发函数）
- **f(n)**：从起点经过节点 n 到终点的总预估代价

**通俗理解**：
- `g(n)` = 已经走了多远
- `h(n)` = 预估还要走多远
- `f(n)` = 预估总共要走多远

A\* 算法每次选择 `f(n)` 最小的节点进行扩展，就像"贪心"一样，优先搜索最有希望的方向。

### 2.2 启发函数（Heuristic Function）

启发函数 `h(n)` 的选择很重要：

**常用启发函数**：
1. **曼哈顿距离**（Manhattan Distance）
   ```
   h(n) = |x_n - x_goal| + |y_n - y_goal|
   ```
   - 适用场景：只能上下左右移动（如网格地图）
   - 本项目使用这种方法

2. **欧几里得距离**（Euclidean Distance）
   ```
   h(n) = sqrt((x_n - x_goal)^2 + (y_n - y_goal)^2)
   ```
   - 适用场景：可以任意方向移动

**注意**：启发函数不能高估实际代价，否则 A\* 可能找不到最优路径。

### 2.3 算法步骤

1. 将起点加入**开放列表**（Open List）
2. 循环以下步骤，直到找到终点或开放列表为空：
   a. 从开放列表中取出 `f(n)` 最小的节点
   b. 将该节点加入**关闭列表**（Closed List）
   c. 扩展该节点的邻居节点
   d. 对每个邻居节点：
      - 如果邻居节点是终点，则成功找到路径
      - 如果邻居节点不在开放列表中，则计算 `f(n)` 并加入开放列表
      - 如果邻居节点已在开放列表中，且新的 `f(n)` 更小，则更新
3. 如果开放列表为空，说明找不到路径

### 2.4 示例演示

假设要找到从 `(0, 0)` 到 `(4, 4)` 的路径，网格中有障碍物：

```
S = 起点 (0, 0)
G = 终点 (4, 4)
# = 障碍物

  0 1 2 3 4
0 S . . # .
1 . # . # .
2 . . . . .
3 . # # # .
4 . . . . G
```

**搜索过程**（简化）：
1. 起点 `(0, 0)`，`f = 0 + 8 = 8`
2. 扩展 `(0, 0)`，邻居有 `(0, 1)` 和 `(1, 0)`
3. 选择 `f` 最小的邻居继续扩展
4. 重复步骤 2-3，直到到达 `(4, 4)`
5. 回溯路径：`(0,0) -> (0,1) -> (0,2) -> (1,2) -> ... -> (4,4)`

---

## 3. 项目中的 A* 实现

### 3.1 核心代码（`src/utils/pathPlanning.ts`）

**节点定义**：
```typescript
interface Node {
    x: number;          // x 坐标
    y: number;          // y 坐标
    g: number;          // 从起点到该节点的实际代价
    h: number;          // 从该节点到终点的预估代价
    f: number;          // 总代价 (g + h)
    parent: Node | null; // 父节点（用于回溯路径）
}
```

**A\* 算法实现**（简化版）：
```typescript
function aStar(start: Point, goal: Point, obstacles: Point[]): Point[] {
    // 1. 初始化
    const openList: Node[] = [];
    const closedList: Set<string> = new Set();
    
    const startNode: Node = {
        x: start.x,
        y: start.y,
        g: 0,
        h: manhattanDistance(start, goal),
        f: 0,
        parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);
    
    // 2. 主循环
    while (openList.length > 0) {
        // 取出 f 最小的节点
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift()!;
        
        // 如果是终点，回溯路径
        if (current.x === goal.x && current.y === goal.y) {
            return backtrackPath(current);
        }
        
        // 加入关闭列表
        closedList.add(`${current.x},${current.y}`);
        
        // 扩展邻居
        const neighbors = getNeighbors(current, obstacles);
        for (const neighbor of neighbors) {
            if (closedList.has(`${neighbor.x},${neighbor.y}`)) {
                continue;
            }
            
            const g = current.g + 1;
            const h = manhattanDistance(neighbor, goal);
            const f = g + h;
            
            // 检查是否在开放列表中
            const existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
            if (!existingNode) {
                // 不在开放列表中，加入
                openList.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g,
                    h,
                    f,
                    parent: current
                });
            } else if (g < existingNode.g) {
                // 在开放列表中，且新的 g 更小，更新
                existingNode.g = g;
                existingNode.f = g + existingNode.h;
                existingNode.parent = current;
            }
        }
    }
    
    // 3. 找不到路径
    return [];
}
```

**曼哈顿距离**：
```typescript
function manhattanDistance(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

**回溯路径**：
```typescript
function backtrackPath(node: Node): Point[] {
    const path: Point[] = [];
    let current: Node | null = node;
    
    while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
    }
    
    return path;
}
```

### 3.2 使用示例

```typescript
// 起点和终点
const start = { x: 0, y: 0 };
const goal = { x: 47, y: 47 };

// 障碍物列表
const obstacles = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    // ...
];

// 规划路径
const path = aStar(start, goal, obstacles);

if (path.length > 0) {
    console.log('找到路径：', path);
} else {
    console.log('找不到路径！');
}
```

---

## 4. 算法优化与改进

### 4.1 使用优先队列（Priority Queue）

**问题**：上面的代码使用数组存储开放列表，每次排序的时间复杂度是 O(n log n)。

**解决方案**：使用优先队列（堆），将时间复杂度降到 O(log n)。

**实现**：
```typescript
class PriorityQueue {
    private heap: Node[] = [];
    
    push(node: Node): void {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }
    
    pop(): Node | null {
        if (this.heap.length === 0) return null;
        const result = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return result;
    }
    
    // ... 其他辅助方法
}
```

### 4.2 考虑机器人尺寸（膨胀处理）

**问题**：A\* 算法规划的路径可能离障碍物太近，机器人会碰撞。

**解决方案**：将障碍物"膨胀"一定半径。

```typescript
function inflateObstacles(obstacles: Point[], radius: number): Point[] {
    const inflated: Point[] = [];
    
    for (const obs of obstacles) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    inflated.push({
                        x: obs.x + dx,
                        y: obs.y + dy
                    });
                }
            }
        }
    }
    
    return inflated;
}
```

### 4.3 平滑路径

**问题**：A\* 算法规划的路径是"锯齿状"的，不平滑。

**解决方案**：使用路径平滑算法（如双向搜索、贝塞尔曲线）。

```typescript
function smoothPath(path: Point[]): Point[] {
    // 简化版：去除不必要的拐点
    const smoothed: Point[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        const next = path[i + 1];
        
        // 如果当前点是直线上的点，跳过
        if (!isCollinear(prev, curr, next)) {
            smoothed.push(curr);
        }
    }
    
    smoothed.push(path[path.length - 1]);
    return smoothed;
}
```

---

## 📝 总结

**关键点回顾**：
1. A\* 算法是路径规划的经典算法
2. 核心思想：通过估价函数 `f(n) = g(n) + h(n)` 指导搜索
3. 本项目使用曼哈顿距离作为启发函数
4. 可以通过优化数据结构和添加膨胀处理来改进算法

**下一步行动**：
1. 理解 A\* 算法的原理
2. 阅读本项目的 `src/utils/pathPlanning.ts`
3. 尝试修改启发函数或添加新功能

祝你学习顺利！🎉
