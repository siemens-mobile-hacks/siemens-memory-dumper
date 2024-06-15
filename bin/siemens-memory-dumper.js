#!/usr/bin/env node
import { program } from "commander";
import { listAvailableMemory, readAllMemory, readMemoryToFile } from "../src/index.js";
import { SerialPort } from "serialport";

const USB_DEVICES = [
	"067B:2303",	// PL2303
	"1A86:7523",	// CH340
	"0403:6001",	// FT232
	"10C4:EA60",	// СР2102
	"11F5:0004",	// DCA-540
	"11F5:1004",	// DCA-540
];

const DEFAULT_PORT = await getDefaultPort();

program
	.description('CLI memory dumper for Siemens phones.')
	.option('-p, --port <port>', 'serial port name', DEFAULT_PORT)
	.option('-b, --baudrate <baudrate>', 'limit maximum baudrate (0 - use maximum)', '0');

program.command('read')
	.description('Read memory region by address and size and save to file.')
	.argument('<addr>', 'memory address (0xHEX)')
	.argument('<size>', 'memory size (0xHEX or 1M, 128k, 256...)')
	.argument('[file|dir]', 'write memory to this file or dir')
	.action(async function (addr, size, output) {
		await readMemoryToFile({addr, size, output, ...this.optsWithGlobals()});
	});

program.command('read-region')
	.description('Read memory region by name and save to file.')
	.argument('<name>', 'memory region name (SRAM, RAM, ...)')
	.argument('[file|dir]', 'write memory to this file or dir')
	.action(async function (name, output) {
		await readMemoryToFile({name, output, ...this.optsWithGlobals()});
	});

program.command('read-all')
	.description('Read all available memory regions from phone and save to dir.')
	.argument('[dir]', 'write memory regions to this dir')
	.action(async function (output) {
		await readAllMemory({output, ...this.optsWithGlobals()});
	});

program.command('list')
	.description('List available memory regions for dump.')
	.action(async function () {
		await listAvailableMemory(this.optsWithGlobals());
	});

program.command('list-ports')
	.description('List available serial ports.')
	.action(async function () {
		for (let p of await SerialPort.list()) {
			if (p.productId != null)
				console.log(p.path, `${p.vendorId}:${p.productId}`, p.manufacturer);
		}
	});

program.showHelpAfterError();
program.parse();

async function getDefaultPort() {
	let availablePorts = (await SerialPort.list()).filter((d) => {
		return USB_DEVICES.includes(`${d.vendorId}:${d.productId}`.toUpperCase());
	});
	let defaultPort = availablePorts.length > 0 ? availablePorts[0].path : null;
	if (!defaultPort)
		defaultPort = (process.platform === "win32" ? "COM4" : "/dev/ttyUSB0");
	return defaultPort;
}
