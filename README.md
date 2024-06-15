[![NPM Version](https://img.shields.io/npm/v/%40sie-js%2Fserial)](https://www.npmjs.com/package/@sie-js/memory-dump)

# SUMMARY
Console utility for memory dump of Siemens phones.

Works on all OS: Linux, OSX, Windows

# INSTALL
- Install the latest version of [NodeJS](https://nodejs.org/en/download/).
	- Windows: [download nodejs.msi](https://nodejs.org/en/download/prebuilt-installer)
   		
		Install .msi package with checked `[x] Automatically install the necessary tools`.
		
		Also, restart is required after installation.
 	- OSX: `brew install node@20`
  	- Linux: [use package manager](https://nodejs.org/en/download/package-manager/all)
- Install a [CGSN patch](https://siemens-mobile-hacks.github.io/reverse-engineering/arm-debugger.html) to the phone.

# USAGE
> [!NOTE]
> You can achieve maximum speed using a DCA-540 or DCA-510 data cables. Bluetooth is also possible, but has the worst speed.

```
$ npx @sie-js/memory-dumper -h
Usage: memory-dumper [options] [command]

CLI memory dumper for Siemens phones.

Options:
  -p, --port <port>          serial port name (default: "/dev/ttyUSB0")
  -b, --baudrate <baudrate>  limit maximum baudrate (0 - use maximum) (default: "0")
  -h, --help                 display help for command

Commands:
  read [options]             Read memory from phone to file.
  read-all [options]         Read all available memory regions from phone to dir.
  list                       List available memory regions for dump.
  help [command]             display help for command
```

### List all available memory regions
```bash
npx @sie-js/memory-dumper -p PORT list
```
```
$ npx @sie-js/memory-dumper -p /dev/ttyUSB0 list
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

### Dump all memory regions
```bash
npx @sie-js/memory-dumper -p PORT read-all -o OUTPUT_DIR
```
```
$ npx @sie-js/memory-dumper -p /dev/ttyUSB0 read-all -o /tmp/C81
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

### Dump any custom memory region
```bash
npx @sie-js/memory-dumper -p PORT read -a 0xA0000000 -s 128k -o bootcore.bin
npx @sie-js/memory-dumper -p PORT read -a 0xA0000000 -s 0x20000 -o bootcore.bin
```
```
$ npx @sie-js/memory-dumper -p /dev/ttyUSB0 read -a 0xA0000000 -s 128k -o bootcore.bin
Connecting to phone using port /dev/ttyUSB0...
Connected using 921600 baudrate.
Reading memory A0000000 ... A001FFFF (128 kB)

 [========================================] 100% | ETA: 0s | 67.37 kB/s

File saved to: bootcore.bin
```
