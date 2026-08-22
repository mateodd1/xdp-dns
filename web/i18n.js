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
        "doh.desc": "Cifrado de extremo a extremo a través de HTTPS.",
        "dot.desc": "Protocolo estándar de DNS sobre TLS.",
        "std.title": "DNS Estándar",
        "std.desc": "Resolución DNS estándar con validación DNSSEC.",

        // Apple Profiles
        "profiles.title": "Perfiles Apple",
        "profiles.desc": "Perfiles de configuración móvil para dispositivos Apple.",
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
        "guide.android.s1": "Ve a <strong>Ajustes</strong> → <strong>Redes e Internet / Conexiones</strong> → <strong>Más ajustes de conexión</strong>.",
        "guide.android.s2": "Pulsa sobre <strong>DNS privado</strong> (Private DNS).",
        "guide.android.s3": "Selecciona <em>\"Nombre de host del proveedor de DNS privado\"</em>.",
        "guide.android.s4": "Escribe: <code class=\"code-inline\">dns.xdp.es</code> y pulsa <strong>Guardar</strong>.",

        // Guide Steps - iOS
        "guide.ios.s1": "Descarga el perfil <a href=\"dns_xdp_es_doh.mobileconfig\" class=\"text-link\">.mobileconfig (DoH)</a> desde el navegador Safari.",
        "guide.ios.s2": "Abre <strong>Ajustes</strong> y pulsa en <em>\"Perfil descargado\"</em> en la parte superior.",
        "guide.ios.s3": "Pulsa <strong>Instalar</strong> en la esquina superior derecha y confirma con tu código de desbloqueo.",

        // Guide Steps - Windows
        "guide.windows.s1": "Abre <strong>Configuración</strong> → <strong>Red e Internet</strong> → <strong>Wi-Fi o Ethernet</strong>.",
        "guide.windows.s2": "En <em>\"Asignación de DNS\"</em>, pulsa <strong>Editar</strong> y selecciona <strong>Manual</strong>.",
        "guide.windows.s3": "Activa <strong>IPv4</strong> e introduce como DNS preferido: <code class=\"code-inline\">85.208.114.51</code>.",
        "guide.windows.s4": "En <em>\"Cifrado DNS\"</em>, selecciona <strong>Solo cifrado (DNS a través de HTTPS)</strong> y como plantilla: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>.",

        // Guide Steps - Linux
        "guide.linux.desc": "Para <code>systemd-resolved</code>, edita el archivo <code class=\"code-inline\">/etc/systemd/resolved.conf</code>:",
        "guide.linux.reload": "A continuación, reinicia el servicio con: <code class=\"code-inline\">systemctl restart systemd-resolved</code>",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Ajustes → Privacidad y Seguridad → DNS sobre HTTPS → Protección máxima → Proveedor personalizado: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Configuración → Privacidad y Seguridad → Usar DNS seguro → Con: Personalizado → <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Estadísticas (24h)",
        "stats.view_metrics": "Ver métricas →",
        "stats.processed": "Consultas",
        "stats.blocked": "Bloqueadas",
        "stats.block_rate": "Tasa de bloqueo",

        // Stats Dashboard Page
        "stats.page_title": "Estadísticas | xdp.es DNS",
        "stats.subtitle": "Métricas de tráfico y rendimiento en tiempo real.",
        "stats.tab_24h": "24 Horas",
        "stats.tab_30d": "30 Días",
        "stats.card_total": "Total Consultas",
        "stats.card_blocked": "Consultas Bloqueadas",
        "stats.card_cached": "Caché Hit",
        "stats.card_latency": "Latencia Media",
        "stats.table_asn": "Top ASNs",
        "stats.asn_filter_isp": "Operadores (ISP)",
        "stats.asn_filter_datacenter": "Datacenters",
        "stats.asn_filter_all": "Todos",
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
        "doh.desc": "End-to-end encryption over HTTPS.",
        "dot.desc": "Standard protocol for DNS over TLS.",
        "std.title": "Standard DNS",
        "std.desc": "Standard DNS resolution with DNSSEC validation.",

        // Apple Profiles
        "profiles.title": "Apple Profiles",
        "profiles.desc": "Mobile configuration profiles for Apple devices.",
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
        "guide.android.s1": "Go to <strong>Settings</strong> → <strong>Network & Internet / Connections</strong> → <strong>More connection settings</strong>.",
        "guide.android.s2": "Tap on <strong>Private DNS</strong>.",
        "guide.android.s3": "Select <em>\"Private DNS provider hostname\"</em>.",
        "guide.android.s4": "Enter: <code class=\"code-inline\">dns.xdp.es</code> and tap <strong>Save</strong>.",

        // Guide Steps - iOS
        "guide.ios.s1": "Download the <a href=\"dns_xdp_es_doh.mobileconfig\" class=\"text-link\">.mobileconfig (DoH)</a> profile using Safari.",
        "guide.ios.s2": "Open <strong>Settings</strong> and tap <em>\"Profile Downloaded\"</em> near the top.",
        "guide.ios.s3": "Tap <strong>Install</strong> in the top-right corner and confirm with your passcode.",

        // Guide Steps - Windows
        "guide.windows.s1": "Open <strong>Settings</strong> → <strong>Network & Internet</strong> → <strong>Wi-Fi or Ethernet</strong>.",
        "guide.windows.s2": "Under <em>\"DNS server assignment\"</em>, click <strong>Edit</strong> and select <strong>Manual</strong>.",
        "guide.windows.s3": "Turn on <strong>IPv4</strong> and enter preferred DNS: <code class=\"code-inline\">85.208.114.51</code>.",
        "guide.windows.s4": "Under <em>\"DNS encryption\"</em>, select <strong>Encrypted only (DNS over HTTPS)</strong> and template: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>.",

        // Guide Steps - Linux
        "guide.linux.desc": "For <code>systemd-resolved</code>, edit the file <code class=\"code-inline\">/etc/systemd/resolved.conf</code>:",
        "guide.linux.reload": "Then restart the service with: <code class=\"code-inline\">systemctl restart systemd-resolved</code>",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Settings → Privacy & Security → DNS over HTTPS → Max Protection → Custom provider: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Settings → Privacy and security → Use secure DNS → With: Custom → <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Statistics (24h)",
        "stats.view_metrics": "View metrics →",
        "stats.processed": "Queries",
        "stats.blocked": "Blocked",
        "stats.block_rate": "Block rate",

        // Stats Dashboard Page
        "stats.page_title": "Statistics | xdp.es DNS",
        "stats.subtitle": "Real-time traffic and performance metrics.",
        "stats.tab_24h": "24 Hours",
        "stats.tab_30d": "30 Days",
        "stats.card_total": "Total Queries",
        "stats.card_blocked": "Blocked Queries",
        "stats.card_cached": "Cache Hit",
        "stats.card_latency": "Avg Latency",
        "stats.table_asn": "Top ASNs",
        "stats.asn_filter_isp": "ISPs / Operators",
        "stats.asn_filter_datacenter": "Datacenters",
        "stats.asn_filter_all": "All Networks",
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
