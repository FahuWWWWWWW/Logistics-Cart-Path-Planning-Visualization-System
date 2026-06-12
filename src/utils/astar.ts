import { GridCoord, PathResult, Zone } from '../types';

// 默认中央偏好参数
export const DEFAULT_CENTER_WEIGHT = 8;     // 大幅上调，确保安全优先
export const DEFAULT_SAFE_DISTANCE = 3;     // 3格=150mm，约半个车体宽度

/**
 * A* 路径规划算法
 * @param grid 二维网格，0=可通行，1=障碍物
 * @param start 起点
 * @param end 终点
 * @returns 路径规划结果
 */
export function aStar(
  grid: number[][],
  start: GridCoord,
  end: GridCoord
): PathResult {
  const startTime = performance.now();
  const rows = grid.length;
  const cols = grid[0].length;

  // 边界检查
  if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows) {
    return emptyResult(startTime);
  }
  if (end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows) {
    return emptyResult(startTime);
  }

  // 如果起点或终点本身就是障碍物，直接返回空
  if (grid[start.y][start.x] === 1 || grid[end.y][end.x] === 1) {
    return emptyResult(startTime);
  }

  // 定义4方向移动（只允许正交，禁止对角线，确保路径为直角）
  const directions = [
    { x: 0, y: -1, cost: 1 },     // 上
    { x: 1, y: 0, cost: 1 },      // 右
    { x: 0, y: 1, cost: 1 },      // 下
    { x: -1, y: 0, cost: 1 },     // 左
  ];

  // 启发式函数：曼哈顿距离（适合4方向移动）
  const heuristic = (a: GridCoord, b: GridCoord): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  // 优先队列（使用二叉堆优化）
  const openSet: Array<{ coord: GridCoord; f: number }> = [];
  const gScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const fScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const parent: (GridCoord | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const closedSet = Array.from({ length: rows }, () => Array(cols).fill(false));

  // 初始化起点
  gScore[start.y][start.x] = 0;
  fScore[start.y][start.x] = heuristic(start, end);
  openSet.push({ coord: start, f: fScore[start.y][start.x] });

  while (openSet.length > 0) {
    // 获取 f 值最小的节点
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!.coord;

    // 到达终点，回溯路径
    if (current.x === end.x && current.y === end.y) {
      const path: GridCoord[] = [];
      let node: GridCoord | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = parent[node.y][node.x];
      }

      const endTime = performance.now();
      return {
        path,
        length: path.length,
        realLength: 0, // 由调用方计算
        nodeCount: path.length,
        timeCost: Math.round(endTime - startTime),
        algorithm: 'A*',
      };
    }

    closedSet[current.y][current.x] = true;

    // 遍历邻居
    for (const dir of directions) {
      const neighbor: GridCoord = {
        x: current.x + dir.x,
        y: current.y + dir.y,
      };

      // 检查边界
      if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) {
        continue;
      }

      // 检查障碍物
      if (grid[neighbor.y][neighbor.x] === 1) {
        continue;
      }

      // 检查是否在关闭列表中
      if (closedSet[neighbor.y][neighbor.x]) {
        continue;
      }

      const tentativeG = gScore[current.y][current.x] + dir.cost;

      if (tentativeG < gScore[neighbor.y][neighbor.x]) {
        parent[neighbor.y][neighbor.x] = current;
        gScore[neighbor.y][neighbor.x] = tentativeG;
        fScore[neighbor.y][neighbor.x] = tentativeG + heuristic(neighbor, end);

        // 检查是否已在开放列表中
        const inOpenSet = openSet.some(
          (item) => item.coord.x === neighbor.x && item.coord.y === neighbor.y
        );

        if (!inOpenSet) {
          openSet.push({ coord: neighbor, f: fScore[neighbor.y][neighbor.x] });
        }
      }
    }
  }

  // 未找到路径
  return emptyResult(startTime);
}

/**
 * 计算网格距离场（每个自由节点到最近障碍物的距离）
 * 使用BFS从所有障碍物同时扩展
 * @param grid 二维网格，0=可通行，1=障碍物
 * @returns 距离场矩阵（与grid同维度，障碍物位置为0）
 */
export function computeDistanceField(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const queue: GridCoord[] = [];

  // 初始化：所有障碍物距离为0，加入队列
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 1) {
        dist[y][x] = 0;
        queue.push({ x, y });
      }
    }
  }

  // BFS扩展（4方向）
  let head = 0;
  const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  while (head < queue.length) {
    const cur = queue[head++];
    for (const dir of directions) {
      const nx = cur.x + dir.x;
      const ny = cur.y + dir.y;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && dist[ny][nx] === Infinity) {
        dist[ny][nx] = dist[cur.y][cur.x] + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return dist;
}

/**
 * A* 路径规划算法（带通道中央偏好）
 * 在标准A*基础上增加"远离障碍物"代价，使路径尽量走通道中间
 * @param grid 二维网格，0=可通行，1=障碍物
 * @param start 起点
 * @param end 终点
 * @param centerWeight 中央偏好权重（默认0.25，越大越倾向走中间）
 * @param safeDistance 期望安全距离（默认2.5格≈125mm）
 * @returns 路径规划结果
 */
export function aStarCenterPrefer(
  grid: number[][],
  start: GridCoord,
  end: GridCoord,
  centerWeight: number = 0.25,
  safeDistance: number = 2.5
): PathResult {
  const startTime = performance.now();
  const rows = grid.length;
  const cols = grid[0].length;

  // 边界检查
  if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows) {
    return emptyResult(startTime);
  }
  if (end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows) {
    return emptyResult(startTime);
  }

  // 如果起点或终点本身就是障碍物，直接返回空
  if (grid[start.y][start.x] === 1 || grid[end.y][end.x] === 1) {
    return emptyResult(startTime);
  }

  // 预计算距离场
  const distField = computeDistanceField(grid);

  // 定义4方向移动（只允许正交，禁止对角线，确保路径为直角）
  const directions = [
    { x: 0, y: -1, cost: 1 },     // 上
    { x: 1, y: 0, cost: 1 },      // 右
    { x: 0, y: 1, cost: 1 },      // 下
    { x: -1, y: 0, cost: 1 },     // 左
  ];

  // 启发式函数：曼哈顿距离（适合4方向移动）
  const heuristic = (a: GridCoord, b: GridCoord): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  // 安全距离惩罚（平方增长，让贴近障碍物的代价急剧增加）
  // 当距离 >= safeDistance 时，惩罚 = 0
  // 当距离 < safeDistance 时，惩罚 = (safeDistance - d)^2 * centerWeight
  // 平方函数确保：距离障碍物越近，惩罚增长越快，强制路径远离障碍物
  const safetyPenalty = (d: number): number => {
    if (d >= safeDistance) return 0;
    const deficit = safeDistance - d;
    return deficit * deficit * centerWeight; // 平方惩罚
  };

  // 转向惩罚：当前移动方向与入方向不一致时，增加额外代价，减少锯齿
  // 现在只有4方向移动，所以只有0度（同方向）和90度（转弯）两种情况
  // 增加惩罚权重，强烈抑制不必要的转弯
  const turnPenalty = (fromDir: GridCoord | null, toDir: GridCoord): number => {
    if (!fromDir || (fromDir.x === 0 && fromDir.y === 0)) return 0; // 起点无入方向
    // 0度（同方向）：0
    if (fromDir.x === toDir.x && fromDir.y === toDir.y) return 0;
    // 90度（正交↔正交）：3.0（强转弯惩罚，鼓励直线行驶）
    return 3.0;
  };

  // 优先队列（使用二叉堆优化）
  const openSet: Array<{ coord: GridCoord; f: number }> = [];
  const gScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const fScore: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const parent: (GridCoord | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  // 记录每个节点的入方向（从父节点移动过来的方向 dx, dy），用于计算转向惩罚
  const inDir: (GridCoord | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const closedSet = Array.from({ length: rows }, () => Array(cols).fill(false));

  // 初始化起点
  gScore[start.y][start.x] = 0;
  fScore[start.y][start.x] = heuristic(start, end);
  inDir[start.y][start.x] = { x: 0, y: 0 }; // 起点无入方向
  openSet.push({ coord: start, f: fScore[start.y][start.x] });

  while (openSet.length > 0) {
    // 获取 f 值最小的节点
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!.coord;

    // 到达终点，回溯路径
    if (current.x === end.x && current.y === end.y) {
      const path: GridCoord[] = [];
      let node: GridCoord | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = parent[node.y][node.x];
      }

      const endTime = performance.now();
      return {
        path,
        length: path.length,
        realLength: 0, // 由调用方计算
        nodeCount: path.length,
        timeCost: Math.round(endTime - startTime),
        algorithm: 'A*',
      };
    }

    closedSet[current.y][current.x] = true;

    // 遍历邻居
    for (const dir of directions) {
      const neighbor: GridCoord = {
        x: current.x + dir.x,
        y: current.y + dir.y,
      };

      // 检查边界
      if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) {
        continue;
      }

      // 检查障碍物
      if (grid[neighbor.y][neighbor.x] === 1) {
        continue;
      }

      // 检查是否在关闭列表中
      if (closedSet[neighbor.y][neighbor.x]) {
        continue;
      }

      // 计算移动代价 = 基础移动 + 安全距离惩罚 + 转向惩罚
      const moveDir: GridCoord = { x: dir.x, y: dir.y };
      const parentDir = inDir[current.y][current.x]; // 父节点的入方向
      const turnCost = turnPenalty(parentDir, moveDir);
      const moveCost = dir.cost + safetyPenalty(distField[neighbor.y][neighbor.x]) + turnCost;
      const tentativeG = gScore[current.y][current.x] + moveCost;

      if (tentativeG < gScore[neighbor.y][neighbor.x]) {
        parent[neighbor.y][neighbor.x] = current;
        inDir[neighbor.y][neighbor.x] = moveDir; // 记录入方向
        gScore[neighbor.y][neighbor.x] = tentativeG;
        fScore[neighbor.y][neighbor.x] = tentativeG + heuristic(neighbor, end);

        // 检查是否已在开放列表中
        const inOpenSet = openSet.some(
          (item) => item.coord.x === neighbor.x && item.coord.y === neighbor.y
        );

        if (!inOpenSet) {
          openSet.push({ coord: neighbor, f: fScore[neighbor.y][neighbor.x] });
        }
      }
    }
  }

  // 未找到路径
  return emptyResult(startTime);
}

function emptyResult(startTime: number): PathResult {
  const endTime = performance.now();
  return {
    path: [],
    length: 0,
    realLength: 0,
    nodeCount: 0,
    timeCost: Math.round(endTime - startTime),
    algorithm: 'A*',
  };
}

/**
 * 检查两点之间是否有直线视野（Line of Sight）
 * 使用 Bresenham 直线算法，检查两点之间的所有格子是否可通行
 * @param grid 二维网格
 * @param p1 起点
 * @param p2 终点
 * @returns 如果直线路径上所有格子都可通行，返回 true
 */
function hasLineOfSight(grid: number[][], p1: GridCoord, p2: GridCoord): boolean {
  const rows = grid.length;
  const cols = grid[0].length;

  let x0 = p1.x;
  let y0 = p1.y;
  const x1 = p2.x;
  const y1 = p2.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // 检查当前点是否可通行
    if (x0 < 0 || x0 >= cols || y0 < 0 || y0 >= rows || grid[y0][x0] === 1) {
      return false;
    }

    // 到达终点
    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return true;
}

/**
 * 路径简化（Line of Sight）
 * 使用贪心算法：从起点开始，尝试直接连接到最远的可达点，跳过中间点
 * 仅允许水平或垂直连接（确保路径为直角）
 * @param grid 二维网格
 * @param path 原始路径
 * @returns 简化后的路径
 */
function simplifyPath(grid: number[][], path: GridCoord[]): GridCoord[] {
  if (path.length <= 2) return path;

  const simplified: GridCoord[] = [path[0]]; // 起点
  let currentIdx = 0;

  while (currentIdx < path.length - 1) {
    // 尝试连接到最远的可达点
    let farthestIdx = currentIdx + 1;
    for (let i = currentIdx + 2; i < path.length; i++) {
      // 仅允许水平或垂直连接（确保路径为直角）
      const isHorizontal = path[currentIdx].y === path[i].y;
      const isVertical = path[currentIdx].x === path[i].x;
      if ((isHorizontal || isVertical) && hasLineOfSight(grid, path[currentIdx], path[i])) {
        farthestIdx = i;
      } else {
        break; // 无法直达，停止
      }
    }

    // 添加最远可达点
    simplified.push(path[farthestIdx]);
    currentIdx = farthestIdx;
  }

  return simplified;
}

/**
 * 在网格中寻找距离目标最近的可达点
 * @param grid 二维网格
 * @param target 目标坐标
 * @param searchRadius 搜索半径（格数）
 * @returns 最近的可达点，如果找不到返回 null
 */
export function findNearestPassableCell(
  grid: number[][],
  target: GridCoord,
  searchRadius: number = 5
): GridCoord | null {
  const rows = grid.length;
  const cols = grid[0].length;

  // 先检查目标点本身
  if (target.x >= 0 && target.x < cols && target.y >= 0 && target.y < rows && grid[target.y][target.x] === 0) {
    return target;
  }

  // 螺旋搜索
  let bestDist = Infinity;
  let bestCell: GridCoord | null = null;

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const nx = target.x + dx;
      const ny = target.y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestCell = { x: nx, y: ny };
        }
      }
    }
  }

  return bestCell;
}

/**
 * 带回退策略的鲁棒路径规划
 * 如果直接规划失败，尝试寻找最近的可达点
 * @param grid 二维网格
 * @param from 起点
 * @param to 终点
 * @param label 步骤名称（用于日志）
 * @returns 路径结果和实际使用的端点
 */
export function planPathRobust(
  grid: number[][],
  from: GridCoord,
  to: GridCoord,
  label?: string,
  useCenterPrefer: boolean = true, // 默认启用：安全第一，路程第二
  simplify: boolean = false // 默认关闭路径简化，确保路径为直角
): { result: PathResult; actualFrom: GridCoord; actualTo: GridCoord } {
  // 第一次尝试：使用带通道中央偏好的A*规划
  const astarFn = useCenterPrefer ? aStarCenterPrefer : aStar;
  let result = astarFn(grid, from, to);
  
  // 路径简化（Line of Sight）
  if (simplify && result.path.length > 2) {
    const simplifiedPath = simplifyPath(grid, result.path);
    // 更新路径和长度
    result = {
      ...result,
      path: simplifiedPath,
      length: simplifiedPath.length,
      nodeCount: simplifiedPath.length,
    };
  }
  
  if (result.path.length > 0) {
    return { result, actualFrom: from, actualTo: to };
  }

  // 第二次尝试：调整终点到最近的可达点
  const altTo = findNearestPassableCell(grid, to, 8);
  if (altTo) {
    result = astarFn(grid, from, altTo);
    // 路径简化
    if (simplify && result.path.length > 2) {
      const simplifiedPath = simplifyPath(grid, result.path);
      result = {
        ...result,
        path: simplifiedPath,
        length: simplifiedPath.length,
        nodeCount: simplifiedPath.length,
      };
    }
    if (result.path.length > 0) {
      console.warn(`[路径规划] ${label}: 终点调整从(${to.x},${to.y})到(${altTo.x},${altTo.y})`);
      return { result, actualFrom: from, actualTo: altTo };
    }
  }

  // 第三次尝试：同时调整起点和终点
  const altFrom = findNearestPassableCell(grid, from, 8);
  if (altFrom && altTo) {
    result = astarFn(grid, altFrom, altTo);
    // 路径简化
    if (simplify && result.path.length > 2) {
      const simplifiedPath = simplifyPath(grid, result.path);
      result = {
        ...result,
        path: simplifiedPath,
        length: simplifiedPath.length,
        nodeCount: simplifiedPath.length,
      };
    }
    if (result.path.length > 0) {
      console.warn(`[路径规划] ${label}: 起点调整从(${from.x},${from.y})到(${altFrom.x},${altFrom.y})，终点调整到(${altTo.x},${altTo.y})`);
      return { result, actualFrom: altFrom, actualTo: altTo };
    }
  }

  // 所有尝试都失败
  return { result: emptyResult(performance.now()), actualFrom: from, actualTo: to };
}

/**
 * 创建带障碍物膨胀的网格
 * @param rows 行数
 * @param cols 列数
 * @param zones 固定区域（加工台等）
 * @param obstacles 动态障碍物
 * @param dilationRadius 膨胀半径（格数）
 * @param passableZoneLabels 不参与膨胀且完全可通行的区域标签列表（如二维码区车体需进入）
 * @param noDilationZoneLabels 标记为障碍物但不膨胀的区域标签列表（如原料区/粗加工区/暂存区，车可接近但不可进入）
 * @returns 二维网格
 */
export function createGridWithDilation(
  rows: number,
  cols: number,
  zones: Zone[],
  obstacles: GridCoord[],
  dilationRadius: number,
  passableZoneLabels: string[] = [],
  noDilationZoneLabels: string[] = []
): number[][] {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // 需要排除膨胀的区域集合
  const passableLabels = new Set(passableZoneLabels);
  // 不膨胀但仍是障碍物的区域集合
  const noDilationLabels = new Set(noDilationZoneLabels);

  // 收集不膨胀区域的单元格坐标（用于排除膨胀源）
  const noDilationCells = new Set<string>();
  for (const zone of zones) {
    if (noDilationLabels.has(zone.label)) {
      for (let dx = 0; dx < zone.width; dx++) {
        for (let dy = 0; dy < zone.height; dy++) {
          const x = zone.x + dx;
          const y = zone.y + dy;
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            noDilationCells.add(`${x},${y}`);
          }
        }
      }
    }
  }

  // 标记固定障碍物区域（仅标记 isObstacle 且不在排除列表中的区域）
  for (const zone of zones) {
    if (zone.isObstacle && !passableLabels.has(zone.label)) {
      for (let dx = 0; dx < zone.width; dx++) {
        for (let dy = 0; dy < zone.height; dy++) {
          const x = zone.x + dx;
          const y = zone.y + dy;
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[y][x] = 1;
          }
        }
      }
    }
  }

  // 标记动态障碍物
  for (const obs of obstacles) {
    if (obs.y >= 0 && obs.y < rows && obs.x >= 0 && obs.x < cols) {
      grid[obs.y][obs.x] = 1;
    }
  }

  // 膨胀操作（考虑小车安全半径）
  if (dilationRadius > 0) {
    // 创建膨胀源网格：排除不膨胀区域的单元格（它们仍是障碍物但不向外膨胀）
    const dilationSource = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === 1 && !noDilationCells.has(`${x},${y}`)) {
          dilationSource[y][x] = 1;
        }
      }
    }

    const dilatedGrid = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (dilationSource[y][x] === 1) {
          // 以该点为中心，膨胀半径范围内的所有点都标记为障碍
          for (let dy = -dilationRadius; dy <= dilationRadius; dy++) {
            for (let dx = -dilationRadius; dx <= dilationRadius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                dilatedGrid[ny][nx] = 1;
              }
            }
          }
        }
      }
    }

    // 对排除膨胀的完全可通行区域，恢复为可通行
    for (const zone of zones) {
      if (passableLabels.has(zone.label)) {
        for (let dx = 0; dx < zone.width; dx++) {
          for (let dy = 0; dy < zone.height; dy++) {
            const x = zone.x + dx;
            const y = zone.y + dy;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
              dilatedGrid[y][x] = 0;
            }
          }
        }
      }
    }

    // 对不膨胀但仍为障碍物的区域，恢复为障碍（它们不会被膨胀扩展，但本身不可通行）
    for (const zone of zones) {
      if (noDilationLabels.has(zone.label)) {
        for (let dx = 0; dx < zone.width; dx++) {
          for (let dy = 0; dy < zone.height; dy++) {
            const x = zone.x + dx;
            const y = zone.y + dy;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
              dilatedGrid[y][x] = 1;
            }
          }
        }
      }
    }

    // ===== 地图边界约束：车体不得超出地图边界 =====
    // 车心距离边界必须≥dilationRadius（车体半宽），否则车体部分超出地图
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x < dilationRadius || x >= cols - dilationRadius ||
            y < dilationRadius || y >= rows - dilationRadius) {
          dilatedGrid[y][x] = 1;
        }
      }
    }

    return dilatedGrid;
  }

  return grid;
}

/**
 * 将障碍物列表转换为二维网格（简单版本，无膨胀）
 */
export function createGrid(
  rows: number,
  cols: number,
  obstacles: GridCoord[]
): number[][] {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (const obs of obstacles) {
    if (obs.y >= 0 && obs.y < rows && obs.x >= 0 && obs.x < cols) {
      grid[obs.y][obs.x] = 1;
    }
  }
  return grid;
}
