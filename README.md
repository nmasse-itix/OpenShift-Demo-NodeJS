# My Sample NodeJS application

## Description

TODO

## Setup

### In a DEV environment

To deploy the app :
```
oc new-app nodejs~https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git --strategy=source
```

To cleanup :
```
oc delete all -l app=openshift-demo-nodejs
```

### Full CICD Deployment

See [INSTALL](doc/INSTALL.md).
