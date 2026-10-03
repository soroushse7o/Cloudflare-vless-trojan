package utils

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultOutput         = "result.csv"
	maxDelay              = 9999 * time.Millisecond
	minDelay              = 0 * time.Millisecond
	maxLossRate   float32 = 1.0
)

var (
	InputMaxDelay    = maxDelay
	InputMinDelay    = minDelay
	InputMaxLossRate = maxLossRate
	Output           = defaultOutput // file-e khoroji-ye CSV (khali = gheyr-faal)
	OutputTxt        = ""            // file-e khoroji-ye TXT, faghat IP-ha (khali = gheyr-faal)
	OutputJson       = ""            // file-e khoroji-ye JSON (khali = gheyr-faal)
	TxtCount         = 0             // tedad-e IP dar file-e TXT (0 = hame)
	PrintNum         = 10
	Debug            = false // aya halat-e eshkal-yabi (debug) roshan ast
)

// Aya natije dar safhe namayesh dade shavad ya na
func NoPrintResult() bool {
	return PrintNum == 0
}

// Aya masir-e file khali ast (yani oun khoroji gheyr-faal ast)
func isEmptyPath(p string) bool {
	return strings.TrimSpace(p) == ""
}

// Aya khoroji-ye CSV gheyr-faal ast
func noOutput() bool {
	return isEmptyPath(Output)
}

type PingData struct {
	IP       *net.IPAddr
	Sended   int
	Received int
	Delay    time.Duration
	Colo     string
}

type CloudflareIPData struct {
	*PingData
	lossRate      float32
	DownloadSpeed float64
}

// Mohasebe-ye narkh-e gom-shodan-e baste (packet loss)
func (cf *CloudflareIPData) getLossRate() float32 {
	if cf.lossRate == 0 {
		pingLost := cf.Sended - cf.Received
		cf.lossRate = float32(pingLost) / float32(cf.Sended)
	}
	return cf.lossRate
}

func (cf *CloudflareIPData) toString() []string {
	result := make([]string, 7)
	result[0] = cf.IP.String()
	result[1] = strconv.Itoa(cf.Sended)
	result[2] = strconv.Itoa(cf.Received)
	result[3] = strconv.FormatFloat(float64(cf.getLossRate()), 'f', 2, 32)
	result[4] = strconv.FormatFloat(cf.Delay.Seconds()*1000, 'f', 2, 32)
	result[5] = strconv.FormatFloat(cf.DownloadSpeed/1024/1024, 'f', 2, 32)
	// Agar Colo khali bashad, "N/A" neveshte mishavad
	if cf.Colo == "" {
		result[6] = "N/A"
	} else {
		result[6] = cf.Colo
	}
	return result
}

// Sarsotun-haye jadval (hamoun tartib dar CSV va dar safhe)
var tableHeader = []string{"Adres IP", "Ersal shode", "Daryaft shode", "Gom-shodan", "Miangin takhir", "Sorat download(MB/s)", "Kod mantaghe"}

// ExportCsv natije ra dar file-e CSV minevisad
func ExportCsv(data []CloudflareIPData) {
	if noOutput() || len(data) == 0 {
		return
	}
	fp, err := os.Create(Output)
	if err != nil {
		log.Fatalf("Sakht-e file [%s] ba khata movajeh shod: %v", Output, err)
		return
	}
	defer fp.Close()
	w := csv.NewWriter(fp) // yek jaryan-e neveshtan-e jadid
	_ = w.Write(tableHeader)
	_ = w.WriteAll(convertToString(data))
	w.Flush()
}

// ExportTxt faghat IP-ha ra (har khat yek IP) dar file-e TXT minevisad
func ExportTxt(data []CloudflareIPData) {
	if isEmptyPath(OutputTxt) || len(data) == 0 {
		return
	}
	fp, err := os.Create(OutputTxt)
	if err != nil {
		log.Fatalf("Sakht-e file [%s] ba khata movajeh shod: %v", OutputTxt, err)
		return
	}
	defer fp.Close()
	n := len(data)
	if TxtCount > 0 && TxtCount < n { // 0 yani hame-ye IP-ha
		n = TxtCount
	}
	for i := 0; i < n; i++ {
		fmt.Fprintln(fp, data[i].IP.String())
	}
}

type jsonRow struct {
	IP        string  `json:"ip"`
	Sent      int     `json:"sent"`
	Received  int     `json:"received"`
	LossRate  float64 `json:"loss_rate"`
	DelayMs   float64 `json:"delay_ms"`
	SpeedMBps float64 `json:"speed_mbps"`
	Colo      string  `json:"colo"`
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// ExportJson hame-ye natije ra be soorat-e JSON minevisad
func ExportJson(data []CloudflareIPData) {
	if isEmptyPath(OutputJson) || len(data) == 0 {
		return
	}
	rows := make([]jsonRow, 0, len(data))
	for i := range data {
		v := &data[i]
		colo := v.Colo
		if colo == "" {
			colo = "N/A"
		}
		rows = append(rows, jsonRow{
			IP:        v.IP.String(),
			Sent:      v.Sended,
			Received:  v.Received,
			LossRate:  round2(float64(v.getLossRate())),
			DelayMs:   round2(v.Delay.Seconds() * 1000),
			SpeedMBps: round2(v.DownloadSpeed / 1024 / 1024),
			Colo:      colo,
		})
	}
	out, err := json.MarshalIndent(rows, "", "  ")
	if err != nil {
		log.Fatalf("Tabdil be JSON ba khata movajeh shod: %v", err)
		return
	}
	if err := os.WriteFile(OutputJson, out, 0644); err != nil {
		log.Fatalf("Sakht-e file [%s] ba khata movajeh shod: %v", OutputJson, err)
	}
}

func convertToString(data []CloudflareIPData) [][]string {
	result := make([][]string, 0)
	for _, v := range data {
		result = append(result, v.toString())
	}
	return result
}

// Mojoo'e-ye morattab-sazi bar asas-e takhir va gom-shodan
type PingDelaySet []CloudflareIPData

// Filter bar asas-e shart-e takhir
func (s PingDelaySet) FilterDelay() (data PingDelaySet) {
	if InputMaxDelay > maxDelay || InputMinDelay < minDelay { // shart-e vared shode dar mahdude-ye pishfarz nist: filter nemishavad
		return s
	}
	if InputMaxDelay == maxDelay && InputMinDelay == minDelay { // shart-ha pishfarz hastand: filter nemishavad
		return s
	}
	for _, v := range s {
		if v.Delay > InputMaxDelay { // hadd-e bala-ye takhir: baghie-ye data-ha ham ghabul nistand, hamin ja tamam
			break
		}
		if v.Delay < InputMinDelay { // hadd-e paein-e takhir: in IP rad mishavad
			continue
		}
		data = append(data, v) // shart ghabul ast, be araye-ye jadid ezafe mishavad
	}
	return
}

// Filter bar asas-e shart-e gom-shodan-e baste
func (s PingDelaySet) FilterLossRate() (data PingDelaySet) {
	if InputMaxLossRate >= maxLossRate { // shart pishfarz ast: filter nemishavad
		return s
	}
	for _, v := range s {
		if v.getLossRate() > InputMaxLossRate { // hadd-e bala-ye gom-shodan
			break
		}
		data = append(data, v) // shart ghabul ast, be araye-ye jadid ezafe mishavad
	}
	return
}

func (s PingDelaySet) Len() int {
	return len(s)
}
func (s PingDelaySet) Less(i, j int) bool {
	iRate, jRate := s[i].getLossRate(), s[j].getLossRate()
	if iRate != jRate {
		return iRate < jRate
	}
	return s[i].Delay < s[j].Delay
}
func (s PingDelaySet) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// Mojoo'e-ye morattab-sazi bar asas-e sorat-e download
type DownloadSpeedSet []CloudflareIPData

func (s DownloadSpeedSet) Len() int {
	return len(s)
}
func (s DownloadSpeedSet) Less(i, j int) bool {
	return s[i].DownloadSpeed > s[j].DownloadSpeed
}
func (s DownloadSpeedSet) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

// formatRow yek radif-e jadval ra ba arz-e sabet-e sotun-ha misazad
func formatRow(cols []string, widths []int) string {
	var sb strings.Builder
	for i, c := range cols {
		sb.WriteString(fmt.Sprintf("%-*s", widths[i], c))
	}
	return sb.String()
}

// Print natije-ha ra dar safhe namayesh midahad
func (s DownloadSpeedSet) Print() {
	if NoPrintResult() {
		return
	}
	if len(s) <= 0 { // tedad-e IP-ha bayad bishtar az 0 bashad
		fmt.Println("\n[Ettela] Tedad-e IP dar natije-ye kamel-e test 0 ast, natije-i baraye namayesh nist.")
		return
	}
	dateString := convertToString(s) // tabdil be araye-ye do-bo'di [][]string
	if len(dateString) < PrintNum {  // agar tedad-e IP-ha kamtar az tedad-e namayesh bood, tedad-e namayesh = tedad-e IP-ha
		PrintNum = len(dateString)
	}
	ipWidth := 18
	for i := 0; i < PrintNum; i++ { // agar IPv6 dar natije bashad, sotun-e IP bayad pahn-tar shavad
		if len(dateString[i][0]) > 15 {
			ipWidth = 42
			break
		}
	}
	widths := []int{ipWidth, 13, 15, 12, 16, 22, 14}
	Cyan.Println(formatRow(tableHeader, widths))
	for i := 0; i < PrintNum; i++ {
		fmt.Println(formatRow(dateString[i], widths))
	}
	if !noOutput() {
		fmt.Printf("\nNatije-ye kamel dar file-e %v zakhire shod (ba Notepad / Excel baz konid).\n", Output)
	}
	if !isEmptyPath(OutputTxt) {
		fmt.Printf("List-e IP-ha dar file-e %v zakhire shod.\n", OutputTxt)
	}
	if !isEmptyPath(OutputJson) {
		fmt.Printf("Natije dar format-e JSON dar file-e %v zakhire shod.\n", OutputJson)
	}
}
