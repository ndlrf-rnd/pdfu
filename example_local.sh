#!/bin/bash

if [[ ! -d ./contrib/veraPDF-corpus ]] ; then
  mkdir -p "./contrib"
  cd "./contrib" || exit
  rm -rf "./veraPDF-corpus"
  git clone https://github.com/veraPDF/veraPDF-corpus.git
  cd "./.."
fi

rm -rf ./output/
mkdir -p ./output/full
node ./src/index.js -s 512x512 $(pwd)/src/__tests__/data $(pwd)/output/full -f -p 1-13

mkdir -p ./output/report
node ./src/index.js  --no-html --no-svg --no-images --no-render $(pwd)/src/__tests__/data $(pwd)/output/report -f -p 1-13
