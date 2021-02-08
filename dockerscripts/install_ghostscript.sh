cd "/tmp/"
wget  https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs950/ghostscript-9.50-linux-x86_64.tgz
gunzip -c ghostscript-9.50-linux-x86_64.tgz | tar -xvf -
mv /tmp/ghostscript-9.50-linux-x86_64/gs-950-linux-x86_64  /usr/local/bin/gs
rm -rf /tmp/ghostscript*
