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
