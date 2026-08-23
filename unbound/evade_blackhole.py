# /etc/unbound/evade_blackhole.py
# Unbound Python module to evade blackhole routing by dynamically rewriting blocked Anycast IPs ONLY IF they belong to Cloudflare (AS13335)

import os
import time
import ipaddress
import bisect

try:
    from unboundmodule import *
except ImportError:
    pass

BLOCKED_IPS_FILE = "/etc/unbound/blocked_ips.txt"
CF_IPV4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"

_last_mtime = 0
_last_cf_mtime = 0
_last_check_time = 0
BLOCKED_IPS = set()
CF_V4_INTERVALS = []
CF_V4_STARTS = []

def load_data(force=False):
    global _last_mtime, _last_cf_mtime, _last_check_time, BLOCKED_IPS, CF_V4_INTERVALS, CF_V4_STARTS
    now = time.time()
    if not force and (now - _last_check_time < 5):
        return
    _last_check_time = now

    if os.path.exists(BLOCKED_IPS_FILE):
        try:
            mtime = os.path.getmtime(BLOCKED_IPS_FILE)
            if mtime != _last_mtime or force:
                new_set = set()
                with open(BLOCKED_IPS_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        ip = line.strip()
                        if ip and not ip.startswith("#"):
                            new_set.add(ip)
                BLOCKED_IPS = new_set
                _last_mtime = mtime
        except Exception:
            pass

    if os.path.exists(CF_IPV4_FILE):
        try:
            mtime = os.path.getmtime(CF_IPV4_FILE)
            if mtime != _last_cf_mtime or force:
                nets = []
                with open(CF_IPV4_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            try:
                                nets.append(ipaddress.ip_network(line, strict=False))
                            except Exception:
                                pass
                ivs = sorted([(int(n.network_address), int(n.broadcast_address)) for n in nets])
                CF_V4_INTERVALS = ivs
                CF_V4_STARTS = [iv[0] for iv in ivs]
                _last_cf_mtime = mtime
        except Exception:
            pass

def find_cf_v4(ip_str):
    if not CF_V4_STARTS:
        return None
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        idx = bisect.bisect_right(CF_V4_STARTS, ip_int) - 1
        if idx >= 0:
            s, e = CF_V4_INTERVALS[idx]
            if s <= ip_int <= e:
                return s, e
        return None
    except Exception:
        return None

def get_contiguous_ip(ip_str):
    cf_range = find_cf_v4(ip_str)
    if not cf_range:
        return ip_str

    start_int, end_int = cf_range
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        octets = [int(x) for x in ip_str.split('.')]
        base_last = octets[3]

        for offset in range(1, 255):
            for delta in (offset, -offset):
                cand_last = base_last + delta
                if 1 <= cand_last <= 254:
                    cand_int = (ip_int & 0xFFFFFF00) | cand_last
                    if start_int <= cand_int <= end_int:
                        cand = f"{octets[0]}.{octets[1]}.{octets[2]}.{cand_last}"
                        if cand not in BLOCKED_IPS:
                            return cand

        max_search = min(65536, end_int - start_int + 1)
        for offset in range(1, max_search):
            for delta in (offset, -offset):
                cand_int = ip_int + delta
                if start_int <= cand_int <= end_int:
                    cand_last = cand_int & 0xFF
                    if 1 <= cand_last <= 254:
                        cand = str(ipaddress.IPv4Address(cand_int))
                        if cand not in BLOCKED_IPS:
                            return cand

        return ip_str
    except Exception:
        return ip_str

def init_standard(id, env):
    load_data(force=True)
    return True

def deinit(id):
    return True

def operate(id, event, qstate, qdata):
    if event == MODULE_EVENT_MODDONE:
        load_data()
        if not BLOCKED_IPS:
            qstate.ext_state[id] = MODULE_FINISHED
            return True

        if qstate.return_msg and qstate.return_msg.rep:
            rep = qstate.return_msg.rep
            modified = False
            new_answers = []

            for i in range(rep.an_numrrsets):
                rrset = rep.rrsets[i]
                if not rrset or not rrset.rk:
                    continue

                rr_type = ntohs(rrset.rk.type)
                rr_dname = dnameAsStr(rrset.rk.dname)

                if rr_type == RR_TYPE_A:
                    d = rrset.entry.data
                    if d and d.count > 0:
                        for r in range(d.count):
                            rdata = d.rr_data[r]
                            ttl = d.ttl
                            if len(rdata) >= 6:
                                ip_str = f"{rdata[2]}.{rdata[3]}.{rdata[4]}.{rdata[5]}"
                                if ip_str in BLOCKED_IPS:
                                    contiguous_ip = get_contiguous_ip(ip_str)
                                    new_answers.append(f"{rr_dname} {ttl} IN A {contiguous_ip}")
                                    modified = True
                                else:
                                    new_answers.append(f"{rr_dname} {ttl} IN A {ip_str}")
                elif rr_type == RR_TYPE_CNAME:
                    d = rrset.entry.data
                    if d and d.count > 0:
                        for r in range(d.count):
                            rdata = d.rr_data[r]
                            ttl = d.ttl
                            cname_target = dnameAsStr(rdata[2:])
                            new_answers.append(f"{rr_dname} {ttl} IN CNAME {cname_target}")

            if modified:
                msg = DNSMessage(qstate.qinfo.qname_str, qstate.qinfo.qtype, qstate.qinfo.qclass, PKT_QR | PKT_RA, 300)
                for ans in new_answers:
                    msg.answer.append(ans)
                msg.set_return_msg(qstate)

        qstate.ext_state[id] = MODULE_FINISHED
        return True

    if event in (MODULE_EVENT_NEW, MODULE_EVENT_PASS):
        qstate.ext_state[id] = MODULE_WAIT_MODULE
        return True

    qstate.ext_state[id] = MODULE_FINISHED
    return True

def inform_super(id, qstate, qdata, superqstate):
    return True
