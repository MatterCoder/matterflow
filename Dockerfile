# Allow overriding of the base image
ARG BUILD_FROM="ghcr.io/home-assistant/amd64-base-python"

FROM --platform=$BUILDPLATFORM ${BUILD_FROM} AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM
# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

RUN echo "Docker buildx running on $BUILDPLATFORM, building for $TARGETPLATFORM"

ENV LANG=C.UTF-8

# Install build tools and create venv
RUN echo "Installing Build tools" 
RUN apk add --update --no-cache git jq cargo npm dumb-init && \
    echo "Installing MatterFlow"

WORKDIR /matterflow/

# Clone the matterflow repository
RUN git clone https://github.com/MatterCoder/matterflow.git . && \
    mkdir dist && \
    jq -n --arg commit $(eval git rev-parse --short HEAD) '$commit' > dist/.hash && \
    echo "Installed MatterFlow @ version $(cat dist/.hash)" 

WORKDIR /matterflow/api

# Create venv and install Python dependencies
RUN echo "Creating Python venv" && \
    python3 -m venv venv

# Debug TARGETPLATFORM
RUN echo "Target platform is $TARGETPLATFORM"

# Conditional installation based on TARGETPLATFORM
RUN echo "Conditionally Install Python dependencies" && \ 
    if [ "$TARGETPLATFORM" = "linux/arm/v7" ] || [ "$TARGETPLATFORM" = "linux/arm64" ] || [ "$TARGETPLATFORM" = "linux/arm/v6" ]; then \ 
        venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r requirements.txt; \
    else \
        venv/bin/pip install --no-cache-dir -r requirements.txt; \
    fi

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
RUN npm ci
RUN npm run build

# Copy data for add-on
WORKDIR /matterflow/
COPY run.sh /
RUN chmod +x /run.sh

CMD ["/run.sh"]

# Labels
LABEL \
    io.hass.name="${BUILD_NAME}" \
    io.hass.description="${BUILD_DESCRIPTION}" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="Home Assistant Community Add-ons" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}
    