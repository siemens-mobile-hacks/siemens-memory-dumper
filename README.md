[![NPM Version](https://img.shields.io/npm/v/%40sie-js%2Fserial)](https://www.npmjs.com/package/@sie-js/memory-dump)

# SUMMARY
Console utility for memory dump of Siemens phones.

Works on all OS: Linux, OSX, Windows

# INSTALL
You need to install the latest version of nodejs: https://nodejs.org/en/download/

# USAGE
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
```
$ npx @sie-js/memory-dumper list -h
Usage: memory-dumper list [options]

List available memory regions for dump.

Options:
  -h, --help  display help for command
```
```bash
npx @sie-js/memory-dumper -p PORT list
```

### Dump all memory regions
```
$ npx @sie-js/memory-dumper read-all -h
Usage: memory-dumper read-all [options]

Read all available memory regions from phone to dir.

Options:
  -o, --output <dir>  write memory regions to this dir
  -h, --help          display help for command
```
```bash
npx @sie-js/memory-dumper -p PORT read-all -o OUTPUT_DIR
```

## Dump any custom memory region
```
$ npx @sie-js/memory-dumper read -h
Usage: memory-dumper read [options]

Read memory from phone to file.

Options:
  -a, --addr <address>  memory address (0xHEX)
  -s, --size <size>     memory size (0xHEX or 1M, 128k, 256...)
  -o, --output <file>   write memory to this file
  -h, --help            display help for command
```
```bash
npx @sie-js/memory-dumper -p PORT read -a 0xA0000000 -s 128k -o bootcore.bin
npx @sie-js/memory-dumper -p PORT read -a 0xA0000000 -s 0x20000 -o bootcore.bin
```
