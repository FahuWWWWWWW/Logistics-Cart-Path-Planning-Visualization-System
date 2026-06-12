# React + TypeScript 实战指南

> 本文档结合实际项目代码，讲解 React 和 TypeScript 的核心概念和实战技巧。

---

## 📚 目录

1. [React 核心概念](#1-react-核心概念)
2. [TypeScript 在 React 中的应用](#2-typescript-在-react-中的应用)
3. [项目代码解析](#3-项目代码解析)
4. [常见问题与解决方案](#4-常见问题与解决方案)

---

## 1. React 核心概念

### 1.1 组件（Component）

**概念**：组件是 React 应用的基本构建块，可以理解为"自定义的 HTML 标签"。

**示例**：
```tsx
// 定义一个组件
function Welcome() {
    return <h1>你好，世界！</h1>;
}

// 使用组件
<Welcome />
```

**实际项目中的组件**（`src/components/GridMap.tsx`）：
```tsx
export default function GridMap() {
    return (
        <div>
            {/* 地图内容 */}
        </div>
    );
}
```

### 1.2 状态（State）

**概念**：状态是组件内部的数据，当状态改变时，组件会自动重新渲染。

**示例**：
```tsx
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);  // 声明状态
    
    return (
        <div>
            <p>计数：{count}</p>
            <button onClick={() => setCount(count + 1)}>
                点击 +1
            </button>
        </div>
    );
}
```

**实际项目中的状态**（`src/App.tsx`）：
```tsx
const [serialState, setSerialState] = useState<SerialState>({
    isConnected: false,
    baudRate: 115200,
    // ...
});
```

### 1.3 属性（Props）

**概念**：属性是组件之间传递数据的方式，类似于函数的参数。

**示例**：
```tsx
// 父组件
function App() {
    return <Welcome name="张三" />;
}

// 子组件
function Welcome(props) {
    return <h1>你好，{props.name}！</h1>;
}
```

**使用 TypeScript 定义 Props**：
```tsx
interface WelcomeProps {
    name: string;
    age?: number;   // 可选属性
}

function Welcome(props: WelcomeProps) {
    return <h1>你好，{props.name}！</h1>;
}
```

### 1.4 事件处理

**概念**：React 使用驼峰命名法绑定事件。

**示例**：
```tsx
function Button() {
    const handleClick = () => {
        alert('按钮被点击了！');
    };
    
    return <button onClick={handleClick}>点击我</button>;
}
```

### 1.5 条件渲染

**概念**：根据条件显示不同的内容。

**示例**：
```tsx
function Greeting(props) {
    const isLoggedIn = props.isLoggedIn;
    
    if (isLoggedIn) {
        return <h1>欢迎回来！</h1>;
    } else {
        return <h1>请登录</h1>;
    }
}
```

**简写方式（推荐）**：
```tsx
function Greeting(props) {
    return (
        <h1>
            {props.isLoggedIn ? '欢迎回来！' : '请登录'}
        </h1>
    );
}
```

### 1.6 列表渲染

**概念**：使用 `map()` 方法渲染列表。

**示例**：
```tsx
function NumberList() {
    const numbers = [1, 2, 3, 4, 5];
    
    return (
        <ul>
            {numbers.map((number, index) => (
                <li key={index}>{number}</li>
            ))}
        </ul>
    );
}
```

**注意**：列表项需要 `key` 属性，帮助 React 识别哪些元素改变了。

---

## 2. TypeScript 在 React 中的应用

### 2.1 类型注解

**概念**：为变量、函数参数、返回值等添加类型约束。

**示例**：
```tsx
interface User {
    name: string;
    age: number;
    email?: string;   // 可选
}

function UserProfile(props: { user: User }) {
    return (
        <div>
            <p>姓名：{props.user.name}</p>
            <p>年龄：{props.user.age}</p>
        </div>
    );
}
```

### 2.2 状态类型

**示例**：
```tsx
interface CounterState {
    count: number;
    step: number;
}

function Counter() {
    const [state, setState] = useState<CounterState>({
        count: 0,
        step: 1
    });
    
    return (
        <div>
            <p>计数：{state.count}</p>
            <button onClick={() => setState({ ...state, count: state.count + state.step })}>
                +{state.step}
            </button>
        </div>
    );
}
```

### 2.3 事件类型

**示例**：
```tsx
function Input() {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.value);
    };
    
    return <input type="text" onChange={handleChange} />;
}
```

**常用事件类型**：
- `React.ChangeEvent<HTMLInputElement>`：输入框变化事件
- `React.MouseEvent<HTMLButtonElement>`：按钮点击事件
- `React.FormEvent<HTMLFormElement>`：表单提交事件

---

## 3. 项目代码解析

### 3.1 入口文件（`src/main.tsx`）

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

**关键点**：
- `ReactDOM.createRoot()`：创建根节点
- `document.getElementById('root')`：获取 HTML 中的 `<div id="root">`
- `<App />`：渲染 App 组件

### 3.2 主应用组件（`src/App.tsx`）

```tsx
function App() {
    // 状态管理
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [serialState, setSerialState] = useState<SerialState>({ ... });
    
    return (
        <div className={theme === 'dark' ? 'dark' : ''}>
            <GridMap />
            <ControlPanel />
            <SerialPanel />
        </div>
    );
}
```

**关键点**：
- 使用 `useState` 管理多个状态
- 通过 props 将状态传递给子组件

### 3.3 地图组件（`src/components/GridMap.tsx`）

**核心功能**：
1. 使用 Canvas API 绘制网格地图
2. 显示小车位置和路径
3. 处理用户点击事件

**简化代码示例**：
```tsx
export default function GridMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // 绘制地图
    const drawMap = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // 绘制网格
        for (let i = 0; i < 48; i++) {
            for (let j = 0; j < 48; j++) {
                ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    };
    
    // 组件加载时绘制
    useEffect(() => {
        drawMap();
    }, []);
    
    return <canvas ref={canvasRef} width={1200} height={1200} />;
}
```

### 3.4 控制面板组件（`src/components/ControlPanel.tsx`）

**核心功能**：
1. 提供按钮和输入框供用户操作
2. 调用路径规划算法
3. 显示规划结果

**简化代码示例**：
```tsx
export default function ControlPanel() {
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [end, setEnd] = useState({ x: 47, y: 47 });
    
    const handlePlanPath = () => {
        const path = aStar(start, end);
        // 显示路径
    };
    
    return (
        <div>
            <input
                type="number"
                value={start.x}
                onChange={(e) => setStart({ ...start, x: Number(e.target.value) })}
            />
            <button onClick={handlePlanPath}>规划路径</button>
        </div>
    );
}
```

---

## 4. 常见问题与解决方案

### 4.1 状态不更新

**问题**：调用 `setState` 后，状态没有立即更新。

**原因**：React 的状态更新是异步的。

**解决方案**：
```tsx
const [count, setCount] = useState(0);

// 错误写法
setCount(count + 1);
console.log(count);   // 还是旧值

// 正确写法
setCount(prevCount => prevCount + 1);
```

### 4.2 组件不重新渲染

**问题**：状态改变了，但组件没有重新渲染。

**原因**：直接修改状态对象，而不是创建新的对象。

**解决方案**：
```tsx
const [user, setUser] = useState({ name: '张三', age: 25 });

// 错误写法
user.age = 26;
setUser(user);   // React 认为状态没有变化，不会重新渲染

// 正确写法
setUser({ ...user, age: 26 });   // 创建新对象
```

### 4.3 TypeScript 类型错误

**问题**：TypeScript 报错，说类型不匹配。

**解决方案**：
1. 检查接口定义是否正确
2. 使用类型断言（不推荐）
   ```tsx
   const value = someValue as string;
   ```
3. 使用类型守卫（推荐）
   ```tsx
   if (typeof someValue === 'string') {
       // 这里 someValue 被推断为 string
   }
   ```

---

## 📝 总结

**关键点回顾**：
1. React 的核心是**组件**、**状态**、**属性**
2. TypeScript 让 React 开发更安全、更友好
3. 多写代码、多调试，才能熟练掌握

**下一步行动**：
1. 阅读本项目的源代码
2. 尝试修改功能、添加新功能
3. 遇到问题多查文档、多问人

祝你学习顺利！🎉
