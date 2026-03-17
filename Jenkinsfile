pipeline {
  agent any

  parameters {
    choice(
      name: 'TEST_SUITE',
      choices: [
        'OrderSubmission',
        'cadSiteVersion',
        'all'
      ],
      description: 'Run only OrderSubmission, only cadSiteVersion, or all tests'
    )
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    CI = 'true'
    HEADLESS = 'true'
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
        script {
          if (params.TEST_SUITE == 'OrderSubmission') {
            bat 'npm run test:order'
          } else if (params.TEST_SUITE == 'cadSiteVersion') {
            bat 'npx playwright test tests/cadSiteVersion.spec.ts'
          } else {
            bat 'npm run test'
          }
        }
      }
    }

    stage('Prepare report') {
      steps {
        bat 'node scripts/copy-report.js'
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
    }
  }
}
