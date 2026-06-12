' 物流小车路径规划系统 - 静默启动脚本
' 双击后在后台启动服务器，然后打开浏览器

Option Explicit
Dim WshShell, FSO, scriptPath, scriptDir, distPath, serverPath
Dim nodeCmd, httpObj, url, port, maxPort, success, i

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' 获取脚本完整路径，然后提取目录（再上一级是项目根目录）
scriptPath = WScript.ScriptFullName
scriptDir = FSO.GetParentFolderName(scriptPath)
Dim projectDir
projectDir = FSO.GetParentFolderName(scriptDir)

' 检查 dist 文件夹（在项目根目录下）
distPath = projectDir & "\dist\index.html"
If Not FSO.FileExists(distPath) Then
    MsgBox "错误: dist 文件夹不存在！" & vbCrLf & "请先运行: npm run build", vbCritical, "启动失败"
    WScript.Quit
End If

' 杀掉可能占用端口的 node 进程
On Error Resume Next
WshShell.Run "taskkill /F /IM node.exe", 0, True
On Error Goto 0
WScript.Sleep 1000

' 启动服务器（后台运行，窗口隐藏）
serverPath = projectDir & "\server.cjs"
nodeCmd = "node """ & serverPath & """"
WshShell.Run nodeCmd, 0, False

' 等待服务器启动（最多等待 10 秒）
port = 8899
maxPort = 8905
success = False

WScript.Sleep 2000

' 检测服务器是否启动成功
Set httpObj = CreateObject("MSXML2.XMLHTTP")
On Error Resume Next
For i = 1 To 20  ' 最多检测 20 次（每次 500ms = 10 秒）
    url = "http://localhost:" & port
    httpObj.Open "GET", url, False
    httpObj.Send
    If Err.Number = 0 Then
        success = True
        Exit For
    End If
    ' 如果连接失败，可能是端口被占用，服务器切换到下一个端口
    If Err.Number <> 0 Then
        Dim errDesc
        errDesc = Err.Description
        If InStr(errDesc, "connect") > 0 Or InStr(errDesc, "ECONNREFUSED") > 0 Then
            ' 连接被拒绝，可能服务器在其他端口
            ' 不增加端口，继续等待（服务器可能需要更多时间启动）
        End If
        Err.Clear
    End If
    WScript.Sleep 500
Next
On Error Goto 0

If Not success Then
    MsgBox "服务器启动失败！" & vbCrLf & "请检查 Node.js 是否正确安装。" & vbCrLf & vbCrLf & _
           "排查步骤：" & vbCrLf & _
           "1. 按 Win+R，输入 cmd，回车" & vbCrLf & _
           "2. 输入: node --version" & vbCrLf & _
           "3. 如果显示错误，请重新安装 Node.js", _
           vbCritical, "启动失败"
    WScript.Quit
End If

' 打开浏览器
WshShell.Run url

MsgBox "系统已启动！" & vbCrLf & vbCrLf & _
       "浏览器已打开: " & url & vbCrLf & vbCrLf & _
       "关闭服务器请双击: 停止.vbs", _
       vbInformation, "启动成功"
