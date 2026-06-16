/**
 * Flow stacks — dependency-ordered happy-path sequences.
 *
 * Each `step` is a flow id → spec under tests/{qam|automationqa-prod}/.
 * Run: node scripts/run-flow-stack.js prod order-full --project=chrome
 */

/** @typedef {{ spec: string; label: string; writesOrderRef?: boolean; note?: string }} FlowDef */

/** @type {Record<string, Record<string, FlowDef>>} */
const flowsByTarget = {
  qam: {
    catalogmanager: {
      spec: 'tests/qam/Catalogmanager.spec.ts',
      label: 'Catalog Manager',
      tags: ['@tools'],
    },
    cad1: {
      spec: 'tests/qam/cadSiteVersion1.spec.ts',
      label: 'CAD Site Version 1 (WM → checkout → OM)',
      writesOrderRef: true,
      tags: ['@commerce', '@order', '@tools'],
    },
    order: {
      spec: 'tests/qam/orderManager.spec.ts',
      label: 'Order Manager',
      note: 'Uses ORDER_REF / last-order-ref.txt or auto pub checkout',
      tags: ['@order', '@tools'],
    },
    compare: { spec: 'tests/qam/CompareItem.spec.ts', label: 'Compare Items', tags: ['@pub', '@smoke'] },
    pdf: { spec: 'tests/qam/DownloadPDF.spec.ts', label: 'Download PDF', tags: ['@pub', '@smoke'] },
    email: { spec: 'tests/qam/EmailThisPage-New.spec.ts', label: 'Email This Page', tags: ['@pub'] },
    keyword: { spec: 'tests/qam/Keyword search.spec.ts', label: 'Keyword Search', tags: ['@pub', '@smoke'] },
    rfi: { spec: 'tests/qam/RequestInformation.spec.ts', label: 'Request Information', tags: ['@pub'] },
    'order-submit': {
      spec: 'tests/qam/OrderSubmission.spec.ts',
      label: 'Order Submission',
      writesOrderRef: true,
      tags: ['@commerce'],
    },
    promotions: {
      spec: 'tests/qam/Promotions.spec.ts',
      label: 'Promotions',
      writesOrderRef: true,
      tags: ['@commerce'],
    },
    pcat: { spec: 'tests/qam/PCATBasicNavigation.spec.ts', label: 'PCAT', tags: ['@commerce', '@pcat'] },
  },
  prod: {
    catalogmanager: {
      spec: 'tests/automationqa-prod/catalogManager.spec.ts',
      label: 'Catalog Manager',
      tags: ['@tools'],
    },
    cad1: {
      spec: 'tests/automationqa-prod/testVersion.spec.ts',
      label: 'Test Version (WM → checkout → OM)',
      writesOrderRef: true,
      tags: ['@commerce', '@order', '@tools'],
    },
    order: {
      spec: 'tests/automationqa-prod/orderManager.spec.ts',
      label: 'Order Manager',
      note: 'Uses ORDER_REF / last-order-ref.txt or auto pub checkout',
      tags: ['@order', '@tools'],
    },
    compare: { spec: 'tests/automationqa-prod/compareItem.spec.ts', label: 'Compare Items', tags: ['@pub', '@smoke'] },
    pdf: { spec: 'tests/automationqa-prod/downloadPDF.spec.ts', label: 'Download PDF', tags: ['@pub', '@smoke'] },
    email: { spec: 'tests/automationqa-prod/emailThisPage.spec.ts', label: 'Email This Page', tags: ['@pub'] },
    keyword: { spec: 'tests/automationqa-prod/keywordSearch.spec.ts', label: 'Keyword Search', tags: ['@pub', '@smoke'] },
    rfi: { spec: 'tests/automationqa-prod/requestInformation.spec.ts', label: 'Request Information', tags: ['@pub'] },
    'order-submit': {
      spec: 'tests/automationqa-prod/orderSubmission.spec.ts',
      label: 'Order Submission',
      writesOrderRef: true,
      tags: ['@commerce'],
    },
    promotions: {
      spec: 'tests/automationqa-prod/promotions.spec.ts',
      label: 'Promotions',
      writesOrderRef: true,
      tags: ['@commerce'],
    },
    pcat: { spec: 'tests/automationqa-prod/pcatNavigation.spec.ts', label: 'PCAT', tags: ['@commerce', '@pcat'] },
  },
};

/**
 * Named stacks — steps run top-to-bottom; stop on first failure.
 * @type {Record<string, Record<string, { description: string; steps: string[] }>>}
 */
const stacksByTarget = {
  qam: {
    'order-full': {
      description: 'WM CAD → checkout → OM, then OM verify again',
      steps: ['cad1', 'order'],
    },
    order: {
      description: 'Order Manager only (auto checkout if no order ref)',
      steps: ['order'],
    },
    smoke: {
      description: 'Quick pub catalog smoke — no tools login, no WM',
      steps: ['keyword', 'compare', 'pdf'],
    },
    pub: {
      description: 'Pub catalog browsing flows',
      steps: ['keyword', 'compare', 'pdf', 'email', 'rfi'],
    },
    commerce: {
      description: 'Pub checkout flows (order ref written on thank-you)',
      steps: ['order-submit', 'promotions', 'pcat'],
    },
    tools: {
      description: 'Tools-side login flows',
      steps: ['catalogmanager'],
    },
    'happy-all': {
      description: 'Full QAM happy-path stack (dependency order)',
      steps: [
        'catalogmanager',
        'cad1',
        'order',
        'keyword',
        'compare',
        'pdf',
        'email',
        'rfi',
        'order-submit',
        'promotions',
        'pcat',
      ],
    },
  },
  prod: {
    'order-full': {
      description: 'WM Test Version → checkout → OM, then OM verify again',
      steps: ['cad1', 'order'],
    },
    order: {
      description: 'Order Manager only (auto checkout if no order ref)',
      steps: ['order'],
    },
    smoke: {
      description: 'Quick pub catalog smoke — no tools login, no WM',
      steps: ['keyword', 'compare', 'pdf'],
    },
    pub: {
      description: 'Pub catalog browsing flows',
      steps: ['keyword', 'compare', 'pdf', 'email', 'rfi'],
    },
    commerce: {
      description: 'Pub checkout flows (order ref written on thank-you)',
      steps: ['order-submit', 'promotions', 'pcat'],
    },
    tools: {
      description: 'Tools-side login flows',
      steps: ['catalogmanager'],
    },
    'happy-all': {
      description: 'Full PROD happy-path stack (dependency order)',
      steps: [
        'catalogmanager',
        'cad1',
        'order',
        'keyword',
        'compare',
        'pdf',
        'email',
        'rfi',
        'order-submit',
        'promotions',
        'pcat',
      ],
    },
  },
};

module.exports = { flowsByTarget, stacksByTarget };
