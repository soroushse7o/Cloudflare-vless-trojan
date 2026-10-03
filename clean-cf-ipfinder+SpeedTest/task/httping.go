package task

import (
	//"crypto/tls"

	"io"
	"log"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/XIU2/CloudflareSpeedTest/utils"
)

var (
	Httping               bool
	HttpingStatusCode     int
	HttpingCFColo         string
	HttpingCFColomap      *sync.Map
	RegexpColoIATACode    = regexp.MustCompile(`[A-Z]{3}`)  // regex baraye kod-e IATA-ye foroodgah (se harfi)
	RegexpColoCountryCode = regexp.MustCompile(`[A-Z]{2}`)  // regex baraye kod-e keshvar (mesl-e US, CN, UK)
	RegexpColoGcore       = regexp.MustCompile(`^[a-z]{2}`) // regex baraye kod-e shahr (harf-e kuchak, mesl-e us, cn, uk)
)

// pingReceived pingTotalTime
func (p *Ping) httping(ip *net.IPAddr) (int, time.Duration, string) {
	hc := http.Client{
		Timeout: time.Second * 2,
		Transport: &http.Transport{
			DialContext: getDialContext(ip),
			//TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // ghabl az barresi-ye govahi sarf-e nazar shavad
		},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse // jelogiri az redirect
		},
	}
	defer hc.CloseIdleConnections()

	// Avval yek bar vared mishavim ta kod-e vaziat-e HTTP va kod-e mantaghe ra begirim
	var colo string
	{
		request, err := http.NewRequest(http.MethodHead, URL, nil)
		if err != nil {
			if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
				utils.Red.Printf("[Debug] IP: %s, sakht-e darkhast-e test-e takhir ba khata movajeh shod, khata: %v, adres-e test: %s\n", ip.String(), err, URL)
			}
			return 0, 0, ""
		}
		request.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36")
		response, err := hc.Do(request)
		if err != nil {
			if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
				utils.Red.Printf("[Debug] IP: %s, test-e takhir ba khata movajeh shod, khata: %v, adres-e test: %s\n", ip.String(), err, URL)
			}
			return 0, 0, ""
		}
		defer response.Body.Close()

		//fmt.Println("IP:", ip, "StatusCode:", response.StatusCode, response.Request.URL)
		// Agar kod-e vaziat-e HTTP moshakhas nashode ya na-motabar bashad, faghat 200, 301 va 302 ra movafagh hesab mikonim
		if HttpingStatusCode == 0 || HttpingStatusCode < 100 || HttpingStatusCode > 599 {
			if response.StatusCode != 200 && response.StatusCode != 301 && response.StatusCode != 302 {
				if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
					utils.Red.Printf("[Debug] IP: %s, test-e takhir motevaghef shod, kod-e vaziat-e HTTP: %d, adres-e test: %s\n", ip.String(), response.StatusCode, URL)
				}
				return 0, 0, ""
			}
		} else {
			if response.StatusCode != HttpingStatusCode {
				if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
					utils.Red.Printf("[Debug] IP: %s, test-e takhir motevaghef shod, kod-e vaziat-e HTTP: %d, kod-e morednazar: %d, adres-e test: %s\n", ip.String(), response.StatusCode, HttpingStatusCode, URL)
				}
				return 0, 0, ""
			}
		}

		io.Copy(io.Discard, response.Body)

		// Kod-e mantaghe ra az header-haye pasokh migirim
		colo = getHeaderColo(response.Header)

		// Faghat vaghti mantaghe moshakhas shode bashad kod-e foroodgah ra match mikonim
		if HttpingCFColo != "" {
			// Barresi mikonim aya ba kod-e mantaghe-ye khaste shode yeksan ast
			colo = p.filterColo(colo)
			if colo == "" { // agar kod-e mantaghe peyda nashod ya jozv-e mantaghe-haye khaste shode nabood, test-e in IP tamam mishavad
				if utils.Debug { // dar halat-e debug etelaat-e bishtar chap mishavad
					utils.Red.Printf("[Debug] IP: %s, kod-e mantaghe motabeghat nadarad: %s\n", ip.String(), colo)
				}
				return 0, 0, ""
			}
		}
	}

	// Halghe-ye test baraye mohasebe-ye takhir
	success := 0
	var delay time.Duration
	for i := 0; i < PingTimes; i++ {
		request, err := http.NewRequest(http.MethodHead, URL, nil)
		if err != nil {
			log.Fatal("Khata-ye napishbini-nashode, lotfan gozaresh dahid: ", err)
			return 0, 0, ""
		}
		request.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36")
		if i == PingTimes-1 {
			request.Header.Set("Connection", "close")
		}
		startTime := time.Now()
		response, err := hc.Do(request)
		if err != nil {
			continue
		}
		success++
		io.Copy(io.Discard, response.Body)
		_ = response.Body.Close()
		duration := time.Since(startTime)
		delay += duration
	}

	return success, delay, colo
}

func MapColoMap() *sync.Map {
	if HttpingCFColo == "" {
		return nil
	}
	// Mantaghe-haye moshakhas shode ba parametr -cfcolo ra be horuf-e bozorg tabdil va ba format-e yeksan zakhire mikonim
	colos := strings.Split(strings.ToUpper(HttpingCFColo), ",")
	colomap := &sync.Map{}
	for _, colo := range colos {
		colomap.Store(strings.TrimSpace(colo), strings.TrimSpace(colo))
	}
	return colomap
}

// Meghdar-e kod-e mantaghe (colo) ra az header-haye pasokh be dast miavarad
func getHeaderColo(header http.Header) (colo string) {
	if header.Get("server") != "" {
		// Agar CDN-e Cloudflare bashad
		// server: cloudflare
		// cf-ray: 7bd32409eda7b020-SJC
		if header.Get("server") == "cloudflare" {
			if colo = header.Get("cf-ray"); colo != "" {
				return RegexpColoIATACode.FindString(colo)
			}
		}
		// Agar CDN77 bashad (adres-e test: https://www.cdn77.com)
		// server: CDN77-Turbo
		// x-77-pop: losangelesUSCA // baraye Amrika USCA namayesh dade mishavad, felan faghat US estekhraj mishavad
		// x-77-pop: frankfurtDE
		// x-77-pop: amsterdamNL
		// x-77-pop: singaporeSG
		if header.Get("server") == "CDN77-Turbo" {
			if colo = header.Get("x-77-pop"); colo != "" {
				return RegexpColoCountryCode.FindString(colo)
			}
		}
		// Agar Bunny CDN bashad (adres-e test: https://bunny.net)
		// server: BunnyCDN-TW1-1121
		if colo = header.Get("server"); strings.Contains(colo, "BunnyCDN-") {
			return RegexpColoCountryCode.FindString(strings.TrimPrefix(colo, "BunnyCDN-")) // pishvand-e BunnyCDN- ra hazf mikonim va bad match mikonim
		}
	}
	// Agar AWS CloudFront bashad (adres-e test: https://d7uri8nf7uskq.cloudfront.net/tools/list-cloudfront-ips)
	// x-amz-cf-pop: SIN52-P1
	if colo = header.Get("x-amz-cf-pop"); colo != "" {
		return RegexpColoIATACode.FindString(colo)
	}
	// Agar Fastly bashad (adres-e test: https://fastly.jsdelivr.net/gh/XIU2/CloudflareSpeedTest@master/go.mod)
	// x-served-by: cache-qpg1275-QPG
	// x-served-by: cache-fra-etou8220141-FRA, cache-hhr-khhr2060043-HHR (akharin mored mahal-e vaghe'i ast)
	if colo = header.Get("x-served-by"); colo != "" {
		if matches := RegexpColoIATACode.FindAllString(colo, -1); len(matches) > 0 {
			return matches[len(matches)-1] // chon x-served-by-e Fastly momken ast chand kod dashte bashad, faghat akharin ra bar midarim
		}
	}
	// Header-haye Gcore (tavajoh: kod-e shahr ast na kod-e keshvar), adres-e test: https://assets.gcore.pro/assets/icons/shield-lock.svg
	// x-id-fe: fr5-hw-edge-gc17
	// x-shard: fr5-shard0-default
	// x-id: fr5-hw-edge-gc28
	if colo = header.Get("x-id-fe"); colo != "" {
		if colo = RegexpColoGcore.FindString(colo); colo != "" {
			return strings.ToUpper(colo) // kod-e harf-e kuchak ra be harf-e bozorg tabdil mikonim
		}
	}

	// Agar header-i peyda nashod yani CDN poshtibani nemishavad, reshte-ye khali bar migardad
	return ""
}

// Pardazesh-e kod-e mantaghe
func (p *Ping) filterColo(colo string) string {
	if colo == "" {
		return ""
	}
	// Agar parametr-e -cfcolo moshakhas nashode bashad, mostaghim bar migardad
	if HttpingCFColomap == nil {
		return colo
	}
	// Barresi mikonim aya kod-e foroodgah jozv-e mantaghe-haye khaste shode ast
	_, ok := HttpingCFColomap.Load(colo)
	if ok {
		return colo
	}
	return ""
}
