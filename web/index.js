// index.js

const DNS_MODES = {
    adblock: {
        doh: 'https://dns.xdp.es/dns-query',
        dot: 'dns.xdp.es',
        ipv4: '85.208.114.51',
        ipv6: '2a0e:97c0:c40::51',
        ipv4Secondary: '51.170.52.10',
        ipv6Secondary: '2603:c027:8703:d400::10',
        dohProfile: 'dns_xdp_es_doh.mobileconfig',
        dotProfile: 'dns_xdp_es_dot.mobileconfig',
        stamp: 'sdns://AgMAAAAAAAAADTg1LjIwOC4xMTQuNTEACmRucy54ZHAuZXMKL2Rucy1xdWVyeQ'
    },
    standard: {
        doh: 'https://lite.xdp.es/dns-query',
        dot: 'lite.xdp.es',
        ipv4: '85.208.114.52',
        ipv6: '2a0e:97c0:c40::52',
        ipv4Secondary: '51.170.54.40',
        ipv6Secondary: '2603:c027:8703:d400::40',
        dohProfile: 'lite_xdp_es_doh.mobileconfig',
        dotProfile: 'lite_xdp_es_dot.mobileconfig',
        stamp: 'sdns://AgcAAAAAAAAADTg1LjIwOC4xMTQuNTIAC2xpdGUueGRwLmVzCi9kbnMtcXVlcnk'
    }
};

let currentDnsMode = 'adblock';

function copyCurrentEndpoint(key, wrapper) {
    copyEndpoint(DNS_MODES[currentDnsMode][key], wrapper);
}

function refreshGuideEndpoints() {
    const selected = DNS_MODES[currentDnsMode];
    document.querySelectorAll('[data-platform-guide]').forEach(panel => {
        if (!panel.dataset.adblockTemplate) panel.dataset.adblockTemplate = panel.innerHTML;
        panel.innerHTML = panel.dataset.adblockTemplate
            .replaceAll('https://dns.xdp.es/dns-query', selected.doh)
            .replaceAll('dns.xdp.es', selected.dot)
            .replaceAll('85.208.114.51', selected.ipv4)
            .replaceAll('2a0e:97c0:c40::51', selected.ipv6)
            .replaceAll('dns_xdp_es_doh.mobileconfig', selected.dohProfile)
            .replaceAll('dns_xdp_es_dot.mobileconfig', selected.dotProfile)
            .replaceAll('sdns://AgMAAAAAAAAADTg1LjIwOC4xMTQuNTEACmRucy54ZHAuZXMKL2Rucy1xdWVyeQ', selected.stamp);
    });
}

function setDnsMode(mode) {
    if (!DNS_MODES[mode]) return;
    currentDnsMode = mode;
    document.body.dataset.dnsMode = mode;
    try { localStorage.setItem('xdp_dns_mode', mode); } catch (e) {}

    document.querySelectorAll('.dns-mode-btn').forEach(btn => {
        const active = btn.dataset.dnsMode === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });

    const selected = DNS_MODES[mode];
    document.getElementById('doh-endpoint-value').textContent = selected.doh;
    document.getElementById('dot-hostname-value').textContent = selected.dot;
    document.getElementById('ipv4-value').textContent = selected.ipv4;
    document.getElementById('ipv6-value').textContent = selected.ipv6;
    const secondaryIpv4 = document.getElementById('ipv4-secondary-value');
    const secondaryIpv6 = document.getElementById('ipv6-secondary-value');
    if (secondaryIpv4) secondaryIpv4.textContent = selected.ipv4Secondary;
    if (secondaryIpv6) secondaryIpv6.textContent = selected.ipv6Secondary;

    const dohProfileLink = document.getElementById('profile-doh-link');
    const dotProfileLink = document.getElementById('profile-dot-link');
    const dohProfileLabel = document.getElementById('profile-doh-label');
    const dotProfileLabel = document.getElementById('profile-dot-label');
    if (dohProfileLink) dohProfileLink.href = selected.dohProfile;
    if (dotProfileLink) dotProfileLink.href = selected.dotProfile;
    if (dohProfileLabel) dohProfileLabel.textContent = mode === 'standard' ? 'xdp.es Standard DoH DNS' : 'xdp.es AdBlock DoH DNS';
    if (dotProfileLabel) dotProfileLabel.textContent = mode === 'standard' ? 'xdp.es Standard DoT DNS' : 'xdp.es AdBlock DoT DNS';

    const stdTitle = document.getElementById('std-dns-title');
    const stdDesc = document.getElementById('std-dns-desc');
    const titleKey = mode === 'standard' ? 'std.title_standard' : 'std.title_adblock';
    const descKey = mode === 'standard' ? 'std.desc_standard' : 'std.desc_adblock';
    if (stdTitle) {
        stdTitle.setAttribute('data-i18n', titleKey);
        stdTitle.innerText = (window.i18n && window.i18n.t(titleKey)) || (mode === 'standard' ? 'DNS Estándar' : 'DNS Adblock');
    }
    if (stdDesc) {
        stdDesc.setAttribute('data-i18n', descKey);
        stdDesc.innerText = (window.i18n && window.i18n.t(descKey)) || (mode === 'standard' ? 'Resolución DNS estándar con validación DNSSEC.' : 'Resolución DNS con filtrado Adblock y validación DNSSEC.');
    }

    const dohCard = document.querySelector('[data-agent-protocol="doh"]');
    const dotCard = document.querySelector('[data-agent-protocol="dot"]');
    if (dohCard) dohCard.dataset.endpointUrl = selected.doh;
    if (dotCard) dotCard.dataset.endpointHostname = selected.dot;

    refreshGuideEndpoints();

}

window.addEventListener('langchange', () => {
    document.querySelectorAll('[data-platform-guide]').forEach(panel => delete panel.dataset.adblockTemplate);
    setDnsMode(currentDnsMode);
});

function copyEndpoint(text, wrapper) {
    navigator.clipboard.writeText(text).then(() => {
        const tooltip = wrapper.querySelector('.tooltip');
        if (tooltip) {
            if (!tooltip.dataset.defaultText) {
                tooltip.dataset.defaultText = tooltip.innerText;
            }
            tooltip.innerText = (window.i18n && window.i18n.t('copy.copied')) || '¡Copiado!';
            clearTimeout(copyEndpoint._restoreTimer);
            copyEndpoint._restoreTimer = setTimeout(() => {
                // Prefer the i18n value so the restored text follows the active language
                tooltip.innerText = (window.i18n && window.i18n.t('copy.tooltip')) || tooltip.dataset.defaultText;
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
        tab.setAttribute('aria-selected', 'false');
    });

    const targetPanel = document.getElementById('guide-' + guideId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
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
    fetch('stats.json?t=' + Date.now())
        .then(response => {
            if (!response.ok) throw new Error('Network response not ok');
            return response.json();
        })
        .then(data => {
            if (data.stats_24h) {
                const total = data.stats_24h.total || 0;
                const blocked = data.stats_24h.blocked || 0;
                const evaded = data.stats_24h.evaded || 0;
                const pct = data.stats_24h.blocked_pct !== undefined ? data.stats_24h.blocked_pct : (total > 0 ? ((blocked / total) * 100).toFixed(1) : 0);

                const elTotal = document.getElementById('stat-total');
                const elBlocked = document.getElementById('stat-blocked');
                const elEvaded = document.getElementById('stat-evaded');
                const elPercent = document.getElementById('stat-percent');

                if (elTotal) elTotal.innerText = Number(total).toLocaleString();
                if (elBlocked) elBlocked.innerText = Number(blocked).toLocaleString();
                if (elEvaded) elEvaded.innerText = Number(evaded).toLocaleString();
                if (elPercent) elPercent.innerText = pct + '%';
            }
        })
        .catch(err => {
            console.log('Esperando actualización de estadísticas:', err);
            const elTotal = document.getElementById('stat-total');
            const elBlocked = document.getElementById('stat-blocked');
            const elEvaded = document.getElementById('stat-evaded');
            const elPercent = document.getElementById('stat-percent');

            if (elTotal) elTotal.innerText = '0';
            if (elBlocked) elBlocked.innerText = '0';
            if (elEvaded) elEvaded.innerText = '0';
            if (elPercent) elPercent.innerText = '0.0%';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    let savedMode = 'adblock';
    try { savedMode = localStorage.getItem('xdp_dns_mode') || 'adblock'; } catch (e) {}
    setDnsMode(savedMode);
    autoSelectPlatformTab();
    loadStats();
    // Auto refresh stats every 30s
    setInterval(loadStats, 30000);
});
