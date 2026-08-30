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
        let effectiveTheme = theme;
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            effectiveTheme = prefersDark ? 'dark' : 'light';
        }

        root.setAttribute('data-theme', effectiveTheme);
        const isDark = (effectiveTheme === 'dark' || effectiveTheme === 'oled');
        const bgColor = isDark ? '#0e0f12' : '#f8fafc';
        const textColor = isDark ? '#f3f4f6' : '#1e293b';

        // Update inline styles on html and body to ensure instant canvas, top/bottom overscroll recoloring
        root.style.backgroundColor = bgColor;
        root.style.colorScheme = isDark ? 'dark' : 'light';
        if (document.body) {
            document.body.style.backgroundColor = bgColor;
            document.body.style.color = textColor;
        }

        // Update all meta[name="theme-color"] tags for browser status bar and address bar
        const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
        if (metaThemes.length > 0) {
            metaThemes.forEach(m => {
                m.removeAttribute('media');
                m.setAttribute('content', bgColor);
            });
        } else {
            const m = document.createElement('meta');
            m.setAttribute('name', 'theme-color');
            m.setAttribute('content', bgColor);
            document.head.appendChild(m);
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
