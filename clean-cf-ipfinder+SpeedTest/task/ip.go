package task

import (
	"bufio"
	"log"
	"math/rand"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

const defaultInputFile = "ip.txt"

var (
	// TestAll: test-e hame-ye IP-ha (be jaye yek IP-ye tasadofi dar har /24)
	TestAll = false
	// IPFile: nam-e file-e mahdude-haye IP
	IPFile = defaultInputFile
	// IPText: mahdude-haye IP ke mostaghim ba parametr (-ip) dade shode
	IPText string
)

func InitRandSeed() {
	rand.Seed(time.Now().UnixNano())
}

func isIPv4(ip string) bool {
	return strings.Contains(ip, ".")
}

func randIPEndWith(num byte) byte {
	if num == 0 { // baraye IP-ye tanha mesl-e /32
		return byte(0)
	}
	return byte(rand.Intn(int(num)))
}

type IPRanges struct {
	ips     []*net.IPAddr
	mask    string
	firstIP net.IP
	ipNet   *net.IPNet
}

func newIPRanges() *IPRanges {
	return &IPRanges{
		ips: make([]*net.IPAddr, 0),
	}
}

// Agar IP-ye tanha bood mask ezafe mikonad, dar gheyr-e in surat mask (r.mask) ra bar migardanad
func (r *IPRanges) fixIP(ip string) string {
	// Agar '/' nadasht yani mahdude nist va IP-ye tanha ast, pas bayad /32 ya /128 ezafe shavad
	if i := strings.IndexByte(ip, '/'); i < 0 {
		if isIPv4(ip) {
			r.mask = "/32"
		} else {
			r.mask = "/128"
		}
		ip += r.mask
	} else {
		r.mask = ip[i:]
	}
	return ip
}

// Tajziye-ye mahdude-ye IP: IP-ye avval, mahdude va mask ra be dast miavarad
func (r *IPRanges) parseCIDR(ip string) {
	var err error
	if r.firstIP, r.ipNet, err = net.ParseCIDR(r.fixIP(ip)); err != nil {
		log.Fatalln("Khata dar ParseCIDR (mahdude-ye IP na-motabar ast):", ip, err)
	}
}

func (r *IPRanges) appendIPv4(d byte) {
	r.appendIP(net.IPv4(r.firstIP[12], r.firstIP[13], r.firstIP[14], d))
}

func (r *IPRanges) appendIP(ip net.IP) {
	r.ips = append(r.ips, &net.IPAddr{IP: ip})
}

// Kamtarin meghdar-e bakhsh-e chaharom-e IP va tedad-e hostha-ye ghabel-estefade ra bar migardanad
func (r *IPRanges) getIPRange() (minIP, hosts byte) {
	minIP = r.firstIP[15] & r.ipNet.Mask[3] // kamtarin meghdar-e bakhsh-e chaharom-e IP

	// Tedad-e host-ha ra az roye mask hesab mikonim
	m := net.IPv4Mask(255, 255, 255, 255)
	for i, v := range r.ipNet.Mask {
		m[i] ^= v
	}
	total, _ := strconv.ParseInt(m.String(), 16, 32) // majmu'-e IP-haye ghabel-estefade
	if total > 255 {                                 // tashih-e tedad-e IP-haye bakhsh-e chaharom
		hosts = 255
		return
	}
	hosts = byte(total)
	return
}

func (r *IPRanges) chooseIPv4() {
	if r.mask == "/32" { // IP-ye tanha ehtiyaj be tasadofi shodan nadarad, khodash ezafe mishavad
		r.appendIP(r.firstIP)
	} else {
		minIP, hosts := r.getIPRange()    // kamtarin meghdar-e bakhsh-e chaharom va tedad-e host-ha
		for r.ipNet.Contains(r.firstIP) { // ta vaghti IP az mahdude birun nazade, edame midahim
			if TestAll { // agar test-e hame-ye IP-ha faal ast
				for i := 0; i <= int(hosts); i++ { // az kamtarin ta bishtarin meghdar-e bakhsh-e akhar
					r.appendIPv4(byte(i) + minIP)
				}
			} else { // bakhsh-e akhar-e IP ra tasadofi entekhab mikonim 0.0.0.X
				r.appendIPv4(minIP + randIPEndWith(hosts))
			}
			r.firstIP[14]++ // 0.0.(X+1).X
			if r.firstIP[14] == 0 {
				r.firstIP[13]++ // 0.(X+1).X.X
				if r.firstIP[13] == 0 {
					r.firstIP[12]++ // (X+1).X.X.X
				}
			}
		}
	}
}

func (r *IPRanges) chooseIPv6() {
	if r.mask == "/128" { // IP-ye tanha ehtiyaj be tasadofi shodan nadarad, khodash ezafe mishavad
		r.appendIP(r.firstIP)
	} else {
		var tempIP uint8                  // motagheyyer-e movaghat baraye negahdari-ye meghdar-e ghabli
		for r.ipNet.Contains(r.firstIP) { // ta vaghti IP az mahdude birun nazade, edame midahim
			r.firstIP[15] = randIPEndWith(255) // bakhsh-e akhar-e IP ra tasadofi mikonim
			r.firstIP[14] = randIPEndWith(255) // bakhsh-e akhar-e IP ra tasadofi mikonim

			targetIP := make([]byte, len(r.firstIP))
			copy(targetIP, r.firstIP)
			r.appendIP(targetIP) // be estakhr-e IP-ha ezafe mishavad

			for i := 13; i >= 0; i-- { // az bakhsh-e sevom az akhar be ghabl tasadofi mikonim
				tempIP = r.firstIP[i]              // meghdar-e ghabli ra zakhire mikonim
				r.firstIP[i] += randIPEndWith(255) // adad-e tasadofi 0~255 ra be in bakhsh ezafe mikonim
				if r.firstIP[i] >= tempIP {        // agar meghdar-e jadid bozorg-tar ya mosavi bood yani movafagh bood, az halghe kharej mishavim
					break
				}
			}
		}
	}
}

func loadIPRanges() []*net.IPAddr {
	ranges := newIPRanges()
	if IPText != "" { // data-ye mahdude-ye IP az parametr gerefte mishavad
		IPs := strings.Split(IPText, ",") // ba virgul joda mikonim va roye har yek halghe mizanim
		for _, IP := range IPs {
			IP = strings.TrimSpace(IP) // fasele, tab va khat-e jadid-e ebteda va entehaye ro hazf mikonim
			if IP == "" {              // mavared-e khali ra rad mikonim (ebteda, enteha ya virgul-haye pey-dar-pey)
				continue
			}
			ranges.parseCIDR(IP) // tajziye-ye mahdude: IP, mahdude va mask
			if isIPv4(IP) {      // tolid-e IP-haye IPv4 / IPv6 baraye test (tanha / tasadofi / hame)
				ranges.chooseIPv4()
			} else {
				ranges.chooseIPv6()
			}
		}
	} else { // data-ye mahdude-ye IP az file khande mishavad
		if IPFile == "" {
			IPFile = defaultInputFile
		}
		file, err := os.Open(IPFile)
		if err != nil {
			log.Fatal(err)
		}
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() { // roye har khat-e file halghe mizanim
			line := strings.TrimSpace(scanner.Text()) // fasele, tab va khat-e jadid-e ebteda va entehaye ro hazf mikonim
			if line == "" {                           // khat-haye khali ra rad mikonim
				continue
			}
			ranges.parseCIDR(line) // tajziye-ye mahdude: IP, mahdude va mask
			if isIPv4(line) {      // tolid-e IP-haye IPv4 / IPv6 baraye test (tanha / tasadofi / hame)
				ranges.chooseIPv4()
			} else {
				ranges.chooseIPv6()
			}
		}
	}
	return ranges.ips
}
