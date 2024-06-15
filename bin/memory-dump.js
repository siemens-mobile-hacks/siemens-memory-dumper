#!/usr/bin/env node
import { program } from "commander";
import { listAvailableMemory, readAllMemory, readMemoryToFile } from "../src/index.js";

program
	.description('CLI memory dumper for Siemens phones.')
	.option('-p, --port <port>', 'serial port name', '/dev/ttyUSB0')
	.option('-b, --baudrate <baudrate>', 'limit maximum baudrate (0 - use maximum)', '0');

program.command('read')
	.description('Read memory from phone to file.')
	.requiredOption('-a, --addr <address>', 'memory address (0xHEX)')
	.requiredOption('-s, --size <size>', 'memory size (0xHEX or 1M, 128k, 256...)')
	.requiredOption('-o, --output <file>', 'write memory to this file')
	.action(async function () {
		await readMemoryToFile(this.optsWithGlobals());
	});

program.command('read-all')
	.description('Read all available memory regions from phone to dir.')
	.requiredOption('-o, --output <dir>', 'write memory regions to this dir')
	.action(async function () {
		await readAllMemory(this.optsWithGlobals());
	});

program.command('list')
	.description('List available memory regions for dump.')
	.action(async function () {
		await listAvailableMemory(this.optsWithGlobals());
	});

program.showHelpAfterError();
program.parse();
