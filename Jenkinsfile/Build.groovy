def label = "jenkins-node-${UUID.randomUUID().toString()}"
podTemplate(label: label, containers: [
    containerTemplate(name: 'node', image: '086658912680.dkr.ecr.eu-west-1.amazonaws.com/cvs/nodejs-builder:latest', ttyEnabled: true, alwaysPullImage: true, command: 'cat'),]){
    node(label) {
        
        SECRET_ID = "build/config/config.yml"

        stage('checkout') {
            checkout scm
        }

        container('node'){

            withFolderProperties{
                LBRANCH="${env.BRANCH}".toLowerCase()
            }

            stage ("npm deps") {
                sh "npm install"
            }

            stage ("build") {
                sh "npm run build"
            }

            stage ("security") {
                 sh "git secrets --register-aws"
                 sh "git secrets --scan"
                 sh "git log -p | scanrepo"
            }

            stage ("sonar") {
                sh "npm run sonar-scanner"
            }

            stage ("unit test") {
                sh "npm run test"
            }
            
            stage('Fetching Secrets') {
              withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'jenkins-iam', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                  sh "cd build && mkdir config && touch config/config.yml"
                  sh "aws secretsmanager get-secret-value --secret-id ${SECRET_ID} --query SecretString --region=eu-west-1 | jq . --raw-output > build/config/config.xml"
              }
            }

            stage("zip dir"){
                sh "cd build && rm package.json package-lock.json" // These are no longer needed
                sh "cd build && zip -qr ../${LBRANCH}.zip ." // ZIP contents of build
            }

            stage("upload to s3") {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                       accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                           credentialsId: 'jenkins-iam',
                       secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {

                sh "aws s3 cp ${LBRANCH}.zip s3://cvs-services/authoriser/${LBRANCH}.zip --metadata sha256sum=\"\$(openssl dgst -sha256 -binary ${LBRANCH}.zip | openssl enc -base64)\""

                }
            }
        }
    }
}
