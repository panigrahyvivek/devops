#!groovy

node() {
  //Global variables:
  APP_PATH = 'src'
  SRC = "${WORKSPACE}/${APP_PATH}"

  stage("Prepare"){
    deleteDir()
    dir(APP_PATH) {
      checkout scm
    }
  }

  stage("Build"){
    dir(SRC){
        //mtaBuild script: this, mtaJarLocation: MTA_JAR_LOCATION, buildTarget: 'NEO'
        bat 'java -jar C:\\tools\\mta.jar --build-target NEO --mtar myapp.mtar build'
    }
  }
  
  stage("Deploy"){
    dir(SRC){
      withCredentials([usernamePassword(credentialsId: 'neome', passwordVariable: 'password', usernameVariable: 'username')]) {
	      bat 'echo %username%'
	      bat 'echo %password%'
	      bat 'C:\\tools\\neo\\tools\\neo deploy-mta --host hanatrial.ondemand.com --account i077837trial  --source myapp.mtar --user %username% -password %password%' 
      }
    }
  }
}

