package main

import (
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"time"

	"github.com/XIU2/CloudflareSpeedTest/task"
	"github.com/XIU2/CloudflareSpeedTest/utils"
)

var (
	version, versionNew string

	// Parametr-hayi ke ham az khat-e farman va ham az menu-ye avval taghir mikonand
	minDelay, maxDelay, downloadTime int
	maxLossRate                      float64

	printVersion bool
	noMenu       bool // -nomenu : menu-ye avval namayesh dade nashavad
	forceMenu    bool // -menu   : hatman menu-ye avval namayesh dade shavad
)

func init() {
	var help = `
CloudflareSpeedTest ` + version + ` (nesakhe-ye Finglish + menu-ye avval)
Takhir va sorat-e hame-ye IP-haye CDN ya sait-ha ra test mikonad va sari-tarin IP (IPv4+IPv6) ra peyda mikonad!
https://github.com/XIU2/CloudflareSpeedTest

Agar bedun-e parametr ejra konid (va dar terminal bashid), menu-ye avval baz mishavad
ta halat-e test va khoroji-ha ra entekhab konid va bad test ra shoro konid.

Parametr-ha:
    -n 200
        Thread-haye test-e takhir; har che bishtar, test-e takhir sari-tar; dastgah-haye zaif (mesl-e router) ziad nakonid; (pishfarz 200, hadd-e aksar 1000)
    -t 4
        Tedad-e test-e takhir; chand bar takhir-e har IP test shavad; (pishfarz 4 bar)
    -dn 10
        Tedad-e test-e download; bad az test-e takhir va morattab-sazi, az kamtarin takhir shoro karde va be in tedad IP download test mishavad; (pishfarz 10 ta)
    -dt 10
        Modat-e test-e download; hadd-e aksar-e zaman-e download-e har IP, nabayad kheili kam bashad; (pishfarz 10 sanie)
    -tp 443
        Port-e test; port-i ke dar test-e takhir/download estefade mishavad; (pishfarz 443)
    -url https://cf.xiu2.xyz/url
        Adres-e test; adres-i ke dar test-e takhir (HTTPing) va test-e download estefade mishavad; adres-e pishfarz payedari-ye ta'min shode nadarad, behtar ast khodetan besazid;

    -httping
        Taghir-e halat-e test; test-e takhir ba protocol-e HTTP anjam mishavad va adres-e test haman [-url] ast; (pishfarz TCPing)
    -httping-code 200
        Kod-e vaziat-e motabar; kod-e HTTP-i ke dar HTTPing movafagh hesab mishavad, faghat yek adad; (pishfarz 200 301 302)
    -cfcolo HKG,KHH,NRT,LAX,SEA,SJC,FRA,MAD
        Filter-e mantaghe; kod-e IATA-ye foroodgah ya kod-e keshvar/shahr, ba virgul-e englisi joda shavad, faghat dar halat-e HTTPing; (pishfarz hame-ye mantaghe-ha)

    -tl 200
        Hadd-e bala-ye miangin-e takhir; faghat IP-haye ba takhir-e kamtar ra khoroji midahad, shart-haye bala/paein ba ham ghabel-e estefade hastand; (pishfarz 9999 ms)
    -tll 40
        Hadd-e paein-e miangin-e takhir; faghat IP-haye ba takhir-e bishtar ra khoroji midahad; (pishfarz 0 ms)
    -tlr 0.2
        Hadd-e bala-ye narkh-e gom-shodan; faghat IP-haye ba gom-shodan-e kamtar ya mosavi ra khoroji midahad, mahdude 0.00~1.00, adad-e 0 yani har IP-ye ba gom-shodan hazf shavad; (pishfarz 1.00)
    -sl 5
        Hadd-e aghal-e sorat-e download; faghat IP-haye ba sorat-e bishtar ra khoroji midahad, ta vaghti tedad-e [-dn] kamel nashavad test edame darad; (pishfarz 0.00 MB/s)

    -p 10
        Tedad-e natije baraye namayesh; bad az test mostaghim be in tedad natije namayesh dade mishavad, agar 0 bashad natije namayesh dade nemishavad va barname kharej mishavad; (pishfarz 10 ta)
    -f ip.txt
        File-e mahdude-haye IP; agar masir fasele dasht dar kotation bezarid; mahdude-haye CDN-haye digar ham poshtibani mishavad; (pishfarz ip.txt)
    -ip 1.1.1.1,2.2.2.2/24,2606:4700::/32
        Mahdude-haye IP-e dasti; mostaghim ba parametr, ba virgul-e englisi joda shavad; (pishfarz khali)
    -o result.csv
        File-e khoroji-ye CSV; agar masir fasele dasht dar kotation bezarid; agar khali bashad file neveshte nemishavad [-o ""]; (pishfarz result.csv)
    -otxt result.txt
        File-e khoroji-ye TXT; faghat IP-ha, har khat yek IP; (pishfarz khali = gheyr-faal)
    -txtn 5
        Tedad-e IP dar file-e TXT; 0 yani hame; (pishfarz 0)
    -ojson result.json
        File-e khoroji-ye JSON; hame-ye etelaat-e natije; (pishfarz khali = gheyr-faal)

    -dd
        Gheyr-faal kardan-e test-e download; dar in surat natije bar asas-e takhir morattab mishavad (pishfarz bar asas-e sorat-e download); (pishfarz faal)
    -allip
        Test-e hame-ye IP-ha; har IP-ye mahdude (faghat IPv4) test mishavad; (pishfarz dar har /24 yek IP-ye tasadofi)

    -menu
        Hatman menu-ye avval ra neshan bede (hata agar parametr-e digar dadid, an-ha meghdar-e avvalie-ye menu mishavand)
    -nomenu
        Menu-ye avval ra neshan nade (baraye script-ha)
    -debug
        Halat-e eshkal-yabi; dar bazi mavared-e napishbini-nashode log-e bishtari chap mikonad ta dalil-ra peyda konid; (pishfarz khamush)

    -v
        Chap-e noskhe + barresi-ye noskhe-ye jadid
    -h
        Chap-e rahnama
`
	flag.IntVar(&task.Routines, "n", 200, "Thread-haye test-e takhir")
	flag.IntVar(&task.PingTimes, "t", 4, "Tedad-e test-e takhir")
	flag.IntVar(&task.TestCount, "dn", 10, "Tedad-e test-e download")
	flag.IntVar(&downloadTime, "dt", 10, "Modat-e test-e download")
	flag.IntVar(&task.TCPPort, "tp", 443, "Port-e test")
	flag.StringVar(&task.URL, "url", "https://cf.xiu2.xyz/url", "Adres-e test")

	flag.BoolVar(&task.Httping, "httping", false, "Taghir-e halat-e test")
	flag.IntVar(&task.HttpingStatusCode, "httping-code", 0, "Kod-e vaziat-e motabar")
	flag.StringVar(&task.HttpingCFColo, "cfcolo", "", "Filter-e mantaghe")

	flag.IntVar(&maxDelay, "tl", 9999, "Hadd-e bala-ye miangin-e takhir")
	flag.IntVar(&minDelay, "tll", 0, "Hadd-e paein-e miangin-e takhir")
	flag.Float64Var(&maxLossRate, "tlr", 1, "Hadd-e bala-ye narkh-e gom-shodan")
	flag.Float64Var(&task.MinSpeed, "sl", 0, "Hadd-e aghal-e sorat-e download")

	flag.IntVar(&utils.PrintNum, "p", 10, "Tedad-e natije baraye namayesh")
	flag.StringVar(&task.IPFile, "f", "ip.txt", "File-e mahdude-haye IP")
	flag.StringVar(&task.IPText, "ip", "", "Mahdude-haye IP-e dasti")
	flag.StringVar(&utils.Output, "o", "result.csv", "File-e khoroji-ye CSV")
	flag.StringVar(&utils.OutputTxt, "otxt", "", "File-e khoroji-ye TXT")
	flag.IntVar(&utils.TxtCount, "txtn", 0, "Tedad-e IP dar file-e TXT")
	flag.StringVar(&utils.OutputJson, "ojson", "", "File-e khoroji-ye JSON")

	flag.BoolVar(&task.Disable, "dd", false, "Gheyr-faal kardan-e test-e download")
	flag.BoolVar(&task.TestAll, "allip", false, "Test-e hame-ye IP-ha")

	flag.BoolVar(&forceMenu, "menu", false, "Namayesh-e menu-ye avval")
	flag.BoolVar(&noMenu, "nomenu", false, "Namayesh nadadan-e menu-ye avval")
	flag.BoolVar(&utils.Debug, "debug", false, "Halat-e eshkal-yabi")

	flag.BoolVar(&printVersion, "v", false, "Chap-e noskhe")
	flag.Usage = func() { fmt.Print(help) }
	flag.Parse()

	if printVersion {
		println(version)
		fmt.Println("Dar hal-e barresi-ye noskhe-ye jadid...")
		checkUpdate()
		if versionNew != "" {
			utils.Yellow.Printf("*** Noskhe-ye jadid [%s] peyda shod! Lotfan be [https://github.com/XIU2/CloudflareSpeedTest] beravid va be-roz konid! ***", versionNew)
		} else {
			utils.Green.Println("Shoma az akharin noskhe [" + version + "] estefade mikonid!")
		}
		os.Exit(0)
	}
}

// Tanzimat-e nahayi ra (bad az khat-e farman va menu) be bakhsh-haye barname e'mal mikonad
func applySettings() {
	if task.MinSpeed > 0 && time.Duration(maxDelay)*time.Millisecond == utils.InputMaxDelay {
		utils.Yellow.Println("[Pishnahad] Vaghti az parametr-e [-sl] estefade mikonid, behtar ast [-tl] ra ham bezarid ta agar tedad-e IP-haye khaste shode [-dn] peyda nashod, test be hamishe edame peyda nakonad...")
	}
	utils.InputMaxDelay = time.Duration(maxDelay) * time.Millisecond
	utils.InputMinDelay = time.Duration(minDelay) * time.Millisecond
	utils.InputMaxLossRate = float32(maxLossRate)
	task.Timeout = time.Duration(downloadTime) * time.Second
	task.HttpingCFColomap = task.MapColoMap()
}

// Aya bayad menu-ye avval namayesh dade shavad
func shouldShowMenu() bool {
	if noMenu {
		return false
	}
	if forceMenu {
		return true
	}
	if flag.NFlag() > 0 { // karbar khodash parametr dade, menu lazem nist
		return false
	}
	return isTerminal() // agar vorudi az pipe bashad (mesl-e script-ha) menu namayesh dade nemishavad
}

// Aya vorudi-ye barname yek terminal-e vaghe'i ast
func isTerminal() bool {
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}

func main() {
	task.InitRandSeed() // tanzim-e seed-e adad-e tasadofi

	if shouldShowMenu() {
		if !runMenu() { // karbar khorooj ra entekhab kard
			return
		}
	}
	applySettings()

	fmt.Printf("# XIU2/CloudflareSpeedTest %s (nesakhe-ye Finglish)\n\n", version)

	// Shoro-e test-e takhir + filter-e takhir/gom-shodan
	pingData := task.NewPing().Run().FilterDelay().FilterLossRate()
	// Shoro-e test-e download
	speedData := task.TestDownloadSpeed(pingData)
	utils.ExportCsv(speedData)  // khoroji-ye CSV
	utils.ExportTxt(speedData)  // khoroji-ye TXT (faghat IP-ha)
	utils.ExportJson(speedData) // khoroji-ye JSON
	speedData.Print()           // chap-e natije
	endPrint()                  // entekhab-e raveshe khorooj bar asas-e sharayet (baraye Windows)
}

// Entekhab-e raveshe khorooj bar asas-e sharayet (baraye Windows)
func endPrint() {
	if utils.NoPrintResult() { // agar natije namayesh dade nemishavad, mostaghim kharej mishavim
		return
	}
	if runtime.GOOS == "windows" { // dar Windows bayad Enter ya Ctrl+C bezanid (ta vaghti ba double-click ejra mishavad, pas az test pencere baste nashavad)
		fmt.Printf("Baraye khorooj Enter ya Ctrl+C ra bezanid.")
		fmt.Scanln()
	}
}

// Barresi-ye noskhe-ye jadid
func checkUpdate() {
	timeout := 10 * time.Second
	client := http.Client{Timeout: timeout}
	res, err := client.Get("https://api.xiu2.xyz/ver/cloudflarespeedtest.txt")
	if err != nil {
		return
	}
	// Khandan-e data body: []byte
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return
	}
	// Bastan-e jaryan
	defer res.Body.Close()
	if string(body) != version {
		versionNew = string(body)
	}
}
