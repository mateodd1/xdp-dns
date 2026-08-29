// ech-check: conecta con ECH y comprueba si el servidor lo ACEPTA.
// uso: ech-check <ip:puerto> <sni_interior> <ECHConfigList base64>
package main

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"os"
	"time"
)

func main() {
	if len(os.Args) != 4 {
		fmt.Println("uso: ech-check <ip:puerto> <sni> <echconfiglist_b64>")
		os.Exit(2)
	}
	list, err := base64.StdEncoding.DecodeString(os.Args[3])
	if err != nil {
		fmt.Println("ECHConfigList base64 inválido:", err)
		os.Exit(2)
	}
	cfg := &tls.Config{
		ServerName:                     os.Args[2],
		EncryptedClientHelloConfigList: list,
		NextProtos:                     []string{"h2", "http/1.1"},
		MinVersion:                     tls.VersionTLS13,
	}
	d := &tls.Dialer{Config: cfg, NetDialer: &net.Dialer{Timeout: 8 * time.Second}}
	conn, err := d.Dial("tcp", os.Args[1])
	if err != nil {
		fmt.Println("handshake FALLÓ:", err)
		os.Exit(1)
	}
	defer conn.Close()
	st := conn.(*tls.Conn).ConnectionState()
	fmt.Printf("TLS %x  ALPN=%s  cert=%v\n", st.Version, st.NegotiatedProtocol, st.PeerCertificates[0].DNSNames)
	if st.ECHAccepted {
		fmt.Println("ECH ACEPTADO: el SNI interior", os.Args[2], "viajó cifrado")
		os.Exit(0)
	}
	fmt.Println("ECH NO aceptado (handshake normal / retry configs)")
	os.Exit(1)
}
