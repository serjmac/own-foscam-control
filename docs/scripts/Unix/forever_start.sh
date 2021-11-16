#Script to start app with forever, logging app output and forever errors
#you may place wherever you want and call it from cron at startup: @reboot sudo /home/yourUser/forever_start.sh
#yourUser -> is the user which will execute the app
#pathToAppFolder is usually ~/.forever

su - yourUser -c "NODE_ENV=development /usr/local/bin/forever start -w --watchDirectory=/pathToAppFolder/own-foscam-control --watchIgnore --sourceDir /pathToAppFolder/own-foscam-control --workingDir /pathToAppFolder/own-foscam-control -e /pathToForeverLogsFolder/.forever/ownfoscam_error.log -l /pathToForeverLogsFolder/.forever/ownfoscam.log --append app.js"
exit 0