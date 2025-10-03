Set objShell = CreateObject("WScript.Shell")

' Backend起動
objShell.Run "cmd.exe /k ""cd /d C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\backend && pnpm dev""", 1

' 待機
WScript.Sleep 3000

' Frontend起動
objShell.Run "cmd.exe /k ""cd /d C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\frontend && pnpm dev""", 1

' 待機
WScript.Sleep 5000

' VSCode起動
objShell.Run "code ""C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\extension""", 1

MsgBox "VIBECODING started!" & vbCrLf & vbCrLf & "Backend:  http://localhost:3001" & vbCrLf & "Frontend: http://localhost:3002" & vbCrLf & vbCrLf & "Press F5 in VSCode to run extension", vbInformation, "VIBECODING"
