# Accept platform as an argument
ARG TARGETPLATFORM="linux/amd64"

# Allow overriding of the base image
ARG BUILD_FROM="ghcr.io/home-assistant/amd64-base-python"

# Dynamically set the base image based on TARGETPLATFORM
FROM ${BUILD_FROM} AS base

# Debugging
RUN echo "Using base image: ${BUILD_FROM}" && \
    echo "TARGETPLATFORM: ${TARGETPLATFORM}"

ENV LANG=C.UTF-8

WORKDIR /matterflow

RUN apk add --update --no-cache git && \
    echo "Installing MatterFlow"

RUN git clone https://github.com/MatterCoder/matterflow.git /matterflow && \
    mkdir /matterflow/dist && \
    jq -n --arg commit $(eval cd /matterflow;git rev-parse --short HEAD) '$commit' > /matterflow/dist/.hash ; \
    echo "Installed MatterFlow @ version $(cat /matterflow/dist/.hash)" 

WORKDIR /matterflow/api

# Disable fortify during build (if required)
ENV CFLAGS="-D_FORTIFY_SOURCE=0"

# Install build tools and Python dependencies
RUN apk add --update npm dumb-init git python3 py3-pip python3-dev build-base g++ meson ninja libffi-dev cargo musl-dev libc-dev openssl openssl-dev && \
    /usr/bin/python3.12 --version && \
    /usr/bin/python3.12 -m venv /matterflow/api/venv && \
    /matterflow/api/venv/bin/pip install pipenv

# Conditional installation based on TARGETPLATFORM
#RUN if [ "${TARGETPLATFORM}" = "linux/arm/v7" ] ; then \ 
#    /matterflow/api/venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir wheel && \
#    /matterflow/api/venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir numpy pandas cryptography; \
#    fi

# Now install our python dependencies 
RUN . /matterflow/api/venv/bin/activate && \
    pipenv install --verbose && \
    find /matterflow/api -type d -name '__pycache__' -exec rm -r {} + && \
    find /matterflow/api -name '*.pyc' -delete && \
    rm -rf /matterflow/api/venv/lib/python*/site-packages/*.egg-info

RUN rm -rf /root/.cache/pip /usr/local/lib/python*/dist-packages/*.egg-info /usr/local/lib/python*/site-packages/*.egg-info

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

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

# Verify Node.js and npm installation
RUN node --version && npm --version

# Install Web front end
WORKDIR /matterflow/web

RUN npm install
RUN npm run build

# Copy data for add-on
COPY run.sh .
RUN chmod +x run.sh

CMD ["./run.sh"]


