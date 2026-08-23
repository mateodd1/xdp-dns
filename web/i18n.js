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
        "nav.stats": "Estadísticas",
        "nav.about": "Acerca de",
        "nav.ota": "Bloqueo OTA",
        "nav.github": "GitHub",

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
        "stats.asn_toggle_to_dc": "Otros ASN",
        "stats.asn_toggle_to_dc_sub": "Centros de datos y redes externas",
        "stats.asn_toggle_to_isp": "Operadores (ISP)",
        "stats.asn_toggle_to_isp_sub": "Proveedores de Internet y móvil",
        "stats.asn_switch_btn": "⇄ Cambiar",
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
        "ota.domains_title": "Dominios Bloqueados",

        // About Page
        "about.page_title": "Acerca de | xdp.es DNS",
        "about.title": "Acerca de xdp.es DNS",
        "about.subtitle": "Servidor DNS recursivo público, ultrarrápido y enfocado en la privacidad.",
        "about.pill_nologs": "Zero-Logs",
        "about.pill_dnssec": "DNSSEC",
        "about.pill_madrid": "Alojado en Madrid",
        "about.pill_dualstack": "IPv4 / IPv6",
        "about.pill_doh3": "DoH3 & DoT",

        // Section 1: Privacy & Infrastructure
        "about.sec_privacy_title": "Privacidad e Infraestructura",
        "about.sec_privacy_desc": "xdp.es DNS nace con el objetivo de ofrecer un servicio de resolución ultrarrápido, respaldado por protocolos modernos y con un firme compromiso con la privacidad. Su infraestructura está diseñada para mitigar y sortear bloqueos indiscriminados a CDNs durante eventos deportivos. No almacenamos ningún registro de consulta ni datos de actividad, manteniendo únicamente contadores numéricos agregados de resolución.",
        "about.sec_privacy_link": "Puedes obtener más información acerca de los bloqueos indiscriminados en el foro de <a href=\"https://bandaancha.eu/articulos/laliga-estira-bloqueo-ips-cloudflare-11797\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">BandaAncha</a>.",
        "about.card_nologs_title": "Política Zero-Logs",
        "about.card_nologs_desc": "No registramos, rastreamos ni almacenamos tus consultas DNS ni tu dirección IP. Las estadísticas públicas son contadores numéricos agregados en memoria sin ninguna información identificable.",
        "about.card_dnssec_title": "Validación Criptográfica DNSSEC",
        "about.card_dnssec_desc": "Validación criptográfica completa contra el ancla de confianza raíz, garantizando que las respuestas no hayan sido manipuladas ni sufran ataques de suplantación o envenenamiento de caché.",
        "about.card_location_title": "Ubicado en Madrid (España)",
        "about.card_location_desc": "Servidores alojados directamente en Madrid con baja latencia y excelente conectividad para usuarios de toda España y la península ibérica.",
        "about.card_dualstack_title": "Soporte IPv4 e IPv6 Completo",
        "about.card_dualstack_desc": "Conectividad nativa dual-stack tanto en IPv4 como en IPv6, preparado para resolver consultas de forma óptima en cualquier tipo de red moderna.",

        // Section 2: Protocols & Performance
        "about.sec_tech_title": "Protocolos Modernos y Rendimiento",
        "about.card_encrypted_title": "Cifrado Moderno con DoH3 y DoT",
        "about.card_encrypted_desc": "Soporte completo para DNS sobre HTTP/3 (DoH3 con QUIC) con 0-RTT y sin bloqueo de cabeza de línea, junto con DNS sobre TLS (DoT RFC 7858) para cifrado seguro integrado a nivel de sistema operativo.",
        "about.card_filtering_title": "Filtrado de Publicidad y Rastreo",
        "about.card_filtering_desc": "Bloqueo preventivo en tiempo real de anuncios invasivos, rastreadores de telemetría y dominios maliciosos, mejorando la velocidad de navegación y el ahorro de datos.",

        // Section 3: Addresses
        "about.sec_addresses_title": "Direcciones de Conexión",
        "about.addr_ipv4": "Dirección IPv4:",
        "about.addr_ipv6": "Dirección IPv6:",
        "about.addr_doh": "Endpoint DoH / DoH3:",
        "about.addr_dot": "Endpoint DoT:"
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
        "nav.stats": "Statistics",
        "nav.about": "About",
        "nav.ota": "OTA Block",
        "nav.github": "GitHub",

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
        "stats.asn_toggle_to_dc": "Other ASN",
        "stats.asn_toggle_to_dc_sub": "Data centers & external networks",
        "stats.asn_toggle_to_isp": "Operators (ISP)",
        "stats.asn_toggle_to_isp_sub": "Internet Service Providers & mobile",
        "stats.asn_switch_btn": "⇄ Switch",
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
        "ota.domains_title": "Blocked Domains",

        // About Page
        "about.page_title": "About | xdp.es DNS",
        "about.title": "About xdp.es DNS",
        "about.subtitle": "A high-performance, privacy-first, zero-logging recursive DNS resolver.",
        "about.pill_nologs": "Zero-Logs",
        "about.pill_dnssec": "DNSSEC",
        "about.pill_madrid": "Hosted in Madrid",
        "about.pill_dualstack": "IPv4 / IPv6",
        "about.pill_doh3": "DoH3 & DoT",

        // Section 1: Privacy & Infrastructure
        "about.sec_privacy_title": "Privacy & Infrastructure",
        "about.sec_privacy_desc": "xdp.es DNS was created to provide an ultra-fast resolution service based on modern protocols and a strict commitment to privacy. Its infrastructure is designed to mitigate and circumvent indiscriminate CDN blocks during sporting events. We do not store any query logs or user activity data, maintaining only aggregated numeric resolution counters.",
        "about.sec_privacy_link": "You can find more information about these indiscriminate blocks on the <a href=\"https://bandaancha.eu/articulos/laliga-estira-bloqueo-ips-cloudflare-11797\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">BandaAncha forum</a> (in Spanish).",
        "about.card_nologs_title": "Zero-Logs Policy",
        "about.card_nologs_desc": "We never log, track, or store your DNS queries or IP address. Public dashboard statistics are in-memory integer metrics with zero personally identifiable information.",
        "about.card_dnssec_title": "DNSSEC Validation",
        "about.card_dnssec_desc": "Full cryptographic validation against the root trust anchor, ensuring DNS responses are authentic and protected against spoofing or cache-poisoning attacks.",
        "about.card_location_title": "Located in Madrid (Spain)",
        "about.card_location_desc": "Servers hosted directly in Madrid with low latency and optimal connectivity across Spain and the Iberian Peninsula.",
        "about.card_dualstack_title": "Full IPv4 & IPv6 Dual-Stack",
        "about.card_dualstack_desc": "Native dual-stack connectivity across both IPv4 and IPv6, ready for optimal resolution across any modern network.",

        // Section 2: Protocols & Performance
        "about.sec_tech_title": "Modern Protocols & Performance",
        "about.card_encrypted_title": "Modern Encryption with DoH3 & DoT",
        "about.card_encrypted_desc": "Full support for DNS over HTTP/3 (DoH3 with QUIC) offering 0-RTT handshakes and zero head-of-line blocking, alongside standard DNS over TLS (DoT RFC 7858) for native OS-level encryption.",
        "about.card_filtering_title": "Ad & Tracker Filtering",
        "about.card_filtering_desc": "Real-time proactive filtering of intrusive ads, tracking telemetry, and malicious domains, improving browsing speed and reducing bandwidth usage.",

        // Section 3: Addresses
        "about.sec_addresses_title": "Connection Addresses",
        "about.addr_ipv4": "IPv4 Address:",
        "about.addr_ipv6": "IPv6 Address:",
        "about.addr_doh": "DoH / DoH3 Endpoint:",
        "about.addr_dot": "DoT Endpoint:"
    }
};

function getLanguage() {
    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'es').toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
}

function t(key, lang) {
    const activeLang = lang || getLanguage();
    const dict = translations[activeLang] || translations.es;
    if (dict && dict[key]) return dict[key];
    if (translations.es && translations.es[key]) return translations.es[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    if (key === 'stats.asn_toggle_to_dc') return activeLang === 'es' ? 'Otros ASN' : 'Other ASN';
    if (key === 'stats.asn_toggle_to_dc_sub') return activeLang === 'es' ? 'Centros de datos y redes externas' : 'Data centers & external networks';
    if (key === 'stats.asn_toggle_to_isp') return activeLang === 'es' ? 'Operadores (ISP)' : 'Operators (ISP)';
    if (key === 'stats.asn_toggle_to_isp_sub') return activeLang === 'es' ? 'Proveedores de Internet y móvil' : 'Internet Service Providers';
    if (key === 'stats.asn_switch_btn') return activeLang === 'es' ? '⇄ Cambiar' : '⇄ Switch';
    return null;
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
