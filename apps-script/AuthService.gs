/**
 * Admin PIN stored in Script Properties. Session lives in user cache.
 * This is an accidental-use lock, not enterprise security.
 */
function ensureDefaultPin_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(CONFIG.PIN_PROPERTY)) {
    props.setProperty(CONFIG.PIN_PROPERTY, CONFIG.DEFAULT_ADMIN_PIN);
  }
}

function getStoredPin_() {
  ensureDefaultPin_();
  return PropertiesService.getScriptProperties().getProperty(CONFIG.PIN_PROPERTY);
}

function isAdminUnlocked() {
  return CacheService.getUserCache().get(CONFIG.SESSION_CACHE_KEY) === '1';
}

function unlockAdminWithPin(pin) {
  if (String(pin) === getStoredPin_()) {
    CacheService.getUserCache().put(CONFIG.SESSION_CACHE_KEY, '1', CONFIG.SESSION_SECONDS);
    return true;
  }
  return false;
}

function lockAdminSession() {
  CacheService.getUserCache().remove(CONFIG.SESSION_CACHE_KEY);
}

function changeAdminPin(currentPin, newPin) {
  var next = String(newPin || '').trim();
  if (!next) {
    throw new Error('The new PIN cannot be empty.');
  }
  if (String(currentPin) !== getStoredPin_()) {
    throw new Error('Current PIN is incorrect.');
  }
  PropertiesService.getScriptProperties().setProperty(CONFIG.PIN_PROPERTY, next);
  CacheService.getUserCache().put(CONFIG.SESSION_CACHE_KEY, '1', CONFIG.SESSION_SECONDS);
}
