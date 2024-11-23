# Accept the platform as an argument
ARG TARGETPLATFORM
ARG BUILD_FROM="ghcr.io/home-assistant/${TARGETPLATFORM}-base:3.15"

# Use the dynamically constructed base image
FROM ${BUILD_FROM} AS base

# Debug: Print the resolved variables
RUN echo "Using base image: ${BUILD_FROM}"

RUN echo "Resolved TARGETPLATFORM: ${TARGETPLATFORM}"

ENV LANG C.UTF-8

RUN echo "Installing Python 3.12"

# Install Python 3.12 from source
RUN apk add --no-cache \
        gcc \
        musl-dev \
        libffi-dev \
        openssl-dev \
        zlib-dev \
        bzip2-dev \
        xz-dev \
        sqlite-dev \
        readline-dev \
        make && \
    wget https://www.python.org/ftp/python/3.12.0/Python-3.12.0.tgz && \
    tar xzf Python-3.12.0.tgz && \
    cd Python-3.12.0 && \
    ./configure --enable-optimizations && \
    make -j$(nproc) && \
    make altinstall && \
    cd .. && \
    rm -rf Python-3.12.0 Python-3.12.0.tgz

# Set Python 3.12 as default
RUN python3.12 --version && ln -sf /usr/local/bin/python3.12 /usr/bin/python3

WORKDIR /matterflow

RUN apk add --update --no-cache git && \
    echo "Installing MatterFlow"

RUN git clone https://github.com/MatterCoder/matterflow.git /matterflow && \
    mkdir /matterflow/dist && \
    jq -n --arg commit $(eval cd /matterflow;git rev-parse --short HEAD) '$commit' > /matterflow/dist/.hash ; \
    echo "Installed MatterFlow @ version $(cat /matterflow/dist/.hash)" 

WORKDIR /matterflow/api

# Install build tools and Python dependencies
RUN apk add --update --no-cache npm dumb-init python3 py3-pip python3-dev python3 py3-pip python3-dev gcc musl-dev libffi-dev openssl-dev && \
    python3 --version && \
    python3 -m venv /matterflow/api/venv && \
    /matterflow/api/venv/bin/python -m pip install --upgrade pip setuptools wheel && \
    /matterflow/api/venv/bin/pip install pipenv && \
    /matterflow/api/venv/bin/pipenv install --deploy

# Install supervisord:
RUN /matterflow/api/venv/bin/pip install supervisor

# Download the latest python matter server
RUN echo "Installing Python Matter Server"

# Git clone the python matter server
RUN git clone https://github.com/home-assistant-libs/python-matter-server.git /python-matter-server && \
    mkdir /python-matter-server/dist && \
    jq -n --arg commit $(eval cd /python-matter-server;git rev-parse --short HEAD) '$commit' > /python-matter-server/dist/.hash ; \
    echo "Installed Python-matter-server @ version $(cat /python-matter-server/dist/.hash)"

# Install the python matter server
RUN /matterflow/api/venv/bin/pip install python-matter-server

# Set up not so Secret Key
RUN echo "SECRET_KEY=tmp" > mf/.environment

# Set up the address for the Matter python server websocket
RUN echo "MATTER_SERVER=localhost" >> mf/.environment

# Set up the path for the sqlite3 db to be the tmp which we have mapped to /config 
RUN echo "DB_DIR_PATH='/tmp'" >> mf/.environment

# Install Web front end
WORKDIR /matterflow/web

RUN npm install
RUN npm run build

# Copy data for add-on
COPY run.sh .
RUN chmod +x run.sh

CMD ["./run.sh"]


