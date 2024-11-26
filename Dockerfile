# Accept platform as an argument
ARG TARGETPLATFORM="linux/arm/v7"

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
    git checkout pip_not_pipenv && \
    mkdir /matterflow/dist && \
    jq -n --arg commit $(eval cd /matterflow;git rev-parse --short HEAD) '$commit' > /matterflow/dist/.hash ; \
    echo "Installed MatterFlow @ version $(cat /matterflow/dist/.hash)" 

WORKDIR /matterflow/api

# Install build tools and create venv
RUN echo "Installing build tools and create venv" 
RUN apk add --update npm dumb-init git python3 py3-pip python3-dev && \
    /usr/bin/python3.12 --version && \
    /usr/bin/python3.12 -m venv /matterflow/api/venv

# Install precompiled Python dependencies
RUN echo "Install precompiled Python dependencies" 
RUN /matterflow/api/venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir numpy pandas cryptography && \
    /matterflow/api/venv/bin/pip show numpy pandas cryptography

# Install all other Python dependencies
RUN echo "Install Python dependencies" 
RUN /matterflow/api/venv/bin/pip install -r requirements-nodev.txt