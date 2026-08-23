# /etc/unbound/evade_blackhole.py
# Unbound Python module to evade blackhole routing by dynamically rewriting blocked Anycast IPs to contiguous unblocked IPs

import os
import time

try:
    from unboundmodule import *
except ImportError:
    pass

BLOCKED_IPS_FILE = "/etc/unbound/blocked_ips.txt"
_last_mtime = 0
_last_check_time = 0
BLOCKED_IPS = set()

def load_blocked_ips(force=False):
    global _last_mtime, _last_check_time, BLOCKED_IPS
    now = time.time()
    # Check mtime at most once every 5 seconds to avoid excess stat calls
    if not force and (now - _last_check_time < 5):
        return
    _last_check_time = now

    if not os.path.exists(BLOCKED_IPS_FILE):
        if len(BLOCKED_IPS) > 0:
            BLOCKED_IPS = set()
        return

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
            try:
                log_info(f"pythonmod: Loaded {len(BLOCKED_IPS)} blocked IPs from {BLOCKED_IPS_FILE}")
            except Exception:
                pass
    except Exception as e:
        try:
            log_err(f"pythonmod: Error loading {BLOCKED_IPS_FILE}: {e}")
        except Exception:
            pass

def get_contiguous_ip(ip_str):
    try:
        octets = [int(x) for x in ip_str.split('.')]
        base_last = octets[3]

        for offset in range(1, 255):
            for delta in (offset, -offset):
                cand_last = base_last + delta
                if 1 <= cand_last <= 254:
                    cand = f"{octets[0]}.{octets[1]}.{octets[2]}.{cand_last}"
                    if cand not in BLOCKED_IPS:
                        return cand

        for sub_offset in range(1, 255):
            for sub_delta in (sub_offset, -sub_offset):
                cand_sub = octets[2] + sub_delta
                if 0 <= cand_sub <= 255:
                    cand = f"{octets[0]}.{octets[1]}.{cand_sub}.{base_last}"
                    if cand not in BLOCKED_IPS:
                        return cand

        return ip_str
    except Exception:
        return ip_str

def init_standard(id, env):
    load_blocked_ips(force=True)
    try:
        log_info(f"pythonmod: Evade Blackhole Routing Module initialized ({len(BLOCKED_IPS)} blocked IPs active)")
    except Exception:
        pass
    return True

def deinit(id):
    return True

def operate(id, event, qstate, qdata):
    if event == MODULE_EVENT_MODDONE:
        load_blocked_ips()
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
                                    try:
                                        log_info(f"pythonmod: Evaded blackhole IP {ip_str} -> {contiguous_ip} for {qstate.qinfo.qname_str}")
                                    except Exception:
                                        pass
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
