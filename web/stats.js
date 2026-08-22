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
    itemLeft.appendChild(nameSpan);

    if (isAsn && item.ipv4_percent !== undefined && item.ipv6_percent !== undefined) {
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

function renderAsnListWithAccordion(elementId, isps, dcs, period) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';

    const ispItems = (isps || []).slice(0, 8);
    const dcItems = (dcs || []).slice(0, 8);

    if (ispItems.length === 0 && dcItems.length === 0) {
        container.innerHTML = '<div class="empty-msg">Sin consultas registradas.</div>';
        return;
    }

    const allItems = [...ispItems, ...dcItems];
    const maxCount = Math.max(...allItems.map(i => i.count), 1);

    // 1. Render Top 8 ISP items
    ispItems.forEach(item => {
        const row = createStatRow(item, maxCount, true);
        container.appendChild(row);
    });

    // 2. Render 9th item: Datacenter ASN accordion toggle
    if (dcItems.length > 0) {
        const totalDcCount = dcItems.reduce((acc, curr) => acc + (curr.count || 0), 0);

        let dcToggleTitle = 'Datacenter ASN';
        let dcToggleSub = `${dcItems.length} centros de datos y servidores`;
        if (window.i18n && typeof window.i18n.t === 'function') {
            const resT = window.i18n.t('stats.dc_toggle_title');
            if (resT && !resT.includes('.')) dcToggleTitle = resT;
            const resS = window.i18n.t('stats.dc_toggle_sub');
            if (resS && !resS.includes('.')) dcToggleSub = resS;
        }

        const toggleRow = document.createElement('div');
        toggleRow.className = 'stats-row-item dc-accordion-toggle';
        toggleRow.setAttribute('role', 'button');
        toggleRow.setAttribute('tabindex', '0');
        toggleRow.setAttribute('id', `dc-toggle-${period}`);

        const itemLeft = document.createElement('div');
        itemLeft.className = 'item-left';

        const nameRow = document.createElement('div');
        nameRow.className = 'item-name-row';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'dc-toggle-icon';
        iconSpan.innerText = '▶';
        nameRow.appendChild(iconSpan);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.style.fontWeight = '600';
        nameSpan.innerText = dcToggleTitle;
        nameSpan.setAttribute('data-i18n', 'stats.dc_toggle_title');
        nameRow.appendChild(nameSpan);

        itemLeft.appendChild(nameRow);

        const subSpan = document.createElement('span');
        subSpan.className = 'item-sub';
        subSpan.innerText = dcToggleSub;
        subSpan.setAttribute('data-i18n', 'stats.dc_toggle_sub');
        itemLeft.appendChild(subSpan);

        toggleRow.appendChild(itemLeft);

        const countSpan = document.createElement('span');
        countSpan.className = 'item-count';
        countSpan.innerText = Number(totalDcCount).toLocaleString();
        toggleRow.appendChild(countSpan);

        // Content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'dc-accordion-content';
        contentDiv.id = `dc-content-${period}`;

        dcItems.forEach(item => {
            const dcRow = createStatRow(item, maxCount, true);
            contentDiv.appendChild(dcRow);
        });

        // Click / Keyboard handler to toggle accordion
        toggleRow.onclick = function() {
            const isExpanded = contentDiv.classList.toggle('expanded');
            toggleRow.classList.toggle('expanded', isExpanded);
            if (isExpanded) {
                contentDiv.querySelectorAll('.row-bg-bar').forEach(bar => {
                    const w = bar.getAttribute('data-target-width');
                    if (w) bar.style.width = w;
                });
            }
        };

        toggleRow.onkeydown = function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleRow.click();
            }
        };

        container.appendChild(toggleRow);
        container.appendChild(contentDiv);
    }
}

function loadStatsData() {
    fetch('/stats.json')
        .then(r => {
            if (!r.ok) throw new Error('Network response not ok');
            return r.json();
        })
        .then(data => {
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

            renderAsnListWithAccordion('list-asns-24h', s24.top_asns_isp || s24.top_asns, s24.top_asns_datacenter, '24h');
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

            renderAsnListWithAccordion('list-asns-30d', s30.top_asns_isp || s30.top_asns, s30.top_asns_datacenter, '30d');
            renderStatsList('list-types-30d', s30.top_query_types, false);
        })
        .catch(err => {
            console.error('Error al cargar stats:', err);
        });
}

function detectUserConnection() {
    const iconWrap = document.getElementById('conn-icon-wrapper');
    const desc = document.getElementById('conn-desc');
    const ipEl = document.getElementById('conn-ip');

    function applyConnection(ip, asn, orgName, isV6) {
        const asnDisplay = asn ? `AS${asn} • ` : '';
        const logoUrl = getIspLogo(`${orgName} AS${asn}`);

        if (iconWrap) {
            if (logoUrl) {
                iconWrap.innerHTML = `<img src="${logoUrl}" alt="${orgName}" class="conn-isp-logo-main" />`;
            } else {
                iconWrap.innerHTML = `<div class="status-dot ${isV6 ? 'ipv6' : 'ipv4'}" id="conn-dot"></div>`;
            }
        }

        if (desc) desc.innerText = `${asnDisplay}${orgName}`;
        if (ipEl) ipEl.innerText = ip;
    }

    fetch('https://ipwho.is/')
        .then(r => r.json())
        .then(data => {
            if (data && data.success) {
                const ip = data.ip || '-';
                const isV6 = ip.includes(':');
                const asn = (data.connection && data.connection.asn) || '';
                const orgName = (data.connection && (data.connection.org || data.connection.isp)) || 'Network';
                applyConnection(ip, asn, orgName, isV6);
            } else {
                fallbackDetect();
            }
        })
        .catch(() => {
            fallbackDetect();
        });

    function fallbackDetect() {
        fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
                if (data && data.ip) {
                    const ip = data.ip;
                    const isV6 = ip.includes(':');
                    const asn = (data.asn || '').replace(/^AS/i, '');
                    const orgName = data.org || data.carrier || 'Network';
                    applyConnection(ip, asn, orgName, isV6);
                }
            })
            .catch(() => {
                if (desc) desc.innerText = 'Conexión Activa';
                if (ipEl) ipEl.innerText = '-';
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStatsData();
    detectUserConnection();
    // Auto-refresh data every 30 seconds
    setInterval(loadStatsData, 30000);
});
