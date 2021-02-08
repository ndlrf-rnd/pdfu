
####################
# PDF.js
export PDFJS_VERSION=2.2.228
rm -rf ./pdf.js
curl -fsSL https://github.com/mozilla/pdf.js/archive/v${PDFJS_VERSION}.zip | bsdtar -xvf-
cd "./pdf.js-${PDFJS_VERSION}"
  npm install
  gulp dist-install
cd "./.."
rm -rf "./pdf.js-${PDFJS_VERSION}"/.git

####################
# PNGCRUSH
# Original source: https://pmt.sourceforge.io/pngcrush/
rm -rf ./tmp
rm -rf ./pngcrush
mkdir -p ./pngcrush
git clone https://github.com/Kjuly/pngcrush.git
cd ./tmp
  make clean
  make
  chmod +x ./pngcrush
  mv ./tmp/pngcrush ./pngcrush
  rm -rf ./tmp
cd ./..
