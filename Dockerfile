ARG BASE_CONTAINER=centos:7.6.1810
FROM ${BASE_CONTAINER}

LABEL maintainer="Ilya Kutukov <i@leninka.ru>"
LABEL org="https://rusneb.ru"
LABEL repo="https://github.com/ndlrf-rnd/pdfu"
LABEL description="PDF extraction and validation utilities"

ENV CONTAINER docker
ARG NODE_VERSION=10.16.3
ENV NODE_VERSION=${NODE_VERSION}

ENV VERAPDF_MAJOR_VERSION=1.14
ENV VERAPDF_VERSION=${VERAPDF_MAJOR_VERSION}.2

ARG JDK8_MAJOR_VERSION=2.2.228

ARG PDFJS_VERSION=2.2.228
ENV PDFJS_VERSION=${PDFJS_VERSION}

ARG JDK8_MAJOR_VERSION=1.8.0
ARG JDK8_VERSION_DETAIL=${JDK8_MAJOR_VERSION}.212.b04

ARG JDK11_MAJOR_VERSION="11"
ARG JDK11_VERSION_DETAIL="${JDK11_MAJOR_VERSION}.0.2.7"

RUN groupadd -r node --gid=1000 && \
    useradd -r -g node --uid=1000 node

# Some packages are required for node-canvas
# https://github.com/Automattic/node-canvas#installation
# $ sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

RUN rpm --import http://mirror.centos.org/centos/RPM-GPG-KEY-CentOS-5 && \
    yum update -y && \
    yum install -y \
      sudo \
      g++ \
      wget \
      git \
      make \
      unzip \
      bsdtar \
      java-1.8.0-openjdk \
      gcc-c++ \
      cairo-devel \
      pango-devel \
      libjpeg-turbo-devel \
      giflib-devel \
      tree \
      dos2unix \
      && \
    yum clean all && \
    rm -rf /var/cache/yum

# Install Node.js
COPY ./dockerscripts/setup_12.x /tmp/setup_12.x

RUN dos2unix /tmp/setup_12.x && \
    sh /tmp/setup_12.x && \
    yum update -y && \
    yum install -y \
      nodejs \
      && \
    yum clean all && \
    rm -rf /var/cache/yum && \
    rm -rf /tmp/setup_12.x

ENV JAVA_HOME /usr/lib/jvm/jre-1.8.0-openjdk/
ENV NODE_HOME /home/node/


# Install veraPDF
COPY ./dockerscripts/verapdf-auto-install.xml /tmp/verapdf-auto-install.xml

RUN dos2unix /tmp/verapdf-auto-install.xml && \
    mkdir -p /home/node/ && \
    cd /tmp/ && \
    wget -q https://software.verapdf.org/releases/${VERAPDF_MAJOR_VERSION}/verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip && \
    unzip ./verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip && \
    rm -rf ./verapdf-pdfbox-${VERAPDF_VERSION}-installer.zip && \
    cd /tmp/verapdf-pdfbox-${VERAPDF_VERSION}/ && \
    java -jar ./verapdf-izpack-pdfbox-installer-${VERAPDF_VERSION}.jar /tmp/verapdf-auto-install.xml && \
    rm -rf /tmp/verapdf-auto-install.xml && \
    rm -rf /tmp/verapdf-pdfbox-${VERAPDF_VERSION}
ENV VERA_PDF="/usr/local/opt/verapdf"

# Install pngcrush
# Original source: https://pmt.sourceforge.io/pngcrush/
RUN mkdir -p /home/node/contrib/ && \
    git clone https://github.com/Kjuly/pngcrush.git /tmp/pngcrush && \
    cd /tmp/pngcrush/pngcrush && \
    make clean && \
    make && \
    mv /tmp/pngcrush/pngcrush/pngcrush /home/node/contrib/ && \
    rm -rf /tmp/pngcrush && \
    chown -R node:node /home/node/contrib/ && \
    chown -R node:node /usr/lib/node_modules/ && \
    chmod +x /home/node/contrib/pngcrush
ENV PNGCRUSH="/home/node/contrib/pngcrush"

RUN npm install -g npm && \
    npm install -g \
      node-gyp \
      gulp-cli \
      webpack \
      webpack-cli \
    && \
    npm install --build-from-source canvas && \
    npm cache clean --force && \
    chown -R node:node /home/node/ && \
    chown -R node:node /usr/bin/

COPY /*.* /home/node/pdfu/
COPY /src/ /home/node/pdfu/src/
COPY /bin/ /home/node/pdfu/bin/
COPY /dockerscripts/ /home/node/dockerscripts/

RUN find /home/node -name '*.js' -or -name '*.sh' -or -name '*.json' -exec dos2unix {} \; && \
    mkdir /data && \
    chown node:node /data/ && \
    mkdir /tmp/cache && \
    chown node:node /tmp/cache/ && \
    mkdir /output/ && \
    chown node:node /output/ && \
    chown -R node:node /home/node/pdfu/

USER node

RUN cd /home/node/pdfu/ && \
    npm install && \
    npm cache clean --force

WORKDIR /home/node
VOLUME /data/
VOLUME /tmp/cache/

ENTRYPOINT ["/home/node/dockerscripts/entrypoint.sh"]
