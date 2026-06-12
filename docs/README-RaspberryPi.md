# 物流小车路径规划系统 - 树莓派部署指南

## 系统架构说明

```
┌─────────────────────────────────────────────────┐
│             树莓派 (Raspberry Pi)                │
│                                                  │
│  ┌────────────┐      ┌──────────────────────┐  │
│  │   Chromium  │──┼──>│   Node.js 服务器      │  │
│  │   浏览器     │      │   (server.cjs:8899)  │  │
│  │             │      │                      │  │
│  │  Web Serial │      │  静态文件服务         │  │
│  │  API        │      │  (dist/)            │  │
│  └──────┬──────┘      └──────────────────────┘  │
│         │                                        │
│         │ (USB)                                  │
│         v                                        │
│  ┌──────────────┐                               │
│  │  下位机       │  (K230 / STM32 / Arduino)     │
│  │  (串口通信)   │                               │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
```

**关键点：**
- 前端在 Chromium 浏览器中运行
- 通过 **Web Serial API** 直接访问串口（无需后端转发）
- `server.cjs` 只负责提供静态文件服务
- 支持 GPIO 串口 (`/dev/ttyAMA0`) 和 USB 串口 (`/dev/ttyUSB0`)

---

## 一、准备工作

### 1.1 硬件要求
- 树莓派 3B+ / 4B / 5（推荐 4B 以上）
- MicroSD 卡（16GB 以上，推荐 32GB）
- 电源（5V 3A，Type-C）
- 显示器 + HDMI 线（首次配置用，后续可无头模式）
- 串口设备（K230/STM32 开发板）

### 1.2 软件要求
- Raspberry Pi OS（Bullseye 或更新版本）
- Node.js 18+ （ARM 版）
- Chromium 浏览器（Raspberry Pi OS 自带）

---

## 二、快速部署（一键脚本）

将项目拷贝到树莓派后，运行部署脚本：

```bash
# 克隆项目（如果还没有）
git clone https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System.git
cd Logistics-Cart-Path-Planning-Visualization-System

# 赋予脚本执行权限
chmod +x deploy-rpi.sh

# 完整部署（安装依赖 + 构建 + 启动）
./deploy-rpi.sh

# 或分步执行
./deploy-rpi.sh build      # 仅构建前端
./deploy-rpi.sh start      # 仅启动服务器
./deploy-rpi.sh status     # 查看状态
```

---

## 三、手动部署步骤

### 3.1 安装 Node.js

```bash
# 方法一：使用 apt 安装（推荐，简单）
sudo apt update
sudo apt install -y nodejs npm

# 检查版本（需要 18+）
node --version
npm --version

# 如果版本太低，使用 nvm 安装最新版
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 3.2 安装 Chromium

```bash
# Raspberry Pi OS 通常已预装
# 如果没有，手动安装：
sudo apt install -y chromium-browser
```

### 3.3 配置串口权限

```bash
# 将当前用户加入 dialout 组（串口访问权限）
sudo usermod -a -G dialout $USER

# 注销并重新登录（或重启）使权限生效
sudo reboot
```

### 3.4 构建前端

```bash
cd /path/to/project
npm install
npm run build
```

### 3.5 启动服务器

```bash
node server.cjs
# 或指定端口
node server.cjs 8080
```

服务器启动后会自动打开 Chromium 浏览器。

---

## 四、串口配置（树莓派重要）

### 4.1 启用串口（GPIO 串口）

```bash
# 运行配置工具
sudo raspi-config
```

进入菜单：
```
3 Interface Options
  -> I6 Serial Port
    -> 登录 Shell: 否
    -> 硬件串口: 是
```

重启后，GPIO 串口设备出现在 `/dev/ttyAMA0`。

### 4.2 USB 串口（推荐）

如果使用 USB 转串口模块（如 CP2102、CH340），插入后设备通常出现在 `/dev/ttyUSB0`。

```bash
# 查看串口设备
ls -l /dev/ttyUSB* /dev/ttyAMA*
```

### 4.3 在浏览器中选择串口

1. 打开系统网页（`http://localhost:8899`）
2. 点击「串口连接」按钮
3. 在弹出的对话框中选择对应的串口（如 `ttyUSB0` 或 `ttyAMA0`）
4. 点击「连接」

---

## 五、无头模式（Headless）运行

如果树莓派没有显示器，可以通过 SSH 远程访问：

### 5.1 通过 SSH 启动服务器

```bash
# SSH 登录树莓派
ssh pi@树莓派IP

# 启动服务器
cd /path/to/project
./deploy-rpi.sh start
```

### 5.2 在另一台电脑上访问

修改 `server.cjs`，允许局域网访问（已默认 `0.0.0.0`）：

```bash
# 在另一台电脑的浏览器中打开：
http://树莓派IP:8899
```

**注意：** Web Serial API 需要 HTTPS 或 localhost，远程访问时无法使用串口功能。串口连接需要在树莓派本地操作。

### 5.3 触摸屏方案（推荐）

连接 HDMI 触摸屏到树莓派，实现一体化操作：

```bash
# 设置 Chromium 开机自启动（Kiosk 模式）
mkdir -p ~/.config/lxsession/LXDE-pi/
cat > ~/.config/lxsession/LXDE-pi/autostart <<EOF
@chromium-browser --kiosk --disable-infobars http://localhost:8899
EOF
```

---

## 六、开机自启（systemd 服务）

使用部署脚本一键设置：

```bash
./deploy-rpi.sh autostart
```

或手动创建服务：

```bash
sudo tee /etc/systemd/system/logistics-cart.service > /dev/null <<EOF
[Unit]
Description=Logistics Cart Path Planning System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/path-planning-visualization
ExecStart=/usr/bin/node /home/pi/path-planning-visualization/server.cjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable logistics-cart
sudo systemctl start logistics-cart
```

管理服务：

```bash
sudo systemctl status logistics-cart   # 查看状态
sudo systemctl stop logistics-cart      # 停止
sudo systemctl start logistics-cart     # 启动
sudo systemctl restart logistics-cart  # 重启
journalctl -u logistics-cart -f        # 查看日志
```

---

## 七、性能优化（树莓派 3B+ 或更低配置）

### 7.1 提高 GPU 显存

```bash
sudo raspi-config
# 3 Interface Options -> Memory Split -> 设置为 128
```

### 7.2 禁用不必要的服务

```bash
sudo systemctl disable bluetooth
sudo systemctl disable cups
```

### 7.3 使用轻量级浏览器

如果 Chromium 卡顿，可以尝试：

```bash
# 安装 Midori（轻量级浏览器）
sudo apt install -y midori
```

---

## 八、常见问题

### Q1: Web Serial API 不工作
**原因：** Web Serial API 需要 HTTPS 或 localhost。  
**解决：** 必须在树莓派本地浏览器中访问 `http://localhost:8899`（不能用 IP 地址）。

### Q2: 串口无法访问（权限错误）
**原因：** 用户不在 `dialout` 组。  
**解决：**
```bash
sudo usermod -a -G dialout $USER
reboot
```

### Q3: Chromium 无法打开（无头模式）
**原因：** 没有显示器时没有 X11 显示环境。  
**解决：** 使用 Cage（Kiosk 窗口管理器）或安装 Xvfb（虚拟显示）。

### Q4: 构建失败（内存不足）
**原因：** 树莓派内存不足（尤其是 3B+ 1GB 版本）。  
**解决：**
```bash
# 增加交换空间
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# 修改 CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Q5: 服务器启动后无法访问
**原因：** 防火墙阻止端口。  
**解决：**
```bash
# 开放端口
sudo ufw allow 8899
```

---

## 九、文件清单

| 文件 | 说明 |
|------|------|
| `deploy-rpi.sh` | 树莓派部署脚本（一键部署） |
| `server.cjs` | 静态文件服务器（跨平台） |
| `dist/` | 前端构建输出（由 `npm run build` 生成） |
| `README-RaspberryPi.md` | 本文档 |

---

## 十、技术支持

- 项目地址: https://github.com/FahuWWWWWWW/Logistics-Cart-Path-Planning-Visualization-System
- 串口协议文档: 见项目 `docs/` 目录
- 问题反馈: 通过 GitHub Issues
