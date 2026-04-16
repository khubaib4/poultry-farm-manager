!macro customInstall
  ; Install VC++ Redistributable silently
  nsExec::ExecToLog '"$INSTDIR\\vc_redist.x64.exe" /install /quiet /norestart'
  Delete "$INSTDIR\\vc_redist.x64.exe"
!macroend
