package task

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/XIU2/CloudflareSpeedTest/utils"

	"github.com/VividCortex/ewma"
)

const (
	bufferSize                     = 1024
	defaultURL                     = "https://cf.xiu2.xyz/url"
	defaultTimeout                 = 10 * time.Second
	defaultDisableDownload         = false
	defaultTestNum                 = 10
	defaultMinSpeed        float64 = 0.0
)

var (
	URL     = defaultURL
	Timeout = defaultTimeout
	Disable = defaultDisableDownload

	TestCount = defaultTestNum
	MinSpeed  = defaultMinSpeed
)

func checkDownloadDefault() {
	if URL == "" {
		URL = defaultURL
	}
	if Timeout <= 0 {
		Timeout = defaultTimeout
	}
	if TestCount <= 0 {
		TestCount = defaultTestNum
	}
	if MinSpeed <= 0.0 {
		MinSpeed = defaultMinSpeed
	}
}

func TestDownloadSpeed(ipSet utils.PingDelaySet) (speedSet utils.DownloadSpeedSet) {
	checkDownloadDefault()
	if Disable {
		return utils.DownloadSpeedSet(ipSet)
	}
	if len(ipSet) <= 0 { // faghat vaghti tedad-e IP-ha bishtar az 0 bashad test-e download edame peyda mikonad
		utils.Yellow.Println("[Ettela] Tedad-e IP-haye natije-ye test-e takhir 0 ast, test-e download ra rad mikonim.")
		return
	}
	testNum := TestCount                        // tedad-e saf-e entezar-e test-e download, dar ebteda barabar-e tedad-e test-e download (-dn)
	if len(ipSet) < TestCount || MinSpeed > 0 { // agar tedad-e IP-haye bad az filter kamtar az -dn bashad (yani -dn kafi nist), ya hadd-e aghal-e sorat (-sl) moshakhas shode bashad (momken ast lazem shavad hame test shavand ta tedad-e khaste shode peyda shavad), saf barabar-e tedad-e IP-ha mishavad
		testNum = len(ipSet)
	}
	if testNum < TestCount { // agar saf kamtar az -dn bashad (yani -dn kafi nist), -dn ham be andaze-ye saf tanzim mishavad
		TestCount = testNum
	}

	utils.Cyan.Printf("Shoro-e test-e download (hadde-aghal: %.2f MB/s, tedad: %d, saf: %d)\n", MinSpeed, TestCount, testNum)
	// Tul-e navar-e test-e download ra ba navar-e test-e takhir yeksan mikonim (zibayi)
	bar_a := len(strconv.Itoa(len(ipSet)))
	bar_b := strings.Repeat(" ", len(utils.PingBarLabel)) + strings.Repeat(" ", bar_a)
	bar := utils.NewBar(TestCount, bar_b, "")
	for i := 0; i < testNum; i++ {
		speed, colo := downloadHandler(ipSet[i].IP)
		ipSet[i].DownloadSpeed = speed
		if ipSet[i].Colo == "" { // faghat vaghti Colo khali ast neveshte mishavad, dar gheyr-e in surat ghablan ba httping gerefte shode ast
			ipSet[i].Colo = colo
		}
		// Bad az test-e download-e har IP, ba shart-e hadde-aghal-e sorat filter mikonim
		if speed >= MinSpeed*1024*1024 {
			bar.Grow(1, "")
			speedSet = append(speedSet, ipSet[i]) // sorat az hadde-aghal bishtar ast, be araye-ye jadid ezafe mishavad
			if len(speedSet) == TestCount {       // vaghti tedad-e IP-haye khaste shode (-dn) kamel shod az halghe kharej mishavim
				break
			}
		}
	}
	bar.Done()
	if MinSpeed == 0.00 { // agar hadde-aghal-e sorat moshakhas nashode, hame-ye natije-ha bar migardad
		speedSet = utils.DownloadSpeedSet(ipSet)
	} else if utils.Debug && len(speedSet) == 0 { // agar hadde-aghal-e sorat moshakhas shode, halat-e debug roshan ast va hich IP-i shart ra nadashte, hame-ye natije-ha ra bar migardanim ta karbar sorat-haye vaghe'i ra bebinad va shart ra kam konad
		utils.Yellow.Println("[Debug] Hich IP-i shart-e hadde-aghal-e sorat-e download ra nadasht, shart nadide gerefte mishavad va hame-ye natije-ha namayesh dade mishavad (baraye tanzim-e shart dar test-e bad).")
		speedSet = utils.DownloadSpeedSet(ipSet)
	}
	// Morattab-sazi bar asas-e sorat
	sort.Sort(speedSet)
	return
}

func getDialContext(ip *net.IPAddr) func(ctx context.Context, network, address string) (net.Conn, error) {
	var fakeSourceAddr string
	if isIPv4(ip.String()) {
		fakeSourceAddr = fmt.Sprintf("%s:%d", ip.String(), TCPPort)
	} else {
		fakeSourceAddr = fmt.Sprintf("[%s]:%d", ip.String(), TCPPort)
	}
	return func(ctx context.Context, network, address string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, network, fakeSourceAddr)
	}
}

// Chap-e yekparche-ye khata-haye darkhast dar halat-e debug
func printDownloadDebugInfo(ip *net.IPAddr, err error, statusCode int, url, lastRedirectURL string, response *http.Response) {
	finalURL := url // adres-e nahayi-ye pishfarz, ta vaghti response khali ast ham chap shavad
	if lastRedirectURL != "" {
		finalURL = lastRedirectURL // agar lastRedirectURL khali nabood yani redirect shode, akharin maghsad-e redirect ra chap mikonim
	} else if response != nil && response.Request != nil && response.Request.URL != nil {
		finalURL = response.Request.URL.String() // agar response, Request va URL hame nil nabashand, akharin adres-e movafagh ra migirim
	}
	if url != finalURL { // agar URL va adres-e nahayi fargh dashte bashand yani redirect shode, khata az adres-e bad az redirect ast
		if statusCode > 0 { // agar kod-e vaziat bishtar az 0 bashad, khata az kod-e vaziat-e HTTP ast
			utils.Red.Printf("[Debug] IP: %s, test-e download motevaghef shod, kod-e vaziat-e HTTP: %d, adres-e test-e download: %s, adres-e bad az redirect ke khata dad: %s\n", ip.String(), statusCode, url, finalURL)
		} else {
			utils.Red.Printf("[Debug] IP: %s, test-e download ba khata movajeh shod, khata: %v, adres-e test-e download: %s, adres-e bad az redirect ke khata dad: %s\n", ip.String(), err, url, finalURL)
		}
	} else { // agar URL va adres-e nahayi yeksan bashand yani redirect nashode ast
		if statusCode > 0 { // agar kod-e vaziat bishtar az 0 bashad, khata az kod-e vaziat-e HTTP ast
			utils.Red.Printf("[Debug] IP: %s, test-e download motevaghef shod, kod-e vaziat-e HTTP: %d, adres-e test-e download: %s\n", ip.String(), statusCode, url)
		} else {
			utils.Red.Printf("[Debug] IP: %s, test-e download ba khata movajeh shod, khata: %v, adres-e test-e download: %s\n", ip.String(), err, url)
		}
	}
}

// return download Speed
func downloadHandler(ip *net.IPAddr) (float64, string) {
	var lastRedirectURL string // akharin maghsad-e redirect ra negah midarad ta dar surat-e khata chap shavad
	client := &http.Client{
		Transport: &http.Transport{DialContext: getDialContext(ip)},
		Timeout:   Timeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			lastRedirectURL = req.URL.String() // maghsad-e har redirect ra zakhire mikonim ta dar surat-e khata chap shavad
			if len(via) > 10 {                 // hadd-e aksar 10 bar redirect
				if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
					utils.Red.Printf("[Debug] IP: %s, tedad-e redirect-ha az had gozasht, test motevaghef shod, adres-e test-e download: %s\n", ip.String(), req.URL.String())
				}
				return http.ErrUseLastResponse
			}
			if req.Header.Get("Referer") == defaultURL { // vaghti adres-e pishfarz estefade mishavad, redirect Referer ra nemifrestad
				req.Header.Del("Referer")
			}
			return nil
		},
	}
	defer client.CloseIdleConnections()
	req, err := http.NewRequest("GET", URL, nil)
	if err != nil {
		if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
			utils.Red.Printf("[Debug] IP: %s, sakht-e darkhast-e test-e download ba khata movajeh shod, khata: %v, adres-e test-e download: %s\n", ip.String(), err, URL)
		}
		return 0.0, ""
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36")

	response, err := client.Do(req)
	if err != nil {
		if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
			printDownloadDebugInfo(ip, err, 0, URL, lastRedirectURL, response)
		}
		return 0.0, ""
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
			printDownloadDebugInfo(ip, nil, response.StatusCode, URL, lastRedirectURL, response)
		}
		return 0.0, ""
	}

	// Kod-e mantaghe ra az header-haye pasokh migirim
	colo := getHeaderColo(response.Header)

	timeStart := time.Now()           // zaman-e shoro (hala)
	timeEnd := timeStart.Add(Timeout) // zaman-e payan = shoro + modat-e test-e download

	contentLength := response.ContentLength // hajm-e file
	buffer := make([]byte, bufferSize)

	var (
		contentRead     int64 = 0
		timeSlice             = Timeout / 100
		timeCounter           = 1
		lastContentRead int64 = 0
	)

	var nextTime = timeStart.Add(timeSlice * time.Duration(timeCounter))
	e := ewma.NewMovingAverage()

	// Halghe-ye mohasebe: vaghti file kamel download shod (do meghdar barabar), az halghe kharej mishavim (test tamam mishavad)
	for contentLength != contentRead {
		currentTime := time.Now()
		if currentTime.After(nextTime) {
			timeCounter++
			nextTime = timeStart.Add(timeSlice * time.Duration(timeCounter))
			e.Add(float64(contentRead - lastContentRead))
			lastContentRead = contentRead
		}
		// Agar az modat-e test-e download gozashte bashad, az halghe kharej mishavim (test tamam mishavad)
		if currentTime.After(timeEnd) {
			break
		}
		bufferRead, err := response.Body.Read(buffer)
		if err != nil {
			if err != io.EOF { // agar dar hin-e download khata-i (mesl-e Timeout) rokh dad va dalil-esh tamam shodan-e file nabood, az halghe kharej mishavim (test tamam mishavad)
				break
			} else if contentLength == -1 { // download kamel shod va hajm-e file namalum ast, az halghe kharej mishavim (test tamam mishavad). Masalan: https://speed.cloudflare.com/__down?bytes=200000000 agar dar 10 sanie tamam shavad (sorat kheili bala), natije kheili kam ya 0.00 neshun dade mishavad
				break
			}
			// Dar yaftan-e baze-ye zamani-ye ghabli
			last_time_slice := timeStart.Add(timeSlice * time.Duration(timeCounter-1))
			// Hajm-e data-ye download shode / ((zaman-e hala - baze-ye ghabli) / baze)
			e.Add(float64(contentRead-lastContentRead) / (float64(currentTime.Sub(last_time_slice)) / float64(timeSlice)))
		}
		contentRead += int64(bufferRead)
	}
	return e.Value() / (Timeout.Seconds() / 120), colo
}
