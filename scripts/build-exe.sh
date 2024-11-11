#!/bin/bash
set -e
set -x
cd "$(dirname $0)/../"
rm -f *.exe *.exe.zip
npx -y esbuild bin/siemens-memory-dumper.js \
	--bundle \
	--outfile=./siemens-memory-dumper.js \
	--format=cjs \
	--platform=node \
	--loader:.node=file \
	--external:@serialport/bindings-cpp
sed -i 's/@serialport\/bindings-cpp/@sie-js\/node-serialport-bindings-cpp/g' ./siemens-memory-dumper.js
npx -y pkg -c ./pkg.json ./siemens-memory-dumper.js
