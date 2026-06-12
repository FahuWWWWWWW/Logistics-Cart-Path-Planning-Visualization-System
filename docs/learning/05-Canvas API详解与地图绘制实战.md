# Canvas API 详解与地图绘制实战

> 📚 **前置知识**：需要了解基本的 JavaScript 和 HTML
> ⏱️ **学习时间**：约 2-3 小时
> 🎯 **学习目标**：掌握 Canvas 绘图 API，能够绘制网格地图、路径、动画

---

## 目录

1. [Canvas 基础概念](#1-canvas-基础概念)
2. [绘制几何图形](#2-绘制几何图形)
3. [绘制文本和图像](#3-绘制文本和图像)
4. [动画与交互](#4-动画与交互)
5. [实战：绘制网格地图](#5-实战绘制网格地图)
6. [性能优化](#6-性能优化)
7. [项目实战解析](#7-项目实战解析)

---

## 1. Canvas 基础概念

### 1.1 什么是 Canvas？

**Canvas（画布）** 是 HTML5 提供的一个用于绘制图形的元素。就像一个真正的画布，你可以用 JavaScript 在上面画任何东西。

**类比**：
- HTML 元素 = 一张白纸
- Canvas = 一个绘图板
- JavaScript = 你的手（拿着画笔）

### 1.2 创建 Canvas

```html
<!-- 创建一个 800x600 的画布 -->
<canvas id="myCanvas" width="800" height="600"></canvas>
```

**重要概念**：
- `width` 和 `height` 属性决定画布的真实像素大小
- CSS 的 `width` 和 `height` 只是显示大小，不会改变画布分辨率
- **推荐**：用 JavaScript 动态设置画布大小（支持 HiDPI 屏幕）

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d'); // 获取绘图上下文

// 支持高清屏幕（避免模糊）
const dpr = window.devicePixelRatio || 1;
canvas.width = 800 * dpr;
canvas.height = 600 * dpr;
ctx.scale(dpr, dpr); // 缩放绘图上下文
```

### 1.3 坐标系

Canvas 使用**笛卡尔坐标系**：
- 原点 `(0, 0)` 在**左上角**
- X 轴向右为正
- Y 轴向下为正

```
(0,0) ──────→ X 轴正方向
  │
  │
  │
  ↓
 Y 轴正方向
```

**类比**：就像数学坐标系，但是 Y 轴方向反了（向下为正）。

---

## 2. 绘制几何图形

### 2.1 绘制矩形

```javascript
// 方法一：fillRect() 和 strokeRect()
ctx.fillStyle = 'blue'; // 填充颜色
ctx.fillRect(10, 10, 100, 50); // (x, y, width, height)

ctx.strokeStyle = 'red'; // 边框颜色
ctx.lineWidth = 3; // 边框宽度
ctx.strokeRect(10, 10, 100, 50);

// 方法二：先描述路径，再绘制
ctx.beginPath(); // 开始新路径
ctx.rect(120, 10, 100, 50); // 描述矩形路径
ctx.fill(); // 填充
ctx.stroke(); // 描边
```

**参数说明**：
- `x, y`：矩形左上角坐标
- `width, height`：矩形宽高

### 2.2 绘制线条

```javascript
ctx.beginPath(); // 开始路径
ctx.moveTo(10, 100); // 移动到起点 (x, y)
ctx.lineTo(110, 100); // 画直线到 (x, y)
ctx.lineTo(110, 150); // 再画一条直线
ctx.stroke(); // 描边（显示线条）
```

**重要方法**：
- `moveTo(x, y)`：抬笔移动到某点（不画线）
- `lineTo(x, y)`：从当前点画直线到目标点
- `closePath()`：闭合路径（从当前点画直线回到起点）

### 2.3 绘制圆形和弧线

```javascript
ctx.beginPath();
ctx.arc(200, 200, 50, 0, Math.PI * 2); // (圆心x, 圆心y, 半径, 起始角度, 结束角度)
ctx.fill();

// 绘制半圆
ctx.beginPath();
ctx.arc(300, 200, 50, 0, Math.PI); // 从 0 到 π（180度）
ctx.stroke();
```

**角度说明**：
- `0` = 右边（3 点钟方向）
- `Math.PI / 2` = 下边（6 点钟方向）
- `Math.PI` = 左边（9 点钟方向）
- `Math.PI * 2` = 一圈（360度）

### 2.4 绘制虚线

```javascript
ctx.setLineDash([5, 3]); // 虚线模式：[实线长度, 空白长度]
ctx.beginPath();
ctx.moveTo(10, 300);
ctx.lineTo(200, 300);
ctx.stroke();

ctx.setLineDash([]); // 恢复实线
```

---

## 3. 绘制文本和图像

### 3.1 绘制文本

```javascript
ctx.font = 'bold 20px Arial'; // 设置字体
ctx.fillStyle = 'black'; // 填充颜色（实心文字）
ctx.strokeStyle = 'red'; // 描边颜色（空心文字）

// 绘制实心文字
ctx.fillText('Hello Canvas', 10, 400);

// 绘制空心文字
ctx.strokeText('Hello Canvas', 10, 430);

// 文字对齐方式
ctx.textAlign = 'center'; // 水平对齐：left | center | right
ctx.textBaseline = 'middle'; // 垂直对齐：top | middle | bottom
ctx.fillText('居中文字', 400, 400);
```

**重要属性**：
- `font`：字体样式（和 CSS 的 `font` 属性一样）
- `textAlign`：水平对齐
- `textBaseline`：垂直对齐

### 3.2 给文字添加描边（防模糊）

在项目中，我们经常需要让文字更清晰（尤其是小字）：

```javascript
function drawLabel(text, x, y, font, fillColor, strokeColor) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 先画描边（让文字更清晰）
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round'; // 圆角连接
    ctx.strokeText(text, x, y);
  }
  
  // 再画填充
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

// 使用
drawLabel('启停区', 100, 100, 'bold 14px Arial', 'black', 'white');
```

**效果**：白色描边 + 黑色填充 = 文字在任何背景上都清晰可见。

### 3.3 绘制图像

```javascript
const img = new Image();
img.src = 'car.png';
img.onload = () => {
  // 绘制图像
  ctx.drawImage(img, 10, 10); // 原尺寸绘制
  ctx.drawImage(img, 10, 10, 50, 50); // 缩放绘制 (x, y, width, height)
};
```

**参数说明**：
- `img`：图像对象
- `x, y`：绘制位置
- `width, height`：缩放后的宽高

---

## 4. 动画与交互

### 4.1 动画原理

Canvas 动画的原理：**不断清除画布 → 重新绘制**。

```javascript
let x = 0;

function animate() {
  // 1. 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. 更新位置
  x += 1;
  
  // 3. 重新绘制
  ctx.fillRect(x, 100, 50, 50);
  
  // 4. 请求下一帧
  requestAnimationFrame(animate);
}

animate(); // 开始动画
```

**重要函数**：
- `clearRect(x, y, width, height)`：清除指定矩形区域
- `requestAnimationFrame(callback)`：请求浏览器在下一帧执行回调（约 60fps）

### 4.2 鼠标交互

```javascript
canvas.addEventListener('mousemove', (e) => {
  // 获取鼠标在画布上的坐标
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  console.log(`鼠标位置：(${x}, ${y})`);
});

// 判断鼠标是否点击了某个区域
canvas.addEventListener('click', (e) => {
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 判断是否在矩形内
  if (x >= 10 && x <= 110 && y >= 10 && y <= 60) {
    console.log('点击了矩形！');
  }
});
```

---

## 5. 实战：绘制网格地图

### 5.1 需求分析

我们要绘制一个 48×48 的网格地图（每格 50×50mm），包含：
- 网格线
- 坐标标注
- 区域填充（启停区、作业区等）

### 5.2 代码实现

```javascript
const GRID_SIZE = 48; // 网格大小
const CELL_SIZE = 50; // 每格像素大小

function drawGrid() {
  // 1. 绘制网格线
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= GRID_SIZE; i++) {
    // 竖线
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    ctx.stroke();
    
    // 横线
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
    ctx.stroke();
  }
  
  // 2. 绘制坐标标注
  ctx.fillStyle = '#666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  
  for (let i = 0; i < GRID_SIZE; i++) {
    // 横坐标 (0, 1, 2, ...)
    ctx.fillText(i, i * CELL_SIZE + CELL_SIZE / 2, GRID_SIZE * CELL_SIZE + 15);
    
    // 纵坐标 (0, 1, 2, ...)
    ctx.fillText(i, -15, i * CELL_SIZE + CELL_SIZE / 2);
  }
}

// 调用
drawGrid();
```

### 5.3 绘制区域

```javascript
function drawZone(x, y, width, height, color, label) {
  // 填充区域
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, width * CELL_SIZE, height * CELL_SIZE);
  
  // 绘制边框
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, width * CELL_SIZE, height * CELL_SIZE);
  
  // 绘制标签
  ctx.fillStyle = 'black';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    label,
    (x + width / 2) * CELL_SIZE,
    (y + height / 2) * CELL_SIZE
  );
}

// 绘制启停区 (假设在左上角，5×5 格)
drawZone(0, 0, 5, 5, 'rgba(0, 255, 0, 0.3)', '启停区');
```

---

## 6. 性能优化

### 6.1 避免重复绘制

**问题**：每一帧都重新绘制所有内容，性能差。

**解决方案**：只绘制变化的部分。

```javascript
// ❌ 错误：每一帧都绘制整个地图
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(); // 网格没变，不需要每一帧都画
  drawCar();
  requestAnimationFrame(animate);
}

// ✅ 正确：分层绘制
const gridCanvas = document.createElement('canvas'); // 离屏画布
const gridCtx = gridCanvas.getContext('2d');
drawGrid(gridCtx); // 只画一次

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(gridCanvas, 0, 0); // 直接复制
  drawCar();
  requestAnimationFrame(animate);
}
```

### 6.2 使用 `requestAnimationFrame`

**不要用 `setInterval` 或 `setTimeout` 做动画**！

```javascript
// ❌ 错误
setInterval(() => {
  // 动画代码
}, 16); // 试图达到 60fps

// ✅ 正确
requestAnimationFrame(animate); // 浏览器自动优化帧率
```

### 6.3 批量绘制

```javascript
// ❌ 错误：每次循环都绘制
for (let i = 0; i < 1000; i++) {
  ctx.fillRect(i, i, 1, 1);
}

// ✅ 正确：使用 Path2D 批量绘制
const path = new Path2D();
for (let i = 0; i < 1000; i++) {
  path.rect(i, i, 1, 1);
}
ctx.fill(path); // 一次绘制
```

---

## 7. 项目实战解析

### 7.1 项目中的 Canvas 使用

在 `GridMap.tsx` 中，我们使用 Canvas 绘制比赛场地：

```typescript
// 获取 Canvas 上下文
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');

// 绘制网格
const drawGrid = () => {
  ctx.strokeStyle = theme === 'dark' ? '#444' : '#ddd';
  for (let i = 0; i <= GRID_SIZE; i++) {
    // 竖线
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, GRID_SIZE * cellSize);
    ctx.stroke();
    // ...
  }
};

// 绘制小车
const drawCart = (x: number, y: number, angle: number) => {
  ctx.save(); // 保存当前状态
  ctx.translate(x, y); // 平移到小车位置
  ctx.rotate(angle); // 旋转（车头方向）
  
  // 绘制车身
  ctx.fillStyle = 'blue';
  ctx.fillRect(-15, -15, 30, 30);
  
  ctx.restore(); // 恢复状态
};
```

### 7.2 关键技巧

#### 技巧一：坐标系转换

物理坐标（mm）→ 画布坐标（px）：

```typescript
const toPixel = (mm: number) => mm / 50 * cellSize; // 每格 50mm
```

#### 技巧二：双缓冲技术

避免画面闪烁：

```typescript
const offscreen = document.createElement('canvas'); // 离屏画布
const offCtx = offscreen.getContext('2d');

// 在离屏画布上绘制
drawEverything(offCtx);

// 一次性复制到屏幕
ctx.drawImage(offscreen, 0, 0);
```

#### 技巧三：响应式缩放

```typescript
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  drawEverything(); // 重新绘制
}

window.addEventListener('resize', resizeCanvas);
```

---

## 总结

✅ **你已经学会了**：
- Canvas 基础概念和坐标系
- 绘制矩形、线条、圆形、文本
- 实现动画和交互
- 绘制网格地图
- 性能优化技巧

🎯 **下一步**：
- 阅读项目源码 `src/components/GridMap.tsx`
- 尝试修改地图颜色、添加新区域
- 实现小车的平滑移动动画

📚 **扩展阅读**：
- [MDN Canvas 教程](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial)
- [Canvas 性能优化](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
