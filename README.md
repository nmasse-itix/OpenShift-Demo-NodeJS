# My Sample NodeJS application

## Description

TODO

## Setup

### Dev environment

```
oc new-app nodejs~https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git --strategy=source
```

### Full CICD Deployment

#### Prepare OpenShift

Create the four environments :
```
oc new-project demo-dev
oc new-project demo-build
oc new-project demo-test
oc new-project demo-prod
```

Create the build config in the build environment :
```
oc new-build -n demo-build nodejs~https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git --strategy=source --name=openshift-demo-nodejs
```

You can test the build config with :
```
oc start-build -n demo-build openshift-demo-nodejs --env=NPM_PACKAGE_TO_INSTALL=openshift-demo-nodejs-nmasse@0.1.0
```

Deploy a Jenkins in the build project :
```
oc new-app -n demo-build --template=jenkins-persistent --name=jenkins
```

Give admin role to the jenkins service account on subsequent environments :
```
oc adm policy add-role-to-user admin system:serviceaccount:demo-build:jenkins -n demo-test
oc adm policy add-role-to-user admin system:serviceaccount:demo-build:jenkins -n demo-prod
```

Give rights on other environments to pull images from build environment :
```
oc adm policy add-role-to-group system:image-puller system:serviceaccounts:demo-test -n demo-build
oc adm policy add-role-to-group system:image-puller system:serviceaccounts:demo-prod -n demo-build
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

#### Create the Jenkins Pipeline

Create a Jenkins Credentials with the following parameters :
 - Scope: global
 - Kind: Username with password
 - Username: <your NPM username>
 - Password: <your NPM password>
 - ID: npm-secret

Create a Jenkins Pipeline that accepts the following parameters :

| Parameter Name | Parameter Type | Default Value | Description |
| --- | --- | --- | --- |
| NPM_CREDENTIALS_ID | String | npm-secret | The Jenkins Credentials ID that holds login and password to login on NPM Registry |
| NPM_EMAIL | String | <your NPM email> | The email address associated with the NPM Account pointed by NPM_CREDENTIALS_ID |
| NPM_REGISTRY | String | https://registry.npmjs.org | Private NPM registry to log in to (Default if not provided: https://registry.npmjs.org) |
| OPENSHIFT_IMAGE_STREAM | String | openshift-demo-nodejs | The ImageStream name to use to tag the built images |
| OPENSHIFT_BUILD_CONFIG | String | openshift-demo-nodejs | The BuildConfig name to use |
| OPENSHIFT_SERVICE | String | openshift-demo-nodejs | The Service object to update (either green or blue) |
| OPENSHIFT_DEPLOYMENT_CONFIG | String | openshift-demo-nodejs | The DeploymentConfig name to use |
| OPENSHIFT_BUILD_PROJECT | String | demo-build | The OpenShift project in which builds are run |
| OPENSHIFT_TEST_ENVIRONMENT | String | demo-test | The OpenShift project in which we will deploy the test version |
| OPENSHIFT_PROD_ENVIRONMENT | String | demo-prod | The OpenShift project in which we will deploy the prod version |
| OPENSHIFT_TEST_URL | String | http://demo.test.app.openshift.test | The App URL in the test environment (to run the integration tests) |

Pick the pipeline from GIT using the option "Pipeline script from SCM".
