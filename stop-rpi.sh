#!/bin/bash
# 停止服务器
pkill -f "node.*server.cjs" 2>/dev/null && echo "✅ 服务器已停止" || echo "服务器未运行"
