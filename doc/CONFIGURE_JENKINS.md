# Configure Jenkins

## Login to NPM and generate a token

Log in the NPM registry with:
```
npm login
```

And create a new read/write token:
```
npm token create
```

Keep the generated token in a safe place !

See [the NPM documentation](https://docs.npmjs.com/getting-started/working_with_tokens) for more information.

## Create a credential named `npm-secret`

Login to Jenkins with your OpenShift credentials and create a Jenkins credential with the following parameters :
 - Scope: global
 - Kind: Username with password
 - Username: `npm-secret` (or anything else, only the password is used)
 - Password: \<the token generated previously\>
 - ID: npm-secret

To create a Jenkins Credentials :
 1. Login to the Jenkins admin interface
 2. In the left side menu, click `Credentials`, then `System`
 3. Click `Global credentials`
 4. In the left side menu, click `Add Credentials`
 5. Fill-in the form
 6. Click `OK`

## Install plugins

Install the two following Jenkins plugins :
 - [Pipeline Utility Steps](https://plugins.jenkins.io/pipeline-utility-steps)
 - [Credentials Binding](https://plugins.jenkins.io/credentials-binding)

Note: the `Pipeline Utility Steps` plugin might already be installed. In such case, make sure the latest version is installed.

Quick reminder to install a plugin :
 1. Login to the Jenkins admin interface
 2. In the left side menu, click `Manage Jenkins`
 3. Click `Manage Plugins`
 4. Select the `Available` tab
 5. Search for the plugin to install
 6. Check the box next to the plugin to install
 7. Click `Download now and install after restart`
 8. Do not forget to check the box `Restart Jenkins when installation is complete and no jobs are running`

__Note :__ to update a plugin, select the `Updates` tab instead of the `Available` tab.

## Create the Jenkins Pipeline (Manual Install ONLY)

Depending if you created a JenkinsPipeline BuildConfig, OpenShift may have created
a Jenkins pipeline for you. In such a case, the Jenkins Pipeline is named `<namespace>/<buildconfig-name>`
and you have nothing more to do.

Whereas if you installed the demo manually, you need to create the pipeline from scratch.
If this is the case, create a Jenkins Pipeline that accepts the following parameters :

| Parameter Name | Parameter Type | Default Value | Description |
| --- | --- | --- | --- |
| NPM_CREDENTIALS_ID | String | npm-secret | The Jenkins Credentials ID that holds the token to login on NPM Registry |
| OPENSHIFT_IMAGE_STREAM | String | openshift-demo-nodejs | The ImageStream name to use to tag the built images |
| OPENSHIFT_BUILD_CONFIG | String | openshift-demo-nodejs | The BuildConfig name to use |
| OPENSHIFT_SERVICE | String | openshift-demo-nodejs | The Service object to update (either green or blue) |
| OPENSHIFT_DEPLOYMENT_CONFIG | String | openshift-demo-nodejs | The DeploymentConfig name to use |
| OPENSHIFT_BUILD_PROJECT | String | demo-build | The OpenShift project in which builds are run |
| OPENSHIFT_TEST_ENVIRONMENT | String | demo-test | The OpenShift project in which we will deploy the test version |
| OPENSHIFT_PROD_ENVIRONMENT | String | demo-prod | The OpenShift project in which we will deploy the prod version |
| OPENSHIFT_TEST_URL | String | http://demo.test.app.openshift.test | The App URL in the test environment (to run the integration tests) |

Pick the pipeline from GIT using the option `Pipeline script from SCM` and the following parameters :
 - SCM: `GIT`
 - Script Path: `Jenkinsfile`
 - Repository URL: https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git
 - Branch Specifier: `*/master`
