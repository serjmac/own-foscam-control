REM this is a Windows script to start the app with forever package, logging app output and forever error logs. Adapt to suit your needs and use them at system log in with scheduler, service, Startup ...
REM define path to folder, example C:\Users\John\dev\own-foscam-control
set appfolderpath=C:\pathToAppFolder\own-foscam-control

REM define path to folder, example C:\Users\John\.forever\ownfoscam.log
set logfilepath=C:\pathToAppForeverLogFile\.forever\ownfoscam.log

REM define path to folder, example C:\Users\John\.forever\ownfoscam_error.log
set errorlogfilepath=C:\pathToAppForeverErrorLogFile\.forever\ownfoscam_error.log

REM cd to app folder
cd %appfolderpath%

REM start app with forever. Use forever list command from CMD to list processes. use forever stop uid to stop the process
forever start -w --watchDirectory=%appfolderpath% --watchIgnore --sourceDir %appfolderpath% --workingDir %appfolderpath% -e %errorlogfilepath% -l %logfilepath% --append app.js
exit 0

