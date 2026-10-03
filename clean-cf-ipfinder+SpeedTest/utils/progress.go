package utils

import (
	"fmt"

	"github.com/cheggaaa/pb/v3"
)

// Label-e navar-e pishraft-e test-e takhir (tedad-e IP-haye ghabel-estefade)
const PingBarLabel = "Ghabel-estefade:"

type Bar struct {
	pb *pb.ProgressBar
}

// NewBar yek navar-e pishraft misazad
func NewBar(count int, MyStrStart, MyStrEnd string) *Bar {
	tmpl := fmt.Sprintf(`{{counters . }} {{ bar . "[" "-" (cycle . "↖" "↗" "↘" "↙" ) "_" "]"}} %s {{string . "MyStr" | green}} %s `, MyStrStart, MyStrEnd)
	bar := pb.ProgressBarTemplate(tmpl).Start(count)
	return &Bar{pb: bar}
}

func (b *Bar) Grow(num int, MyStrVal string) {
	b.pb.Set("MyStr", MyStrVal).Add(num)
}

func (b *Bar) Done() {
	b.pb.Finish()
}
