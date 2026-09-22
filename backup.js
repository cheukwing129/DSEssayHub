/* Backup validation for notes, materials and article progress. */
((global) => {
  const COLORS = new Set(['yellow', 'pink', 'blue']);

  const isPlainObject = value =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

  function normalizeArticleId(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text)) return null;
    const number = Number(text);
    return Number.isSafeInteger(number) && number > 0 ? String(number) : null;
  }

  function normalizeParagraphIndex(value) {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  function normalizeTimestamp(value) {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  function sanitizeNote(item) {
    if (!isPlainObject(item)) return null;

    const articleId = normalizeArticleId(item.articleId);
    const paragraphIndex = normalizeParagraphIndex(item.paragraphIndex);
    if (!articleId || paragraphIndex === null) return null;

    if (item.type === 'highlight') {
      if (!COLORS.has(item.color)) return null;
      if (item.noteContent != null && typeof item.noteContent !== 'string') return null;
      if (item.text != null && typeof item.text !== 'string') return null;
      return {
        articleId,
        paragraphIndex,
        type: 'highlight',
        color: item.color,
        text: item.text ?? '',
        noteContent: item.noteContent ?? '',
        timestamp: normalizeTimestamp(item.timestamp)
      };
    }

    if (item.type === 'comment') {
      if (typeof item.noteContent !== 'string') return null;
      if (item.text != null && typeof item.text !== 'string') return null;
      return {
        articleId,
        paragraphIndex,
        type: 'comment',
        color: '',
        text: item.text ?? '',
        noteContent: item.noteContent,
        timestamp: normalizeTimestamp(item.timestamp)
      };
    }

    return null;
  }

  function sanitizeMaterial(item) {
    if (!isPlainObject(item)) return null;

    const articleId = normalizeArticleId(item.articleId);
    const paragraphIndex = normalizeParagraphIndex(item.paragraphIndex);
    if (!articleId || paragraphIndex === null) return null;
    if (item.type != null && item.type !== 'material') return null;
    if (typeof item.text !== 'string' || !item.text.trim()) return null;

    return {
      articleId,
      paragraphIndex,
      type: 'material',
      text: item.text,
      timestamp: normalizeTimestamp(item.timestamp)
    };
  }

  function sanitizeProgressRecord(articleIdValue, record) {
    const articleId = normalizeArticleId(articleIdValue);
    if (!articleId || !isPlainObject(record)) return null;

    const recognizedKeys = [
      'structureNote',
      'reflectionNote',
      'trainingModeAnswer',
      'trainingModeRevealed',
      'updatedAt'
    ];
    if (!recognizedKeys.some(key => Object.prototype.hasOwnProperty.call(record, key))) return null;

    for (const key of ['structureNote', 'reflectionNote', 'trainingModeAnswer']) {
      if (record[key] != null && typeof record[key] !== 'string') return null;
    }
    if (record.trainingModeRevealed != null && typeof record.trainingModeRevealed !== 'boolean') return null;
    if (record.updatedAt != null && (!Number.isFinite(record.updatedAt) || record.updatedAt < 0)) return null;

    return {
      articleId,
      value: {
        structureNote: record.structureNote ?? '',
        reflectionNote: record.reflectionNote ?? '',
        trainingModeAnswer: record.trainingModeAnswer ?? '',
        trainingModeRevealed: record.trainingModeRevealed ?? false,
        updatedAt: normalizeTimestamp(record.updatedAt)
      }
    };
  }

  function sanitizeBackup(backup) {
    if (!isPlainObject(backup)) {
      return { ok: false, error: '備份檔案格式不正確。' };
    }

    const version = backup.version ?? 1;
    if (version !== 1) {
      return { ok: false, error: `不支援的備份版本：${String(version)}。` };
    }

    let invalidCount = 0;
    const notes = [];
    const materials = [];
    const progress = {};

    if (backup.dse_notes != null) {
      if (!Array.isArray(backup.dse_notes)) invalidCount++;
      else {
        backup.dse_notes.forEach(item => {
          const clean = sanitizeNote(item);
          if (clean) notes.push(clean);
          else invalidCount++;
        });
      }
    }

    if (backup.materialBank != null) {
      if (!Array.isArray(backup.materialBank)) invalidCount++;
      else {
        backup.materialBank.forEach(item => {
          const clean = sanitizeMaterial(item);
          if (clean) materials.push(clean);
          else invalidCount++;
        });
      }
    }

    if (backup.articleProgress != null) {
      if (!isPlainObject(backup.articleProgress)) invalidCount++;
      else {
        Object.entries(backup.articleProgress).forEach(([articleId, record]) => {
          const clean = sanitizeProgressRecord(articleId, record);
          if (clean) progress[clean.articleId] = clean.value;
          else invalidCount++;
        });
      }
    }

    return {
      ok: true,
      version: 1,
      invalidCount,
      data: {
        dse_notes: notes,
        materialBank: materials,
        articleProgress: progress
      }
    };
  }

  global.DSEHub = global.DSEHub || {};
  global.DSEHub.backup = { sanitizeBackup };
})(globalThis);
