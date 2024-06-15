[![NPM Version](https://img.shields.io/npm/v/%40sie-js%2Fsiemens-memory-dumper)](https://www.npmjs.com/package/@sie-js/siemens-memory-dumper)

# SUMMARY
Console utility for reading RAM memory inside Siemens phones.

Works on all OS: Linux, OSX, Windows

[Read more about memory dumping.](https://siemens-mobile-hacks.github.io/reverse-engineering/memory-dump.html)

# INSTALL
First you need to install the [CGSN patch](https://siemens-mobile-hacks.github.io/reverse-engineering/arm-debugger.html) to the phone.

**Linux & OSX**
1. Install the latest version of [NodeJS](https://nodejs.org/en/download/).
2. Install `siemens-memory-dumper` package:
	```bash
 	npm install -g @sie-js/siemens-memory-dumper@latest
 	```

	Alternatively, you can use a `siemens-memory-dumper` without installation:
	```bash
	# Just replace "siemens-memory-dumper" to "npx @sie-js/siemens-memory-dumper"
	npx @sie-js/siemens-memory-dumper -p /dev/ttyUSB0 list
	```

**Windows**

Download prebuilt `siemens-memory-dumper.exe` from [releases](https://github.com/siemens-mobile-hacks/siemens-memory-dumper/releases).

Alternatively, you can [install nodejs on windows](https://nodejs.org/en/download/) and use instruction for OSX/Linux.

# TIPS & TRICKS
1. You can achieve maximum speed using a DCA-540 or DCA-510 data cables.
2. Bluetooth is also possible, but has the worst speed.
3. It is better to read memory before ArmDebugger is used.

# USAGE
```
Usage: siemens-memory-dumper [options] [command]

CLI memory dumper for Siemens phones.

Options:
  -p, --port <port>              serial port name (default: "/dev/ttyUSB0")
  -b, --baudrate <baudrate>      limit maximum baudrate (0 - use maximum) (default: "0")
  -h, --help                     display help for command

Commands:
  read <addr> <size> [file|dir]  Read memory region by address and size and save to file.
  read-region <name> [file|dir]  Read memory region by name and save to file.
  read-all [dir]                 Read all available memory regions from phone and save to dir.
  list                           List available memory regions for dump.
  list-ports                     List available serial ports.
  help [command]                 display help for command
```

### List all available memory regions
```bash
siemens-memory-dumper -p PORT list
```
```
$ siemens-memory-dumper -p /dev/ttyUSB0 list
Connecting to phone using port /dev/ttyUSB0...
Connected using 921600 baudrate.
Detected phone SIEMENS C81v51
╔══════════╤════════════╤════════════════════╤════════════════════════════════════════════════════╗
║ Name     │ Address    │ Size               │ Description                                        ║
╟──────────┼────────────┼────────────────────┼────────────────────────────────────────────────────╢
║ BROM     │ 0x00400000 │ 0x00008000 (32 kB) │ Built-in 1st stage bootloader firmware.            ║
╟──────────┼────────────┼────────────────────┼────────────────────────────────────────────────────╢
║ TCM      │ 0x00000000 │ 0x00004000 (16 kB) │ Built-in memory in the CPU, used for IRQ handlers. ║
╟──────────┼────────────┼────────────────────┼────────────────────────────────────────────────────╢
║ SRAM     │ 0x00080000 │ 0x00018000 (96 kB) │ Built-in memory in the CPU.                        ║
╟──────────┼────────────┼────────────────────┼────────────────────────────────────────────────────╢
║ RAM      │ 0xA8000000 │ 0x01000000 (16 Mb) │ External RAM.                                      ║
╟──────────┼────────────┼────────────────────┼────────────────────────────────────────────────────╢
║ VMALLOC1 │ 0xAC000000 │ 0x00E00000 (14 Mb) │ Virtual memory for malloc().                       ║
╚══════════╧════════════╧════════════════════╧════════════════════════════════════════════════════╝
```

### Dump all available memory regions
```bash
siemens-memory-dumper -p PORT read-all
```
```
$ siemens-memory-dumper -p /dev/ttyUSB0 read-all /tmp/C81
Connecting to phone using port /dev/ttyUSB0...
Connected using 921600 baudrate.
Detected phone SIEMENS C81v51

[1/5] Reading BROM 00400000 ... 00407FFF (32 kB)
 [========================================] 100% | ETA: 467s | 65.98 kB/s
File saved to: /tmp/C81/C81v51-BROM-00400000_00008000.bin

[2/5] Reading TCM 00000000 ... 00003FFF (16 kB)
 [========================================] 100% | ETA: 460s | 66.95 kB/s
File saved to: /tmp/C81/C81v51-TCM-00000000_00004000.bin

[3/5] Reading SRAM 00080000 ... 00097FFF (96 kB)
 [========================================] 100% | ETA: 456s | 67.42 kB/s
File saved to: /tmp/C81/C81v51-SRAM-00080000_00018000.bin

[4/5] Reading RAM A8000000 ... A8FFFFFF (16 Mb)
 [========================================] 100% | ETA: 212s | 67.51 kB/s
File saved to: /tmp/C81/C81v51-RAM-A8000000_01000000.bin

[5/5] Reading VMALLOC1 AC000000 ... ACDFFFFF (14 Mb)
 [========================================] 100% | ETA: 0s | 67.65 kB/s
File saved to: /tmp/C81/C81v51-VMALLOC1-AC000000_00E00000.bin
```

### Dump memory region by name
```bash
siemens-memory-dumper -p PORT read-region SRAM
siemens-memory-dumper -p PORT read-region SRAM ./SRAM.bin
```
```
Connecting to phone using port /dev/ttyUSB0...
Connected using 921600 baudrate.
Detected phone SIEMENS C81v51
Reading memory 00080000 ... 00097FFF (96 kB)

 [========================================] 100% | ETA: 0s | 39.3 kB/s

File saved to: ./C81v51-SRAM-00080000_00018000.bin
```

### Dump any custom memory region by address and size
```bash
siemens-memory-dumper -p PORT read 0xA0000000 128k
siemens-memory-dumper -p PORT read 0xA0000000 128k ./bootcore.bin
siemens-memory-dumper -p PORT read 0xA0000000 0x20000 ./bootcore.bin
```
```
$ siemens-memory-dumper -p /dev/ttyUSB0 read 0xA0000000 128k
Connecting to phone using port /dev/ttyUSB0...
Connected using 921600 baudrate.
Detected phone SIEMENS C81v51
Reading memory A0000000 ... A001FFFF (128 kB)

 [========================================] 100% | ETA: 0s | 67.23 kB/s

File saved to: ./C81v51-A0000000_00020000.bin
```
