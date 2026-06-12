' 停止物流小车路径规划系统服务器

Option Explicit
Dim WshShell, result

Set WshShell = CreateObject("WScript.Shell")

result = MsgBox("确定要停止服务器吗？" & vbCrLf & vbCrLf & _
                "停止后浏览器将无法访问系统。", _
                vbQuestion + vbYesNo, "停止服务器")

If result = vbYes Then
    On Error Resume Next
    WshShell.Run "taskkill /F /IM node.exe", 0, True
    If Err.Number = 0 Then
        MsgBox "服务器已停止。", vbInformation, "停止成功"
    Else
        MsgBox "停止失败，可能服务器未运行。", vbExclamation, "停止失败"
    End If
    On Error Goto 0
End If
