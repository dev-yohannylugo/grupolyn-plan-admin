function onOpen() {
  try {
    if (typeof _legacyOnOpen === 'function') {
      _legacyOnOpen();
    }
  } catch (e) {}
  ensureDefaultPin_();
  buildAdminMenu();
}

function buildAdminMenu() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('Admin');
  if (!isAdminUnlocked()) {
    menu.addItem('Unlock…', 'promptUnlockAdmin');
  } else {
    menu
      .addItem('Generate monthly comparative report', 'generateMonthlyComparativeReport')
      .addItem('Create Gmail draft', 'createMonthlyComparativeGmailDraft')
      .addSeparator()
      .addItem('Change admin PIN…', 'promptChangeAdminPin')
      .addItem('Lock Admin', 'lockAdminAndRebuildMenu');
  }
  menu.addToUi();
}

function promptUnlockAdmin() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    'Admin access',
    'Enter the administrator PIN.',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  if (unlockAdminWithPin(result.getResponseText())) {
    buildAdminMenu();
    ui.alert('Admin unlocked. Open the Admin menu again to use the tools.');
  } else {
    ui.alert('Incorrect PIN.');
  }
}

function lockAdminAndRebuildMenu() {
  lockAdminSession();
  buildAdminMenu();
  SpreadsheetApp.getUi().alert('Admin locked.');
}

function promptChangeAdminPin() {
  requireAdmin_();
  var ui = SpreadsheetApp.getUi();
  var current = ui.prompt('Change PIN', 'Enter the current PIN.', ui.ButtonSet.OK_CANCEL);
  if (current.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  var next = ui.prompt('Change PIN', 'Enter the new PIN.', ui.ButtonSet.OK_CANCEL);
  if (next.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  var confirm = ui.prompt('Change PIN', 'Confirm the new PIN.', ui.ButtonSet.OK_CANCEL);
  if (confirm.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  if (next.getResponseText() !== confirm.getResponseText()) {
    ui.alert('The new PIN and confirmation do not match.');
    return;
  }
  try {
    changeAdminPin(current.getResponseText(), next.getResponseText());
    ui.alert('PIN updated.');
  } catch (err) {
    ui.alert(err.message);
  }
}

function requireAdmin_() {
  if (!isAdminUnlocked()) {
    throw new Error('Admin is locked. Unlock the Admin menu first.');
  }
}
