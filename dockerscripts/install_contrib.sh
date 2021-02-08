#!/bin/bash

BASE_DIR="$(pwd)"
CONTRIB_DIR="${BASE_DIR}/contrib"
# veraPDF
export VERAPDF_MAJOR_VERSION="1.14"
export VERAPDF_VERSION="${VERAPDF_MAJOR_VERSION}.2"

mkdir -p "${CONTRIB_DIR}"
# shellcheck disable=SC2164
cd "${CONTRIB_DIR}"
if [[ ! -f "${CONTRIB_DIR}/verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip" ]]; then
  wget "https://software.verapdf.org/releases/${VERAPDF_MAJOR_VERSION}/verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip"
  unzip "${CONTRIB_DIR}/verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip"
fi
# shellcheck disable=SC2164
cd "${CONTRIB_DIR}/verapdf-pdfbox-${VERAPDF_VERSION}/"
rm -rf "${CONTRIB_DIR}/verapdf-auto-install.xml"
cp -f "${BASE_DIR}/dockerscripts/verapdf-auto-install.xml" "./verapdf-auto-install.xml"
rm -rf "/usr/local/opt/verapdf"
java -jar ./verapdf-izpack-pdfbox-installer-${VERAPDF_VERSION}.jar "verapdf-auto-install.xml"
# shellcheck disable=SC2164
cd "${BASE_DIR}"

# Install veraPDF from sources
#RUN git clone https://github.com/veraPDF/verapdf-apps.git && \
#    cd ./verapdf-apps && \
#    git checkout master && \
#    echo "Runnin maven installer" && \
#    mvn -q clean install && \
#    ls -lth && \
#    cd ./..

# SipHash
#RUN git clone https://github.com/whitfin/siphash-cpp.git /tmp/siphash-cpp/ && \
#    cd /tmp/siphash-cpp/ && \
#    make install && \
#    rm -rf /tmp/siphash-cpp/
