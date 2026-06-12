# 串口通信与 Web Serial API 入门

> 本文档讲解串口通信的基础知识，以及如何在浏览器中使用 Web Serial API 与硬件设备通信。

---

## 📚 目录

1. [什么是串口通信？](#1-什么是串口通信)
2. [串口通信基础](#2-串口通信基础)
3. [Web Serial API 入门](#3-web-serial-api-入门)
4. [项目中的串口通信](#4-项目中的串口通信)
5. [常见问题与解决方案](#5-常见问题与解决方案)

---

## 1. 什么是串口通信？

### 1.1 简单理解

**串口通信** = 电脑与硬件设备之间的"对话"方式

想象一下：
- 电脑 = 人
- 硬件设备（如 Arduino、STM32）= 另一个人
- 串口 = 两个人之间的对讲机

通过串口，电脑可以：
- 发送指令给硬件设备（如"前进"、"停止"）
- 接收硬件设备的数据（如"当前位置"、"传感器数据"）

### 1.2 常见应用场景

- ** Arduino / STM32 开发**：电脑给开发板烧录程序
- **物联网设备**：树莓派与传感器通信
- **工业控制**：电脑控制机器人、CNC 机床
- **本项目**：电脑与物流小车通信

---

## 2. 串口通信基础

### 2.1 串口参数

串口通信需要设置以下参数（双方必须一致）：

| 参数 | 含义 | 常用值 |
|------|------|--------|
| **波特率（Baud Rate）** | 通信速度 | 9600、115200 |
| **数据位（Data Bits）** | 每个字节的位数 | 8（常用） |
| **停止位（Stop Bits）** | 停止信号的位数 | 1（常用） |
| **校验位（Parity）** | 错误检查 | none（常用） |

**示例**：
```
波特率：115200
数据位：8
停止位：1
校验位：none
```

### 2.2 串口硬件

**常见接口**：
- **USB 转串口**：电脑通过 USB 连接硬件（如 CP2102、CH340 芯片）
- **GPIO 串口**：树莓派的 GPIO 引脚（TX、RX）

**接线方式**：
```
电脑 USB 口  --->  USB 转串口模块  --->  硬件设备（TX、RX）
```

**注意**：TX（发送）和 RX（接收）要交叉连接：
- 电脑的 TX 连硬件的 RX
- 电脑的 RX 连硬件的 TX

---

## 3. Web Serial API 入门

### 3.1 什么是 Web Serial API？

**Web Serial API** 是浏览器提供的一个 API，允许网页直接访问串口设备。

**优势**：
- 无需安装驱动或插件
- 在浏览器中直接通信
- 跨平台（Windows、Mac、Linux）

**限制**：
- 需要 HTTPS 或 localhost（安全限制）
- 目前仅 Chrome、Edge 支持

### 3.2 基本用法

**步骤一：请求串口权限**
```javascript
// 请求用户选择串口
const port = await navigator.serial.requestPort();

// 打开串口
await port.open({
    baudRate: 115200,   // 波特率
    dataBits: 8,        // 数据位
    stopBits: 1,        // 停止位
    parity: 'none'      // 校验位
});
```

**步骤二：发送数据**
```javascript
const writer = port.writable.getWriter();

// 发送字符串
const data = 'Hello, World!\n';
const encoder = new TextEncoder();
const encodedData = encoder.encode(data);
await writer.write(encodedData);

writer.releaseLock();
```

**步骤三：接收数据**
```javascript
const reader = port.readable.getReader();
const decoder = new TextDecoder();

while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    console.log('收到数据：', text);
}

reader.releaseLock();
```

**步骤四：关闭串口**
```javascript
await port.close();
```

---

## 4. 项目中的串口通信

### 4.1 串口管理类（`src/utils/serial.ts`）

本项目封装了一个 `SerialManager` 类，简化串口操作。

**核心方法**：

```typescript
class SerialManager {
    // 连接串口
    async connect(config: SerialState): Promise<void> {
        this.port = await navigator.serial.requestPort();
        await this.port.open({ ... });
    }
    
    // 断开串口
    async disconnect(): Promise<void> {
        await this.port.close();
    }
    
    // 发送数据
    async send(data: string): Promise<void> {
        const writer = this.port.writable.getWriter();
        await writer.write(new TextEncoder().encode(data));
        writer.releaseLock();
    }
    
    // 开始读取数据
    private async startReading(): Promise<void> {
        const reader = this.port.readable.getReader();
        while (this.isReading) {
            const { value, done } = await reader.read();
            // 处理接收到的数据
        }
    }
}
```

### 4.2 协议帧格式

本项目使用 JSON 格式的协议帧：

**发送帧**（电脑 → 硬件）：
```json
{
    "ver": "1.0.0",
    "type": "START",
    "seq": 1,
    "ts": 1000,
    "data": {
        "parking": 1,
        "task_mode": "auto"
    }
}
```

**接收帧**（硬件 → 电脑）：
```json
{
    "ver": "1.0.0",
    "type": "STATUS",
    "seq": 1,
    "ts": 1000,
    "data": {
        "x": 100,
        "y": 200,
        "status": "running"
    }
}
```

### 4.3 使用示例

**连接串口**：
```typescript
const serialManager = new SerialManager();

// 注册回调
serialManager.onStatusChange((connected) => {
    console.log('连接状态：', connected);
});

serialManager.onLog((entry) => {
    console.log('日志：', entry);
});

// 连接
await serialManager.connect({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
});
```

**发送指令**：
```typescript
// 发送启动指令
await serialManager.sendStart(1, 'auto');

// 发送设置目标坐标指令
await serialManager.sendSetTarget(100, 200);
```

**接收数据**：
```typescript
serialManager.onProtocolFrame((frame) => {
    console.log('收到协议帧：', frame);
    
    if (frame.type === 'STATUS') {
        // 处理状态数据
        const { x, y, status } = frame.data;
        console.log(`小车位置：(${x}, ${y})，状态：${status}`);
    }
});
```

---

## 5. 常见问题与解决方案

### 5.1 浏览器不支持 Web Serial API

**问题**：代码报错 `navigator.serial is undefined`。

**原因**：浏览器不支持或版本太旧。

**解决方案**：
1. 使用 Chrome 89+ 或 Edge 89+
2. 在地址栏输入 `chrome://flags`，启用 `#enable-experimental-web-platform-features`

### 5.2 无法访问串口（权限错误）

**问题**：代码报错 `Permission denied`。

**原因**：用户没有授权或浏览器安全限制。

**解决方案**：
1. 确保使用 HTTPS 或 localhost
2. 确保用户主动点击按钮触发 `requestPort()`（不能自动调用）
3. 检查操作系统权限（如 Linux 下需要将用户加入 `dialout` 组）

### 5.3 数据接收不完整

**问题**：接收的数据被截断或乱码。

**原因**：串口数据是流式的，可能分多次接收。

**解决方案**：使用缓冲区拼接数据

```typescript
private async startReading(): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (this.isReading) {
        const { value, done } = await this.reader.read();
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 按换行符分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';   // 保留最后不完整的行
        
        for (const line of lines) {
            console.log('完整数据：', line);
        }
    }
}
```

### 5.4 串口设备不显示

**问题**：调用 `requestPort()` 后，弹出的对话框中没有串口设备。

**原因**：
1. 设备没有正确连接
2. 驱动没有安装
3. 设备被其他程序占用

**解决方案**：
1. 检查设备管理器（Windows）或 `ls /dev/tty*` （Linux/Mac），确认设备存在
2. 安装正确的驱动（如 CP2102 驱动）
3. 关闭可能占用串口的程序（如 Arduino IDE、串口调试助手）

---

## 📝 总结

**关键点回顾**：
1. 串口通信是电脑与硬件设备通信的重要方式
2. Web Serial API 让网页可以直接访问串口
3. 本项目封装了 `SerialManager` 类，简化串口操作
4. 使用 JSON 格式的协议帧进行数据交换

**下一步行动**：
1. 准备一个串口设备（如 Arduino）
2. 运行本项目的串口通信功能
3. 尝试发送和接收数据

祝你学习顺利！🎉
