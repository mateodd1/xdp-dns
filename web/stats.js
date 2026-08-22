// /root/xpd-dns/web/stats.js
// Anonymous DNS Metrics & Connection Status Loader

function switchTab(interval) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[data-interval="${interval}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const activePane = document.getElementById(`pane-${interval}`);
    if (activePane) activePane.classList.add('active');
}

function getIspLogo(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes('telefonica') || lower.includes('movistar') || lower.includes('as3352') || lower.includes('as6739')) {
        return '/stats/img/movistar.svg';
    }
    if (lower.includes('vodafone') || lower.includes('as12430')) {
        return '/stats/img/vodafone.svg';
    }
    if (lower.includes('orange') || lower.includes('as12479')) {
        return '/stats/img/orange.svg';
    }
    if (lower.includes('digi') || lower.includes('as57269') || lower.includes('as206238')) {
        return '/stats/img/digi.png';
    }
    if (lower.includes('yoigo') || lower.includes('masmovil') || lower.includes('másmóvil') || lower.includes('xfera') || lower.includes('pepephone') || lower.includes('euskaltel') || lower.includes('as15704') || lower.includes('as210344') || lower.includes('as15954') || lower.includes('as56645')) {
        return '/stats/img/masmovil.svg';
    }
    return null;
}

function createStatRow(item, maxCount, isAsn = false) {
    const percent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
    const row = document.createElement('div');
    row.className = 'stats-row-item';

    if (item.isSwitchCard) {
        row.classList.add('asn-switch-card');
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        if (item.onClick) {
            row.onclick = item.onClick;
            row.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.onClick();
                }
            };
        }
    }

    const bgBar = document.createElement('div');
    bgBar.className = 'row-bg-bar';
    bgBar.style.width = '0%';
    bgBar.setAttribute('data-target-width', `${percent}%`);
    row.appendChild(bgBar);

    const itemLeft = document.createElement('div');
    itemLeft.className = 'item-left';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.innerText = item.name;
    if (item.nameI18nKey) nameSpan.setAttribute('data-i18n', item.nameI18nKey);
    itemLeft.appendChild(nameSpan);

    if (item.sub) {
        const subSpan = document.createElement('span');
        subSpan.className = 'item-sub';
        subSpan.innerText = item.sub;
        if (item.subI18nKey) subSpan.setAttribute('data-i18n', item.subI18nKey);
        itemLeft.appendChild(subSpan);
    } else if (isAsn && item.ipv4_percent !== undefined && item.ipv6_percent !== undefined) {
        const subSpan = document.createElement('span');
        subSpan.className = 'item-sub';
        subSpan.innerText = `IPv4: ${item.ipv4_percent}% • IPv6: ${item.ipv6_percent}%`;
        itemLeft.appendChild(subSpan);
    }

    row.appendChild(itemLeft);

    const countSpan = document.createElement('span');
    countSpan.className = 'item-count';
    if (item.percent !== undefined) {
        countSpan.innerText = `${item.percent}% (${Number(item.count).toLocaleString()})`;
    } else {
        countSpan.innerText = Number(item.count).toLocaleString();
    }
    row.appendChild(countSpan);

    setTimeout(() => {
        bgBar.style.width = `${percent}%`;
    }, 50);

    return row;
}

function renderStatsList(elementId, items, isAsn = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';

    const displayItems = (items || []).filter(i => i && i.name && i.name.toUpperCase() !== 'ANY');

    if (!displayItems || displayItems.length === 0) {
        container.innerHTML = '<div class="empty-msg">Sin consultas registradas.</div>';
        return;
    }

    const maxCount = Math.max(...displayItems.map(i => i.count), 1);

    displayItems.forEach(item => {
        const row = createStatRow(item, maxCount, isAsn);
        container.appendChild(row);
    });
}

let currentStatsCache = null;
let currentAsnCategory24h = 'isp';
let currentAsnCategory30d = 'isp';

function switchAsnCategory(period, category) {
    if (period === '24h') {
        currentAsnCategory24h = category;
        if (currentStatsCache && currentStatsCache.stats_24h) {
            renderAsnSection('24h', currentStatsCache.stats_24h, category);
        }
    } else {
        currentAsnCategory30d = category;
        if (currentStatsCache && currentStatsCache.stats_30d) {
            renderAsnSection('30d', currentStatsCache.stats_30d, category);
        }
    }
}

function renderAsnSection(period, statsObj, category) {
    const elementId = period === '24h' ? 'list-asns-24h' : 'list-asns-30d';
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';

    const isIsp = category === 'isp';
    const ispItems = statsObj.top_asns_isp && statsObj.top_asns_isp.length > 0 ? statsObj.top_asns_isp : (statsObj.top_asns || []);
    const dcItems = statsObj.top_asns_datacenter || [];

    const currentItems = (isIsp ? ispItems : dcItems).slice(0, 8);
    const otherItems = isIsp ? dcItems : ispItems;

    if (!currentItems || currentItems.length === 0) {
        container.innerHTML = '<div class="empty-msg">Sin consultas registradas.</div>';
        return;
    }

    const otherTotal = otherItems.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const allItemsForMax = [...currentItems];
    if (otherTotal > 0) {
        allItemsForMax.push({ count: otherTotal });
    }
    const maxCount = Math.max(...allItemsForMax.map(i => i.count), 1);

    // 1. Render Top 8 current items
    currentItems.forEach(item => {
        const row = createStatRow(item, maxCount, true);
        container.appendChild(row);
    });

    // 2. Render 9th item: Toggle card with identical layout and count
    if (otherItems.length > 0) {
        const targetCategory = isIsp ? 'datacenter' : 'isp';
        const nameKey = isIsp ? 'stats.asn_toggle_to_dc' : 'stats.asn_toggle_to_isp';
        const subKey = isIsp ? 'stats.asn_toggle_to_dc_sub' : 'stats.asn_toggle_to_isp_sub';

        const toggleItem = {
            name: isIsp ? 'Otros ASN' : 'Operadores (ISP)',
            nameI18nKey: nameKey,
            sub: isIsp ? 'Centros de datos y redes externas' : 'Proveedores de Internet y móvil',
            subI18nKey: subKey,
            count: otherTotal,
            isSwitchCard: true,
            onClick: () => switchAsnCategory(period, targetCategory)
        };

        const switchRow = createStatRow(toggleItem, maxCount, true);
        container.appendChild(switchRow);
    }
}

function loadStatsData() {
    fetch('/stats.json')
        .then(r => {
            if (!r.ok) throw new Error('Network response not ok');
            return r.json();
        })
        .then(data => {
            currentStatsCache = data;
            const s24 = data.stats_24h || {};
            const s30 = data.stats_30d || {};

            // 24 Hours Metrics
            const elTotal24 = document.getElementById('val-total-24h');
            const elBlocked24 = document.getElementById('val-blocked-24h');
            const elSubBlocked24 = document.getElementById('sub-blocked-24h');
            const elCached24 = document.getElementById('val-cached-24h');
            const elSubCached24 = document.getElementById('sub-cached-24h');
            const elLatency24 = document.getElementById('val-latency-24h');

            if (elTotal24) elTotal24.innerText = Number(s24.total || 0).toLocaleString();
            if (elBlocked24) elBlocked24.innerText = Number(s24.blocked || 0).toLocaleString();
            if (elSubBlocked24) elSubBlocked24.innerText = `${s24.blocked_pct || 0}% tasa de bloqueo`;
            if (elCached24) elCached24.innerText = `${s24.cached_pct || 0}%`;
            if (elSubCached24) elSubCached24.innerText = `${Number(s24.cached || 0).toLocaleString()} en caché`;
            if (elLatency24) elLatency24.innerText = `${s24.avg_duration || 0} ms`;

            renderAsnSection('24h', s24, currentAsnCategory24h);
            renderStatsList('list-types-24h', s24.top_query_types, false);

            // 30 Days Metrics
            const elTotal30 = document.getElementById('val-total-30d');
            const elBlocked30 = document.getElementById('val-blocked-30d');
            const elSubBlocked30 = document.getElementById('sub-blocked-30d');
            const elCached30 = document.getElementById('val-cached-30d');
            const elSubCached30 = document.getElementById('sub-cached-30d');
            const elLatency30 = document.getElementById('val-latency-30d');

            if (elTotal30) elTotal30.innerText = Number(s30.total || 0).toLocaleString();
            if (elBlocked30) elBlocked30.innerText = Number(s30.blocked || 0).toLocaleString();
            if (elSubBlocked30) elSubBlocked30.innerText = `${s30.blocked_pct || 0}% tasa de bloqueo`;
            if (elCached30) elCached30.innerText = `${s30.cached_pct || 0}%`;
            if (elSubCached30) elSubCached30.innerText = `${Number(s30.cached || 0).toLocaleString()} en caché`;
            if (elLatency30) elLatency30.innerText = `${s30.avg_duration || 0} ms`;

            renderAsnSection('30d', s30, currentAsnCategory30d);
            renderStatsList('list-types-30d', s30.top_query_types, false);
        })
        .catch(err => {
            console.error('Error al cargar stats:', err);
        });
}

function updateStatusCard(info) {
    const statusCard = document.getElementById('connection-status');
    if (!statusCard) return;

    const ip = info.query || info.ip || '-';
    const isIPv6 = ip.includes(':');

    // Extract ASN from "as" field (e.g. "AS12430 Vodafone Espana S.A.U.")
    let asnDisplay = '';
    let ispDisplay = info.isp || info.org || 'Unknown ISP';

    if (info.as) {
        const match = info.as.match(/^(AS\d+)\b/i);
        if (match) {
            asnDisplay = `${match[1].toUpperCase()} • `;
        }
    }

    // Determine logo to show
    let logoHtml = `<div class="connection-icon-wrapper"><div class="status-dot ${isIPv6 ? 'ipv6' : 'ipv4'}"></div></div>`;
    let brandClass = isIPv6 ? 'brand-ipv6' : 'brand-ipv4';

    const lowerAS = (info.as || '').toLowerCase();
    const lowerISP = (info.isp || '').toLowerCase();
    const lowerORG = (info.org || '').toLowerCase();

    const isVodafone = lowerAS.includes('as12430') || lowerISP.includes('vodafone') || lowerORG.includes('vodafone');
    const isMovistar = lowerAS.includes('as3352') || lowerAS.includes('as3351') || lowerISP.includes('telefonica') || lowerISP.includes('movistar') || lowerORG.includes('telefonica') || lowerORG.includes('movistar');
    const isOrange = lowerAS.includes('as12479') || lowerISP.includes('orange') || lowerORG.includes('orange');
    const isDigi = lowerAS.includes('as57269') || lowerAS.includes('as206238') || lowerISP.includes('digi') || lowerORG.includes('digi');
    const isMasmovil = lowerAS.includes('as15704') || lowerAS.includes('as210344') || lowerAS.includes('as15954') || lowerAS.includes('as56645') || lowerISP.includes('yoigo') || lowerISP.includes('masmovil') || lowerISP.includes('másmóvil') || lowerISP.includes('xfera') || lowerISP.includes('pepephone') || lowerISP.includes('euskaltel') || lowerORG.includes('yoigo') || lowerORG.includes('masmovil') || lowerORG.includes('másmóvil') || lowerORG.includes('xfera') || lowerORG.includes('pepephone') || lowerORG.includes('euskaltel');

    if (isVodafone) {
        logoHtml = `<div class="connection-icon-wrapper"><img src="/stats/img/vodafone.svg" alt="Vodafone" style="width: 24px; height: 24px;" /></div>`;
        brandClass = 'brand-vodafone';
    } else if (isMovistar) {
        logoHtml = `<div class="connection-icon-wrapper"><img src="/stats/img/movistar.svg" alt="Movistar" style="width: 22px; height: 22px;" /></div>`;
        brandClass = 'brand-movistar';
    } else if (isOrange) {
        logoHtml = `<div class="connection-icon-wrapper"><img src="/stats/img/orange.svg" alt="Orange" style="width: 22px; height: 22px;" /></div>`;
        brandClass = 'brand-orange';
    } else if (isDigi) {
        logoHtml = `<div class="connection-icon-wrapper"><img src="/stats/img/digi.png" alt="Digi" style="width: 24px; height: 24px;" /></div>`;
        brandClass = 'brand-digi';
    } else if (isMasmovil) {
        logoHtml = `<div class="connection-icon-wrapper"><svg viewBox="0 0 1167 1028" class="masmovil-logo-svg" style="width: 26px; height: 26px;"><path class="mas-m-path" d="M87.96 0.17C95.64 0.17 103.32 0.17 111 0.17C113.66 1.06 116.64 0.83 119.5 1.14C123.8 1.61 128.2 2.41 132.45 3.24C141.46 5.01 150.92 9.77 158.35 15.11C180.85 31.31 193.1 58.29 203.44 83.12C214.49 109.7 227.5 135.47 238.45 162.1C243.43 174.21 249.45 185.9 254.49 198C272.85 242.11 294.02 285.08 312.35 329.21C319.31 345.97 327.77 362.13 334.51 378.96C344.35 403.53 355.78 427.67 366.67 451.79C369.64 458.39 376.34 476.92 380.5 481.16C392.49 450.86 407.75 421.87 420.36 391.84C447.84 326.36 479 262.43 506.48 196.95C513.42 180.43 521.43 164.36 528.37 147.84C537.65 125.75 548.46 104.27 557.55 82.09C567.34 58.19 578.22 32.09 599.75 16.26C607.79 10.35 617.84 5.43 627.64 3.3C633.93 1.94 641.12 2.02 647.1 0.17C656.35 0.17 665.6 0.17 674.85 0.17C680.68 1.95 690.36 1.71 697.28 3.35C706.24 5.47 715.34 10.41 722.85 15.63C738.76 26.67 752.92 44.65 757.7 63.67C762.66 83.37 760.91 104.36 760.91 124.5C760.91 155.83 760.91 187.17 760.91 218.5C760.91 412.17 760.91 605.83 760.91 799.5C760.91 840.5 760.91 881.5 760.91 922.5C760.91 950.08 760.99 979.8 740.91 1001.39C732.01 1010.95 720.54 1018.38 708.17 1022.59C701.79 1024.76 693.72 1025.3 687.92 1027.83C679.26 1027.83 670.6 1027.83 661.93 1027.83C656.99 1025.7 650.98 1025.4 645.77 1023.64C633.38 1019.45 621.89 1013.2 612.58 1003.93C589.98 981.43 590.14 952.22 590.11 922.5C590.09 893.83 590.1 865.17 590.1 836.5C590.1 741.17 590.14 645.83 590.12 550.5C590.11 520.17 590.09 489.83 590.07 459.5C590.06 449.83 590.06 440.17 590.05 430.5C590.04 425.06 590.6 419.27 589.5 413.97C583.95 425.28 579.09 437.14 574.32 448.8C567.04 466.61 558.7 484.01 551.29 501.77C535.3 540.12 517.32 577.67 501.61 616.14C494.24 634.17 485.57 651.67 478.26 669.72C472.19 684.72 466.15 701 456.8 714.3C437.61 741.63 410.63 753.6 377.5 752.99C359.1 752.65 341.39 747.71 326.06 737.44C307.37 724.93 296.77 704.08 288.54 683.92C283.19 670.8 276.92 658.05 271.52 644.95C262.65 623.42 252.38 602.46 243.6 580.89C231.19 550.41 217.73 520.26 204.33 490.21C196.63 472.93 188.67 455.6 181.45 438.09C178.37 430.62 175.07 420.67 170.5 414.13C168.76 428.94 170.17 445.49 170.13 460.5C170.05 490.83 169.96 521.17 169.93 551.5C169.84 643.5 170.1 735.5 169.98 827.5C169.94 859.83 169.93 892.17 169.86 924.5C169.79 953.17 170.87 978.94 150.05 1001.54C139.95 1012.51 126.5 1020.53 112.14 1024.56C107.47 1025.88 101.31 1025.82 97.17 1027.83C88.15 1027.83 79.12 1027.83 70.1 1027.83C63.87 1025.12 56.31 1024.32 49.76 1021.71C33.08 1015.04 17.15 1002.84 9.27 986.26C7 981.48 4.63 976.42 3.36 971.27C2.22 966.69 1.88 961.41 0.17 957.1C0.17 662.12 0.17 367.13 0.17 72.14C1.75 68.77 2.3 64.51 3.39 60.8C4.79 56.02 7.15 51.31 9.44 46.91C19.41 27.78 37.41 12.53 57.54 5.08C63.18 2.99 69.51 1.54 75.5 0.97C79.59 0.58 84.07 1.17 87.96 0.17Z" fill-rule="evenodd"/><path d="M1051.9 0.17C1055.56 0.17 1059.22 0.17 1062.88 0.17C1065.51 1.1 1068.58 0.98 1071.46 1.3C1077.44 1.95 1083.39 2.92 1089.23 4.39C1112.8 10.29 1134.6 23.87 1148.46 44.04C1166.82 70.76 1166.22 95.39 1166.22 126.5C1166.22 148.17 1166.22 169.83 1166.22 191.5C1166.21 301.5 1166.14 411.5 1166.2 521.5C1166.22 544.83 1166.22 568.17 1166.24 591.5C1166.25 609.75 1167.43 628.3 1163.63 646.27C1158.5 670.5 1142.58 691.4 1121.7 704.2C1113.73 709.08 1105.27 713.11 1096.28 715.71C1083.5 719.41 1070.87 721.67 1057.5 721.76C1044.84 721.84 1032.44 719.82 1020.32 716.29C1010.84 713.54 1001.6 709.56 993.2 704.35C968.64 689.13 952.68 663.12 949.26 634.46C947.67 621.07 948.85 606.97 948.85 593.5C948.85 571.17 948.85 548.83 948.85 526.5C948.85 414.5 948.9 302.5 948.85 190.5C948.84 167.83 948.83 145.17 948.83 122.5C948.83 93.25 947.95 70.24 965.68 45.22C980.57 24.21 1002.1 11.05 1026.65 4.26C1031.76 2.85 1037.26 1.85 1042.52 1.24C1045.65 0.87 1048.95 1.15 1051.9 0.17ZM1073.04 1027.83C1062.33 1027.83 1051.62 1027.83 1040.92 1027.83C1033.69 1025.17 1025.14 1025.08 1017.61 1022.79C994.32 1015.68 973.32 1003.38 960.04 982.42C950.02 966.6 948.52 948.81 948.71 930.5C948.86 915.95 948.18 901.83 952.33 887.73C965.39 843.32 1018.49 823.56 1060.5 824.26C1103.17 824.97 1148.64 845.74 1162.68 888.73C1167.3 902.89 1166.63 918.79 1166.39 933.5C1166.13 950.21 1164.5 967.43 1155.44 981.94C1142.51 1002.64 1121.26 1015.9 1098.08 1022.53C1090.1 1024.82 1080.46 1025.03 1073.04 1027.83Z" fill="#ffe200" fill-rule="evenodd"/></svg></div>`;
        brandClass = 'brand-masmovil';
    }

    const titleText = (window.i18n && window.i18n.t('conn.title')) || 'Tu Conexión';

    statusCard.className = 'connection-card ' + brandClass;
    statusCard.innerHTML = `
        <div class="connection-left">
            ${logoHtml}
            <div class="connection-text-group">
                <span class="connection-card-title">${titleText}</span>
                <span class="connection-card-desc">${asnDisplay}${ispDisplay}</span>
            </div>
        </div>
        <div class="connection-right">
            <span class="connection-ip">${ip}</span>
        </div>
    `;
}

function renderErrorCard() {
    const statusCard = document.getElementById('connection-status');
    if (statusCard) {
        const titleText = (window.i18n && window.i18n.t('conn.title')) || 'Tu Conexión';
        statusCard.className = 'connection-card brand-error';
        statusCard.innerHTML = `
            <div class="connection-left">
                <div class="connection-icon-wrapper"><div class="status-dot" style="background-color: #ef4444;"></div></div>
                <div class="connection-text-group">
                    <span class="connection-card-title">${titleText}</span>
                    <span class="connection-card-desc" style="color: #ef4444;">Error al conectar con el servicio GeoIP</span>
                </div>
            </div>
            <div class="connection-right">
                <span class="connection-ip">-</span>
            </div>
        `;
    }
}

function detectUserConnection() {
    // Helper to fetch GeoIP for a specific IP
    function fetchGeoData(currentIp) {
        const cachedIp = localStorage.getItem('geoip_ip');
        const cachedDataStr = localStorage.getItem('geoip_data');

        if (cachedIp === currentIp && cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                updateStatusCard(cachedData);
                return; // Instant load from cache!
            } catch (e) {
                console.error('Error parsing cached geoip data:', e);
            }
        }

        // Fetch details from our backend /api/geoip/{ip}
        fetch('/api/geoip/' + encodeURIComponent(currentIp))
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch geoip info');
                return res.json();
            })
            .then(info => {
                if (info && info.status === 'success') {
                    localStorage.setItem('geoip_ip', currentIp);
                    localStorage.setItem('geoip_data', JSON.stringify(info));
                    updateStatusCard(info);
                } else {
                    throw new Error('GeoIP lookup failed');
                }
            })
            .catch(err => {
                console.error('Error fetching geoip info:', err);
                // Fallback to ipwho.is if backend proxy has any issues
                fetch('https://ipwho.is/' + encodeURIComponent(currentIp))
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.success) {
                            const asn = (data.connection && data.connection.asn) ? `AS${data.connection.asn}` : '';
                            const orgName = (data.connection && (data.connection.org || data.connection.isp)) || 'Network';
                            const fallbackInfo = { query: currentIp, as: asn, isp: orgName };
                            updateStatusCard(fallbackInfo);
                        } else {
                            renderErrorCard();
                        }
                    })
                    .catch(() => renderErrorCard());
            });
    }

    // Step 1: Check if client has IPv6 via fast IPv6 probe (api6.ipify.org or ipwho.is)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    fetch('https://api6.ipify.org?format=json', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
            clearTimeout(timeoutId);
            if (data && data.ip && data.ip.includes(':')) {
                fetchGeoData(data.ip.trim());
            } else {
                fallbackIPv4();
            }
        })
        .catch(() => {
            clearTimeout(timeoutId);
            fallbackIPv4();
        });

    function fallbackIPv4() {
        fetch('/api/ip')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch client IP');
                return res.text();
            })
            .then(ipText => {
                fetchGeoData(ipText.trim());
            })
            .catch(err => {
                console.error('Error fetching client IP:', err);
                fetch('https://ipwho.is/')
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.success) {
                            const ip = data.ip || '-';
                            const asn = (data.connection && data.connection.asn) ? `AS${data.connection.asn}` : '';
                            const orgName = (data.connection && (data.connection.org || data.connection.isp)) || 'Network';
                            updateStatusCard({ query: ip, as: asn, isp: orgName });
                        } else {
                            renderErrorCard();
                        }
                    })
                    .catch(() => renderErrorCard());
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStatsData();
    detectUserConnection();
    // Auto-refresh data every 30 seconds
    setInterval(loadStatsData, 30000);
});
