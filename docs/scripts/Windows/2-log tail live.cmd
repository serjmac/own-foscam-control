REM This is a Windows script that will leave open a CMD window with latest lines of app output log, like "tail -f" does in UNIX systems
REM define path to folder, example C:\Users\John\.forever\ownfoscam.log
set logfilepath=C:\pathToAppForeverLogFile\.forever\ownfoscam.log

REM start a powershell command to show last 30 log lines live (equivalent to unix to tail -f)
powershell -Command "& {Get-Content %logfilepath% -Wait -Tail 30}"
