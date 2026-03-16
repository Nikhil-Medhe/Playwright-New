// Jenkins pipeline for Playwright tests.
// Agent must have Node.js (e.g. 18+) or use a node Docker image.
pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    CI = 'true'
    HEADLESS = 'true'
    // Optional: override base URL for Jenkins
    // BASE_URL = 'https://nikhil.cn-qam-pub.catnav.us'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        bat 'npm ci'
        bat 'npx playwright install --with-deps chromium'
      }
    }

    stage('Run tests') {
      steps {
        bat 'npm run test'
      }
    }
  }

  post {
    always {
      // Archive HTML report and test results (run-YYYY-MM-DD_HH-mm-ss folders)
      archiveArtifacts artifacts: 'playwright-reports/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
    }
    failure {
      echo 'Tests failed. Check playwright-reports/run-* for HTML report.'
    }
  }
}
