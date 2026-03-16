pipeline {
  agent any

  parameters {
    choice(
      name: 'TEST_FILE',
      choices: [
        'tests/OrderSubmission.spec.ts',
        'tests/cadSiteVersion.spec.ts'
      ],
      description: 'Select Playwright test file to run'
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

    stage('Run Selected Test') {
      steps {
        bat "npx playwright test ${params.TEST_FILE}"
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
