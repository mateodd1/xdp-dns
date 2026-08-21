// /root/xpd-dns/web/theme.js
// Theme Manager: Dark, Light, and Auto (prefers-color-scheme)

(function() {
    const THEME_KEY = 'xdp_theme';

    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'auto';
        } catch (e) {
            return 'auto';
        }
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
        updateThemeUI(theme);
    }

    function setTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {}
        applyTheme(theme);
    }

    function updateThemeUI(activeTheme) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const val = btn.getAttribute('data-theme-val');
            if (val === activeTheme) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // Expose functions globally
    window.setTheme = setTheme;
    window.applyTheme = applyTheme;
    window.getStoredTheme = getStoredTheme;

    // React to system/browser color scheme changes when theme is set to 'auto'
    try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (getStoredTheme() === 'auto') {
                applyTheme('auto');
            }
        });
    } catch (e) {}

    // Initialize UI once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateThemeUI(getStoredTheme());
        });
    } else {
        updateThemeUI(getStoredTheme());
    }
})();
