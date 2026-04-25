// theme.js — shared dark/light mode toggle for all pages

(function () {
  // Apply saved theme immediately (before render)
  const saved = localStorage.getItem('caf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

    // Build the toggle button
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.setAttribute('aria-label', 'Toggle dark/light mode');
    btn.innerHTML = `<span class="theme-btn-icon">${isLight() ? '☀️' : '🌙'}</span><span class="theme-btn-label">${isLight() ? 'Light Mode' : 'Dark Mode'}</span>`;

    btn.addEventListener('click', function () {
      const next = isLight() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('caf_theme', next);
      btn.querySelector('.theme-btn-icon').textContent = next === 'light' ? '☀️' : '🌙';
      btn.querySelector('.theme-btn-label').textContent = next === 'light' ? 'Light Mode' : 'Dark Mode';
    });

    // Wrap the ← Home link + theme button in a vertical stack
    const backNav = document.querySelector('.back-nav');
    if (backNav) {
      const wrapper = document.createElement('div');
      wrapper.id = 'navStack';
      backNav.parentNode.insertBefore(wrapper, backNav);
      wrapper.appendChild(backNav);
      wrapper.appendChild(btn);
    }
  });
})();


