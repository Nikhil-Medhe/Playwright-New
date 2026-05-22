pipeline {
  agent any

  parameters {
    choice(
      name: 'RUN_TARGET',
      choices: ['qam', 'prod'],
      description: 'QAM (cn-qam-stage) or PROD (thomasnet-navigator) — same as local run-tests-by-target.js'
    )
    choice(
      name: 'BROWSER',
      choices: ['chrome', 'edge', 'firefox'],
      description: 'Playwright project (--project=)'
    )
    choice(
      name: 'TEST_SUITE',
      choices: [
        'OrderSubmission',
        'Catalogmanager',
        'cadSiteVersion1',
        'cadSiteVersion1_OrderManager',
        'cadSiteVersion',
        'all'
      ],
      description: 'Spec(s) to run. cadSiteVersion1_OrderManager = cadSiteVersion1 then orderManager (order ref file).'
    )
  }

  options {
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    CI = 'true'
    HEADLESS = 'true'
    // SMTP + EMAIL_TO: set in Jenkins job env, global env, or agent .env (see JENKINS_EMAIL_SETUP.md)
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        script {
          def pwBrowser = 'chromium'
          if (params.BROWSER == 'edge') pwBrowser = 'msedge'
          else if (params.BROWSER == 'firefox') pwBrowser = 'firefox'
          bat 'npm ci'
          bat "npx playwright install --with-deps ${pwBrowser}"
        }
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
          def target = params.RUN_TARGET
          def projectFlag = "--project=${params.BROWSER}"
          def runTarget = { String specArgs ->
            def cmd = "node scripts/run-tests-by-target.js ${target} ${specArgs} ${projectFlag}".trim()
            def code = bat(script: cmd, returnStatus: true)
            if (code != 0) error("Playwright failed (exit ${code}): ${cmd}")
          }

          if (params.TEST_SUITE == 'OrderSubmission') {
            runTarget('tests/OrderSubmission.spec.ts')
          } else if (params.TEST_SUITE == 'Catalogmanager') {
            runTarget('tests/Catalogmanager.spec.ts')
          } else if (params.TEST_SUITE == 'cadSiteVersion1') {
            runTarget('tests/cadSiteVersion1.spec.ts')
          } else if (params.TEST_SUITE == 'cadSiteVersion1_OrderManager') {
            runTarget('tests/cadSiteVersion1.spec.ts')
            runTarget('tests/orderManager.spec.ts')
          } else if (params.TEST_SUITE == 'cadSiteVersion') {
            runTarget('tests/cadSiteVersion.spec.ts')
          } else {
            runTarget('')
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
      script {
        if (fileExists('test-results/junit.xml')) {
          junit 'test-results/junit.xml'
        }
        def emailResult = (currentBuild.currentResult == 'SUCCESS') ? 'pass' : 'fail'
        def footer = "Jenkins: ${env.JOB_NAME} #${env.BUILD_NUMBER} | Suite: ${params.TEST_SUITE} | ${env.BUILD_URL}console"
        def mailExit = 0
        withEnv([
          "EMAIL_BODY_FOOTER=${footer}",
          "RUN_TARGET=${params.RUN_TARGET}",
        ]) {
          mailExit = bat(script: "node scripts/send-result-email.js ${emailResult}", returnStatus: true)
        }
        if (mailExit != 0) {
          echo 'WARN: send-result-email.js failed. Set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TO on the job/agent (or .env on the build agent). Test: npm run email:test'
        } else {
          echo "Result email sent (${emailResult}, target=${params.RUN_TARGET})."
        }
      }
    }
  }
}
