// theme.js
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

    // Instant prefetch on link hover/touch to eliminate navigation delay & white flash
    const prefetchedUrls = new Set();
    function prefetchUrl(url) {
        if (!url || prefetchedUrls.has(url)) return;
        prefetchedUrls.add(url);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
    }

    function handleLinkInteraction(e) {
        const target = e.target && e.target.closest && e.target.closest('a[href]');
        if (!target) return;
        const href = target.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//') && !href.includes('#') && !target.hasAttribute('download')) {
            if (href === '/test' || href.startsWith('/test/') || href === '/block-ota' || href.startsWith('/block-ota/')) return;
            prefetchUrl(href);
        }
    }

    document.addEventListener('pointerenter', handleLinkInteraction, { passive: true, capture: true });
    document.addEventListener('touchstart', handleLinkInteraction, { passive: true, capture: true });
})();
