// /root/xpd-dns/web/i18n.js
// Automatic language detection based on browser and OS locale

const translations = {
    es: {
        // General / Header
        "site.title": "xdp.es | Servidor DNS Cifrado de Alto Rendimiento",
        "site.desc": "Servidor DNS recursivo público y seguro con DoH (DNS over HTTPS), DoT (DNS over TLS), DNSSEC y bloqueo de publicidad y telemetría.",
        "theme.light": "Claro",
        "theme.dark": "Oscuro",
        "theme.auto": "Auto",
        "copy.tooltip": "Click para copiar",
        "copy.copied": "¡Copiado!",
        "nav.back_home": "← Volver al inicio",
        "nav.home": "← Inicio",

        // Main Page - Protocols
        "doh.badge": "HTTPS",
        "doh.desc": "Cifrado de extremo a extremo a través de HTTPS. Compatible con navegadores modernos, Windows 11, iOS y Android.",
        "doh.label": "URL DoH:",
        
        "dot.badge": "TLS",
        "dot.desc": "Protocolo estándar TLS para DNS privado. Ideal para la función DNS Privado en Android y routers avanzados.",
        "dot.label": "Hostname DoT:",

        "std.title": "DNS Estándar",
        "std.badge": "UDP / TCP",
        "std.desc": "Resolución directa con validación DNSSEC y ultra-baja latencia.",

        // Apple Profiles
        "profiles.title": "Perfiles Apple",
        "profiles.badge": "iOS • macOS",
        "profiles.desc": "Descarga e instala perfiles de configuración automática para iPhone, iPad y equipos Mac.",
        "profiles.doh_title": "xdp.es DoH DNS",
        "profiles.doh_sub": "DNS over HTTPS + Adblock",
        "profiles.dot_title": "xdp.es DoT DNS",
        "profiles.dot_sub": "DNS over TLS + Adblock",

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
        "stats.summary_title": "Estadísticas de Resolución (24h)",
        "stats.view_metrics": "Ver métricas →",
        "stats.processed": "Consultas procesadas",
        "stats.blocked": "Consultas bloqueadas",
        "stats.block_rate": "Tasa de bloqueo",

        // Stats Dashboard Page
        "stats.page_title": "Estadísticas en Tiempo Real | xdp.es DNS",
        "stats.subtitle": "Estadísticas de resolución DNS y métricas en tiempo real",
        "stats.tab_24h": "Últimas 24 Horas",
        "stats.tab_30d": "Últimos 30 Días",
        "stats.card_total": "Total Consultas",
        "stats.card_total_sub": "Peticiones procesadas",
        "stats.card_blocked": "Consultas Bloqueadas",
        "stats.card_cached": "Acierto en Caché",
        "stats.card_cached_sub": "en caché",
        "stats.card_latency": "Latencia Media",
        "stats.card_latency_sub": "Tiempo medio de resolución",
        "stats.table_asn": "Origen de las Solicitudes (ASN)",
        "stats.table_types": "Distribución por Tipo de Registro",
        "stats.loading": "Cargando datos...",
        "stats.no_data": "Sin consultas registradas.",
        "stats.rate_suffix": "tasa de bloqueo",

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
        // General / Header
        "site.title": "xdp.es | High-Performance Encrypted DNS Resolver",
        "site.desc": "Fast, zero-logging public recursive DNS resolver with DoH (DNS over HTTPS), DoT (DNS over TLS), DNSSEC, and ad/telemetry blocking.",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "theme.auto": "Auto",
        "copy.tooltip": "Click to copy",
        "copy.copied": "Copied!",
        "nav.back_home": "← Back to home",
        "nav.home": "← Home",

        // Main Page - Protocols
        "doh.badge": "HTTPS",
        "doh.desc": "End-to-end encryption over HTTPS. Fully compatible with modern browsers, Windows 11, iOS, and Android.",
        "doh.label": "DoH URL:",
        
        "dot.badge": "TLS",
        "dot.desc": "Standard TLS protocol for private DNS. Ideal for Android Private DNS and advanced routers.",
        "dot.label": "DoT Hostname:",

        "std.title": "Standard DNS",
        "std.badge": "UDP / TCP",
        "std.desc": "Direct recursive resolution with DNSSEC validation and ultra-low latency.",

        // Apple Profiles
        "profiles.title": "Apple Profiles",
        "profiles.badge": "iOS • macOS",
        "profiles.desc": "Download and install auto-configuration profiles for iPhone, iPad, and Mac devices.",
        "profiles.doh_title": "xdp.es DoH DNS",
        "profiles.doh_sub": "DNS over HTTPS + Adblock",
        "profiles.dot_title": "xdp.es DoT DNS",
        "profiles.dot_sub": "DNS over TLS + Adblock",

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
        "guide.linux.desc": "For <code>systemd-resolved</code>, edit <code class=\"code-inline\">/etc/systemd/resolved.conf</code>:",
        "guide.linux.reload": "Then restart the service with: <code class=\"code-inline\">systemctl restart systemd-resolved</code>",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Settings → Privacy & Security → DNS over HTTPS → Max Protection → Custom provider: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Settings → Privacy and security → Use secure DNS → With: Custom → <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Resolution Statistics (24h)",
        "stats.view_metrics": "View metrics →",
        "stats.processed": "Processed queries",
        "stats.blocked": "Blocked queries",
        "stats.block_rate": "Block rate",

        // Stats Dashboard Page
        "stats.page_title": "Real-Time Statistics | xdp.es DNS",
        "stats.subtitle": "DNS resolution statistics and real-time telemetry metrics",
        "stats.tab_24h": "Last 24 Hours",
        "stats.tab_30d": "Last 30 Days",
        "stats.card_total": "Total Queries",
        "stats.card_total_sub": "Processed requests",
        "stats.card_blocked": "Blocked Queries",
        "stats.card_cached": "Cache Hit Ratio",
        "stats.card_cached_sub": "cached",
        "stats.card_latency": "Average Latency",
        "stats.card_latency_sub": "Average resolution time",
        "stats.table_asn": "Query Origin by ASN",
        "stats.table_types": "Breakdown by Query Type",
        "stats.loading": "Loading data...",
        "stats.no_data": "No queries recorded.",
        "stats.rate_suffix": "block rate",

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
