# Tailwind CSS 快速入门

> 📚 **前置知识**：需要了解基本的 HTML 和 CSS
> ⏱️ **学习时间**：约 1-2 小时
> 🎯 **学习目标**：掌握 Tailwind CSS 的使用，能够快速构建现代化 UI

---

## 目录

1. [什么是 Tailwind CSS？](#1-什么是-tailwind-css)
2. [快速上手](#2-快速上手)
3. [常用类名速查](#3-常用类名速查)
4. [响应式设计](#4-响应式设计)
5. [深色模式](#5-深色模式)
6. [自定义主题](#6-自定义主题)
7. [项目实战解析](#7-项目实战解析)

---

## 1. 什么是 Tailwind CSS？

### 1.1 传统 CSS 的问题

**传统方式**：需要写 CSS 文件，定义类名，再应用到 HTML。

```css
/* style.css */
.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

```html
<div class="card">内容</div>
```

**问题**：
- CSS 文件越来越大，难以维护
- 取名困难（`.card`, `.card2`, `.card-new`...）
- 修改样式需要来回切换文件

### 1.2 Tailwind 的解决方案

**Tailwind 理念**：直接在 HTML 中写样式类名，不用写 CSS。

```html
<div class="bg-white rounded-lg p-4 shadow-md">
  内容
</div>
```

**优势**：
- ✅ 不用取类名
- ✅ 样式直观（看类名就知道样式）
- ✅ 自动响应式
- ✅ 体积小（只打包用到的样式）

**类比**：
- 传统 CSS = 自己做饭（需要准备食材、调料、灶具）
- Tailwind = 点外卖（直接选套餐，快捷方便）

---

## 2. 快速上手

### 2.1 在项目中使用

本项目已经配置好了 Tailwind，直接使用即可。

```typescript
// 在 React 组件中
function MyComponent() {
  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg">
      这是一个蓝色卡片
    </div>
  );
}
```

### 2.2 基本语法

Tailwind 类名格式：`属性-值`

```html
<!-- 背景颜色：bg + 颜色 + 深浅 -->
<div className="bg-blue-500"></div> <!-- 蓝色，深度 500 -->
<div className="bg-red-200"></div>   <!-- 红色，深度 200（浅） -->

<!-- 内边距：p + 方向 + 大小 -->
<div className="p-4"></div>    <!-- 四边内边距 1rem -->
<div className="px-4"></div>  <!-- 左右内边距 -->
<div className="py-2"></div>  <!-- 上下内边距 -->

<!-- 文字大小：text + 大小 -->
<div className="text-sm"></div>  <!-- 小字 -->
<div className="text-lg"></div>  <!-- 大字 -->
```

---

## 3. 常用类名速查

### 3.1 布局

```html
<!-- Flex 布局 -->
<div className="flex">                    <!-- display: flex -->
<div className="flex justify-center">     <!-- 水平居中 -->
<div className="flex items-center">       <!-- 垂直居中 -->
<div className="flex flex-col">           <!-- 垂直排列 -->

<!-- Grid 布局 -->
<div className="grid grid-cols-3">       <!-- 3 列网格 -->
<div className="grid grid-cols-2 gap-4"> <!-- 2 列，间距 1rem -->

<!-- 间距 -->
<div className="m-4">                   <!-- margin: 1rem -->
<div className="mt-8">                  <!-- margin-top: 2rem -->
<div className="p-4">                   <!-- padding: 1rem -->
```

### 3.2 尺寸

```html
<!-- 宽度 -->
<div className="w-full"></div>   <!-- width: 100% -->
<div className="w-1/2"></div>   <!-- width: 50% -->
<div className="w-64"></div>     <!-- width: 16rem (256px) -->

<!-- 高度 -->
<div className="h-screen"></div> <!-- height: 100vh -->
<div className="h-32"></div>     <!-- height: 8rem (128px) -->

<!-- 最小/最大尺寸 -->
<div className="min-h-screen"></div> <!-- min-height: 100vh -->
<div className="max-w-md"></div>     <!-- max-width: 28rem -->
```

### 3.3 颜色

```html
<!-- 背景色 -->
<div className="bg-white"></div>      <!-- 白色 -->
<div className="bg-gray-100"></div>   <!-- 浅灰色 -->
<div className="bg-blue-500"></div>   <!-- 蓝色 -->
<div className="bg-red-500"></div>    <!-- 红色 -->

<!-- 文字颜色 -->
<div className="text-white"></div>
<div className="text-gray-800"></div>
<div className="text-blue-600"></div>

<!-- 边框颜色 -->
<div className="border border-gray-300"></div>
```

**颜色深度说明**：
- `50` ~ `100`：很浅
- `200` ~ `300`：浅
- `400` ~ `500`：**标准**（最常用）
- `600` ~ `700`：深
- `800` ~ `900`：很深

### 3.4 边框和阴影

```html
<!-- 圆角 -->
<div className="rounded"></div>      <!-- border-radius: 0.25rem -->
<div className="rounded-lg"></div>   <!-- border-radius: 0.5rem -->
<div className="rounded-full"></div> <!-- 圆形 -->

<!-- 阴影 -->
<div className="shadow"></div>      <!-- 标准阴影 -->
<div className="shadow-md"></div>    <!-- 中等阴影 -->
<div className="shadow-lg"></div>    <!-- 大阴影 -->
<div className="shadow-none"></div>   <!-- 无阴影 -->
```

### 3.5 交互状态

```html
<!-- Hover 状态（鼠标悬停） -->
<button className="bg-blue-500 hover:bg-blue-600">
  鼠标悬停时颜色变深
</button>

<!-- Focus 状态（获得焦点） -->
<input className="border focus:border-blue-500 focus:outline-none" />

<!-- Active 状态（点击时） -->
<button className="active:bg-blue-700">点击时颜色更深</button>

<!-- Disabled 状态（禁用） -->
<button className="disabled:opacity-50" disabled>禁用状态</button>
```

---

## 4. 响应式设计

### 4.1 断点前缀

Tailwind 使用**断点前缀**实现响应式：

| 前缀 | 最小宽度 | 说明 |
|------|---------|------|
|（无）| 0px | 默认（手机） |
| `sm:` | 640px | 平板（竖屏） |
| `md:` | 768px | 平板（横屏） |
| `lg:` | 1024px | 笔记本 |
| `xl:` | 1280px | 台式机 |

### 4.2 使用示例

```html
<!-- 手机：1 列，平板：2 列，笔记本：3 列 -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>项目 1</div>
  <div>项目 2</div>
  <div>项目 3</div>
</div>

<!-- 手机：隐藏，平板：显示 -->
<div className="hidden md:block">
  这段文字在手机上隐藏，平板上显示
</div>

<!-- 手机：小字，台式机：大字 -->
<div className="text-sm lg:text-lg">
  响应式文字大小
</div>
```

**记忆技巧**：
- 断点前缀 = 在这个宽度**及以上**生效
- `md:text-lg` = 在 768px 及以上的屏幕显示大字

---

## 5. 深色模式

### 5.1 启用深色模式

本项目已配置深色模式（`tailwind.config.js`）：

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 使用 class 策略
  // ...
}
```

### 5.2 使用深色模式

```html
<!-- 浅色模式：白底黑字 -->
<!-- 深色模式：深灰底白字 -->
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  自动适配浅色/深色模式
</div>

<!-- 卡片示例 -->
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
    标题
  </h2>
  <p className="text-gray-600 dark:text-gray-300">
    内容
  </p>
</div>
```

**原理**：
- 在 `<html>` 标签上添加 `class="dark"`
- `dark:` 前缀的类名在 `.dark` 下生效

---

## 6. 自定义主题

### 6.1 扩展颜色

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': '#667eea', // 自定义主色
      }
    }
  }
}
```

使用：

```html
<div className="bg-primary text-white">
  使用自定义颜色
</div>
```

### 6.2 扩展间距

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '128': '32rem', // 自定义间距
      }
    }
  }
}
```

使用：

```html
<div className="w-128 h-128">
  自定义尺寸
</div>
```

---

## 7. 项目实战解析

### 7.1 项目中的 Tailwind 使用

在 `ControlPanel.tsx` 中，我们使用 Tailwind 构建控制面板：

```typescript
// 控制面板容器
<div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">

  {/* 标题 */}
  <h2 className="text-lg font-bold text-gray-800 dark:text-white px-4 py-3 border-b">
    路径规划控制
  </h2>

  {/* 按钮 */}
  <button
    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
    onClick={handleClick}
  >
    开始规划
  </button>
</div>
```

### 7.2 常用组合

#### 卡片样式

```html
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <!-- 内容 -->
</div>
```

#### 按钮样式

```html
<!-- 主要按钮 -->
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
  主要按钮
</button>

<!-- 次要按钮 -->
<button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors">
  次要按钮
</button>

<!-- 危险按钮 -->
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
  删除
</button>
```

#### 输入框样式

```html
<input
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
             bg-white dark:bg-gray-800 text-gray-800 dark:text-white
             focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
/>
```

### 7.3 技巧总结

✅ **多用 `flex` 布局**：简单直观
✅ **善用 `hover:` 和 `focus:`**：提升交互体验
✅ **深色模式用 `dark:`**：一键适配
✅ **响应式用断点前缀**：`sm:`, `md:`, `lg:`
❌ **不要写自定义 CSS**：尽量用 Tailwind 类名

---

## 总结

✅ **你已经学会了**：
- Tailwind 的基本概念和优势
- 常用类名（布局、颜色、间距、边框）
- 响应式设计和深色模式
- 在项目中使用 Tailwind

🎯 **下一步**：
- 阅读项目源码，观察 Tailwind 类名的使用
- 尝试修改组件样式（改颜色、间距、圆角等）
- 使用 [Tailwind Play](https://play.tailwindcss.com/) 在线练习

📚 **扩展阅读**：
- [Tailwind 官方文档](https://tailwindcss.com/docs)
- [Tailwind UI 组件库](https://tailwindui.com/)（付费，但很值得参考）

---

## 附录：类名速查表

### 间距（Spacing）

| 类名 | 值 | 说明 |
|------|-----|------|
| `m-4` | 1rem | margin: 1rem |
| `p-4` | 1rem | padding: 1rem |
| `mt-8` | 2rem | margin-top: 2rem |
| `px-4` | 1rem | padding-left + padding-right: 1rem |

### 颜色（Colors）

| 类名 | 说明 |
|------|------|
| `bg-gray-100` | 浅灰色背景 |
| `bg-blue-500` | 蓝色背景（标准） |
| `text-white` | 白色文字 |
| `border-red-500` | 红色边框 |

### 响应式（Responsive）

| 前缀 | 宽度 | 说明 |
|------|------|------|
|（无）| 0px | 手机 |
| `sm:` | 640px | 平板（竖屏） |
| `md:` | 768px | 平板（横屏） |
| `lg:` | 1024px | 笔记本 |
| `xl:` | 1280px | 台式机 |
