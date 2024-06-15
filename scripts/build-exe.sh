#!/bin/bash
set -e
set -x
cd "$(dirname $0)/../"
rm -f *.exe *.exe.zip
npx -y esbuild bin/siemens-memory-dumper.js --bundle --outfile=./siemens-memory-dumper.js --format=cjs --platform=node --loader:.node=file --external:@serialport/bindings-cpp
npx -y pkg -c ./pkg.json ./siemens-memory-dumper.js
zip siemens-memory-dumper.exe.zip siemens-memory-dumper.exe
