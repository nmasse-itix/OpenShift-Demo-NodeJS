# Demo Scenario

## Preparation

If you plan to deliver this demo, you will need :
 - a GitHub Account
 - an NPM Account

You will then need to clone this repo and edit `package.json` to change :
 - the package name
 - the package version

__Note :__ You will have to change the package version each time you reset Jenkins
since the build number is used in the NPM package version and the version numbers
in NPM can only go up, never down.

## Modify the app

To run the following scenarios, you will have to modify the app to have a different color.
Here is how to do so.

Main steps :
 - Edit `server.js` and modify line 7 (`var color = ...`) to have a different color.
 - You can find nice colors [here](https://www.w3schools.com/cssref/css_colors.asp)
 - Run the following commands :

```
git add server.js
git commit -m 'improve look and feel'
git push
```

## Deploy in the DEV environment

In this scenario, we are a developer joining an existing team. This developer
has to setup his environment and start modifying the application.

Main steps :
 - Use Source-to-Image to deploy the app (either through CLI or GUI)
 - Show the running app in the browser
 - Modify the source code to change the color of the square
 - Trigger a new build
 - Show the modified app
 - Show the container logs
 - Open a shell in the container and show how to debug

## Deploy in the TEST and PROD environments

In this scenario, we will deploy the new version of the application in the
TEST and PROD environments. To do so, we will use Jenkins.

Main steps :
 - Modify the source code (if not already done) to change the color of the square
 - Show that the TEST and PROD application is running and has the previous color
 - Trigger the Jenkins pipeline from OpenShift and follow progress
 - When Jenkins waits for input on the last step, show the TEST app (has the new color)
 - Show that the PROD app is still on the previous color
 - In OpenShift, authorize the deployment in the PROD environment
 - Show that the PROD app has the new color

## Self-Healing in the TEST environment

In this scenario, we will show that OpenShift restart a POD when it crashes or disappear.

Main steps :
 - In the TEST environment, get the POD Id of the running application
 - Kill it with `oc delete pod <pod_id>`
 - Watch the Web GUI, you will see OpenShift starting a new POD

## Scaling in the TEST environment

In this scenario, we will show that you can easily scale your application by starting
new PODs.

Main steps :
 - In the TEST environment, click the "up arrow" in the GUI
 - Watch OpenShift starting a new POD
 - Once the new POD is ready, show with multiple `curl` that the two PODs are serving requests :

```
$ curl http://route.to.test.app/info
{"color":"purple","podName":"openshift-demo-nodejs-2-2mcgb"}

$ curl http://route.to.test.app/info
{"color":"purple","podName":"openshift-demo-nodejs-2-nsbv6"}
```
