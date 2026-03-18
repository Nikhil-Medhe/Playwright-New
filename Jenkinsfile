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
      bat 'node scripts/zip-report.js'
      archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'playwright-report.zip', allowEmptyArchive: true
      archiveArtifacts artifacts: 'playwright-reports/**/*', allowEmptyArchive: true
      archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright Report'
      ])
      script {
        if (fileExists('test-results/junit.xml')) {
          junit 'test-results/junit.xml'
        }
      }
    }
    success {
      script {
        def recipients = env.EMAIL_RECIPIENTS ?: 'nikhil.medhe@firstsource.com'
        def summary = getTestSummary()
        def body = """Playwright Test Result – SUCCESS

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Suite: ${params.TEST_SUITE}

${summary}

HTML report: see attached playwright-report.zip (unzip and open index.html).
Playwright Report (steps, screenshots): ${env.BUILD_URL}Playwright_20Report/
Console log: ${env.BUILD_URL}console
"""
        try {
          emailext(to: recipients, subject: "[PASS] Playwright ${env.JOB_NAME} #${env.BUILD_NUMBER} – ${params.TEST_SUITE}", body: body, attachmentsPattern: 'playwright-report.zip')
        } catch (e) {
          mail(to: recipients, subject: "[PASS] Playwright ${env.JOB_NAME} #${env.BUILD_NUMBER} – ${params.TEST_SUITE}", body: body)
        }
      }
    }
    failure {
      script {
        def recipients = env.EMAIL_RECIPIENTS ?: 'nikhil.medhe@firstsource.com'
        def summary = getTestSummary()
        def body = """Playwright Test Result – FAILED

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Suite: ${params.TEST_SUITE}

${summary}

HTML report: see attached playwright-report.zip (unzip and open index.html).
Playwright Report (failed steps, screenshots, video): ${env.BUILD_URL}Playwright_20Report/
Console log: ${env.BUILD_URL}console
"""
        try {
          emailext(to: recipients, subject: "[FAIL] Playwright ${env.JOB_NAME} #${env.BUILD_NUMBER} – ${params.TEST_SUITE}", body: body, attachmentsPattern: 'playwright-report.zip')
        } catch (e) {
          mail(to: recipients, subject: "[FAIL] Playwright ${env.JOB_NAME} #${env.BUILD_NUMBER} – ${params.TEST_SUITE}", body: body)
        }
      }
    }
  }
}

def getTestSummary() {
  if (!fileExists('test-results/junit.xml')) return 'Test summary: See Playwright Report.'
  def xml = readFile('test-results/junit.xml')
  def t = (xml =~ /tests="(\d+)"/); def tests = t.find() ? t.group(1) : '?'
  def f = (xml =~ /failures="(\d+)"/); def failures = f.find() ? f.group(1) : '?'
  def passed = (tests ==~ /\d+/ && failures ==~ /\d+/) ? (tests.toInteger() - failures.toInteger()) : '?'
  return "Tests: ${passed} passed, ${failures} failed (total ${tests})."
}
