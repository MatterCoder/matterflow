# Accept the platform as an argument
ARG TARGETPLATFORM=amd64
ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base-python

# Use the dynamically constructed base image
FROM ${BUILD_FROM} AS base

# Debug: Print the resolved variables
RUN echo "Using base image: ${BUILD_FROM}"

RUN echo "Resolved TARGETPLATFORM: ${TARGETPLATFORM}"

ENV LANG=C.UTF-8

WORKDIR /matterflow

RUN apk add --update --no-cache git && \
    echo "Installing MatterFlow"

RUN git clone https://github.com/MatterCoder/matterflow.git /matterflow && \
    mkdir /matterflow/dist && \
    jq -n --arg commit $(eval cd /matterflow;git rev-parse --short HEAD) '$commit' > /matterflow/dist/.hash ; \
    echo "Installed MatterFlow @ version $(cat /matterflow/dist/.hash)" 

WORKDIR /matterflow/api

# Install build tools and Python dependencies
RUN apk add --update --no-cache npm dumb-init python3 py3-pip python3-dev && \
    /usr/bin/python3.12 --version && \
    /usr/bin/python3.12 -m venv /matterflow/api/venv && \
    /matterflow/api/venv/bin/pip install pipenv && \
    . /matterflow/api/venv/bin/activate && \
    pipenv install --deploy

# Install supervisord:
RUN /matterflow/api/venv/bin/pip install supervisor

# Download the latest python matter server dashboard - note 
# we still require the python matter server to run as a separate docker container
RUN echo "Installing Python Matter Server Dashboard"

# Git clone the python matter server
RUN git clone https://github.com/home-assistant-libs/python-matter-server.git /python-matter-server && \
    mkdir /python-matter-server/dist && \
    jq -n --arg commit $(eval cd /python-matter-server;git rev-parse --short HEAD) '$commit' > /python-matter-server/dist/.hash ; \
    echo "Installed Python-matter-server @ version $(cat /python-matter-server/dist/.hash)"

# Install the python matter server
WORKDIR /python-matter-server
RUN /matterflow/api/venv/bin/pip install python-matter-server

WORKDIR /matterflow/api

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


