# Accept platform as an argument
ARG TARGETPLATFORM="linux/arm/v7"

# Allow overriding of the base image
ARG BUILD_FROM="python:3.11-alpine"

# Stage 1: Use the specified base image
FROM --platform=${TARGETPLATFORM} ${BUILD_FROM} AS base

# Debugging
RUN echo "Using base image: ${BUILD_FROM}" && \
    echo "TARGETPLATFORM: ${TARGETPLATFORM}"

ENV LANG=C.UTF-8

# Install build tools and create venv
RUN echo "Installing Build tools" 
RUN apk add --update --no-cache git jq cargo npm dumb-init && \
    echo "Installing MatterFlow"

# Clone the matterflow repository
RUN git clone https://github.com/MatterCoder/matterflow.git /matterflow && \
    git checkout pip_not_pipenv && \
    mkdir dist && \
    jq -n --arg commit $(eval git rev-parse --short HEAD) '$commit' > dist/.hash && \
    echo "Installed MatterFlow @ version $(cat dist/.hash)" 

WORKDIR /matterflow/api

# Create venv and install Python dependencies
RUN echo "Install Python dependencies" 

RUN python3 -m venv venv

# Conditional installation based on TARGETPLATFORM
RUN if [ "${TARGETPLATFORM}" = "linux/arm/v7" ] ; then \ 
        venv/bin/pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r requirements.txt; \
    else \
        venv/bin/pip install --no-cache-dir -r requirements.txt; \
    fi
    

# Verify Python dependencies
RUN /matterflow/api/venv/bin/pip show numpy pandas cryptography


