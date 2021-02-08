# pdfu

PDF resources extraction and analysis toolset 

## Installation

This library is targeted [Node.js](https://nodejs.org/en/download/) environment.

### Installation from sources

```shell script
$ npm install -g node-gyp gulp-cli
$ git clone https://github.com/ndlrf-rnd/pdfu.git
$ cd ./pdfu
$ npm install -g .
$ pdfu
```

Correct result:

> usage: pdfu [-h] [-v] [-f] [-s STEP] [-d] [-o OUTPUT] [-I] [-V] [-S] [-H]
>             [--siphash] [-O] [--optimize-replace] [--md5] [-T] [-r [RENDER]]
>             [-p PAGES]
>             input
> pdfu: error: too few arguments

### Container build

```shell script
$ npm run build:docker
$ docker run -it --mount type=bind,source=$(pwd)/FOLDER_WITH_PDFS,target=/data --mount type=bind,source=$(pwd)/OUTPUT_FOLDER,target=/output pdfu:latest
```

## CLI Interface
 
```shell script
$ pdfu --help
usage: pdfu [-h] [-v] [-f] [-s STEP] [-d] [-o OUTPUT] [-I] [-V] [-S] [-H]
            [--siphash] [-O] [--optimize-replace] [--md5] [-T] [-r [RENDER]]
            [-p PAGES]
            input

pdfu

Positional arguments:
  input                 input .pdf paths or Glob expressions like ./**/*.pdf

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -f, --overwrite, --force
                        force re-create existing files
  -s STEP, --step STEP  max pages in PDF slice
  -d, --debug           debug output
  -o OUTPUT, --output OUTPUT
                        output path
  -I, --no-images       don't export resource images
  -V, --vera            Force enable verapdf reporting if verapdf is installed
  -S, --svg             export to .svg
  -H, --html            Export to .html and .xhtml
  --siphash             Calculate input file siphash
  -O, --optimize        Optimize images
  --optimize-replace    Remove original images after iptimization
  --md5                 Calculate input file md5 checksum
  -T, --text            Export text from pages to .txt
  -r [RENDER], --render [RENDER]
                        Page render size in px in format WxH (e.g. 2048x1536)
  -p PAGES, --pages PAGES, --page PAGES
                        Page ranges and numbers like "4,6,8-10,12,14..16,18,
                        20..23-5" negative numbers using enumeration from
                        tail of total pages count, so for 32 pages PDF -1 is
                        32 and -33 is 1 page
```

## Known problems

In case of low memory try running pdfu in high mem mode (node --max-old-space-size=8192)
 
## Used libraries:
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [veraPDF](https://verapdf.com)

## Used Third-party software:
- [pngcrush](https://pngcrush.com/)
- [veraPDF test corpora](https://github.com/veraPDF/veraPDF-corpus.git)

## License notes

### pdfu

This program is authored by [Ilya Kutukov](https://github.com/mrjj) ([i@leninka.ru](mailto:i@leninka.ru), [post.ilya@gmail.com](mailto:post.ilya@gmail.com)) and distributed under MIT License.

---

The MIT License (MIT)

Copyright (c) 2019 Ilya Kutukov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

### Imagemin

[Imagemin](https://github.com/imagemin/imagemin) library used for image size optimisation and its covered by [MIT License](https://github.com/imagemin/imagemin/blob/master/license).

---

MIT License

Copyright (c) Imagemin (github.com/imagemin)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

© 2019 GitHub, Inc.

---

###  veraPDF-library

The veraPDF PDF/A Validation Library is dual-licensed, see:

 - [GPLv3+](https://raw.githubusercontent.com/veraPDF/veraPDF-library/integration/LICENSE.GPL "GNU General Public License, version 3")
 - [MPLv2+](https://raw.githubusercontent.com/veraPDF/veraPDF-library/integration/LICENSE.MPL "Mozilla Public License, version 2.0")

---

###  veraPDF test corpora

© 2015 [veraPDF Consortium](http://www.verapdf.org "veraPDF Project home page")

Creative Commons License This work is licensed under a Creative Commons Attribution 4.0 International (CC BY 4.0)

## Owl

```
   ◯  .       .        .           .     *     .
 .  .     .      ___---===(OvO)===---___  .      °     *
                  .              
,~^~,   .      .     ◯         .            .      ,~^~^^                
    ~^\$~^~~^#*~-^\_  __ _ _ _ _ ____/*-~^~~^^~^##~^~^
                  = * - _-  =_- . - 
```
