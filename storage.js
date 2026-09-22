/* Shared LocalStorage access for notes, materials and article progress. */
((global) => {
  const KEYS = Object.freeze({
    NOTES: 'dse_notes',
    MATERIALS: 'materialBank',
    ARTICLE_PROGRESS: 'articleProgress'
  });

  const resolveStorage = storage => storage || global.localStorage;

  function readArray(key, { storage, label = '資料' } = {}) {
    try {
      const store = resolveStorage(storage);
      if (!store) return [];
      const raw = store.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error(`讀取${label}失敗，可能是 LocalStorage 內容格式損毀：`, err);
      return [];
    }
  }

  function readObject(key, { storage, label = '資料' } = {}) {
    try {
      const store = resolveStorage(storage);
      if (!store) return {};
      const raw = store.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (err) {
      console.error(`讀取${label}失敗，可能是 LocalStorage 內容格式損毀：`, err);
      return {};
    }
  }

  function writeJson(key, value, { storage, label = '資料' } = {}) {
    try {
      const store = resolveStorage(storage);
      if (!store) return false;
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`儲存${label}失敗：`, err);
      return false;
    }
  }

  global.DSEHub = global.DSEHub || {};
  global.DSEHub.storage = { KEYS, readArray, readObject, writeJson };
})(globalThis);
