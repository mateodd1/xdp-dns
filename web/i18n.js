// i18n.js
// Automatic language detection based on browser and OS locale

const translations = {
    es: {
        "site.title": "xdp.es DNS | DNS público en España contra bloqueos indiscriminados",
        "theme.light": "Claro",
        "theme.dark": "Oscuro",
        "theme.auto": "Auto",
        "copy.tooltip": "Click para copiar",
        "copy.copied": "¡Copiado!",
        "nav.back_home": "← Volver al inicio",
        "nav.home": "← Inicio",
        "nav.test": "Test DNS",
        "nav.stats": "Estadísticas",
        "nav.about": "Acerca de",
        "nav.github": "GitHub",

        "mode.adblock": "Adblock",
        "mode.adblock_desc": "Con filtrado",
        "mode.standard": "Standard",
        "mode.standard_desc": "Sin filtrado",
        "hero.subtitle": "Resolución DNS recursiva, ultra-rápida y con validación DNSSEC.",

        // Protocols
        "doh.desc": "Cifrado de extremo a extremo a través de HTTPS.",
        "dot.desc": "Protocolo estándar de DNS sobre TLS.",
        "std.title": "DNS Adblock",
        "std.title_adblock": "DNS Adblock",
        "std.title_standard": "DNS Estándar",
        "std.desc": "Resolución DNS con filtrado Adblock y validación DNSSEC.",
        "std.desc_adblock": "Resolución DNS con filtrado Adblock y validación DNSSEC.",
        "std.desc_standard": "Resolución DNS estándar con validación DNSSEC.",

        // Apple Profiles
        "profiles.title": "Perfiles Apple",
        "profiles.desc": "Perfiles de configuración móvil para dispositivos Apple.",
        "profiles.doh_title": "xdp.es AdBlock DoH DNS",
        "profiles.dot_title": "xdp.es AdBlock DoT DNS",

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

        // Guide Steps - MikroTik
        "guide.tab_mikrotik": "MikroTik",
        "guide.mikrotik.s1": "Abre <strong>WinBox</strong> o <strong>WebFig</strong> y ve a <strong>IP</strong> → <strong>DNS</strong>.",
        "guide.mikrotik.s2": "Activa <em>\"Use DoH Server\"</em> e introduce: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>.",
        "guide.mikrotik.s3": "En <em>\"Static DNS Entries\"</em>, añade <code class=\"code-inline\">dns.xdp.es</code> → <code class=\"code-inline\">85.208.114.51</code> para que el router pueda arrancar sin depender de otro resolvedor.",
        "guide.mikrotik.s4": "Marca <strong>Allow Remote Requests</strong> para que el router sirva DNS a tu red local.",
        "guide.mikrotik.s5": "Apunta los clientes al router vía DHCP: <strong>IP</strong> → <strong>DHCP Server</strong> → <strong>Networks</strong> → <em>DNS Servers</em> = IP LAN del router.",
        "guide.mikrotik.cli": "Equivalente por terminal (<code>/terminal</code>):",

        // Guide Steps - Ubiquiti
        "guide.tab_ubiquiti": "Ubiquiti",
        "guide.ubiquiti.title_unifi": "UniFi OS / Gateways (DNS Shield - DoH):",
        "guide.ubiquiti.s1": "Abre <strong>UniFi Network</strong> y ve a <strong>Settings (Ajustes)</strong> → <strong>Security (Seguridad)</strong> → <strong>General</strong>.",
        "guide.ubiquiti.s2": "En <strong>DNS Shield</strong> (DNS cifrado), activa la opción y selecciona <em>\"Custom\"</em> (Personalizado).",
        "guide.ubiquiti.s3": "Introduce la URL DoH: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code> y la IP de resolución: <code class=\"code-inline\">85.208.114.51</code>.",
        "guide.ubiquiti.title_stamp": "DNS Stamp (para DNS Shield / dnscrypt-proxy):",
        "guide.ubiquiti.title_wan": "Configuración estándar por interfaz WAN:",
        "guide.ubiquiti.s4": "Ve a <strong>Settings</strong> → <strong>Internet</strong> → tu conexión WAN → <strong>Advanced (Manual)</strong>.",
        "guide.ubiquiti.s5": "Introduce como <em>Primary DNS</em>: <code class=\"code-inline\">85.208.114.51</code> y como <em>Secondary DNS</em>: <code class=\"code-inline\">2a0e:97c0:c40::51</code>.",
        "guide.ubiquiti.cli": "Para EdgeRouter / EdgeOS por terminal (<code>CLI</code>):",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Ajustes → Privacidad y Seguridad → DNS sobre HTTPS → Protección máxima → Proveedor personalizado: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Configuración → Privacidad y Seguridad → Usar DNS seguro → Con: Personalizado → <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Estadísticas (24h)",
        "stats.view_metrics": "Ver métricas →",
        "stats.processed": "Consultas",
        "stats.blocked": "Bloqueadas",
        "stats.evaded": "Reemplazadas",
        "stats.block_rate": "Tasa de bloqueo",

        // Stats Dashboard Page
        "stats.page_title": "Estadísticas | xdp.es DNS",
        "stats.subtitle": "Métricas de tráfico y rendimiento en tiempo real.",
        "stats.tab_24h": "24 Horas",
        "stats.tab_30d": "30 Días",
        "stats.card_total": "Total Consultas",
        "stats.card_blocked": "Consultas Bloqueadas",
        "stats.card_evaded": "Consultas Reemplazadas",
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
        "stats.evaded_suffix": "reemplazadas",
        "stats.of_group": "del grupo",
        "stats.of_total": "total",
        "stats.asns_count": "{count} ASNs",

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
        "about.page_title": "Acerca de xdp.es DNS | Neutralidad y Mitigación de Bloqueos Indiscriminados",
        "about.title": "Acerca de xdp.es DNS",
        "about.subtitle": "Servidor DNS recursivo público, ultrarrápido y enfocado en la privacidad.",
        "about.pill_nologs": "Zero-Logs",
        "about.pill_dnssec": "DNSSEC",
        "about.pill_madrid": "Alojado en Madrid",
        "about.pill_dualstack": "IPv4 / IPv6",
        "about.pill_doh3": "DoH3 & DoT",

        // Section 1: Privacy & Infrastructure
        "about.sec_privacy_title": "Privacidad e Infraestructura",
        "about.sec_privacy_desc": "xdp.es DNS nace con el objetivo de ofrecer un servicio de resolución ultrarrápido, respaldado por protocolos modernos y con un firme compromiso con la privacidad. Su infraestructura está diseñada para mitigar y sortear bloqueos indiscriminados o producidos por error a CDNs que afectan a servicios legítimos. No almacenamos ningún registro de consulta ni datos de actividad, manteniendo únicamente contadores numéricos agregados de resolución.",
        "about.blocklist_source": "Para identificar las direcciones IPv4 afectadas utilizamos el listado público de bloqueos de <a href=\"https://hayahora.futbol/estado/blocked-any.txt\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">hayahora.futbol</a>. Antes de aplicar cualquier sustitución, cada dirección se valida contra los prefijos anunciados por Cloudflare AS13335; esta fuente externa no recibe datos de las consultas de nuestros usuarios.",
        "about.sec_privacy_link": "Puedes obtener más información acerca de los bloqueos indiscriminados a redes CDN en el foro de <a href=\"https://bandaancha.eu/articulos/laliga-estira-bloqueo-ips-cloudflare-11797\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">BandaAncha.eu</a>.",
        "about.card_nologs_title": "Política Zero-Logs",
        "about.card_nologs_desc": "No registramos, rastreamos ni almacenamos tus consultas DNS ni tu dirección IP. Las estadísticas públicas son contadores numéricos agregados en memoria sin ninguna información identificable.",
        "about.card_dnssec_title": "Validación Criptográfica DNSSEC",
        "about.card_dnssec_desc": "Validación criptográfica completa contra el ancla de confianza raíz, garantizando que las respuestas no hayan sido manipuladas ni sufran ataques de suplantación o envenenamiento de caché.",
        "about.card_recursive_title": "Resolución Recursiva Propia",
        "about.card_recursive_desc": "No reenviamos tus consultas a terceros (como Google o Cloudflare). Nuestro resolver Unbound consulta directamente a los 13 servidores raíz mundiales de IANA y a los autoritativos de cada zona, eliminando intermediarios.",
        "about.card_qname_title": "Minimización de Consultas (QNAME)",
        "about.card_qname_desc": "Implementamos el estándar RFC 9156: no se envía el dominio completo a los servidores raíz ni a los TLDs, sino solo la parte estrictamente necesaria para cada nivel, protegiendo qué subdominio o servicio exacto estás visitando.",
        "about.card_location_title": "Ubicado en Madrid (España)",
        "about.card_location_desc": "Servidores alojados directamente en Madrid con baja latencia y excelente conectividad para usuarios de toda España y la península ibérica.",
        "about.card_dualstack_title": "Soporte IPv4 e IPv6 Completo",
        "about.card_dualstack_desc": "Conectividad nativa dual-stack tanto en IPv4 como en IPv6, preparado para resolver consultas de forma óptima en cualquier tipo de red moderna.",

        // Section 2: Protocols & Performance
        "about.sec_tech_title": "Protocolos Modernos y Rendimiento",
        "about.card_encrypted_title": "Cifrado Moderno con DoH3 y DoT",
        "about.card_encrypted_desc": "Soporte completo para DNS sobre HTTP/3 (DoH3 con QUIC) con 0-RTT y sin bloqueo de cabeza de línea, junto con DNS sobre TLS (DoT RFC 7858) para cifrado seguro integrado a nivel de sistema operativo.",
        "about.card_filtering_title": "Filtrado de Publicidad y Rastreo",
        "about.card_filtering_desc": "Bloqueo preventivo en tiempo real de anuncios invasivos, rastreadores de telemetría y dominios maliciosos mediante la lista <a href=\"https://github.com/hagezi/dns-blocklists\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">HaGeZi Multi PRO</a>, mejorando la velocidad de navegación y el ahorro de datos.",

        // Section 3: Addresses
        "about.sec_addresses_title": "Direcciones del Servicio",
        "about.svc_adblock_desc": "Bloqueo de publicidad, rastreadores y malware",
        "about.svc_standard_desc": "Resolución DNS limpia, sin bloqueo de publicidad",
        "about.addr_ipv4": "Dirección IPv4:",
        "about.addr_ipv6": "Dirección IPv6:",
        "about.addr_doh": "Endpoint DoH / DoH3:",
        "about.addr_dot": "Endpoint DoT:",

        // Section 4: Contact
        "about.sec_contact_title": "Contacto",
        "about.sec_contact_desc": "Para consultas, incidencias o sugerencias: <a href=\"mailto:contacto@xdp.es\" class=\"text-link\">contacto@xdp.es</a>",

        // Blocked IPs / Evasion Monitor Page
        "blocked.page_title": "Monitor de Evasión de Bloqueos | xdp.es DNS",
        "blocked.title": "Monitor de Evasión de Bloqueos",
        "blocked.subtitle": "Seguimiento en tiempo real de IPs bloqueadas (IPv4 e IPv6), servicios críticos afectados y tiempo medido de cada corte.",
        "blocked.live_checking": "Comprobando estado...",
        "blocked.live_active": "Evasión Activa ({count} IPs)",
        "blocked.live_inactive": "Sin bloqueos activos (Directo)",
        "blocked.stat_total": "IPs Baneadas",
        "blocked.stat_cf": "En Cloudflare",
        "blocked.stat_evaded": "Rutas Evasivas",
        "blocked.stat_services": "Servicios Monit.",
        "blocked.services_title": "Servicios críticos monitorizados",
        "blocked.services_subtitle": "Tiempo de afectación medido cuando las IPs resueltas del servicio coinciden con la blocklist o la sonda residencial instala un redirect. Cloudflare solo cuenta como incidencia si el bloqueo supera un umbral (no 1–2 IPs residuales).",
        "blocked.service_status_operational": "Operativo (Protegido)",
        "blocked.service_status_evaded": "Evasión Activa",
        "blocked.service_critical": "Crítico",
        "blocked.time_30d": "Bloqueado (30d)",
        "blocked.time_7d": "Últimos 7d",
        "blocked.time_today": "Hoy",
        "blocked.last_incident_label": "Última afectación:",
        "blocked.ongoing_incident": "En curso ({duration})",
        "blocked.no_recent_incidents": "Sin incidencias medidas aún",
        "blocked.mitigation_title": "Mitigación XDP:",
        "blocked.monitored_domains_label": "Dominios:",
        "blocked.category_dev": "Desarrollo / DevOps",
        "blocked.category_git": "Git & Repositorios",
        "blocked.category_streaming": "Streaming & Vídeo",
        "blocked.category_gaming": "Gaming & Tienda",
        "blocked.category_pkg": "Paquetes / CI",
        "blocked.category_pki": "Certificados TLS",
        "blocked.category_ai": "IA & APIs",
        "blocked.category_cdn": "CDN Global Anycast",
        "blocked.category_payments": "Pagos / TPV",
        "blocked.ips_title": "Listado de IPs Bloqueadas",
        "blocked.history_title": "Registro histórico de incidencias",
        "blocked.history_subtitle": "Solo cortes medidos por este monitor (blocklist pública y sonda residencial). No es un dictamen pericial.",
        "blocked.history_stat_incidents": "Incidencias medidas",
        "blocked.history_stat_hours": "Tiempo acumulado",
        "blocked.history_stat_services": "Servicios impactados",
        "blocked.history_filter_all": "Todos los servicios",
        "blocked.history_search_placeholder": "Buscar incidencia por servicio, fecha, IP o dominio...",
        "blocked.history_export_all": "📋 Copiar informe técnico (todas)",
        "blocked.history_legal_guide_btn": "Cómo reclamar (operador, SETID/OAUT, CNMC, vía civil)",
        "blocked.history_legal_guide_title": "Cómo usar este registro en una reclamación",
        "blocked.legal_warn": "Este registro es un informe técnico de parte generado por xdp.es. Recoge timestamps UTC, IPs de la blocklist y dominios cuya resolución coincide con esas IPs o con un redirect de la sonda. No es un dictamen pericial: un juzgado puede exigir que un perito lo ratifique. Los recortes anteriores al arranque de este medidor no aparecen.",
        "blocked.legal_s1_title": "1. Reclama primero a tu operador",
        "blocked.legal_s1_html": "Para la <strong>OAUT</strong> es obligatorio haber reclamado antes al servicio de atención de tu ISP y conservar el <strong>número de reclamación interna</strong>. Sin ese paso, la oficina inadmite. Espera respuesta o 1 mes de silencio.",
        "blocked.legal_s2_title": "2. SETID / OAUT — calidad e interrupción del servicio",
        "blocked.legal_s2_html": "La <strong>Oficina de Atención al Usuario de Telecomunicaciones</strong> (dependiente de la SETID) tramita controversias de factura, portabilidad, contrato, averías e <strong>interrupción del servicio de acceso a internet</strong> (Ley 11/2022, art. 78). Web: <a href=\"https://usuariosteleco.digital.gob.es/\" target=\"_blank\" rel=\"noopener noreferrer\">usuariosteleco.digital.gob.es</a>. Legitimados: personas físicas, autónomos y microempresas. Plazo: 3 meses desde la respuesta o el silencio del operador. La resolución vincula a usuario y operador; <strong>no es un expediente sancionador contra LaLiga</strong> ni un procedimiento de neutralidad de red.",
        "blocked.legal_s3_title": "3. CNMC — internet abierta / sobrebloqueo",
        "blocked.legal_s3_html": "La autoridad del <strong>Reglamento (UE) 2015/2120</strong> en España es la <strong>CNMC</strong>, no la SETID (Ley 11/2022, art. 76). Sede: <a href=\"https://sede.cnmc.gob.es/\" target=\"_blank\" rel=\"noopener noreferrer\">sede.cnmc.gob.es</a>. El argumento sólido no es «todo bloqueo es ilegal», sino la <strong>falta de proporcionalidad</strong> al filtrar IPs anycast compartidas que cortan servicios lícitos (Docker, GitHub, npm, Let's Encrypt, etc.).",
        "blocked.legal_s4_title": "4. Comisión Europea y Defensor del Pueblo",
        "blocked.legal_s4_html": "Denuncia de infracción de Derecho de la UE: <a href=\"https://commission.europa.eu/about-european-commission/contact/problems-and-complaints/complaints-about-breaches-eu-law-member-states_es\" target=\"_blank\" rel=\"noopener noreferrer\">formulario de la Comisión Europea</a>. El Defensor del Pueblo puede recabar información de la Administración si hay inacción reiterada.",
        "blocked.legal_s5_title": "5. Vía civil (daños)",
        "blocked.legal_s5_html": "<strong>Art. 1101 del Código Civil</strong>: responsabilidad contractual frente a <em>tu operador</em> por el servicio de acceso contratado. <strong>Art. 1902</strong>: extra-contractual (daños a terceros); es más difícil si el filtro se ampara en un auto judicial. Este JSON/informe se puede adjuntar como <strong>prueba documental de parte</strong>, no como pericial.",
        "blocked.legal_s6_title": "Norma de fondo (no citar al revés)",
        "blocked.legal_s6_html": "El art. 3.1–3 del Reglamento 2015/2120 obliga a tratar el tráfico de forma equitativa. El <strong>art. 3.3.a</strong> permite a las operadoras cumplir sentencias y órdenes de autoridad; el debate es si bloquear una IP compartida de CDN es <strong>necesario y proporcionado</strong> (considerando 13). Adjunta IDs de incidencia, ventanas UTC, IPs y dominios de este registro.",
        "blocked.incident_status_ongoing": "Bloqueo en curso",
        "blocked.incident_status_resolved": "Cerrado (medido)",
        "blocked.incident_time_window": "Horario:",
        "blocked.incident_duration": "Duración:",
        "blocked.incident_targets": "Dominios afectados:",
        "blocked.incident_ips": "IPs coincidentes:",
        "blocked.incident_cause": "Qué se ha medido:",
        "blocked.incident_impact": "Impacto técnico:",
        "blocked.incident_mitigation": "Evasión XDP:",
        "blocked.incident_legal_basis": "Norma de referencia:",
        "blocked.incident_source": "Fuente de la medida:",
        "blocked.incident_copy_report": "📋 Copiar informe técnico",
        "blocked.incident_report_copied": "✓ Informe copiado",
        "blocked.incident_no_results": "No hay incidencias medidas que coincidan con la búsqueda.",
        "blocked.incident_empty": "Aún no hay incidencias medidas. El registro empieza a contar cuando el monitor detecta un corte real (blocklist o sonda), no hay datos de relleno.",
        "blocked.incident_more_ips": "+{count} más",
        "blocked.search_placeholder": "Buscar IP o prefijo...",
        "blocked.filter_all": "Todas",
        "blocked.filter_cf": "Cloudflare",
        "blocked.filter_other": "Otras CDN",
        "blocked.filter_v4": "IPv4",
        "blocked.filter_v6": "IPv6",
        "blocked.list_ooni": "OONI",
        "blocked.list_probe": "Sonda",
        "blocked.list_live": "En vivo",
        "blocked.refresh": "Actualizar",
        "blocked.th_ip": "IP Bloqueada",
        "blocked.th_network": "Red / Proveedor",
        "blocked.th_prefix": "Prefijo BGP",
        "blocked.th_alternative": "IP Alternativa (Evasión)",
        "blocked.th_status": "Estado",
        "blocked.card_banned": "⛔ IP Baneada",
        "blocked.card_clean_alt": "⚡ IP Alternativa Limpia",
        "blocked.card_prefix": "Prefijo:",
        "blocked.status_evaded": "Evadida",
        "blocked.status_intact": "Intacta",
        "blocked.badge_other": "Otros",
        "blocked.copy_btn": "Copiar",
        "blocked.copied": "✓ Copiado",
        "blocked.copy_failed": "✗ Error",
        "blocked.load_error": "⚠️ No se pudieron cargar los datos. Pulsa «Actualizar» para reintentar.",
        "blocked.no_services": "No hay información de servicios disponible.",
        "blocked.prev": "Anterior",
        "blocked.next": "Siguiente",
        "blocked.empty_no_blocks": "🟢 No hay ninguna IP bloqueada en este momento.",
        "blocked.empty_not_found": "No se encontraron resultados para la búsqueda.",
        "blocked.loading": "Cargando datos...",

        // /test page
        "test.page_title": "Test DNS | Comprueba si tu conexión está protegida con xdp.es",
        "test.title": "¿Navegas por XDP?",
        "test.checking": "Comprobando…",
        "test.retry": "Repetir test",
        "test.verdict_yes": "✅ Sí — {service}",
        "test.verdict_yes_sub": "Tu conexión resuelve a través de XDP.",
        "test.verdict_no": "❌ No usas XDP",
        "test.resolver_label": "Tu resolutor DNS:",
        "test.verdict_unknown": "⚠️ No se pudo determinar",
        "test.unknown_sub": "¿Usas DoH en el navegador, Private Relay o una VPN?",
        "test.asn_unknown": "ASN desconocido"
    },
    en: {
        "site.title": "xdp.es DNS | Public DNS in Spain against indiscriminate blocking",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "theme.auto": "Auto",
        "copy.tooltip": "Click to copy",
        "copy.copied": "Copied!",
        "nav.back_home": "← Back to home",
        "nav.home": "← Home",
        "nav.test": "DNS Test",
        "nav.stats": "Statistics",
        "nav.about": "About",
        "nav.github": "GitHub",

        "mode.adblock": "Adblock",
        "mode.adblock_desc": "Filtered",
        "mode.standard": "Standard",
        "mode.standard_desc": "Unfiltered",
        "hero.subtitle": "High-performance recursive DNS with DNSSEC validation.",

        // Protocols
        "doh.desc": "End-to-end encryption over HTTPS.",
        "dot.desc": "Standard protocol for DNS over TLS.",
        "std.title": "Adblock DNS",
        "std.title_adblock": "Adblock DNS",
        "std.title_standard": "Standard DNS",
        "std.desc": "Adblock DNS resolution with DNSSEC validation.",
        "std.desc_adblock": "Adblock DNS resolution with DNSSEC validation.",
        "std.desc_standard": "Standard DNS resolution with DNSSEC validation.",

        // Apple Profiles
        "profiles.title": "Apple Profiles",
        "profiles.desc": "Mobile configuration profiles for Apple devices.",
        "profiles.doh_title": "xdp.es AdBlock DoH DNS",
        "profiles.dot_title": "xdp.es AdBlock DoT DNS",

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

        // Guide Steps - MikroTik
        "guide.tab_mikrotik": "MikroTik",
        "guide.mikrotik.s1": "Open <strong>WinBox</strong> or <strong>WebFig</strong> and go to <strong>IP</strong> → <strong>DNS</strong>.",
        "guide.mikrotik.s2": "Enable <em>\"Use DoH Server\"</em> and enter: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>.",
        "guide.mikrotik.s3": "Under <em>\"Static DNS Entries\"</em>, add <code class=\"code-inline\">dns.xdp.es</code> → <code class=\"code-inline\">85.208.114.51</code> so the router can bootstrap without relying on another resolver.",
        "guide.mikrotik.s4": "Check <strong>Allow Remote Requests</strong> so the router serves DNS to your LAN.",
        "guide.mikrotik.s5": "Point LAN clients to the router via DHCP: <strong>IP</strong> → <strong>DHCP Server</strong> → <strong>Networks</strong> → <em>DNS Servers</em> = router's LAN IP.",
        "guide.mikrotik.cli": "Terminal equivalent (<code>/terminal</code>):",

        // Guide Steps - Ubiquiti
        "guide.tab_ubiquiti": "Ubiquiti",
        "guide.ubiquiti.title_unifi": "UniFi OS / Gateways (DNS Shield - DoH):",
        "guide.ubiquiti.s1": "Open <strong>UniFi Network</strong> and go to <strong>Settings</strong> → <strong>Security</strong> → <strong>General</strong>.",
        "guide.ubiquiti.s2": "Under <strong>DNS Shield</strong> (Encrypted DNS), toggle it on and select <em>\"Custom\"</em>.",
        "guide.ubiquiti.s3": "Enter the DoH URL: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code> and IP address: <code class=\"code-inline\">85.208.114.51</code>.",
        "guide.ubiquiti.title_stamp": "DNS Stamp (for DNS Shield / dnscrypt-proxy):",
        "guide.ubiquiti.title_wan": "Standard WAN DNS configuration:",
        "guide.ubiquiti.s4": "Go to <strong>Settings</strong> → <strong>Internet</strong> → select your WAN connection → <strong>Advanced (Manual)</strong>.",
        "guide.ubiquiti.s5": "Enter <em>Primary DNS</em>: <code class=\"code-inline\">85.208.114.51</code> and <em>Secondary DNS</em>: <code class=\"code-inline\">2a0e:97c0:c40::51</code>.",
        "guide.ubiquiti.cli": "For EdgeRouter / EdgeOS via terminal (<code>CLI</code>):",

        // Guide Steps - Browsers
        "guide.browser.ff": "<strong>Firefox:</strong> Settings → Privacy & Security → DNS over HTTPS → Max Protection → Custom provider: <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",
        "guide.browser.chrome": "<strong>Chrome / Brave / Edge:</strong> Settings → Privacy and security → Use secure DNS → With: Custom → <code class=\"code-inline\">https://dns.xdp.es/dns-query</code>",

        // Stats Summary
        "stats.summary_title": "Statistics (24h)",
        "stats.view_metrics": "View metrics →",
        "stats.processed": "Queries",
        "stats.blocked": "Blocked",
        "stats.evaded": "Replaced",
        "stats.block_rate": "Block rate",

        // Stats Dashboard Page
        "stats.page_title": "Statistics | xdp.es DNS",
        "stats.subtitle": "Real-time traffic and performance metrics.",
        "stats.tab_24h": "24 Hours",
        "stats.tab_30d": "30 Days",
        "stats.card_total": "Total Queries",
        "stats.card_blocked": "Blocked Queries",
        "stats.card_evaded": "Replaced Queries",
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
        "stats.evaded_suffix": "replaced",
        "stats.of_group": "of group",
        "stats.of_total": "total",
        "stats.asns_count": "{count} ASNs",

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
        "about.page_title": "About xdp.es DNS | Neutrality & Over-blocking Mitigation",
        "about.title": "About xdp.es DNS",
        "about.subtitle": "A high-performance, privacy-first, zero-logging recursive DNS resolver.",
        "about.pill_nologs": "Zero-Logs",
        "about.pill_dnssec": "DNSSEC",
        "about.pill_madrid": "Hosted in Madrid",
        "about.pill_dualstack": "IPv4 / IPv6",
        "about.pill_doh3": "DoH3 & DoT",

        // Section 1: Privacy & Infrastructure
        "about.sec_privacy_title": "Privacy & Infrastructure",
        "about.sec_privacy_desc": "xdp.es DNS was created to provide an ultra-fast resolution service based on modern protocols and a strict commitment to privacy. Its infrastructure is designed to mitigate and circumvent indiscriminate CDN blocks, as well as blocks applied by mistake that affect legitimate services. We do not store any query logs or user activity data, maintaining only aggregated numeric resolution counters.",
        "about.blocklist_source": "To identify affected IPv4 addresses, we use the public block list provided by <a href=\"https://hayahora.futbol/estado/blocked-any.txt\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">hayahora.futbol</a>. Before applying any replacement, each address is validated against the prefixes announced by Cloudflare AS13335; this external source receives no data about our users' queries.",
        "about.sec_privacy_link": "You can find more information about indiscriminate blocks affecting CDN networks on the <a href=\"https://bandaancha.eu/articulos/laliga-estira-bloqueo-ips-cloudflare-11797\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">BandaAncha.eu forum</a> (in Spanish).",
        "about.card_nologs_title": "Zero-Logs Policy",
        "about.card_nologs_desc": "We never log, track, or store your DNS queries or IP address. Public dashboard statistics are in-memory integer metrics with zero personally identifiable information.",
        "about.card_dnssec_title": "DNSSEC Validation",
        "about.card_dnssec_desc": "Full cryptographic validation against the root trust anchor, ensuring DNS responses are authentic and protected against spoofing or cache-poisoning attacks.",
        "about.card_recursive_title": "Direct Root Recursive Resolution",
        "about.card_recursive_desc": "We do not forward your queries to third-party upstreams (such as Google or Cloudflare). Our Unbound resolver queries IANA root servers and authoritative nameservers directly, eliminating intermediaries.",
        "about.card_qname_title": "QNAME Minimisation (RFC 9156)",
        "about.card_qname_desc": "Strict implementation of RFC 9156: only the minimum domain label required for each hierarchy level is sent to root and TLD nameservers, concealing the exact subdomains or services you visit.",
        "about.card_location_title": "Located in Madrid (Spain)",
        "about.card_location_desc": "Servers hosted directly in Madrid with low latency and optimal connectivity across Spain and the Iberian Peninsula.",
        "about.card_dualstack_title": "Full IPv4 & IPv6 Dual-Stack",
        "about.card_dualstack_desc": "Native dual-stack connectivity across both IPv4 and IPv6, ready for optimal resolution across any modern network.",

        // Section 2: Protocols & Performance
        "about.sec_tech_title": "Modern Protocols & Performance",
        "about.card_encrypted_title": "Modern Encryption with DoH3 & DoT",
        "about.card_encrypted_desc": "Full support for DNS over HTTP/3 (DoH3 with QUIC) offering 0-RTT handshakes and zero head-of-line blocking, alongside standard DNS over TLS (DoT RFC 7858) for native OS-level encryption.",
        "about.card_filtering_title": "Ad & Tracker Filtering",
        "about.card_filtering_desc": "Real-time proactive filtering of intrusive ads, tracking telemetry, and malicious domains using the <a href=\"https://github.com/hagezi/dns-blocklists\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-link\">HaGeZi Multi PRO</a> list, improving browsing speed and reducing bandwidth usage.",

        // Section 3: Addresses
        "about.sec_addresses_title": "Service Addresses",
        "about.svc_adblock_desc": "Blocks ads, trackers and malware",
        "about.svc_standard_desc": "Clean DNS resolution, no ad blocking",
        "about.addr_ipv4": "IPv4 Address:",
        "about.addr_ipv6": "IPv6 Address:",
        "about.addr_doh": "DoH / DoH3 Endpoint:",
        "about.addr_dot": "DoT Endpoint:",

        // Section 4: Contact
        "about.sec_contact_title": "Contact",
        "about.sec_contact_desc": "For questions, issues or suggestions: <a href=\"mailto:contacto@xdp.es\" class=\"text-link\">contacto@xdp.es</a>",

        // Blocked IPs / Evasion Monitor Page
        "blocked.page_title": "Block Evasion Monitor | xdp.es DNS",
        "blocked.title": "Block Evasion Monitor",
        "blocked.subtitle": "Real-time tracking of blocked IPs (IPv4 and IPv6), impacted critical services and measured outage duration.",
        "blocked.live_checking": "Checking status...",
        "blocked.live_active": "Evasion Active ({count} IPs)",
        "blocked.live_inactive": "No active blocks (Direct)",
        "blocked.stat_total": "Banned IPs",
        "blocked.stat_cf": "On Cloudflare",
        "blocked.stat_evaded": "Evaded Routes",
        "blocked.stat_services": "Monit. Services",
        "blocked.services_title": "Monitored critical services",
        "blocked.services_subtitle": "Downtime is counted when a service's resolved IPs match the blocklist, or the residential probe installs a redirect. Cloudflare is only an incident above a mass-block threshold (not 1–2 leftover IPs).",
        "blocked.service_status_operational": "Operational (Protected)",
        "blocked.service_status_evaded": "Evasion Active",
        "blocked.service_critical": "Critical",
        "blocked.time_30d": "Blocked (30d)",
        "blocked.time_7d": "Last 7d",
        "blocked.time_today": "Today",
        "blocked.last_incident_label": "Last incident:",
        "blocked.ongoing_incident": "Ongoing ({duration})",
        "blocked.no_recent_incidents": "No measured incidents yet",
        "blocked.mitigation_title": "XDP Mitigation:",
        "blocked.monitored_domains_label": "Domains:",
        "blocked.category_dev": "Development / DevOps",
        "blocked.category_git": "Git & Repositories",
        "blocked.category_streaming": "Streaming & Video",
        "blocked.category_gaming": "Gaming & Store",
        "blocked.category_pkg": "Packages / CI",
        "blocked.category_pki": "TLS certificates",
        "blocked.category_ai": "AI & APIs",
        "blocked.category_cdn": "Global Anycast CDN",
        "blocked.category_payments": "Payments / TPV",
        "blocked.ips_title": "Blocked IP Addresses List",
        "blocked.history_title": "Incident history",
        "blocked.history_subtitle": "Only outages measured by this monitor (public blocklist and residential probe). This is not a court-appointed expert report.",
        "blocked.history_stat_incidents": "Measured incidents",
        "blocked.history_stat_hours": "Accumulated time",
        "blocked.history_stat_services": "Impacted services",
        "blocked.history_filter_all": "All services",
        "blocked.history_search_placeholder": "Search incident by service, date, IP or domain...",
        "blocked.history_export_all": "📋 Copy technical report (all)",
        "blocked.history_legal_guide_btn": "How to complain (ISP, SETID/OAUT, CNMC, civil courts)",
        "blocked.history_legal_guide_title": "How to use this log in a complaint",
        "blocked.legal_warn": "This log is a party-generated technical report from xdp.es. It stores UTC timestamps, blocklist IPs and domains whose resolution matches those IPs or a probe redirect. It is not a court expert opinion (dictamen pericial): a court may require an expert to ratify it. Outages from before this meter started are not listed.",
        "blocked.legal_s1_title": "1. Complain to your ISP first",
        "blocked.legal_s1_html": "For <strong>OAUT</strong> you must first complain to your ISP's customer service and keep the <strong>internal complaint number</strong>. Without that step the office will dismiss the case. Wait for a reply or 1 month of silence.",
        "blocked.legal_s2_title": "2. SETID / OAUT — service quality and interruption",
        "blocked.legal_s2_html": "The <strong>Telecom User Office</strong> (under SETID) handles billing, portability, contract, faults and <strong>internet access interruption</strong> disputes (Act 11/2022, art. 78). Site: <a href=\"https://usuariosteleco.digital.gob.es/\" target=\"_blank\" rel=\"noopener noreferrer\">usuariosteleco.digital.gob.es</a>. Who can file: natural persons, self-employed and micro-enterprises. Deadline: 3 months from the ISP reply or silence. The decision binds user and operator; <strong>it is not a sanction file against LaLiga</strong> and not the net-neutrality procedure.",
        "blocked.legal_s3_title": "3. CNMC — open internet / overblocking",
        "blocked.legal_s3_html": "Spain's authority for <strong>Regulation (EU) 2015/2120</strong> is the <strong>CNMC</strong>, not SETID (Act 11/2022, art. 76). Portal: <a href=\"https://sede.cnmc.gob.es/\" target=\"_blank\" rel=\"noopener noreferrer\">sede.cnmc.gob.es</a>. The solid argument is not “every block is illegal”, but <strong>lack of proportionality</strong> when shared anycast IPs cut off lawful services (Docker, GitHub, npm, Let's Encrypt, etc.).",
        "blocked.legal_s4_title": "4. European Commission and Ombudsman",
        "blocked.legal_s4_html": "EU-law infringement complaint: <a href=\"https://commission.europa.eu/about-european-commission/contact/problems-and-complaints/complaints-about-breaches-eu-law-member-states_en\" target=\"_blank\" rel=\"noopener noreferrer\">European Commission form</a>. The Spanish Ombudsman (Defensor del Pueblo) can request information from the Administration if inaction persists.",
        "blocked.legal_s5_title": "5. Civil claims (damages)",
        "blocked.legal_s5_html": "<strong>Civil Code art. 1101</strong>: contractual liability against <em>your ISP</em> for the access service you pay for. <strong>Art. 1902</strong>: extra-contractual (tort); harder if the filter is backed by a court order. This JSON/report can be attached as <strong>party documentary evidence</strong>, not as a judicial expert report.",
        "blocked.legal_s6_title": "Substantive rule (do not cite it backwards)",
        "blocked.legal_s6_html": "Arts. 3(1)–(3) of Regulation 2015/2120 require equal treatment of traffic. <strong>Art. 3(3)(a)</strong> lets ISPs comply with court or authority orders; the issue is whether blocking a shared CDN IP is <strong>necessary and proportionate</strong> (recital 13). Attach incident IDs, UTC windows, IPs and domains from this log.",
        "blocked.incident_status_ongoing": "Ongoing block",
        "blocked.incident_status_resolved": "Closed (measured)",
        "blocked.incident_time_window": "Time window:",
        "blocked.incident_duration": "Duration:",
        "blocked.incident_targets": "Impacted domains:",
        "blocked.incident_ips": "Matching IPs:",
        "blocked.incident_cause": "What was measured:",
        "blocked.incident_impact": "Technical impact:",
        "blocked.incident_mitigation": "XDP mitigation:",
        "blocked.incident_legal_basis": "Legal reference:",
        "blocked.incident_source": "Measurement source:",
        "blocked.incident_copy_report": "📋 Copy technical report",
        "blocked.incident_report_copied": "✓ Report copied",
        "blocked.incident_no_results": "No measured incidents match your search.",
        "blocked.incident_empty": "No measured incidents yet. The log starts when the monitor detects a real outage (blocklist or probe); there is no filler data.",
        "blocked.incident_more_ips": "+{count} more",
        "blocked.search_placeholder": "Search IP or prefix...",
        "blocked.filter_all": "All",
        "blocked.filter_cf": "Cloudflare",
        "blocked.filter_other": "Other CDNs",
        "blocked.filter_v4": "IPv4",
        "blocked.filter_v6": "IPv6",
        "blocked.list_ooni": "OONI",
        "blocked.list_probe": "Probe",
        "blocked.list_live": "Live",
        "blocked.refresh": "Refresh",
        "blocked.th_ip": "Blocked IP",
        "blocked.th_network": "Network / Provider",
        "blocked.th_prefix": "BGP Prefix",
        "blocked.th_alternative": "Alternative IP (Evasion)",
        "blocked.th_status": "Status",
        "blocked.card_banned": "⛔ Banned IP",
        "blocked.card_clean_alt": "⚡ Clean Alternative IP",
        "blocked.card_prefix": "Prefix:",
        "blocked.status_evaded": "Evaded",
        "blocked.status_intact": "Direct",
        "blocked.badge_other": "Others",
        "blocked.copy_btn": "Copy",
        "blocked.copied": "✓ Copied",
        "blocked.copy_failed": "✗ Error",
        "blocked.load_error": "⚠️ Could not load data. Press Refresh to retry.",
        "blocked.no_services": "No service information available.",
        "blocked.prev": "Previous",
        "blocked.next": "Next",
        "blocked.empty_no_blocks": "🟢 No IPs are currently blocked at this time.",
        "blocked.empty_not_found": "No results found for your search.",
        "blocked.loading": "Loading data...",

        // /test page
        "test.page_title": "DNS Test | Check if your connection is protected with xdp.es",
        "test.title": "Are you browsing via XDP?",
        "test.checking": "Checking…",
        "test.retry": "Run again",
        "test.verdict_yes": "✅ Yes — {service}",
        "test.verdict_yes_sub": "Your connection resolves through XDP.",
        "test.verdict_no": "❌ You are not using XDP",
        "test.resolver_label": "Your DNS resolver:",
        "test.verdict_unknown": "⚠️ Could not determine",
        "test.unknown_sub": "Browser DoH, Private Relay or a VPN may be in use.",
        "test.asn_unknown": "Unknown ASN"
    }
};

function getLanguage() {
    const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'es').toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
}

function t(key, lang) {
    const activeLang = lang || getLanguage();
    if (key === 'std.title') {
        const mode = (typeof currentDnsMode !== 'undefined' ? currentDnsMode : (document.body && document.body.dataset && document.body.dataset.dnsMode) || 'adblock');
        return mode === 'standard' ? (activeLang === 'es' ? 'DNS Estándar' : 'Standard DNS') : (activeLang === 'es' ? 'DNS Adblock' : 'Adblock DNS');
    }
    if (key === 'std.desc') {
        const mode = (typeof currentDnsMode !== 'undefined' ? currentDnsMode : (document.body && document.body.dataset && document.body.dataset.dnsMode) || 'adblock');
        return mode === 'standard' ? (activeLang === 'es' ? 'Resolución DNS estándar con validación DNSSEC.' : 'Standard DNS resolution with DNSSEC validation.') : (activeLang === 'es' ? 'Resolución DNS con filtrado Adblock y validación DNSSEC.' : 'Adblock DNS resolution with DNSSEC validation.');
    }
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

    // Update Placeholder content
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const placeholder = t(key, currentLang);
        if (placeholder) {
            el.setAttribute('placeholder', placeholder);
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
