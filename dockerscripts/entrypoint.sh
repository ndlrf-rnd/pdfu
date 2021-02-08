#!/bin/bash
set -e

echo "-------------"
echo "Data folder content $(find /data/ -name '*.pdf' | wc -l/) files:"
find /data/ -name '*.pdf' -exec ls -lF {} \;
echo "-------------"

cd "/home/node/pdfu/"
echo "Files to process: $(find /data/ -name '*.pdf' | wc -l)"
find /data/ -name '*.pdf' -exec ./bin/pdfu {} \;
