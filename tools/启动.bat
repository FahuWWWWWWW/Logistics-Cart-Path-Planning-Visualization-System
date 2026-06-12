@echo off
chcp 65001 > nul
echo ==========
echo   物流小车路径规划系统 - 离线启动器
echo ==========
echo.

REM 检查 dist 文件夹是否存在（在当前目录的上级）
if not exist "..\dist\index.html" (
    echo [错误] dist 文件夹不存在，请先运行: npm run build
    pause
    exit /b 1
)

REM 启动本地服务器（Node.js）
echo [1/2] 正在启动本地服务器...
start "路径规划服务器" cmd /k "cd .. && node server.cjs"

REM 等待服务器启动
echo [2/2] 等待服务器启动...
timeout /t 3 > nul

REM 打开浏览器（使用默认浏览器）
echo 正在打开浏览器...
start http://localhost:8899

echo.
echo 系统已启动！
echo - 浏览器已打开: http://localhost:8899
echo - 关闭"路径规划服务器"窗口将停止服务器
echo.
pause > nul
