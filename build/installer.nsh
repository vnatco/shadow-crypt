; Shadow Crypt NSIS custom installer script
; Adds / removes Windows Explorer context menu entries and .aes file association

!macro customInstall
  ; ── Context menu: right-click any file → "Open with Shadow Crypt" ──
  WriteRegStr HKCU "Software\Classes\*\shell\ShadowCrypt"          ""       "Open with Shadow Crypt"
  WriteRegStr HKCU "Software\Classes\*\shell\ShadowCrypt"          "Icon"   "$INSTDIR\ShadowCrypt.exe,0"
  WriteRegStr HKCU "Software\Classes\*\shell\ShadowCrypt\command"  ""       '"$INSTDIR\ShadowCrypt.exe" "%1"'

  ; ── .aes file association ──
  ; Map the extension to our ProgID
  WriteRegStr HKCU "Software\Classes\.aes"                                    ""          "ShadowCrypt.aes"
  WriteRegStr HKCU "Software\Classes\.aes"                                    "PerceivedType" "encrypted"

  ; ProgID definition
  WriteRegStr HKCU "Software\Classes\ShadowCrypt.aes"                         ""          "AES Encrypted File"
  WriteRegStr HKCU "Software\Classes\ShadowCrypt.aes\DefaultIcon"             ""          "$INSTDIR\ShadowCrypt.exe,0"
  WriteRegStr HKCU "Software\Classes\ShadowCrypt.aes\shell\open\command"      ""          '"$INSTDIR\ShadowCrypt.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\ShadowCrypt.aes\shell\open"              "FriendlyAppName" "Shadow Crypt"

  ; Tell Windows Explorer to refresh icons / associations
  ${RefreshShellIcons}
!macroend

!macro customUninstall
  ; Remove context menu
  DeleteRegKey HKCU "Software\Classes\*\shell\ShadowCrypt"

  ; Remove file association
  DeleteRegKey HKCU "Software\Classes\.aes"
  DeleteRegKey HKCU "Software\Classes\ShadowCrypt.aes"

  ${RefreshShellIcons}
!macroend
