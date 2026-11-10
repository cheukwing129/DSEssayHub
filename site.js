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
    if (value === '2012pp') return '2012 練習卷';
    if (value.startsWith('文學')) return value;
    return /^\d{4}$/.test(value) ? `${value}年` : value;
  };

  const renderWritingGuidance = guidance => {
    const sections = [
      ['requirements', '題目要求'],
      ['keyPoints', '審題要點'],
      ['pitfalls', '常見偏差與題目陷阱'],
      ['planning', '詳略與組織安排']
    ];
    const content = sections.map(([key, title]) => {
      const points = Array.isArray(guidance?.[key]) ? guidance[key] : [];
      if (!points.length) return '';
      return `<section class="writing-guidance-section"><h3>${title}</h3><ul>${points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul></section>`;
    }).join('');
    if (!content) return '<p>此題的審題參考尚待整理。</p>';
    return `<div class="writing-guidance"><p class="writing-guidance-note">以下為教學參考，詳略與組織建議可按立意和文體調整。</p>${content}</div>`;
  };

  global.DSEHub = global.DSEHub || {};
  global.DSEHub.escapeHtml = escapeHtml;
  global.DSEHub.nameById = nameById;
  global.DSEHub.questionTextByKey = questionTextByKey;
  global.DSEHub.itemById = itemById;
  global.DSEHub.formatQuestionSourceYear = formatQuestionSourceYear;
  global.DSEHub.renderWritingGuidance = renderWritingGuidance;

  if (typeof document === 'undefined') return;

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (!navToggle || !mainNav) return;

  const closeNav = ({ restoreFocus = false } = {}) => {
    navToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('is-open');
    if (restoreFocus) navToggle.focus();
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeNav();
    else {
      navToggle.setAttribute('aria-expanded', 'true');
      mainNav.classList.add('is-open');
    }
  });

  document.addEventListener('click', event => {
    if (navToggle.getAttribute('aria-expanded') !== 'true') return;
    if (navToggle.contains(event.target) || mainNav.contains(event.target)) return;
    closeNav();
  });

  const currentPage = global.location?.pathname?.split('/').pop() || 'index.html';
  mainNav.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    try {
      const linkPage = new URL(href, global.location.href).pathname.split('/').pop();
      if (linkPage === currentPage || (currentPage.startsWith('writing-guide-') && linkPage === 'writing-guides.html')) {
        link.setAttribute('aria-current', 'page');
      }
    } catch {
      // 非標準 href 不影響主導覽。
    }
    link.addEventListener('click', () => closeNav());
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeNav({ restoreFocus: true });
    }
  });
})(globalThis);
