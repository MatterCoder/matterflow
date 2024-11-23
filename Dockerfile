# Accept the platform as an argument
ARG TARGETPLATFORM
ARG BUILD_FROM="ghcr.io/home-assistant/${TARGETPLATFORM}-base"

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
RUN apk add --update --no-cache npm dumb-init python3 py3-pip python3-dev gcc musl-dev libffi-dev openssl-dev && \
    python3 --version && \
    python3 -m venv /matterflow/api/venv && \
    /matterflow/api/venv/bin/python -m pip install --upgrade pip setuptools wheel && \
    /matterflow/api/venv/bin/pip install pipenv && \
    . /matterflow/api/venv/bin/activate && \
    pipenv install --deploy

# Install supervisord:
RUN /matterflow/api/venv/bin/pip install supervisor

# Set up not so Secret Key
RUN echo "SECRET_KEY=tmp" > mf/.environment

# Set up the address for the Matter python server websocket
RUN echo "MATTER_SERVER=127.0.0.1" >> mf/.environment

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


