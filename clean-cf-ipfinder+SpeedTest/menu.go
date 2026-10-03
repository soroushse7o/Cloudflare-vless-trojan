package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/XIU2/CloudflareSpeedTest/task"
	"github.com/XIU2/CloudflareSpeedTest/utils"
)

// ---------------------------------------------------------------
//  Menu-ye avval (safhe-ye avval): ghabl az shoro-e test, halat-e test
//  va khoroji-ha ra entekhab konid, bad test ra shoro konid.
//  Hame-ye meghdar-ha hamoun parametr-haye khat-e farman hastand.
// ---------------------------------------------------------------

var stdin = bufio.NewReader(os.Stdin)

// readLine yek khat az karbar migirad (agar vorudi tamam shod barname kharej mishavad)
func readLine(prompt string) string {
	fmt.Print(prompt)
	line, err := stdin.ReadString('\n')
	if err != nil && line == "" {
		fmt.Println()
		os.Exit(0)
	}
	return strings.TrimSpace(line)
}

// askInt yek adad-e sahih ba mahdude migirad; Enter yani meghdar-e felan
func askInt(label string, cur, lo, hi int) int {
	for {
		s := readLine(fmt.Sprintf("  %s [%d ta %d] (felan: %d): ", label, lo, hi, cur))
		if s == "" {
			return cur
		}
		v, err := strconv.Atoi(s)
		if err != nil || v < lo || v > hi {
			utils.Red.Printf("  Adad-e na-motabar. Adadi beyne %d ta %d vared konid.\n", lo, hi)
			continue
		}
		return v
	}
}

// askFloat yek adad-e ashari ba mahdude migirad; Enter yani meghdar-e felan
func askFloat(label string, cur, lo, hi float64) float64 {
	for {
		s := readLine(fmt.Sprintf("  %s [%g ta %g] (felan: %g): ", label, lo, hi, cur))
		if s == "" {
			return cur
		}
		v, err := strconv.ParseFloat(s, 64)
		if err != nil || v < lo || v > hi {
			utils.Red.Printf("  Adad-e na-motabar. Adadi beyne %g ta %g vared konid.\n", lo, hi)
			continue
		}
		return v
	}
}

// askString yek matn migirad; Enter yani meghdar-e felan, '-' yani khali
func askString(label, cur string) string {
	show := cur
	if strings.TrimSpace(show) == "" {
		show = "khali"
	}
	s := readLine(fmt.Sprintf("  %s (felan: %s | '-' = khali): ", label, show))
	if s == "" {
		return cur
	}
	if s == "-" {
		return ""
	}
	return strings.Trim(s, "\"")
}

// askBool yek porsesh-e bale/na mipors-ad; Enter yani meghdar-e felan
func askBool(label string, cur bool) bool {
	d := "n"
	if cur {
		d = "b"
	}
	for {
		s := strings.ToLower(readLine(fmt.Sprintf("  %s (b = bale / n = na) (felan: %s): ", label, d)))
		switch s {
		case "":
			return cur
		case "b", "bale", "y", "yes", "1":
			return true
		case "n", "na", "no", "0":
			return false
		}
		utils.Red.Println("  Lotfan faghat b (bale) ya n (na) vared konid.")
	}
}

// askOutput yek khoroji-ye file-i ra faal/gheyr-faal mikonad va nam-e file ra migirad
func askOutput(label, cur, def string) string {
	on := askBool(label+" zakhire shavad?", strings.TrimSpace(cur) != "")
	if !on {
		return ""
	}
	if strings.TrimSpace(cur) == "" {
		cur = def
	}
	name := askString("Nam-e file", cur)
	if strings.TrimSpace(name) == "" {
		name = def
	}
	return name
}

// askURL adres-e test ra migirad; agar khali shod adres-e pishfarz bar migardad
func askURL(cur string) string {
	u := askString("Adres-e test (URL)", cur)
	if strings.TrimSpace(u) == "" {
		return "https://cf.xiu2.xyz/url"
	}
	return u
}

func onOff(v bool) string {
	if v {
		return "roshan"
	}
	return "khamush"
}

func pathState(p string) string {
	if strings.TrimSpace(p) == "" {
		return "khamush"
	}
	return p
}

// ---------------- Kholase-ye tanzimat-e felan ----------------

func modeSummary() string {
	if task.Httping {
		s := "HTTPing"
		if strings.TrimSpace(task.HttpingCFColo) != "" {
			s += " (mantaghe: " + task.HttpingCFColo + ")"
		}
		return s
	}
	return "TCPing"
}

func presetSummary() string {
	return fmt.Sprintf("thread=%d, tekrar=%d, download=%d ta, modat=%d sanie", task.Routines, task.PingTimes, task.TestCount, downloadTime)
}

func ipSummary() string {
	s := task.IPFile
	if strings.TrimSpace(task.IPText) != "" {
		s = "IP-haye dasti"
	}
	if task.TestAll {
		s += " (hame-ye IP-ha)"
	}
	return s
}

func downloadSummary() string {
	if task.Disable {
		return "khamush (natije bar asas-e takhir)"
	}
	return fmt.Sprintf("roshan (%d IP, har kodam %d sanie)", task.TestCount, downloadTime)
}

func filterSummary() string {
	return fmt.Sprintf("tl=%d, tll=%d, tlr=%.2f, sl=%.2f", maxDelay, minDelay, maxLossRate, task.MinSpeed)
}

func outputSummary() string {
	return fmt.Sprintf("namayesh=%d | CSV=%s | TXT=%s | JSON=%s", utils.PrintNum, pathState(utils.Output), pathState(utils.OutputTxt), pathState(utils.OutputJson))
}

func advancedSummary() string {
	return fmt.Sprintf("port=%d, thread=%d, tekrar=%d, debug=%s", task.TCPPort, task.Routines, task.PingTimes, onOff(utils.Debug))
}

// ---------------- Menu-ye asli ----------------

func printMainMenu() {
	fmt.Println()
	utils.Cyan.Println("======================================================================")
	utils.Cyan.Printf("  CloudflareSpeedTest %s  -  nesakhe-ye Finglish\n", version)
	utils.Cyan.Println("  Safhe-ye avval: halat-e test va khoroji-ha ra entekhab konid")
	utils.Cyan.Println("======================================================================")
	fmt.Printf("  [1] Halat-e test (TCPing / HTTPing) : %s\n", modeSummary())
	fmt.Printf("  [2] Pish-tanzim (sari / daghigh)    : %s\n", presetSummary())
	fmt.Printf("  [3] Manba-ye IP-ha                  : %s\n", ipSummary())
	fmt.Printf("  [4] Test-e download                 : %s\n", downloadSummary())
	fmt.Printf("  [5] Filter-ha (takhir, gom-shodan)  : %s\n", filterSummary())
	fmt.Printf("  [6] Khoroji-ha (namayesh, CSV, ...) : %s\n", outputSummary())
	fmt.Printf("  [7] Tanzimat-e pishrafte            : %s\n", advancedSummary())
	utils.Green.Println("  [S] Shoro-e test")
	fmt.Println("  [Q] Khorooj")
}

// runMenu menu-ye avval ra namayesh midahad; agar karbar test ra shoro kard true bar migardanad
func runMenu() bool {
	for {
		printMainMenu()
		choice := strings.ToLower(readLine("\n  Gozine ra entekhab konid: "))
		switch choice {
		case "1":
			menuMode()
		case "2":
			menuPreset()
		case "3":
			menuIPSource()
		case "4":
			menuDownload()
		case "5":
			menuFilters()
		case "6":
			menuOutputs()
		case "7":
			menuAdvanced()
		case "s":
			if confirmStart() {
				return true
			}
		case "q":
			return false
		default:
			utils.Red.Println("  Gozine-ye na-motabar. Yeki az [1] ta [7] ya [S] ya [Q] ra vared konid.")
		}
	}
}

// ---------------- [1] Halat-e test ----------------

func menuMode() {
	fmt.Println()
	utils.Cyan.Println("--- Halat-e test ---")
	fmt.Println("  1) TCPing  : sari va kam-masraf (pishfarz). Kod-e mantaghe ra dar test-e takhir nemidahad.")
	fmt.Println("  2) HTTPing : daghigh-tar, ba darkhast-e HTTP. Kod-e mantaghe (colo) ra neshan midahad va filter-e mantaghe dare.")
	cur := "1"
	if task.Httping {
		cur = "2"
	}
	switch readLine(fmt.Sprintf("  Entekhab (felan: %s): ", cur)) {
	case "1":
		task.Httping = false
		task.HttpingCFColo = "" // filter-e mantaghe faghat dar HTTPing kar mikonad
	case "2":
		task.Httping = true
		task.URL = askURL(task.URL)
		if strings.HasPrefix(task.URL, "http://") && task.TCPPort == 443 {
			if askBool("Adres HTTP ast; port ra 80 konam?", true) {
				task.TCPPort = 80
			}
		} else if strings.HasPrefix(task.URL, "https://") && task.TCPPort == 80 {
			if askBool("Adres HTTPS ast; port ra 443 konam?", true) {
				task.TCPPort = 443
			}
		}
		task.HttpingStatusCode = askInt("Kod-e vaziat-e HTTP-e motabar (0 = 200/301/302)", task.HttpingStatusCode, 0, 599)
		task.HttpingCFColo = askString("Mantaghe-haye morednazar, ba virgul (mesl-e HKG,LAX)", task.HttpingCFColo)
		utils.Yellow.Println("  Tavajoh: HTTPing mesl-e scan-e shabake ast; roye server thread (-n) ra kam begirid.")
	case "":
		// bedun-e taghir
	default:
		utils.Red.Println("  Gozine-ye na-motabar.")
	}
}

// ---------------- [2] Pish-tanzim ----------------

func setPreset(n, t, dn, dt int, noDownload bool) {
	task.Routines = n
	task.PingTimes = t
	task.TestCount = dn
	downloadTime = dt
	task.Disable = noDownload
	utils.Green.Println("  Pish-tanzim e'mal shod.")
}

func menuPreset() {
	fmt.Println()
	utils.Cyan.Println("--- Pish-tanzim (sorat / daghighat) ---")
	fmt.Println("  1) Sari           : thread=300, tekrar=2, download=5 ta,  modat=5 sanie")
	fmt.Println("  2) Motevaset      : thread=200, tekrar=4, download=10 ta, modat=10 sanie (pishfarz)")
	fmt.Println("  3) Daghigh        : thread=200, tekrar=8, download=20 ta, modat=15 sanie")
	fmt.Println("  4) Faghat takhir  : thread=300, tekrar=4, bedun-e test-e download (sari-tarin)")
	switch readLine("  Entekhab (Enter = bazgasht): ") {
	case "1":
		setPreset(300, 2, 5, 5, false)
	case "2":
		setPreset(200, 4, 10, 10, false)
	case "3":
		setPreset(200, 8, 20, 15, false)
	case "4":
		setPreset(300, 4, 10, 10, true)
	case "":
		// bedun-e taghir
	default:
		utils.Red.Println("  Gozine-ye na-motabar.")
	}
}

// ---------------- [3] Manba-ye IP-ha ----------------

// validateIPList IP-ha / mahdude-haye joda shode ba virgul ra barresi mikonad
func validateIPList(s string) error {
	n := 0
	for _, item := range strings.Split(s, ",") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		n++
		if strings.Contains(item, "/") {
			if _, _, err := net.ParseCIDR(item); err != nil {
				return fmt.Errorf("mahdude-ye na-motabar: %s", item)
			}
		} else if net.ParseIP(item) == nil {
			return fmt.Errorf("IP-ye na-motabar: %s", item)
		}
	}
	if n == 0 {
		return fmt.Errorf("hich IP-i vared nashode ast")
	}
	return nil
}

func menuIPSource() {
	fmt.Println()
	utils.Cyan.Println("--- Manba-ye IP-ha ---")
	fmt.Println("  1) ip.txt    (IPv4-haye Cloudflare, pishfarz)")
	fmt.Println("  2) ipv6.txt  (IPv6-haye Cloudflare)")
	fmt.Println("  3) File-e dalkhah (masir-e file ra vared konid)")
	fmt.Println("  4) Vared kardan-e dasti-ye IP / mahdude (ba virgul joda konid)")
	fmt.Printf("  5) Test-e hame-ye IP-ha-ye har mahdude (allip): %s\n", onOff(task.TestAll))
	switch readLine("  Entekhab (Enter = bazgasht): ") {
	case "1":
		task.IPFile = "ip.txt"
		task.IPText = ""
	case "2":
		task.IPFile = "ipv6.txt"
		task.IPText = ""
	case "3":
		p := askString("Masir-e file-e mahdude-ha", task.IPFile)
		if strings.TrimSpace(p) == "" {
			utils.Red.Println("  Masir nemitavanad khali bashad.")
			return
		}
		if _, err := os.Stat(p); err != nil {
			utils.Red.Printf("  File peyda nashod: %s\n", p)
			return
		}
		task.IPFile = p
		task.IPText = ""
	case "4":
		s := readLine("  IP/mahdude-ha (mesl-e 1.1.1.1,2.2.2.2/24,2606:4700::/32): ")
		if s == "" {
			return
		}
		if err := validateIPList(s); err != nil {
			utils.Red.Printf("  Khata: %v\n", err)
			return
		}
		task.IPText = s
	case "5":
		task.TestAll = askBool("Hame-ye IP-ha-ye har mahdude test shavand? (kond-tar)", task.TestAll)
	case "":
		// bedun-e taghir
	default:
		utils.Red.Println("  Gozine-ye na-motabar.")
	}
}

// ---------------- [4] Test-e download ----------------

func menuDownload() {
	fmt.Println()
	utils.Cyan.Println("--- Test-e download ---")
	on := askBool("Test-e download anjam shavad?", !task.Disable)
	task.Disable = !on
	if !on {
		utils.Yellow.Println("  Test-e download khamush shod; natije bar asas-e takhir morattab mishavad.")
		return
	}
	task.URL = askURL(task.URL)
	if strings.HasPrefix(task.URL, "http://") && task.TCPPort == 443 {
		if askBool("Adres HTTP ast; port ra 80 konam?", true) {
			task.TCPPort = 80
		}
	}
	task.TestCount = askInt("Tedad-e IP baraye test-e download (dn)", task.TestCount, 1, 1000)
	downloadTime = askInt("Modat-e test-e download baraye har IP, sanie (dt)", downloadTime, 1, 300)
}

// ---------------- [5] Filter-ha ----------------

func menuFilters() {
	fmt.Println()
	utils.Cyan.Println("--- Filter-ha (shart-haye natije) ---")
	maxDelay = askInt("Hadd-e bala-ye miangin-e takhir, ms (tl)", maxDelay, 1, 9999)
	minDelay = askInt("Hadd-e paein-e miangin-e takhir, ms (tll)", minDelay, 0, 9999)
	if minDelay > maxDelay {
		utils.Red.Println("  Hadd-e paein az hadd-e bala bishtar ast; hadd-e paein 0 shod.")
		minDelay = 0
	}
	maxLossRate = askFloat("Hadd-e bala-ye narkh-e gom-shodan (tlr)", maxLossRate, 0, 1)
	if task.Disable {
		utils.Yellow.Println("  Test-e download khamush ast, pas hadd-e aghal-e sorat (sl) ra nemipersim.")
		return
	}
	task.MinSpeed = askFloat("Hadd-e aghal-e sorat-e download, MB/s (sl)", task.MinSpeed, 0, 10000)
}

// ---------------- [6] Khoroji-ha ----------------

func menuOutputs() {
	fmt.Println()
	utils.Cyan.Println("--- Khoroji-ha ---")
	utils.PrintNum = askInt("Tedad-e natije baraye namayesh dar safhe (0 = namayesh nade)", utils.PrintNum, 0, 1000)
	utils.Output = askOutput("File-e CSV (natije-ye kamel)", utils.Output, "result.csv")
	utils.OutputTxt = askOutput("File-e TXT (faghat IP-ha)", utils.OutputTxt, "result.txt")
	if strings.TrimSpace(utils.OutputTxt) != "" {
		utils.TxtCount = askInt("Tedad-e IP dar file-e TXT (0 = hame)", utils.TxtCount, 0, 100000)
	}
	utils.OutputJson = askOutput("File-e JSON", utils.OutputJson, "result.json")
}

// ---------------- [7] Tanzimat-e pishrafte ----------------

func menuAdvanced() {
	fmt.Println()
	utils.Cyan.Println("--- Tanzimat-e pishrafte ---")
	task.Routines = askInt("Thread-haye test-e takhir (n)", task.Routines, 1, 1000)
	task.PingTimes = askInt("Tedad-e test-e takhir baraye har IP (t)", task.PingTimes, 1, 100)
	task.TCPPort = askInt("Port-e test (tp)", task.TCPPort, 1, 65534)
	utils.Debug = askBool("Halat-e eshkal-yabi (debug)", utils.Debug)
}

// ---------------- Shoro ----------------

// confirmStart tanzimat ra barresi mikonad, kholase ra chap mikonad va agar mojaz bood true bar migardanad
func confirmStart() bool {
	if strings.TrimSpace(task.IPText) == "" {
		if _, err := os.Stat(task.IPFile); err != nil {
			utils.Red.Printf("\n  File-e mahdude-haye IP peyda nashod: %s\n  Az gozine-ye [3] manba-ye IP-ha ra dorost konid.\n", task.IPFile)
			return false
		}
	}
	if utils.PrintNum == 0 && strings.TrimSpace(utils.Output) == "" && strings.TrimSpace(utils.OutputTxt) == "" && strings.TrimSpace(utils.OutputJson) == "" {
		utils.Yellow.Println("\n  Hich khoroji-i faal nist (namayesh = 0 va hame-ye file-ha khamush); natije-ye test hich ja ghabel-e didan nist.")
		if !askBool("Ba in vojud edame bedim?", false) {
			return false
		}
	}
	if task.MinSpeed > 0 && task.Disable {
		utils.Yellow.Println("\n  Test-e download khamush ast; hadd-e aghal-e sorat (sl) nadide gerefte mishavad.")
	}
	fmt.Println()
	utils.Cyan.Println("--- Kholase-ye tanzimat ---")
	fmt.Printf("  Halat-e test : %s\n", modeSummary())
	fmt.Printf("  Manba-ye IP  : %s\n", ipSummary())
	fmt.Printf("  Download     : %s\n", downloadSummary())
	fmt.Printf("  Filter-ha    : %s\n", filterSummary())
	fmt.Printf("  Khoroji-ha   : %s\n", outputSummary())
	fmt.Printf("  Pishrafte    : %s\n", advancedSummary())
	fmt.Println()
	return true
}
