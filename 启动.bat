@echo off
chcp 65001 > nul
echo ===========
echo   物流小车路径规划系统 - 离线启动器
echo ===========
echo.

REM 检查 dist 文件夹是否存在
if not exist "dist\index.html" (
    echo [错误] dist 文件夹不存在，请先运行: npm run build
    pause
    exit /b 1
)

REM 启动本地服务器（Node.js）
echo [1/2] 正在启动本地服务器...
start "路径规划服务器" cmd /k "node server.cjs"

REM 等待服务器启动
timeout /t 2 > nul

REM 用 Edge App 模式打开（无地址栏，更像桌面应用）
echo [2/2] 正在打开应用窗口...
start msedge --app=http://localhost:8899 --new-window

echo.
echo 系统已启动！
echo - 应用窗口已打开（无地址栏模式）
echo - 关闭此窗口将停止服务器
echo.
pause > nul
