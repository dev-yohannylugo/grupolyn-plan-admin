/**
 * GrupoLyN Finance Admin — configuration (template version 2.4).
 */
var CONFIG = {
  APP_VERSION: '2.4',
  DEFAULT_ADMIN_PIN: 'GrupoLyn2026',
  PIN_PROPERTY: 'ADMIN_PIN',
  SESSION_CACHE_KEY: 'ADMIN_UNLOCKED',
  SESSION_SECONDS: 1800,
  BUDGET_SHEET: 'Monthly Budget',
  REPORT_SHEET: 'Admin Comparative Report',
  COVER_SHEET: 'Cover',
  VARIANCE_THRESHOLD: 0.15,
  MAX_DRIVERS: 3,
  DRIVER_COVERAGE: 0.5,
  YEAR_CELL: { row: 2, col: 6 },
  MONTH_CELL: { row: 3, col: 6 },
  HEADER_ROW: 5,
  DATA_START_ROW: 7,
  COL: {
    SECTION: 1,
    GROUP: 2,
    ITEM: 3,
    BUDGET: 4,
    ACTUAL: 6,
    HIDE: 16
  },
  EXPENSE_SECTION: 'Expenses & Debt Service',
  STOP_SECTION_PREFIX: 'Cash Flow Position'
};
