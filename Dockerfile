# Stage 1: Build Stage
ARG BUILD_FROM="ghcr.io/home-assistant/amd64-base-python"
FROM --platform=$BUILDPLATFORM ${BUILD_FROM} AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

ENV LANG=C.UTF-8

RUN echo "Docker buildx running on $BUILDPLATFORM, building for $TARGETPLATFORM"

# Install build tools
RUN apk add --no-cache git jq cargo npm python3-dev build-base

WORKDIR /matterflow/

# Clone the matterflow repository
RUN git clone https://github.com/MatterCoder/matterflow.git . && \
    mkdir dist && \
    jq -n --arg commit $(git rev-parse --short HEAD) '$commit' > dist/.hash

WORKDIR /matterflow/api

# Create Python venv and install Python dependencies
RUN python3 -m venv venv && \
    if [ "$TARGETPLATFORM" = "linux/arm/v7" ] || [ "$TARGETPLATFORM" = "linux/arm64" ] || [ "$TARGETPLATFORM" = "linux/arm/v6" ]; then \
        venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r requirements.txt; \
    else \
        venv/bin/pip install --no-cache-dir -r requirements.txt; \
    fi && \
    venv/bin/pip install supervisor

# Clone and install python-matter-server
RUN git clone https://github.com/home-assistant-libs/python-matter-server.git /python-matter-server && \
    mkdir /python-matter-server/dist && \
    jq -n --arg commit $(cd /python-matter-server; git rev-parse --short HEAD) '$commit' > /python-matter-server/dist/.hash && \
    /matterflow/api/venv/bin/pip install /python-matter-server

# Install web front-end dependencies and build assets
WORKDIR /matterflow/web
RUN npm ci && npm run build

# Stage 2: Runtime Stage
FROM --platform=$BUILDPLATFORM ${BUILD_FROM} AS runtime

WORKDIR /matterflow

# Copy necessary files from build stage
COPY --from=build /matterflow /matterflow
COPY --from=build /python-matter-server /python-matter-server

# Install runtime dependencies only
RUN apk add --no-cache dumb-init nodejs npm 

# Set environment variables and permissions
WORKDIR /matterflow/api
RUN echo "SECRET_KEY=tmp" > mf/.environment && \
    echo "DIR_PATH='/data'" >> mf/.environment

# Copy run script and make it executable
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
