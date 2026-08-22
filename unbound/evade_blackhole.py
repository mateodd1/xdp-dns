# /etc/unbound/evade_blackhole.py
# Unbound Python module to evade blackhole routing by dynamically rewriting blocked Anycast IPs to contiguous unblocked IPs

try:
    from unboundmodule import *
except ImportError:
    pass

BLOCKED_IPS = {
    "104.20.21.45", "104.21.0.172", "104.21.1.74", "104.21.3.248", "104.21.8.63",
    "104.21.8.205", "104.21.9.166", "104.21.10.192", "104.21.11.183", "104.21.12.145",
    "104.21.13.70", "104.21.14.144", "104.21.16.158", "104.21.17.134", "104.21.17.205",
    "104.21.18.182", "104.21.21.223", "104.21.24.26", "104.21.27.155", "104.21.28.103",
    "104.21.28.106", "104.21.32.245", "104.21.34.28", "104.21.34.237", "104.21.36.220",
    "104.21.37.24", "104.21.43.230", "104.21.45.209", "104.21.50.64", "104.21.51.148",
    "104.21.55.136", "104.21.56.137", "104.21.57.108", "104.21.58.149", "104.21.58.226",
    "104.21.59.27", "104.21.59.154", "104.21.59.161", "104.21.59.195", "104.21.61.33",
    "104.21.61.49", "104.21.63.74", "104.21.65.93", "104.21.66.71", "104.21.67.118",
    "104.21.68.32", "104.21.68.156", "104.21.69.84", "104.21.75.167", "104.21.77.86",
    "104.21.78.104", "104.21.79.72", "104.21.83.161", "104.21.83.252", "104.21.86.172",
    "104.21.87.98", "104.21.92.113", "104.21.93.220", "104.21.95.240", "104.26.6.135",
    "104.26.7.135", "172.64.66.1", "172.67.68.166", "172.67.69.105", "172.67.72.179",
    "172.67.128.36", "172.67.128.197", "172.67.130.134", "172.67.130.160", "172.67.130.201",
    "172.67.131.97", "172.67.137.21", "172.67.138.158", "172.67.142.248", "172.67.144.105",
    "172.67.145.95", "172.67.145.214", "172.67.145.217", "172.67.148.52", "172.67.149.164",
    "172.67.152.138", "172.67.155.11", "172.67.157.141", "172.67.159.174", "172.67.160.214",
    "172.67.161.68", "172.67.161.183", "172.67.166.84", "172.67.166.239", "172.67.167.213",
    "172.67.168.16", "172.67.169.50", "172.67.169.56", "172.67.170.51", "172.67.170.68",
    "172.67.174.235", "172.67.176.203", "172.67.178.75", "172.67.178.103", "172.67.179.64",
    "172.67.179.194", "172.67.180.233", "172.67.181.183", "172.67.182.240", "172.67.183.27",
    "172.67.184.3", "172.67.185.217", "172.67.186.224", "172.67.188.80", "172.67.190.203",
    "172.67.192.24", "172.67.196.167", "172.67.200.2", "172.67.200.217", "172.67.202.174",
    "172.67.203.73", "172.67.204.128", "172.67.205.192", "172.67.205.196", "172.67.206.122",
    "172.67.209.158", "172.67.211.208", "172.67.214.37", "172.67.215.83", "172.67.216.124",
    "172.67.219.45", "172.67.221.216", "172.67.222.197", "172.67.223.202", "188.114.96.2",
    "188.114.96.3", "188.114.96.5", "188.114.96.6", "188.114.96.7", "188.114.96.8",
    "188.114.96.12", "188.114.97.2", "188.114.97.3", "188.114.97.5", "188.114.97.6",
    "188.114.97.7", "188.114.97.8", "188.114.97.12"
}

def get_contiguous_ip(ip_str):
    octets = [int(x) for x in ip_str.split('.')]
    for delta in [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]:
        new_last = octets[3] + delta
        if 1 <= new_last <= 254:
            cand = f"{octets[0]}.{octets[1]}.{octets[2]}.{new_last}"
            if cand not in BLOCKED_IPS:
                return cand
    return f"{octets[0]}.{octets[1]}.{octets[2]}.{octets[3]+1}"

def init_standard(id, env):
    log_info("pythonmod: Evade Blackhole Routing Module initialized")
    return True

def deinit(id):
    return True

def operate(id, event, qstate, qdata):
    if event == MODULE_EVENT_MODDONE:
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
                                    log_info(f"pythonmod: Evaded blackhole IP {ip_str} -> {contiguous_ip} for {qstate.qinfo.qname_str}")
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
