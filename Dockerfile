# Accept platform as an argument
ARG TARGETPLATFORM="linux/arm/v7"

# Allow overriding of the base image
ARG BUILD_FROM="python:3.11-alpine"

# Stage 1: Use the specified base image
FROM --platform=${TARGETPLATFORM} ${BUILD_FROM} AS base

RUN apk add --update --no-cache git jq && \
    echo "Installing MatterFlow"

WORKDIR /matterflow

RUN git clone https://github.com/MatterCoder/matterflow.git . && \
    git checkout pip_not_pipenv && \
    mkdir dist && \
    jq -n --arg commit $(eval git rev-parse --short HEAD) '$commit' > dist/.hash && \
    echo "Installed MatterFlow @ version $(cat dist/.hash)" 

WORKDIR /matterflow/api

# Create venv and install Python dependencies
RUN python3 -m venv venv && \
    venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir numpy pandas cryptography


# Verify Python dependencies
RUN /matterflow/api/venv/bin/pip show numpy pandas cryptography

# Debugging
RUN echo "Using base image: ${BUILD_FROM}" && \
    echo "TARGETPLATFORM: ${TARGETPLATFORM}"

ENV LANG=C.UTF-8

# Install build tools and create venv
RUN echo "Installing node and npm" 
RUN apk add --update npm dumb-init 

# Install all other non dev Python dependencies
RUN echo "Install Python dependencies" 
RUN /matterflow/api/venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r requirements-nodev.txt