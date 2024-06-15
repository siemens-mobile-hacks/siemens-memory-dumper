import fs from 'fs';
import "chalk";
import { table as asciiTable } from 'table';
import { CGSN, serialWaitForOpen } from "@sie-js/serial";
import cliProgress from "cli-progress";
import { SerialPort } from "serialport";
import { sprintf } from "sprintf-js";

export async function readMemoryToFile(argv) {
	let addr = argv.addr != null ? parseAddr(argv.addr) : 0;
	let size = argv.size != null ? parseSize(argv.size) : 0;
	let name;
	let outputFile;
	let baudrate = parseInt(argv.baudrate, 10);

	let [cgsn, port] = await cgsnConnect(argv.port, baudrate);
	if (!cgsn)
		return;

	let info = await getPhoneInfo(cgsn);
	if (!info) {
		console.error(`Can't get phone information!`);
		await cgsnClose(cgsn, port);
		return;
	}

	if (argv.name) {
		let region = getMemoryRegionByName(info.memoryRegions, argv.name);
		if (!region) {
			console.error(`Memory region ${argv.name} not found.`);
			await cgsnClose(cgsn, port);
			return;
		}
		addr = region.addr;
		size = region.size;
		name = region.name;
	} else {
		let region = getMemoryRegionByAddrAndSize(info.memoryRegions, size);
		if (region)
			name = region.name;
	}

	let genericName = `${info.phoneModel}v${info.phoneSwVersion}${name ? '-' + name : ''}-${sprintf("%08X_%08X", addr, size)}.bin`;
	if (!argv.output) {
		outputFile = `./${genericName}`;
	} else if (fs.existsSync(argv.output) && fs.lstatSync(argv.output).isDirectory()) {
		outputFile = `${argv.output}/${genericName}`;
	} else  {
		outputFile = argv.output;
	}

	fs.writeFileSync(outputFile, "");

	console.log(sprintf("Reading memory %08X ... %08X (%s)", addr, addr + size - 1, formatSize(size)));
	console.log();

	let pb = new cliProgress.SingleBar({
		format: ' [{bar}] {percentage}% | ETA: {eta}s | {speed} kB/s'
	}, cliProgress.Presets.legacy);
	pb.start(size, 0);

	let result = await cgsn.readMemory(addr, size, {
		onProgress: (cursor, total, elapsed) => pb.update(cursor, {
			speed: elapsed ? +((cursor / (elapsed / 1000)) / 1024).toFixed(2) : 'N/A',
		})
	});
	pb.stop();

	fs.writeFileSync(outputFile, result.buffer);

	console.log();
	console.log(`File saved to: ${outputFile}`);

	await cgsnClose(cgsn, port);
}

export async function readAllMemory(argv) {
	let baudrate = parseInt(argv.baudrate, 10);

	if (!argv.output)
		argv.output = ".";

	if (!fs.existsSync(argv.output)) {
		try {
			fs.mkdirSync(argv.output, true);
		} catch (e) {
			console.error(e.message);
			console.error(`Output dir not found: ${argv.output}`);
			return;
		}
	}

	let [cgsn, port] = await cgsnConnect(argv.port, baudrate);
	if (!cgsn)
		return;

	let info = await getPhoneInfo(cgsn);
	if (!info) {
		console.error(`Can't get phone information!`);
		await cgsnClose(cgsn, port);
		return;
	}

	console.log();

	let totalSize = 0;
	for (let r of info.memoryRegions) {
		totalSize += r.size;
	}

	let pb = new cliProgress.SingleBar({
		format: ' [{bar}] {percentage}% | ETA: {totalEta}s | {speed} kB/s'
	}, cliProgress.Presets.legacy);

	let i = 1;
	let totalRead = 0;
	for (let r of info.memoryRegions) {
		console.log(sprintf("[%d/%d] Reading %s %08X ... %08X (%s)", i, info.memoryRegions.length, r.name, r.addr, r.addr + r.size - 1, formatSize(r.size)));

		pb.start(r.size, 0);

		let result = await cgsn.readMemory(r.addr, r.size, {
			onProgress(cursor, total, elapsed) {
				let speed = elapsed ? cursor / (elapsed / 1000) : 0;
				pb.update(cursor, {
					speed: speed ? +(speed / 1024).toFixed(2) : 'N/A',
					filename: r.name,
					fileIndex: i,
					totalFiles: info.memoryRegions.length,
					totalEta: speed ? Math.round((totalSize - (totalRead + cursor)) / speed) : 0,
				});
			}
		});
		totalRead += r.size;
		i++;

		if (!result.success) {
			console.error(`Error: ${result.error}`);
			break;
		}

		let outputFile = `${argv.output}/${info.phoneModel}v${info.phoneSwVersion}-${r.name}-${sprintf("%08X_%08X", r.addr, r.size)}.bin`;
		fs.writeFileSync(outputFile, result.buffer);

		pb.stop();
		console.log(`File saved to: ${outputFile}`);
		console.log();
	}

	await cgsnClose(cgsn, port);
}

export async function listAvailableMemory(argv) {
	let baudrate = parseInt(argv.baudrate, 10);
	let [cgsn, port] = await cgsnConnect(argv.port, baudrate);
	if (!cgsn)
		return;

	let info = await getPhoneInfo(cgsn);
	if (!info) {
		console.error(`Can't get phone information!`);
		await cgsnClose(cgsn, port);
		return;
	}

	let table = [
		['Name', 'Address', 'Size', 'Description'],
	];
	for (let r of info.memoryRegions) {
		table.push([
			r.name,
			sprintf("0x%08X", r.addr),
			sprintf("0x%08X (%s)", r.size, formatSize(r.size)),
			r.descr,
		]);
	}

	console.log(asciiTable(table));

	await cgsnClose(cgsn, port);
}

function getMemoryRegionByName(regions, name) {
	for (let r of regions) {
		if (r.name.toLowerCase() == name.toLowerCase())
			return r;
	}
	return null;
}

function getMemoryRegionByAddrAndSize(regions, addr, size) {
	for (let r of regions) {
		if (r.addr == addr && r.size == size)
			return r;
	}
	return null;
}

async function getPhoneInfo(cgsn) {
	let atc = cgsn.getAtChannel();

	let phoneModel;
	let phoneVendor;
	let phoneSwVersion;
	let phoneImei;

	let response;
	response = await atc.sendCommand("AT+CGSN");
	if (!response.success)
		return null;
	phoneImei = response.lines[0];

	response = await atc.sendCommand("AT+CGMI");
	if (!response.success)
		return null;
	phoneVendor = response.lines[0];

	response = await atc.sendCommand("AT+CGMM");
	if (!response.success)
		return null;
	phoneModel = response.lines[0];

	response = await atc.sendCommand("AT+CGMR");
	if (!response.success)
		return null;
	phoneSwVersion = response.lines[0];

	console.log(`Detected phone ${phoneVendor} ${phoneModel}v${phoneSwVersion}`);

	let memoryRegions = [
		{
			name:	"BROM",
			addr:	0x00400000,
			size:	0x00008000,
			descr:	'Built-in 1st stage bootloader firmware.',
		}, {
			name:	"TCM",
			addr:	0x00000000,
			size:	0x00004000,
			descr:	'Built-in memory in the CPU, used for IRQ handlers.',
		}, {
			name:	"SRAM",
			addr:	0x00080000,
			size:	0x00018000,
			descr:	'Built-in memory in the CPU.',
		}
	];

	if (phoneModel.match(/^(E71|EL71|M72|CL61)(F|C|)$/i)) {
		memoryRegions.push({
			name:	"RAM",
			addr:	0xA8000000,
			size:	0x01000000,
			descr:	'External RAM.',
		});
		memoryRegions.push({
			name:	"VMALLOC1",
			addr:	0xAC000000,
			size:	0x01000000,
			descr:	'Virtual memory for malloc().',
		});
		memoryRegions.push({
			name:	"VMALLOC2",
			addr:	0xAD000000,
			size:	0x00800000,
			descr:	'Virtual memory for malloc().',
		});
	} else if (phoneModel.match(/^(C81|M81|S68)(F|C|)$/i)) {
		memoryRegions.push({
			name:	"RAM",
			addr:	0xA8000000,
			size:	0x01000000,
			descr:	'External RAM.',
		});
		memoryRegions.push({
			name:	"VMALLOC1",
			addr:	0xAC000000,
			size:	0x00E00000,
			descr:	'Virtual memory for malloc().',
		});
	} else if (phoneModel.match(/^(S75|SL75|CX75|M75|SK65)(F|C|)$/i)) {
		memoryRegions.push({
			name:	"RAM",
			addr:	0xA8000000,
			size:	0x01000000,
			descr:	'External RAM.',
		});
	} else if (phoneModel.match(/^(CX70|C65|CX65|M65|S65|SL65|ME75|CF75|C75|C72)(F|C|)$/i)) {
		memoryRegions.push({
			name:	"RAM",
			addr:	0xA8000000,
			size:	0x00800000,
			descr:	'External RAM.',
		});
	} else {
		console.error(`Detected unknown phone! Memory regions maybe incorret.`);
		memoryRegions.push({
			name:	"RAM",
			addr:	0xA8000000,
			size:	0x00800000,
			descr:	'External RAM.',
		});
	}

	return { phoneVendor, phoneModel, phoneSwVersion, phoneImei, memoryRegions };
}

async function cgsnConnect(portName, limitBaudrate) {
	let port = await serialWaitForOpen(new SerialPort({ path: portName, baudRate: 115200 }));
	let cgsn = new CGSN(port);

	console.info(`Connecting to phone using port ${portName}...`);
	if (await cgsn.connect()) {
		await cgsn.setBestBaudrate(limitBaudrate);

		console.info(`Connected using ${port.baudRate} baudrate.`);
		return [cgsn, port];
	} else {
		console.error('Phone not found or CGSN patch is not installed.');
		await cgsnClose(cgsn, port);
		return [null, null];
	}
}

async function cgsnClose(cgsn, port) {
	await cgsn.disconnect();
	cgsn.destroy();
	port.close();
}

function parseAddr(value) {
	let m;
	if ((m = value.match(/^(?:0x)?([a-f0-9]+)$/i))) {
		return parseInt(m[1], 16);
	} else {
		throw new Error(`Invalid address: ${value}`);
	}
}

function parseSize(value) {
	let m;
	if ((m = value.match(/^(\d+)M$/i))) {
		return m[1] * 1024 * 1024;
	} else if ((m = value.match(/^(\d+)k$/i))) {
		return m[1] * 1024;
	} else if ((m = value.match(/^(?:0x|0)([0-9a-f]+)$/i))) {
		return parseInt(m[1], 16);
	} else if ((m = value.match(/^(\d+)$/i))) {
		return +m[1];
	} else {
		throw new Error(`Invalid size: ${value}`);
	}
}

function formatSize(size) {
	if (size > 1024 * 1024) {
		return +(size / 1024 / 1024).toFixed(2) + " Mb";
	} else {
		return +(size / 1024).toFixed(2) + " kB";
	}
}
