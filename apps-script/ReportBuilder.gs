function formatMoney_(amount) {
  var n = Number(amount) || 0;
  var abs = Math.abs(n);
  var formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return (n < 0 ? '-$' : '$') + formatted;
}

function formatPct_(pct) {
  if (!isFinite(pct)) {
    return 'n/a (no planned amount)';
  }
  return (Math.abs(pct) * 100).toFixed(1) + '%';
}

function buildReportText(analysis) {
  var period = String(analysis.month || '') + ' ' + String(analysis.year || '');
  var lines = [];
  lines.push('GrupoLyN monthly comparative report');
  lines.push('Period: ' + period);
  lines.push('Template version: ' + CONFIG.APP_VERSION);
  lines.push('Threshold: ' + (CONFIG.VARIANCE_THRESHOLD * 100) + '% of planned');
  lines.push('');
  if (analysis.income && (analysis.income.planned || analysis.income.actual)) {
    lines.push(
      'Income: ' +
        formatMoney_(analysis.income.actual) +
        ' actual vs ' +
        formatMoney_(analysis.income.planned) +
        ' planned'
    );
    lines.push('');
  }
  analysis.categories.forEach(function (cat) {
    if (cat.planned === 0 && cat.actual === 0) {
      return;
    }
    if (cat.significant) {
      var direction = cat.overBudget ? 'over budget' : 'under budget';
      lines.push(cat.name + ' is ' + direction + ' by ' + formatPct_(cat.pct) + '.');
      cat.drivers.forEach(function (item) {
        lines.push(
          '- ' +
            item.name +
            ': ' +
            formatMoney_(item.actual) +
            ' (Actual) vs ' +
            formatMoney_(item.planned) +
            ' (Planned)'
        );
      });
      lines.push('');
    } else {
      lines.push(
        cat.name +
          ': ' +
          formatMoney_(cat.actual) +
          ' actual vs ' +
          formatMoney_(cat.planned) +
          ' planned'
      );
    }
  });
  return lines.join('\n').trim() + '\n';
}

function writeReportSheet(ss, analysis, body) {
  var sheet = ss.getSheetByName(CONFIG.REPORT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.REPORT_SHEET);
  } else {
    sheet.clear();
  }
  var period = String(analysis.month || '') + ' ' + String(analysis.year || '');
  var header = [
    ['GrupoLyN monthly comparative report'],
    ['Period', period],
    ['Generated', new Date()],
    ['Version', CONFIG.APP_VERSION],
    ['Variance threshold', CONFIG.VARIANCE_THRESHOLD],
    []
  ];
  sheet.getRange(1, 1, header.length, 2).setValues(
    header.map(function (row) {
      return [row[0] || '', row[1] === undefined ? '' : row[1]];
    })
  );
  sheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  var tableHeader = ['Category', 'Actual', 'Planned', 'Variance $', 'Variance %', 'Status', 'Notes'];
  var start = header.length + 1;
  sheet.getRange(start, 1, 1, tableHeader.length).setValues([tableHeader]).setFontWeight('bold');
  var rows = [];
  var noteRows = [];
  analysis.categories.forEach(function (cat) {
    if (cat.planned === 0 && cat.actual === 0) {
      return;
    }
    var status = cat.significant ? (cat.overBudget ? 'Over' : 'Under') : 'OK';
    var note = cat.significant
      ? cat.name + ' is ' + (cat.overBudget ? 'over' : 'under') + ' budget by ' + formatPct_(cat.pct) + '.'
      : '';
    rows.push([
      cat.name,
      cat.actual,
      cat.planned,
      cat.variance,
      isFinite(cat.pct) ? cat.pct : '',
      status,
      note
    ]);
    if (cat.significant) {
      cat.drivers.forEach(function (item) {
        noteRows.push([
          '  ' + item.name,
          item.actual,
          item.planned,
          item.actual - item.planned,
          percentDelta_(item.planned, item.actual),
          '',
          formatMoney_(item.actual) + ' (Actual) vs ' + formatMoney_(item.planned) + ' (Planned)'
        ]);
        rows.push(noteRows[noteRows.length - 1]);
      });
    }
  });
  if (rows.length) {
    sheet.getRange(start + 1, 1, rows.length, tableHeader.length).setValues(rows);
    sheet.getRange(start + 1, 2, rows.length, 4).setNumberFormat('$#,##0.00');
    sheet.getRange(start + 1, 5, rows.length, 1).setNumberFormat('0.0%');
  }
  var textStart = start + rows.length + 3;
  sheet.getRange(textStart, 1).setValue('Client-ready summary').setFontWeight('bold');
  sheet.getRange(textStart + 1, 1).setValue(body);
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(7, 420);
  sheet.setFrozenRows(start);
}

function stampCoverVersion(ss) {
  var cover = ss.getSheetByName(CONFIG.COVER_SHEET);
  if (!cover) {
    return;
  }
  var range = cover.getDataRange();
  var values = range.getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      if (String(values[r][c]).indexOf('Version 2.3') !== -1) {
        cover.getRange(r + 1, c + 1).setValue(String(values[r][c]).replace('Version 2.3', 'Version ' + CONFIG.APP_VERSION));
      }
    }
  }
}
