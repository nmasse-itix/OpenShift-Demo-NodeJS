# Full CI/CD Setup

This section describe how to setup a complete CI/CD environment using Jenkins.
You can either setup the environment :
 - in a fully automated way, using OpenShift templates
 - manually

## Automated setup through Templates

Create the four environments :
```
oc new-project demo-dev
oc new-project demo-build
oc new-project demo-test
oc new-project demo-prod
```

Deploy a Jenkins in the BUILD project :
```
oc new-app -n demo-build --template=jenkins-persistent --name=jenkins -p MEMORY_LIMIT=1Gi
```

Create all other objects using the template :
```
oc process -f setup/all-in-one-template.yaml > objects.json
oc create -f objects.json
```

Then, configure Jenkins [as described here](CONFIGURE_JENKINS.md).

Where parameters are :

| Parameter Name | Required ? | Default Value | Description |
| --- | --- | --- | --- |
| DEV_PROJECT | No | demo-dev | TODO |
| BUILD_PROJECT | No | demo-build | TODO |
| TEST_PROJECT | No | demo-test | TODO |
| PROD_PROJECT | No | demo-prod | TODO |

TODO

## Manual Setup

### Prepare OpenShift

Create the four environments :
```
oc new-project demo-dev
oc new-project demo-build
oc new-project demo-test
oc new-project demo-prod
```

Create the build config in the BUILD environment :
```
oc new-build -n demo-build nodejs~https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git --strategy=source --name=openshift-demo-nodejs
```

You can test the build config with :
```
oc start-build -n demo-build openshift-demo-nodejs --env=NPM_PACKAGE_TO_INSTALL=openshift-demo-nodejs-nmasse@0.1.0
```

Deploy a Jenkins in the build project :
```
oc new-app -n demo-build --template=jenkins-persistent --name=jenkins -p MEMORY_LIMIT=1Gi
```

Give admin role to the jenkins service account on subsequent environments :
```
oc adm policy add-role-to-user admin system:serviceaccount:demo-build:jenkins -n demo-test
oc adm policy add-role-to-user admin system:serviceaccount:demo-build:jenkins -n demo-prod
```

Tag the test image :
```
oc tag demo-build/openshift-demo-nodejs:latest openshift-demo-nodejs:ready-for-testing -n demo-test
```

Create the test application :
```
oc new-app demo-build/openshift-demo-nodejs:ready-for-testing --name openshift-demo-nodejs -n demo-test
oc expose service openshift-demo-nodejs --name=openshift-demo-nodejs --hostname=demo.test.app.openshift.test -n demo-test
```

Tag the prod image :
```
oc tag demo-test/openshift-demo-nodejs:ready-for-testing openshift-demo-nodejs:ready-for-prod -n demo-prod
```

Create the prod application (blue) :
```
oc new-app demo-build/openshift-demo-nodejs:ready-for-prod --name openshift-demo-nodejs-blue -n demo-prod -l color=blue
```

Create the prod application (green) :
```
oc new-app demo-build/openshift-demo-nodejs:ready-for-prod --name openshift-demo-nodejs-green -n demo-prod -l color=green
```

Create a service on selector "color" :
```
oc create -n demo-prod -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  labels:
    app: openshift-demo-nodejs
  name: openshift-demo-nodejs
spec:
  ports:
  - name: 8080-tcp
    port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    color: blue
  sessionAffinity: None
  type: ClusterIP
EOF
```

And expose this service as a route :
```
oc expose service openshift-demo-nodejs --name=openshift-demo-nodejs --hostname=demo.prod.app.openshift.test -n demo-prod
```

You can verify the target of the route with :
```
oc get service openshift-demo-nodejs -n demo-prod -o template --template='{{ .spec.selector.color }}'
```

You can change the target of the route with :
```
oc patch -n demo-prod service/openshift-demo-nodejs --patch '{"spec":{"selector":{"color":"green"}}}'
```

Disable the triggers :
```
oc set triggers dc/openshift-demo-nodejs --from-image=demo-build/openshift-demo-nodejs:ready-for-testing --manual=true -c openshift-demo-nodejs -n demo-test
oc set triggers dc/openshift-demo-nodejs-blue --from-image=demo-build/openshift-demo-nodejs:ready-for-prod --manual=true -c openshift-demo-nodejs-blue -n demo-prod
oc set triggers dc/openshift-demo-nodejs-green --from-image=demo-build/openshift-demo-nodejs:ready-for-prod --manual=true -c openshift-demo-nodejs-green -n demo-prod
```

### Create the Jenkins Pipeline

Configure Jenkins [as described here](CONFIGURE_JENKINS.md).
