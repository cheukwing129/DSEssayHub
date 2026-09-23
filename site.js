/* Shared site-wide UI utilities and behaviour. */
((global) => {
  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const indexBy = (items, keyOf, valueOf = item => item) => {
    const result = {};
    (Array.isArray(items) ? items : []).forEach(item => {
      const key = keyOf(item);
      if (key === undefined || key === null || key === '') return;
      result[key] = valueOf(item);
    });
    return result;
  };

  const nameById = items => indexBy(items, item => item?.id, item => item?.name);
  const questionTextByKey = items => indexBy(
    items,
    item => item?.year != null && item?.questionNumber != null
      ? `${item.year}_${item.questionNumber}`
      : null,
    item => item?.questionFull
  );
  const itemById = items => indexBy(items, item => item?.id);

  const formatQuestionSourceYear = year => {
    const value = String(year ?? '').trim();
    if (value === '2012pp') return '2012 Pilot Paper';
    if (value.startsWith('文學')) return value;
    return /^\d{4}$/.test(value) ? `${value}年` : value;
  };

  global.DSEHub = global.DSEHub || {};
  global.DSEHub.escapeHtml = escapeHtml;
  global.DSEHub.nameById = nameById;
  global.DSEHub.questionTextByKey = questionTextByKey;
  global.DSEHub.itemById = itemById;
  global.DSEHub.formatQuestionSourceYear = formatQuestionSourceYear;

  if (typeof document === 'undefined') return;

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (!navToggle || !mainNav) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    mainNav.classList.toggle('is-open', !isOpen);
  });
})(globalThis);
