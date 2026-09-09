/**
 * Public entry points for the bound spreadsheet and for the master library.
 */
function generateMonthlyComparativeReport() {
  requireAdmin_();
  var ss = SpreadsheetApp.getActive();
  stampCoverVersion(ss);
  var analysis = analyzeBudgetVariance(parseMonthlyBudget(ss));
  var body = buildReportText(analysis);
  writeReportSheet(ss, analysis, body);
  ss.setActiveSheet(ss.getSheetByName(CONFIG.REPORT_SHEET));
}

function createMonthlyComparativeGmailDraft() {
  requireAdmin_();
  var ss = SpreadsheetApp.getActive();
  var analysis = analyzeBudgetVariance(parseMonthlyBudget(ss));
  var body = buildReportText(analysis);
  writeReportSheet(ss, analysis, body);
  var draft = createDraftFromAnalysis(analysis, body);
  SpreadsheetApp.getUi().alert(
    'Gmail draft created.\nOpen Gmail Drafts to review before sending.\nDraft id: ' + draft.getId()
  );
}
