package utils

import (
	"github.com/fatih/color"
)

// Rang-ha ra yek ketabkhane-ye hazeri modiriyat mikonad (hamahang ba Windows / Linux / macOS)
var (
	Red     = color.New(color.FgRed)                // ghermez 31
	Green   = color.New(color.FgGreen)              // sabz 32
	Yellow  = color.New(color.FgYellow)             // zard 33
	Blue    = color.New(color.FgBlue, color.Bold)   // abi 34
	Magenta = color.New(color.FgMagenta)            // arghavani 35
	Cyan    = color.New(color.FgHiCyan, color.Bold) // firoze-i 36
	White   = color.New(color.FgWhite)              // sefid 37
)
