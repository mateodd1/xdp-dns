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
        "about.title": "Arquitectura y Funcionamiento",
        "about.subtitle": "Servidor DNS recursivo público, ultrarrápido y enfocado en la privacidad sin registros.",
        "about.pill_nologs": "Cero Registros (No-Logs)",
        "about.pill_dnssec": "Validación DNSSEC",
        "about.pill_http3": "DoH3 (HTTP/3) & DoQ",
        "about.pill_ecs": "Sin rastreo ECS",

        "about.sec_privacy_title": "Privacidad y Seguridad de Primera Clase",
        "about.sec_privacy_desc": "La privacidad no es una opción; está integrada en cada nivel del servicio.",
        "about.card_nologs_title": "Política Estricta Sin Registros",
        "about.card_nologs_desc": "No registramos ni almacenamos tus consultas DNS, IPs ni identificadores de clientes. Las métricas públicas en la página de estadísticas son contadores numéricos agregados en memoria que rotan periódicamente.",
        "about.card_dnssec_title": "Validación Criptográfica DNSSEC",
        "about.card_dnssec_desc": "Todas las respuestas de zonas firmadas son validadas con el ancla de confianza de la raíz (Root Trust Anchor), garantizando que las respuestas no hayan sido manipuladas ni sufran ataques de intermediario (MitM).",
        "about.card_ecs_title": "Eliminación de Subred (ECS Stripping)",
        "about.card_ecs_desc": "Desactivamos y eliminamos cualquier extensión EDNS Client Subnet (ECS) hacia los servidores autoritativos para evitar que las redes externas rastreen tu ubicación geográfica real.",
        "about.card_qname_title": "Minimización de QNAME",
        "about.card_qname_desc": "En lugar de enviar el dominio completo a cada servidor en la jerarquía DNS, el resolver envía únicamente la etiqueta mínima necesaria para resolver cada paso (RFC 9156).",

        "about.sec_tech_title": "Protocolos Modernos y Rendimiento",
        "about.card_quic_title": "DoH3 y DNS-over-QUIC (RFC 9250)",
        "about.card_quic_desc": "Soporte nativo para HTTP/3 y QUIC en DoH y DoQ. Elimina el bloqueo de cabeza de línea y permite reanudación de conexión 0-RTT, ideal para redes móviles inestables.",
        "about.card_filtering_title": "Filtrado de Anuncios y Telemetría",
        "about.card_filtering_desc": "Filtrado en tiempo real de dominios maliciosos, publicidad invasiva, trackers y telemetría mediante listas consolidadas y verificadas sin degradar la velocidad de navegación.",
        "about.card_caching_title": "Caché en Memoria de Alta Velocidad",
        "about.card_caching_desc": "Sistema de caché multinivel de alta velocidad que resuelve peticiones recurrentes con latencias inferiores a 1ms directamente desde RAM.",

        "about.sec_arch_title": "Flujo de Resolución",
        "about.step1": "1. Cliente",
        "about.step1_desc": "Realiza la consulta cifrada por DoH3, DoQ, DoT o estándar.",
        "about.step2": "2. Borde y Cifrado (Edge Proxy)",
        "about.step2_desc": "Terminación TLS 1.3 / HTTP/3 QUIC de ultra-baja latencia con certificados ECDSA.",
        "about.step3": "3. Filtrado y Caché",
        "about.step3_desc": "Inspección de listas de bloqueo, respuesta instantánea desde caché y aplicación de políticas.",
        "about.step4": "4. Resolver Recursivo",
        "about.step4_desc": "Resolución recursiva directa a los servidores raíz mundiales con validación DNSSEC y ECS eliminado.",

        "about.sec_specs_title": "Ficha Técnica",
        "about.spec_ipv4": "Dirección IPv4:",
        "about.spec_ipv6": "Dirección IPv6:",
        "about.spec_doh": "Endpoint DoH / DoH3:",
        "about.spec_doq": "Endpoint DoQ:",
        "about.spec_dot": "Endpoint DoT:"
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
        "about.title": "Architecture & Technology",
        "about.subtitle": "A high-performance, privacy-first, zero-logging recursive DNS resolver.",
        "about.pill_nologs": "Zero Logging (No-Logs)",
        "about.pill_dnssec": "DNSSEC Validation",
        "about.pill_http3": "DoH3 (HTTP/3) & DoQ",
        "about.pill_ecs": "No ECS Tracking",

        "about.sec_privacy_title": "World-Class Privacy & Security",
        "about.sec_privacy_desc": "Privacy is not optional; it is built into every layer of the architecture.",
        "about.card_nologs_title": "Strict Zero-Logging Policy",
        "about.card_nologs_desc": "We never log, track, or store your DNS queries, client IPs, or device identifiers. Public dashboard statistics are aggregated in-memory integer metrics rotated periodically.",
        "about.card_dnssec_title": "Cryptographic DNSSEC Validation",
        "about.card_dnssec_desc": "All signed zone responses are authenticated against the global Root Trust Anchor, preventing DNS tampering, spoofing, and man-in-the-middle attacks.",
        "about.card_ecs_title": "EDNS Client Subnet (ECS) Stripping",
        "about.card_ecs_desc": "We actively strip client subnet extensions from all upstream recursive queries to prevent third-party authoritative nameservers from geolocating you.",
        "about.card_qname_title": "QNAME Minimization",
        "about.card_qname_desc": "Instead of sending full domain names to upstream servers, the resolver sends only the minimal label required at each hierarchy level (RFC 9156).",

        "about.sec_tech_title": "Next-Gen Protocols & Performance",
        "about.card_quic_title": "DoH3 & DNS-over-QUIC (RFC 9250)",
        "about.card_quic_desc": "Native support for HTTP/3 and QUIC across DoH and DoQ. Eliminates head-of-line blocking and allows 0-RTT handshakes, ideal for cellular networks.",
        "about.card_filtering_title": "Malware & Telemetry Filtering",
        "about.card_filtering_desc": "Real-time filtering of malicious domains, intrusive trackers, and telemetry using verified blocklists without degrading resolution speed.",
        "about.card_caching_title": "High-Speed In-Memory Caching",
        "about.card_caching_desc": "Multi-tier high-speed caching engine that serves repeated requests directly from RAM in sub-millisecond response times.",

        "about.sec_arch_title": "Resolution Flow",
        "about.step1": "1. Client",
        "about.step1_desc": "Sends encrypted queries via DoH3, DoQ, DoT, or standard DNS.",
        "about.step2": "2. Edge & TLS Proxy",
        "about.step2_desc": "Ultra-low latency TLS 1.3 / HTTP/3 QUIC termination with ECDSA certificates.",
        "about.step3": "3. Filtering & Cache",
        "about.step3_desc": "Blocklist inspection, instant cache resolution, and policy enforcement.",
        "about.step4": "4. Recursive Resolver",
        "about.step4_desc": "Direct recursive queries to global root and authoritative servers with DNSSEC validation and ECS stripped.",

        "about.sec_specs_title": "Technical Specifications",
        "about.spec_ipv4": "IPv4 Address:",
        "about.spec_ipv6": "IPv6 Address:",
        "about.spec_doh": "DoH / DoH3 Endpoint:",
        "about.spec_doq": "DoQ Endpoint:",
        "about.spec_dot": "DoT Endpoint:"
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
    return key;
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
