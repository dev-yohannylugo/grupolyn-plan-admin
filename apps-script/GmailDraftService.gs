function createDraftFromAnalysis(analysis, body) {
  var period = String(analysis.month || '') + ' ' + String(analysis.year || '');
  var subject = 'Monthly comparative report — ' + period;
  var draft = GmailApp.createDraft('', subject, body);
  return draft;
}
