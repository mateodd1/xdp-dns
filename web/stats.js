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

function renderStatsList(elementId, items, isAsn = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-msg">Sin consultas registradas.</div>';
        return;
    }

    const maxCount = Math.max(...items.map(i => i.count));

    items.forEach(item => {
        const percent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const row = document.createElement('div');
        row.className = 'stats-row-item';

        const bgBar = document.createElement('div');
        bgBar.className = 'row-bg-bar';
        bgBar.style.width = '0%';
        row.appendChild(bgBar);

        const itemLeft = document.createElement('div');
        itemLeft.className = 'item-left';

        const nameRow = document.createElement('div');
        nameRow.className = 'item-name-row';

        if (isAsn) {
            const logoUrl = getIspLogo(item.name);
            if (logoUrl) {
                const logoImg = document.createElement('img');
                logoImg.src = logoUrl;
                logoImg.alt = '';
                logoImg.className = 'isp-logo';
                logoImg.loading = 'lazy';
                nameRow.appendChild(logoImg);
            }
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.innerText = item.name;
        nameRow.appendChild(nameSpan);

        itemLeft.appendChild(nameRow);

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
        container.appendChild(row);

        setTimeout(() => {
            bgBar.style.width = `${percent}%`;
        }, 50);
    });
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

            renderStatsList('list-asns-24h', s24.top_asns, true);
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

            renderStatsList('list-asns-30d', s30.top_asns, true);
            renderStatsList('list-types-30d', s30.top_query_types, false);
        })
        .catch(err => {
            console.error('Error al cargar stats:', err);
        });
}

function detectUserConnection() {
    const dot = document.getElementById('conn-dot');
    const desc = document.getElementById('conn-desc');
    const ipEl = document.getElementById('conn-ip');

    fetch('https://ipwho.is/')
        .then(r => r.json())
        .then(data => {
            if (data && data.success) {
                const ip = data.ip || '-';
                const isV6 = ip.includes(':');
                
                if (dot) {
                    dot.className = 'status-dot ' + (isV6 ? 'ipv6' : 'ipv4');
                }
                
                let asnDisplay = '';
                if (data.connection && data.connection.asn) {
                    asnDisplay = `AS${data.connection.asn} • `;
                }
                
                let orgName = (data.connection && (data.connection.org || data.connection.isp)) || 'Organización';
                const logoUrl = getIspLogo(orgName + ' ' + (data.connection && data.connection.asn ? 'AS' + data.connection.asn : ''));
                const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="" class="conn-isp-logo">` : '';
                
                if (desc) desc.innerHTML = `${logoHtml}${asnDisplay}${orgName}`;
                if (ipEl) ipEl.innerText = ip;
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
                    if (dot) dot.className = 'status-dot ' + (isV6 ? 'ipv6' : 'ipv4');
                    
                    let asnDisplay = data.asn ? `${data.asn} • ` : '';
                    let orgName = data.org || data.carrier || 'Organización';
                    const logoUrl = getIspLogo(orgName + ' ' + (data.asn || ''));
                    const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="" class="conn-isp-logo">` : '';
                    
                    if (desc) desc.innerHTML = `${logoHtml}${asnDisplay}${orgName}`;
                    if (ipEl) ipEl.innerText = ip;
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
