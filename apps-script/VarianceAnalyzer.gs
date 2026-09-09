function analyzeBudgetVariance(model) {
  var threshold = CONFIG.VARIANCE_THRESHOLD;
  var rows = model.categories.map(function (cat) {
    var variance = cat.actual - cat.planned;
    var pct = percentDelta_(cat.planned, cat.actual);
    var empty = cat.planned === 0 && cat.actual === 0;
    var significant = !empty && isFinite(pct) && Math.abs(pct) >= threshold;
    if (!empty && !isFinite(pct) && cat.actual !== 0) {
      significant = true;
    }
    return {
      name: cat.name,
      planned: cat.planned,
      actual: cat.actual,
      variance: variance,
      pct: pct,
      significant: significant,
      overBudget: cat.actual > cat.planned,
      drivers: significant ? pickDrivers_(cat, variance) : []
    };
  });
  return {
    year: model.year,
    month: model.month,
    income: model.income,
    categories: rows
  };
}

function percentDelta_(planned, actual) {
  if (planned === 0) {
    return actual === 0 ? 0 : Infinity;
  }
  return (actual - planned) / planned;
}

function pickDrivers_(cat, categoryVariance) {
  var items = cat.items.filter(function (it) {
    return !it.hidden && (it.actual - it.planned) !== 0;
  });
  items.sort(function (a, b) {
    return Math.abs(b.actual - b.planned) - Math.abs(a.actual - a.planned);
  });
  var gap = Math.abs(categoryVariance);
  var acc = 0;
  var drivers = [];
  for (var i = 0; i < items.length && drivers.length < CONFIG.MAX_DRIVERS; i++) {
    var item = items[i];
    var delta = Math.abs(item.actual - item.planned);
    if (delta === 0) {
      continue;
    }
    drivers.push(item);
    acc += delta;
    if (acc >= CONFIG.DRIVER_COVERAGE * gap && drivers.length >= 1) {
      break;
    }
  }
  return drivers;
}
