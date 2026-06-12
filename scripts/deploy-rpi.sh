#!/bin/bash
# ============================================================
#  物流小车路径规划系统 - 树莓派部署脚本
#  ============================================================
#  用法:
#    ./deploy.sh          # 完整部署（安装依赖 + 构建 + 启动）
#    ./deploy.sh build    # 仅构建前端
#    ./deploy.sh start    # 仅启动服务器
#    ./deploy.sh stop     # 停止服务器
#    ./deploy.sh status   # 查看服务器状态
#    ./deploy.sh autostart # 设置开机自启
#  ============================================================

set -e

# ---- 配置 ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
SERVER_PORT=8899
SERVER_SCRIPT="$PROJECT_DIR/server.cjs"
SERVICE_NAME="logistics-cart"
LOG_FILE="$PROJECT_DIR/server.log"

# ---- 颜色输出 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
#  1. 检查系统环境
#  ============================================================
check_env() {
    log_info "检查系统环境..."
    
    # 检查是否为 ARM 架构（树莓派）
    ARCH=$(uname -m)
    if [[ "$ARCH" == arm* ]] || [[ "$ARCH" == aarch64 ]]; then
        log_ok "检测到 ARM 架构 ($ARCH) - 树莓派环境"
    else
        log_warn "非 ARM 架构 ($ARCH)，仍将继续..."
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_warn "Node.js 未安装"
        install_node
    else
        NODE_VER=$(node --version)
        log_ok "Node.js 已安装: $NODE_VER"
    fi
    
    # 检查 Chromium
    if ! command -v chromium-browser &> /dev/null && ! command -v chromium &> /dev/null; then
        log_warn "Chromium 未安装"
        install_chromium
    else
        log_ok "Chromium 已安装"
    fi
    
    # 检查串口权限
    if groups | grep -q dialout; then
        log_ok "当前用户已在 dialout 组（串口权限正常）"
    else
        log_warn "当前用户不在 dialout 组，串口可能无法访问"
        log_info "请运行: sudo usermod -a -G dialout $USER"
        log_info "然后注销并重新登录"
    fi
}

# ============================================================
#  2. 安装 Node.js（树莓派适配）
#  ============================================================
install_node() {
    log_info "正在安装 Node.js..."
    log_info "树莓派 ARM 架构，使用官方脚本安装..."
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_ok "Node.js 安装完成: $(node --version)"
}

# ============================================================
#  3. 安装 Chromium
#  ============================================================
install_chromium() {
    log_info "正在安装 Chromium 浏览器..."
    sudo apt-get update
    sudo apt-get install -y chromium-browser
    log_ok "Chromium 安装完成"
}

# ============================================================
#  4. 安装项目依赖
#  ============================================================
install_deps() {
    log_info "安装项目依赖..."
    cd "$PROJECT_DIR"
    npm install
    log_ok "依赖安装完成"
}

# ============================================================
#  5. 构建前端
#  ============================================================
build_frontend() {
    log_info "构建前端项目..."
    cd "$PROJECT_DIR"
    
    if [ ! -d "node_modules" ]; then
        install_deps
    fi
    
    npm run build
    
    if [ -d "$DIST_DIR" ]; then
        log_ok "前端构建完成: $DIST_DIR"
    else
        log_error "构建失败，dist 目录不存在"
        exit 1
    fi
}

# ============================================================
#  6. 启动服务器
#  ============================================================
start_server() {
    # 检查是否已在运行
    if pgrep -f "node.*server.cjs" > /dev/null; then
        log_warn "服务器已在运行中"
        return
    fi
    
    # 检查 dist 目录
    if [ ! -d "$DIST_DIR" ]; then
        log_warn "dist 目录不存在，先构建前端..."
        build_frontend
    fi
    
    log_info "启动服务器（端口 $SERVER_PORT）..."
    nohup node "$SERVER_SCRIPT" > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    sleep 2
    
    # 检查是否启动成功
    if pgrep -f "node.*server.cjs" > /dev/null; then
        log_ok "服务器启动成功 (PID: $SERVER_PID)"
        log_info "访问地址: http://localhost:$SERVER_PORT"
        log_info "日志文件: $LOG_FILE"
    else
        log_error "服务器启动失败，请查看日志: $LOG_FILE"
        exit 1
    fi
}

# ============================================================
#  7. 停止服务器
#  ============================================================
stop_server() {
    log_info "停止服务器..."
    
    pkill -f "node.*server.cjs" || true
    
    sleep 1
    
    if pgrep -f "node.*server.cjs" > /dev/null; then
        log_warn "强制停止..."
        pkill -9 -f "node.*server.cjs" || true
    fi
    
    log_ok "服务器已停止"
}

# ============================================================
#  8. 查看状态
#  ============================================================
check_status() {
    echo ""
    echo "==================== 服务器状态 ===================="
    
    if pgrep -f "node.*server.cjs" > /dev/null; then
        PID=$(pgrep -f "node.*server.cjs")
        log_ok "服务器运行中 (PID: $PID)"
        echo "  访问地址: http://localhost:$SERVER_PORT"
    else
        log_warn "服务器未运行"
    fi
    
    echo ""
    echo "  项目目录: $PROJECT_DIR"
    echo "  前端构建: $([ -d "$DIST_DIR" ] && echo '已构建' || echo '未构建')"
    echo "  日志文件: $LOG_FILE"
    echo "=================================================="
    echo ""
}

# ============================================================
#  9. 打开浏览器
#  ============================================================
open_browser() {
    local URL="http://localhost:$SERVER_PORT"
    
    if command -v chromium-browser &> /dev/null; then
        chromium-browser --kiosk --disable-infobars "$URL" &
    elif command -v chromium &> /dev/null; then
        chromium --kiosk --disable-infobars "$URL" &
    elif command -v firefox &> /dev/null; then
        firefox "$URL" &
    else
        log_warn "未找到浏览器，请手动打开: $URL"
    fi
}

# ============================================================
#  10. 设置开机自启（systemd）
#  ============================================================
setup_autostart() {
    log_info "设置开机自启..."
    
    local SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Logistics Cart Path Planning System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $SERVER_SCRIPT
Restart=always
RestartSec=5
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    sudo systemctl start "$SERVICE_NAME"
    
    log_ok "开机自启已设置，服务已启动"
    log_info "服务管理命令:"
    log_info "  查看状态: sudo systemctl status $SERVICE_NAME"
    log_info "  停止:     sudo systemctl stop $SERVICE_NAME"
    log_info "  启动:     sudo systemctl start $SERVICE_NAME"
    log_info "  禁用自启: sudo systemctl disable $SERVICE_NAME"
}

# ============================================================
#  11. 完整部署
#  ============================================================
full_deploy() {
    log_info "开始完整部署..."
    echo ""
    
    check_env
    echo ""
    
    install_deps
    echo ""
    
    build_frontend
    echo ""
    
    start_server
    echo ""
    
    log_info "是否现在打开浏览器？(y/n)"
    read -r ANSWER
    if [[ "$ANSWER" == "y" ]] || [[ "$ANSWER" == "Y" ]]; then
        open_browser
    fi
    
    echo ""
    log_ok "部署完成！"
    log_info "后续启动只需运行: ./deploy.sh start"
    log_info "或设置开机自启:   ./deploy.sh autostart"
}

# ============================================================
#  主入口
#  ============================================================
case "${1:-}" in
    build)
        build_frontend
        ;;
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 1
        start_server
        ;;
    status)
        check_status
        ;;
    open)
        open_browser
        ;;
    autostart)
        setup_autostart
        ;;
    "")
        full_deploy
        ;;
    *)
        echo "用法: $0 [build|start|stop|restart|status|open|autostart]"
        echo ""
        echo "  (无参数)   完整部署（安装依赖 + 构建 + 启动）"
        echo "  build     仅构建前端"
        echo "  start     启动服务器"
        echo "  stop      停止服务器"
        echo "  restart   重启服务器"
        echo "  status    查看状态"
        echo "  open      打开浏览器"
        echo "  autostart 设置开机自启"
        exit 1
        ;;
esac
