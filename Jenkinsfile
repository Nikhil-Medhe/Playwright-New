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

    stage('Clean old reports') {
      steps {
        bat 'if exist playwright-reports rmdir /s /q playwright-reports'
        bat 'if exist playwright-report rmdir /s /q playwright-report'
        bat 'if exist test-results rmdir /s /q test-results'
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
      bat 'node scripts/copy-report.js'
      archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'playwright-reports/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
      // Requires "HTML Publisher" plugin. Build page will show "Playwright Report" link (same as local report with errors/screenshots).
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright Report'
      ])
    }
  }
}
