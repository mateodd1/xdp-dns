// /root/xpd-dns/web/i18n.js
// Automatic language detection based on browser and OS locale

const translations = {
    es: {
        "site.title": "xdp.es DNS",
        "theme.light": "Claro",
        "theme.dark": "Oscuro",
        "theme.auto": "Auto",
        "copy.tooltip": "Click para copiar",
        "copy.copied": "¡Copiado!",
        "nav.back_home": "← Volver al inicio",
        "nav.home": "← Inicio",

        // Protocols
        "std.title": "DNS Estándar",

        // Apple Profiles
        "profiles.title": "Perfiles Apple",
        "profiles.doh_title": "xdp.es DoH DNS",
        "profiles.dot_title": "xdp.es DoT DNS",

        // Setup Guides
        "guide.title": "Guía de Configuración",
        "guide.tab_android": "Android",
        "guide.tab_ios": "iOS / Mac",
        "guide.tab_windows": "Windows 11",
        "guide.tab_linux": "Linux",
        "guide.tab_browser": "Navegadores",

        // Guide Steps - Android
        "guide.android.s1": "Ajustes → Conexiones / Redes e Internet → Más ajustes",
        "guide.android.s2": "DNS privado → Nombre de host",
        "guide.android.s3": "Escribir: <code class=\"code-inline\">dns.xdp.es</code> y guardar",

        // Guide Steps - iOS
        "guide.ios.s1": "Descargar el <a href=\"dns_xdp_es_doh.mobileconfig\" class=\"text-link\">perfil .mobileconfig (DoH)</a> en Safari.",
        "guide.ios.s2": "Ajustes → Perfil descargado",
        "guide.ios.s3": "Pulsar Instalar y confirmar.",

        // Guide Steps - Windows
        "guide.windows.s1": "Configuración → Red e Internet → Wi-Fi / Ethernet",
        "guide.windows.s2": "Asignación de DNS → Manual (IPv4: <code class=\"code-inline\">85.208.114.51</code>)",
        "guide.windows.s3": "Cifrado DNS → Solo cifrado (DoH) con plantilla: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Guide Steps - Linux
        "guide.linux.desc": "En <code class=\"code-inline\">/etc/systemd/resolved.conf</code>:",
        "guide.linux.reload": "Reiniciar servicio: <code class=\"code-inline\">systemctl restart systemd-resolved</code>",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Ajustes → Privacidad y Seguridad → DNS sobre HTTPS → Personalizado: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Configuración → Privacidad → Usar DNS seguro → Personalizado: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Estadísticas (24h)",
        "stats.view_metrics": "Ver métricas →",
        "stats.processed": "Consultas",
        "stats.blocked": "Bloqueadas",
        "stats.block_rate": "Tasa de bloqueo",

        // Stats Dashboard Page
        "stats.page_title": "Estadísticas | xdp.es DNS",
        "stats.tab_24h": "24 Horas",
        "stats.tab_30d": "30 Días",
        "stats.card_total": "Total Consultas",
        "stats.card_blocked": "Consultas Bloqueadas",
        "stats.card_cached": "Caché Hit",
        "stats.card_latency": "Latencia Media",
        "stats.table_asn": "Top ASNs",
        "stats.table_types": "Tipos de Registro",
        "stats.loading": "Cargando datos...",
        "stats.no_data": "Sin consultas.",
        "stats.rate_suffix": "bloqueadas",

        // Connection Card
        "conn.title": "Tu Conexión",
        "conn.detecting": "Detectando red...",
        "conn.active": "Conexión Activa",
        "conn.checking": "Comprobando...",

        // Block-OTA Page
        "ota.page_title": "xdp.es | Block-OTA",
        "ota.subtitle": "Adblock + Bloqueo de actualizaciones OTA de Apple.",
        "ota.profile_title": "Perfil Apple",
        "ota.profile_btn": "xdp.es OTA Block DNS",
        "ota.domains_title": "Dominios Bloqueados"
    },
    en: {
        "site.title": "xdp.es DNS",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "theme.auto": "Auto",
        "copy.tooltip": "Click to copy",
        "copy.copied": "Copied!",
        "nav.back_home": "← Back to home",
        "nav.home": "← Home",

        // Protocols
        "std.title": "Standard DNS",

        // Apple Profiles
        "profiles.title": "Apple Profiles",
        "profiles.doh_title": "xdp.es DoH DNS",
        "profiles.dot_title": "xdp.es DoT DNS",

        // Setup Guides
        "guide.title": "Setup Guide",
        "guide.tab_android": "Android",
        "guide.tab_ios": "iOS / Mac",
        "guide.tab_windows": "Windows 11",
        "guide.tab_linux": "Linux",
        "guide.tab_browser": "Browsers",

        // Guide Steps - Android
        "guide.android.s1": "Settings → Connections / Network & Internet → More connection settings",
        "guide.android.s2": "Private DNS → Private DNS provider hostname",
        "guide.android.s3": "Enter: <code class=\"code-inline\">dns.xdp.es</code> and save",

        // Guide Steps - iOS
        "guide.ios.s1": "Download the <a href=\"dns_xdp_es_doh.mobileconfig\" class=\"text-link\">.mobileconfig (DoH) profile</a> in Safari.",
        "guide.ios.s2": "Settings → Profile Downloaded",
        "guide.ios.s3": "Tap Install and confirm.",

        // Guide Steps - Windows
        "guide.windows.s1": "Settings → Network & Internet → Wi-Fi / Ethernet",
        "guide.windows.s2": "DNS assignment → Manual (IPv4: <code class=\"code-inline\">85.208.114.51</code>)",
        "guide.windows.s3": "DNS encryption → Encrypted only (DoH) template: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Guide Steps - Linux
        "guide.linux.desc": "In <code class=\"code-inline\">/etc/systemd/resolved.conf</code>:",
        "guide.linux.reload": "Restart service: <code class=\"code-inline\">systemctl restart systemd-resolved</code>",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Settings → Privacy & Security → DNS over HTTPS → Custom: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Settings → Privacy → Use secure DNS → Custom: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Statistics (24h)",
        "stats.view_metrics": "View metrics →",
        "stats.processed": "Queries",
        "stats.blocked": "Blocked",
        "stats.block_rate": "Block rate",

        // Stats Dashboard Page
        "stats.page_title": "Statistics | xdp.es DNS",
        "stats.tab_24h": "24 Hours",
        "stats.tab_30d": "30 Days",
        "stats.card_total": "Total Queries",
        "stats.card_blocked": "Blocked Queries",
        "stats.card_cached": "Cache Hit",
        "stats.card_latency": "Avg Latency",
        "stats.table_asn": "Top ASNs",
        "stats.table_types": "Query Types",
        "stats.loading": "Loading data...",
        "stats.no_data": "No queries.",
        "stats.rate_suffix": "blocked",

        // Connection Card
        "conn.title": "Your Connection",
        "conn.detecting": "Detecting network...",
        "conn.active": "Active Connection",
        "conn.checking": "Checking...",

        // Block-OTA Page
        "ota.page_title": "xdp.es | Block-OTA",
        "ota.subtitle": "Adblock + Apple OTA updates blocking.",
        "ota.profile_title": "Apple Profile",
        "ota.profile_btn": "xdp.es OTA Block DNS",
        "ota.domains_title": "Blocked Domains"
    }
};

function getLanguage() {
    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'es').toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
}

function t(key, lang) {
    const activeLang = lang || getLanguage();
    const dict = translations[activeLang] || translations.es;
    return dict[key] || (translations.es[key] || key);
}

function applyLanguage(lang) {
    const currentLang = lang || getLanguage();
    document.documentElement.setAttribute('lang', currentLang);

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key, currentLang);
        if (text) {
            el.innerText = text;
        }
    });

    // Update HTML content
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const html = t(key, currentLang);
        if (html) {
            el.innerHTML = html;
        }
    });

    // Dispatch global event for other scripts
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
}

// Global Exports
window.i18n = {
    getLanguage,
    applyLanguage,
    t
};

// Immediate early execution
(function() {
    const initialLang = getLanguage();
    document.documentElement.setAttribute('lang', initialLang);
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLanguage(getLanguage()));
} else {
    applyLanguage(getLanguage());
}
