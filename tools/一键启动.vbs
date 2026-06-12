' ============================================================
' 物流小车路径规划系统 - 一键静默启动
' 双击后在后台启动服务器，然后自动打开浏览器
' 无界面、无弹窗、全程静默
' ============================================================

Option Explicit

Dim WshShell, FSO, scriptPath, scriptDir, projectDir
Dim distPath, serverPath, nodeCmd, httpObj, url, port
Dim success, i, errNum

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' 获取项目根目录
scriptPath = WScript.ScriptFullName
scriptDir = FSO.GetParentFolderName(scriptPath)
projectDir = FSO.GetParentFolderName(scriptDir)

' 检查 dist 文件夹
port = 8899

' 尝试从命令行参数读取端口
If WScript.Arguments.Count > 0 Then
    port = CInt(WScript.Arguments(0))
End If

url = "http://localhost:" & port

distPath = projectDir & "\dist\index.html"
If Not FSO.FileExists(distPath) Then
    WshShell.Run "cmd /c echo [错误] dist 文件夹不存在，请先运行: npm run build && pause", 1, True
    WScript.Quit 1
End If

' 杀掉可能残留的 node 进程
On Error Resume Next
WshShell.Run "taskkill /F /IM node.exe", 0, True
On Error Goto 0
WScript.Sleep 800

' 启动服务器（后台隐藏窗口）
serverPath = projectDir & "\server.cjs"
nodeCmd = "node """ & serverPath & """"
WshShell.Run nodeCmd, 0, False

' 等待并检测服务器
WScript.Sleep 1500

Set httpObj = CreateObject("MSXML2.XMLHTTP")
success = False

On Error Resume Next
For i = 1 To 30  ' 最多等待 15 秒
    httpObj.Open "GET", url, False
    httpObj.Send
    errNum = Err.Number
    If errNum = 0 Then
        success = True
        Exit For
    End If
    Err.Clear
    WScript.Sleep 500
Next
On Error Goto 0

If Not success Then
    WshShell.Run "cmd /c echo [错误] 服务器启动超时，请检查 Node.js 是否已安装 && pause", 1, True
    WScript.Quit 1
End If

' 打开浏览器
WshShell.Run url

' 静默退出，不显示任何提示
WScript.Quit 0
