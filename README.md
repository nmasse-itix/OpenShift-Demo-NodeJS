# My OpenShift Demo written in NodeJS

This GitHub repository is my demo that exhibit the main features of OpenShift.
Feel free to use it to spread the word.

## Description

The demo is a simple application written in NodeJS that is lightweight. It features
a colored square with an "Hello world from <pod_name>!" in it.

Using this, you can exhibit :
 - Self-Healing
 - Scaling
 - Source-to-Image
 - CI/CD with Blue/Green Deployment

## Setup

To deploy the app and start playing with it, just use Source-to-Image :
```
oc new-app nodejs~https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git --strategy=source
```

To cleanup your environment, use :
```
oc delete all -l app=openshift-demo-nodejs
```

Then, once confident, you can setup a full CI/CD environment as described in the [Installation Guide](doc/INSTALL.md).

## Demo Scenario

Once your environment is setup, you can have a look at the [Demo Scenario](doc/SCENARIO.md).
