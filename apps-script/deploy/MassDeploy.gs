/**
 * BONUS — bulk attach the master library to client copies.
 *
 * This file is intended to run from an operations spreadsheet ("Deploy Console")
 * with a column of client Google Sheet URLs, OR from this bound project after
 * enabling the Apps Script API on the Google Cloud project.
 *
 * SpreadsheetApp cannot add a library by itself. The Apps Script API is required:
 *   https://script.googleapis.com/v1/projects/{scriptId}/content
 *
 * Setup
 *  1. Publish this codebase as a library (File > Share > Deploy as library)
 *     and put the library script ID in LIBRARY_ID below.
 *  2. Enable "Google Apps Script API" for the deployer account.
 *  3. Put client spreadsheet URLs in sheet "Deploy Console", column A, from row 2.
 *  4. Run deployToClientList() (from Admin after unlock, or from the script editor).
 */
var DEPLOY_CONFIG = {
  LIBRARY_ID: 'REPLACE_WITH_MASTER_LIBRARY_SCRIPT_ID',
  LIBRARY_SYMBOL: 'GrupoLynFinanceLib',
  LIBRARY_VERSION: 0,
  CONSOLE_SHEET: 'Deploy Console',
  BOOTSTRAP: [
    'function onOpen() {',
    '  GrupoLynFinanceLib.onOpen();',
    '}',
    'function promptUnlockAdmin() { GrupoLynFinanceLib.promptUnlockAdmin(); }',
    'function generateMonthlyComparativeReport() { GrupoLynFinanceLib.generateMonthlyComparativeReport(); }',
    'function createMonthlyComparativeGmailDraft() { GrupoLynFinanceLib.createMonthlyComparativeGmailDraft(); }',
    'function promptChangeAdminPin() { GrupoLynFinanceLib.promptChangeAdminPin(); }',
    'function lockAdminAndRebuildMenu() { GrupoLynFinanceLib.lockAdminAndRebuildMenu(); }'
  ].join('\n')
};

function deployToClientList() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(DEPLOY_CONFIG.CONSOLE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DEPLOY_CONFIG.CONSOLE_SHEET);
    sheet.getRange(1, 1, 1, 4).setValues([['Spreadsheet URL', 'Spreadsheet ID', 'Status', 'Detail']]);
  }
  var last = sheet.getLastRow();
  if (last < 2) {
    throw new Error('Add client spreadsheet URLs in column A starting at row 2.');
  }
  var urls = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < urls.length; i++) {
    var url = String(urls[i][0] || '').trim();
    if (!url) {
      continue;
    }
    try {
      var id = extractSpreadsheetId_(url);
      sheet.getRange(i + 2, 2).setValue(id);
      attachLibraryToSpreadsheet_(id);
      sheet.getRange(i + 2, 3, 1, 2).setValues([['OK', 'Library linked and bootstrap merged']]);
    } catch (err) {
      sheet.getRange(i + 2, 3, 1, 2).setValues([['ERROR', err.message]]);
    }
  }
}

function extractSpreadsheetId_(urlOrId) {
  var match = String(urlOrId).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }
  if (/^[a-zA-Z0-9-_]+$/.test(urlOrId)) {
    return urlOrId;
  }
  throw new Error('Unrecognized spreadsheet URL: ' + urlOrId);
}

function attachLibraryToSpreadsheet_(spreadsheetId) {
  var scriptId = getOrCreateBoundScriptId_(spreadsheetId);
  var token = ScriptApp.getOAuthToken();
  var content = fetchScriptContent_(scriptId, token);
  mergeLibraryDependency_(content);
  mergeBootstrapFile_(content);
  putScriptContent_(scriptId, content, token);
}

function getOrCreateBoundScriptId_(spreadsheetId) {
  var token = ScriptApp.getOAuthToken();
  var created = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ title: 'GrupoLyN Admin', parentId: spreadsheetId }),
    muteHttpExceptions: true
  });
  var code = created.getResponseCode();
  var body = JSON.parse(created.getContentText() || '{}');
  if (code >= 200 && code < 300 && body.scriptId) {
    return body.scriptId;
  }
  if (body.error && /already exists|duplicate/i.test(JSON.stringify(body.error))) {
    throw new Error(
      'This spreadsheet already has a bound script. Open it in the Apps Script editor, add library ' +
        DEPLOY_CONFIG.LIBRARY_ID +
        ' as ' +
        DEPLOY_CONFIG.LIBRARY_SYMBOL +
        ', and paste the bootstrap from MassDeploy.gs.'
    );
  }
  throw new Error('Could not create bound script: ' + created.getContentText());
}

function fetchScriptContent_(scriptId, token) {
  var res = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + scriptId + '/content', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    throw new Error('Read script content failed: ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function mergeLibraryDependency_(content) {
  content.files = content.files || [];
  var jsonFile = null;
  for (var i = 0; i < content.files.length; i++) {
    if (content.files[i].name === 'appsscript') {
      jsonFile = content.files[i];
      break;
    }
  }
  var manifest = jsonFile ? JSON.parse(jsonFile.source) : {};
  manifest.dependencies = manifest.dependencies || {};
  manifest.dependencies.libraries = manifest.dependencies.libraries || [];
  var found = false;
  manifest.dependencies.libraries.forEach(function (lib) {
    if (lib.libraryId === DEPLOY_CONFIG.LIBRARY_ID || lib.userSymbol === DEPLOY_CONFIG.LIBRARY_SYMBOL) {
      lib.libraryId = DEPLOY_CONFIG.LIBRARY_ID;
      lib.userSymbol = DEPLOY_CONFIG.LIBRARY_SYMBOL;
      lib.version = DEPLOY_CONFIG.LIBRARY_VERSION;
      lib.developmentMode = DEPLOY_CONFIG.LIBRARY_VERSION === 0;
      found = true;
    }
  });
  if (!found) {
    manifest.dependencies.libraries.push({
      userSymbol: DEPLOY_CONFIG.LIBRARY_SYMBOL,
      libraryId: DEPLOY_CONFIG.LIBRARY_ID,
      version: DEPLOY_CONFIG.LIBRARY_VERSION,
      developmentMode: DEPLOY_CONFIG.LIBRARY_VERSION === 0
    });
  }
  if (!jsonFile) {
    content.files.push({ name: 'appsscript', type: 'JSON', source: JSON.stringify(manifest, null, 2) });
  } else {
    jsonFile.source = JSON.stringify(manifest, null, 2);
  }
}

function mergeBootstrapFile_(content) {
  var name = 'GrupoLynBootstrap';
  var found = false;
  content.files.forEach(function (file) {
    if (file.name === name) {
      file.source = DEPLOY_CONFIG.BOOTSTRAP;
      found = true;
    }
  });
  if (!found) {
    content.files.push({ name: name, type: 'SERVER_JS', source: DEPLOY_CONFIG.BOOTSTRAP });
  }
}

function putScriptContent_(scriptId, content, token) {
  var res = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + scriptId + '/content', {
    method: 'put',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ files: content.files }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    throw new Error('Update script content failed: ' + res.getContentText());
  }
}
