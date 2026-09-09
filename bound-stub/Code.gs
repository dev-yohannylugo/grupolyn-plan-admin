/**
 * Minimal bound stub used when the spreadsheet is linked to the master library.
 * The demonstration copy ships with the full apps-script/ project bound instead,
 * so the menu works without a library ID. Keep this file for mass rollout.
 */
function onOpen() {
  GrupoLynFinanceLib.onOpen();
}

function promptUnlockAdmin() {
  GrupoLynFinanceLib.promptUnlockAdmin();
}

function generateMonthlyComparativeReport() {
  GrupoLynFinanceLib.generateMonthlyComparativeReport();
}

function createMonthlyComparativeGmailDraft() {
  GrupoLynFinanceLib.createMonthlyComparativeGmailDraft();
}

function promptChangeAdminPin() {
  GrupoLynFinanceLib.promptChangeAdminPin();
}

function lockAdminAndRebuildMenu() {
  GrupoLynFinanceLib.lockAdminAndRebuildMenu();
}
