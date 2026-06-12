#!/bin/bash
#  ============================================================
#  物流小车路径规划系统 - 树莓派快速启动脚本
#  双击或在终端运行即可
#  ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_DIR/server.log"

# 检查 dist 目录
if [ ! -d "$PROJECT_DIR/dist" ]; then
    echo "错误: dist 目录不存在，请先运行 ./deploy-rpi.sh build"
    exit 1
fi

# 停止旧进程
pkill -f "node.*server.cjs" 2>/dev/null || true
sleep 1

# 启动服务器
echo "正在启动服务器..."
nohup node "$PROJECT_DIR/server.cjs" > "$LOG_FILE" 2>&1 &
PID=$!

sleep 2

# 检查启动状态
if pgrep -f "node.*server.cjs" > /dev/null; then
    echo "✅ 服务器启动成功 (PID: $PID)"
    echo "   访问地址: http://localhost:8899"
    echo "   日志文件: $LOG_FILE"
    
    # 打开浏览器
    URL="http://localhost:8899"
    if command -v chromium-browser &> /dev/null; then
        chromium-browser --new-window "$URL" 2>/dev/null &
    elif command -v chromium &> /dev/null; then
        chromium --new-window "$URL" 2>/dev/null &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$URL" 2>/dev/null &
    fi
else
    echo "❌ 服务器启动失败，请查看日志: $LOG_FILE"
    exit 1
fi
