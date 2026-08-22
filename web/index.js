// /root/xpd-dns/web/index.js

function copyEndpoint(text, wrapper) {
    navigator.clipboard.writeText(text).then(() => {
        const tooltip = wrapper.querySelector('.tooltip');
        if (tooltip) {
            const originalText = tooltip.innerText;
            const copiedText = (window.i18n && window.i18n.t('copy.copied')) || '¡Copiado!';
            tooltip.innerText = copiedText;
            setTimeout(() => {
                tooltip.innerText = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
    });
}

function switchGuide(guideId, btn) {
    document.querySelectorAll('.guide-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.guide-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetPanel = document.getElementById('guide-' + guideId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    if (btn) {
        btn.classList.add('active');
    }
}

function detectPlatform() {
    // 1. Check navigator.userAgentData (Modern Client Hints API)
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        const p = navigator.userAgentData.platform.toLowerCase();
        if (p.includes('android')) return 'android';
        if (p.includes('mac') || p.includes('ios')) return 'ios';
        if (p.includes('win')) return 'windows';
        if (p.includes('linux')) return 'linux';
    }

    // 2. Check navigator.userAgent / platform
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

    // Android (checked before Linux because Android user-agent contains 'linux')
    if (ua.includes('android')) {
        return 'android';
    }

    // iOS / iPadOS / macOS
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('macintosh') || ua.includes('mac os')) {
        return 'ios';
    }

    // iPad Pro / iPadOS 13+ requesting desktop site
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return 'ios';
    }

    // Windows
    if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
        return 'windows';
    }

    // Linux & Unix
    if (ua.includes('linux') || ua.includes('x11') || ua.includes('cros')) {
        return 'linux';
    }

    return 'android';
}

function autoSelectPlatformTab() {
    const platform = detectPlatform();
    const btn = document.querySelector(`.guide-tab[data-platform="${platform}"]`);
    if (btn) {
        switchGuide(platform, btn);
        // Only adjust horizontal scroll inside the tab bar container, without scrolling the page
        const tabsContainer = document.querySelector('.guide-tabs');
        if (tabsContainer) {
            tabsContainer.scrollLeft = btn.offsetLeft - (tabsContainer.clientWidth / 2) + (btn.clientWidth / 2);
        }
    } else {
        const defaultBtn = document.querySelector('.guide-tab[data-platform="android"]');
        if (defaultBtn) {
            switchGuide('android', defaultBtn);
        }
    }
}

function loadStats() {
    fetch('stats.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response not ok');
            return response.json();
        })
        .then(data => {
            if (data.stats_24h) {
                const total = data.stats_24h.total || 0;
                const blocked = data.stats_24h.blocked || 0;
                const pct = data.stats_24h.blocked_pct !== undefined ? data.stats_24h.blocked_pct : (total > 0 ? ((blocked / total) * 100).toFixed(1) : 0);

                document.getElementById('stat-total').innerText = Number(total).toLocaleString();
                document.getElementById('stat-blocked').innerText = Number(blocked).toLocaleString();
                document.getElementById('stat-percent').innerText = pct + '%';
            }
        })
        .catch(err => {
            console.log('Esperando actualización de estadísticas:', err);
            document.getElementById('stat-total').innerText = '0';
            document.getElementById('stat-blocked').innerText = '0';
            document.getElementById('stat-percent').innerText = '0.0%';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    autoSelectPlatformTab();
    loadStats();
    // Auto refresh stats every 30s
    setInterval(loadStats, 30000);
});
