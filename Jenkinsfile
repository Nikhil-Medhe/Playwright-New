pipeline {

  agent any



  parameters {

    choice(

      name: 'RUN_TARGET',

      choices: ['qam', 'prod'],

      description: '''qam = nikhil QAM pub (tests/qam, tools.cn-qam-stage.catnav.us)

prod = Automationqa PROD (tests/automationqa-prod, automationqa.thomasnet-navigator.com)'''

    )

    choice(

      name: 'BROWSER',

      choices: ['chrome', 'edge', 'firefox'],

      description: 'Playwright project (--project=)'

    )

    choice(

      name: 'FLOW_STACK',

      choices: ['none', 'smoke', 'pub', 'commerce', 'tools', 'order', 'order-full', 'happy-all'],

      description: '''Optional happy-path stack (overrides TEST_SUITE when not none).

Uses scripts/run-flow-stack.js — stops on first failure.'''

    )

    choice(

      name: 'TEST_SUITE',

      choices: [

        'all',

        'Catalogmanager',

        'CompareItem',

        'DownloadPDF',

        'EmailThisPage-New',

        'cadSiteVersion1',

        'cadSiteVersion1_OrderManager',

        'Keyword search',

        'login',

        'orderManager',

        'OrderSubmission',

        'PCATBasicNavigation',

        'Promotions',

        'RequestInformation'

      ],

      description: '''all = full suite folder for selected RUN_TARGET.

qam: tests/qam/*  |  prod: tests/automationqa-prod/*

cadSiteVersion1 → qam/cadSiteVersion1.spec.ts OR prod/testVersion.spec.ts

login = QAM only. PCAT → qam/PCATBasicNavigation OR prod/pcatNavigation.'''

    )

  }



  options {

    timeout(time: 90, unit: 'MINUTES')

    buildDiscarder(logRotator(numToKeepStr: '10'))

  }



  environment {

    CI = 'true'

    HEADLESS = 'true'

    SMTP_HOST = 'smtp.gmail.com'

    SMTP_PORT = '587'

    // Pipeline jobs have no freestyle "Build Environment" — set recipient here (override via Manage Jenkins → System → Global properties).
    EMAIL_TO = 'nikhil.medhe@firstsource.com'

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



    stage('Setup credentials') {

      steps {

        script {

          bat 'if not exist Data mkdir Data'

          def target = params.RUN_TARGET

          def credFile = target == 'prod' ? 'Data/automationqa-credentials.json' : 'Data/credentials.json'

          def credId = target == 'prod' ? 'playwright-prod-credentials' : 'playwright-qam-credentials'

          def label = target == 'prod' ? 'Automationqa PROD' : 'QAM'



          if (fileExists(credFile)) {

            echo "${label}: using workspace ${credFile}"

          } else {

            try {

              withCredentials([file(credentialsId: credId, variable: 'PLAYWRIGHT_CREDS_FILE')]) {

                bat "copy /Y \"%PLAYWRIGHT_CREDS_FILE%\" \"${credFile}\""

              }

              echo "${label}: loaded ${credFile} from Jenkins credential id=${credId}"

            } catch (err) {

              error(

                "${label} build needs ${credFile}. " +

                "Add Jenkins Secret file credential id=${credId} (upload your JSON), " +

                "or copy the file to workspace Data/ on the agent. Do not commit passwords to git."

              )

            }

          }



          if (!fileExists(credFile)) {

            error("Credentials setup failed: ${credFile} still missing.")

          }

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

          def suiteFolder = target == 'prod' ? 'tests/automationqa-prod' : 'tests/qam'

          def envLabel = target == 'prod' ? 'Automationqa PROD' : 'QAM'



          echo "=== Playwright run: ${envLabel} | folder=${suiteFolder} | browser=${params.BROWSER} | suite=${params.TEST_SUITE} ==="



          def runTarget = { String specArgs ->

            def cmd = "node scripts/run-tests-by-target.js ${target} ${specArgs} ${projectFlag}".trim()

            echo "Running: ${cmd}"

            def code = bat(script: cmd, returnStatus: true)

            if (code != 0) error("Playwright failed (exit ${code}): ${cmd}")

          }



          def specBySuiteQam = [

            'Catalogmanager'       : 'tests/qam/Catalogmanager.spec.ts',

            'CompareItem'          : 'tests/qam/CompareItem.spec.ts',

            'DownloadPDF'          : 'tests/qam/DownloadPDF.spec.ts',

            'EmailThisPage-New'    : 'tests/qam/EmailThisPage-New.spec.ts',

            'cadSiteVersion1'      : 'tests/qam/cadSiteVersion1.spec.ts',

            'Keyword search'       : 'tests/qam/keywordSearch.spec.ts',

            'login'                : 'tests/qam/login.spec.ts',

            'orderManager'         : 'tests/qam/orderManager.spec.ts',

            'OrderSubmission'      : 'tests/qam/OrderSubmission.spec.ts',

            'PCATBasicNavigation'  : 'tests/qam/PCATBasicNavigation.spec.ts',

            'Promotions'           : 'tests/qam/Promotions.spec.ts',

            'RequestInformation'   : 'tests/qam/RequestInformation.spec.ts',

          ]



          def specBySuiteProd = [

            'Catalogmanager'       : 'tests/automationqa-prod/catalogManager.spec.ts',

            'CompareItem'          : 'tests/automationqa-prod/compareItem.spec.ts',

            'DownloadPDF'          : 'tests/automationqa-prod/downloadPDF.spec.ts',

            'EmailThisPage-New'    : 'tests/automationqa-prod/emailThisPage.spec.ts',

            'cadSiteVersion1'      : 'tests/automationqa-prod/testVersion.spec.ts',

            'Keyword search'       : 'tests/automationqa-prod/keywordSearch.spec.ts',

            'orderManager'         : 'tests/automationqa-prod/orderManager.spec.ts',

            'OrderSubmission'      : 'tests/automationqa-prod/orderSubmission.spec.ts',

            'PCATBasicNavigation'  : 'tests/automationqa-prod/pcatNavigation.spec.ts',

            'Promotions'           : 'tests/automationqa-prod/promotions.spec.ts',

            'RequestInformation'   : 'tests/automationqa-prod/requestInformation.spec.ts',

          ]



          def specBySuite = target == 'prod' ? specBySuiteProd : specBySuiteQam



          if (params.TEST_SUITE == 'login' && target == 'prod') {

            error('TEST_SUITE=login is QAM only. Use RUN_TARGET=qam or pick another suite for PROD.')

          }



          def runStack = { String stackName ->

            def cmd = "node scripts/run-flow-stack.js ${target} ${stackName} ${projectFlag}".trim()

            echo "Running stack: ${cmd}"

            def code = bat(script: cmd, returnStatus: true)

            if (code != 0) error("Flow stack failed (exit ${code}): ${cmd}")

          }



          if (params.FLOW_STACK != 'none') {

            runStack(params.FLOW_STACK)

          } else if (params.TEST_SUITE == 'all') {

            runTarget(suiteFolder)

          } else if (params.TEST_SUITE == 'cadSiteVersion1_OrderManager') {

            if (target == 'prod') {

              runTarget('tests/automationqa-prod/testVersion.spec.ts')

              runTarget('tests/automationqa-prod/orderManager.spec.ts')

            } else {

              runTarget('tests/qam/cadSiteVersion1.spec.ts')

              runTarget('tests/qam/orderManager.spec.ts')

            }

          } else if (specBySuite[params.TEST_SUITE]) {

            runTarget(specBySuite[params.TEST_SUITE])

          } else {

            error("Unknown TEST_SUITE for ${target}: ${params.TEST_SUITE}")

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

        def targetLabel = params.RUN_TARGET == 'prod' ? 'Automationqa PROD' : 'QAM'

        def footer = "Jenkins: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${targetLabel} | Suite: ${params.TEST_SUITE} | Stack: ${params.FLOW_STACK} | ${env.BUILD_URL}console"

        def mailExit = 0

        def sendEmail = {

          withEnv([

            "EMAIL_BODY_FOOTER=${footer}",

            "RUN_TARGET=${params.RUN_TARGET}",

          ]) {

            mailExit = bat(script: "node scripts/send-result-email.js ${emailResult}", returnStatus: true)

          }

        }

        if (env.SMTP_USER?.trim() && env.SMTP_PASS?.trim()) {

          sendEmail()

        } else if (fileExists('.env')) {

          sendEmail()

        } else {

          try {

            withCredentials([

              usernamePassword(

                credentialsId: 'playwright-smtp-gmail',

                usernameVariable: 'SMTP_USER',

                passwordVariable: 'SMTP_PASS',

              ),

            ]) {

              sendEmail()

            }

          } catch (err) {

            echo "WARN: No .env, no job SMTP_* env, and credential playwright-smtp-gmail not found."

            mailExit = 1

          }

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


