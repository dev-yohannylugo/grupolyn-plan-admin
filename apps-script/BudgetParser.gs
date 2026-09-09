function parseMonthlyBudget(ss) {
  var sheet = ss.getSheetByName(CONFIG.BUDGET_SHEET);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.BUDGET_SHEET + '" was not found.');
  }
  var lastRow = Math.max(sheet.getLastRow(), CONFIG.DATA_START_ROW);
  var values = sheet.getRange(1, 1, lastRow, CONFIG.COL.HIDE).getValues();
  var year = values[CONFIG.YEAR_CELL.row - 1][CONFIG.YEAR_CELL.col - 1];
  var month = values[CONFIG.MONTH_CELL.row - 1][CONFIG.MONTH_CELL.col - 1];

  var inExpenses = false;
  var categories = [];
  var current = null;
  var income = { planned: null, actual: null };

  for (var i = CONFIG.DATA_START_ROW - 1; i < values.length; i++) {
    var section = String(values[i][CONFIG.COL.SECTION - 1] || '').trim();
    var group = String(values[i][CONFIG.COL.GROUP - 1] || '').trim();
    var item = String(values[i][CONFIG.COL.ITEM - 1] || '').trim();
    var planned = toNumber_(values[i][CONFIG.COL.BUDGET - 1]);
    var actual = toNumber_(values[i][CONFIG.COL.ACTUAL - 1]);
    var hidden = String(values[i][CONFIG.COL.HIDE - 1] || '').toLowerCase() === 'hide';

    if (section.indexOf(CONFIG.STOP_SECTION_PREFIX) === 0) {
      break;
    }
    if (section === 'Income') {
      inExpenses = false;
      continue;
    }
    if (section === CONFIG.EXPENSE_SECTION) {
      inExpenses = true;
      continue;
    }
    if (section === 'Total Income') {
      income.planned = planned;
      income.actual = actual;
      continue;
    }
    if (section.indexOf('Total ') === 0) {
      continue;
    }
    if (!inExpenses) {
      continue;
    }
    if (group && !item) {
      if (group.indexOf('Total ') === 0) {
        var totalName = group.substring(6);
        var cat = findCategory_(categories, totalName) || current;
        if (cat) {
          cat.planned = planned;
          cat.actual = actual;
        }
        continue;
      }
      current = { name: group, planned: 0, actual: 0, items: [] };
      categories.push(current);
      continue;
    }
    if (item && current) {
      current.items.push({
        name: item,
        planned: planned,
        actual: actual,
        hidden: hidden
      });
    }
  }

  categories.forEach(function (cat) {
    if (!cat.planned && !cat.actual) {
      var sums = sumVisibleItems_(cat.items);
      cat.planned = sums.planned;
      cat.actual = sums.actual;
    }
  });

  return {
    year: year,
    month: month,
    income: income,
    categories: categories
  };
}

function findCategory_(categories, name) {
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name === name) {
      return categories[i];
    }
  }
  return null;
}

function sumVisibleItems_(items) {
  var planned = 0;
  var actual = 0;
  items.forEach(function (it) {
    if (it.hidden) {
      return;
    }
    planned += it.planned;
    actual += it.actual;
  });
  return { planned: planned, actual: actual };
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  var n = Number(String(value).replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : n;
}
