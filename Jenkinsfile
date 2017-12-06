#!groovy
/*
 * This Jenkins Pipeline depends on the following plugins :
 *  - Pipeline Utility Steps (https://plugins.jenkins.io/pipeline-utility-steps)
 *  - Credentials Binding (https://plugins.jenkins.io/credentials-binding)
 *
 * This pipeline accepts the following parameters :
 *  - NPM_CREDENTIALS_ID: The Jenkins Credentials ID that holds the NPM token to login on NPM Registry
 *  - NPM_TAG: The tag to use to publish the package to the NPM registry (defaults to 'latest')
 *  - OPENSHIFT_IMAGE_STREAM: The ImageStream name to use to tag the built images
 *  - OPENSHIFT_BUILD_CONFIG: The BuildConfig name to use
 *  - OPENSHIFT_SERVICE: The Service object to update (either green or blue)
 *  - OPENSHIFT_DEPLOYMENT_CONFIG: The DeploymentConfig name to use
 *  - OPENSHIFT_BUILD_PROJECT: The OpenShift project in which builds are run
 *  - OPENSHIFT_TEST_ENVIRONMENT: The OpenShift project in which we will deploy the test version
 *  - OPENSHIFT_PROD_ENVIRONMENT: The OpenShift project in which we will deploy the prod version
 *  - OPENSHIFT_TEST_URL: The App URL in the test environment (to run the integration tests)
 */

// Run this node on a Maven Slave
// Maven Slaves have JDK and Maven already installed
node('nodejs') {
  stage('Checkout Source') {
    // Get Source Code from SCM (Git) as configured in the Jenkins Project
    // Next line for inline script, "checkout scm" for Jenkinsfile from GIT
    //git url: "https://github.com/nmasse-itix/OpenShift-Demo-NodeJS.git"
    checkout scm
  }

  def thisPackage = readJSON file: 'package.json'
  def currentVersion = thisPackage.version
  def newVersion = "$currentVersion-$BUILD_NUMBER"
  def packageName = thisPackage.name
  def packageSpec = "$packageName@$newVersion"
  def packageTag = (params.NPM_TAG != null && params.NPM_TAG != "") ? params.NPM_TAG : 'latest'

  // Run the unit tests
  stage('Unit Tests') {
    sh "npm test"
  }

  // You will need the "credential binding" plugin. See here how to install it :
  // https://support.cloudbees.com/hc/en-us/articles/203802500-Injecting-Secrets-into-Jenkins-Build-Jobs
  withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: params.NPM_CREDENTIALS_ID,
                    usernameVariable: 'DUMMY', passwordVariable: 'NPM_TOKEN']]) {
    // Package the app and publish it to NPM
    stage('Package and Publish to NPM') {
      echo "Using NPM CredentialsID = '${params.NPM_CREDENTIALS_ID}'"

      // Store the NPM Token in the config file
      sh "npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}"

      echo "Will publish version $newVersion to NPM (tagged as 'latest')"
      sh "npm --no-git-tag-version version ${newVersion}"
      sh "npm publish --tag ${packageTag}"
    }
  }

  // Build the OpenShift Image in OpenShift using the artifacts from NPM
  // Also tag the image
  stage('Build OpenShift Image') {

    // Trigger an OpenShift build in the dev environment
    openshiftBuild bldCfg: params.OPENSHIFT_BUILD_CONFIG, checkForTriggeredDeployments: 'false',
                   namespace: params.OPENSHIFT_BUILD_PROJECT, showBuildLogs: 'true',
                   verbose: 'false', waitTime: '', waitUnit: 'sec',
                   env: [ [ name: 'NPM_PACKAGE_TO_INSTALL', value: "${packageSpec}" ] ]


    // Tag the new build
    openshiftTag alias: 'false', destStream: params.OPENSHIFT_IMAGE_STREAM, destTag: "${newVersion}",
                 destinationNamespace: params.OPENSHIFT_BUILD_PROJECT, namespace: params.OPENSHIFT_BUILD_PROJECT,
                 srcStream: params.OPENSHIFT_IMAGE_STREAM, srcTag: 'latest', verbose: 'false'
  }


  // Deploy the built image to the Test Environment.
  stage('Deploy to Test') {
    // Tag the new build as "ready-for-testing"
    openshiftTag alias: 'false', destStream: params.OPENSHIFT_IMAGE_STREAM, srcTag: "${newVersion}",
                 destinationNamespace: params.OPENSHIFT_TEST_ENVIRONMENT, namespace: params.OPENSHIFT_BUILD_PROJECT,
                 srcStream: params.OPENSHIFT_IMAGE_STREAM, destTag: 'ready-for-testing', verbose: 'false'

    // Trigger a new deployment
    openshiftDeploy deploymentConfig: params.OPENSHIFT_DEPLOYMENT_CONFIG, namespace: params.OPENSHIFT_TEST_ENVIRONMENT
  }


  // Run some integration tests.
  // Once the tests succeed tag the image
  stage('Integration Test') {
    // Run integration tests that are in the GIT repo
    sh "tests/run-integration-tests.sh '${params.OPENSHIFT_TEST_URL}'"

    // Tag the new build as "ready-for-prod"
    openshiftTag alias: 'false', destStream: params.OPENSHIFT_IMAGE_STREAM, srcTag: "${newVersion}",
                 destinationNamespace: params.OPENSHIFT_PROD_ENVIRONMENT, namespace: params.OPENSHIFT_BUILD_PROJECT,
                 srcStream: params.OPENSHIFT_IMAGE_STREAM, destTag: 'ready-for-prod', verbose: 'false'
  }

  // Blue/Green Deployment into Production
  // First step : deploy the new version but do not activate it !
  stage('Deploy to Production') {
    // Yes, this is mandatory for the next command to succeed. Don't know why...
    sh "oc project ${params.OPENSHIFT_PROD_ENVIRONMENT}"

    // Extract the route target (xxx-green or xxx-blue)
    // This will be used by getCurrentTarget and getNewTarget methods
    sh "oc get service ${params.OPENSHIFT_SERVICE} -n ${params.OPENSHIFT_PROD_ENVIRONMENT} -o template --template='{{ .spec.selector.color }}' > route-target"

    // Flip/flop target (green goes blue and vice versa)
    def newTarget = getNewTarget()

    // Trigger a new deployment
    openshiftDeploy deploymentConfig: "${params.OPENSHIFT_DEPLOYMENT_CONFIG}-${newTarget}", namespace: params.OPENSHIFT_PROD_ENVIRONMENT
    openshiftVerifyDeployment deploymentConfig: "${params.OPENSHIFT_DEPLOYMENT_CONFIG}-${newTarget}", namespace: params.OPENSHIFT_PROD_ENVIRONMENT
  }

  // Once approved (input step) switch production over to the new version.
  stage('Switch over to new Version') {
    // Determine which is of green or blue is active
    def newTarget = getNewTarget()
    def currentTarget = getCurrentTarget()

    // Wait for administrator confirmation
    input "Switch Production from ${currentTarget} to ${newTarget} ?"

    // Switch blue/green
    sh "oc patch -n ${params.OPENSHIFT_PROD_ENVIRONMENT} service/${params.OPENSHIFT_SERVICE} --patch '{\"spec\":{\"selector\":{\"color\":\"${newTarget}\"}}}'"
  }

}

// Get the current target of the OpenShift production route
// Note: the route-target file is created earlier by the "oc get route" command
def getCurrentTarget() {
  def currentTarget = readFile 'route-target'
  return currentTarget
}

// Flip/flop target (green goes blue and vice versa)
def getNewTarget() {
  def currentTarget = getCurrentTarget()
  def newTarget = ""
  if (currentTarget == "blue") {
      newTarget = "green"
  } else if (currentTarget == "green") {
      newTarget = "blue"
  } else {
    echo "OOPS, wrong target"
  }
  return newTarget
}
