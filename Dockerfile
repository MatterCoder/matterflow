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
RUN apk add --update npm dumb-init git python3 py3-pip python3-dev && \
    /usr/bin/python3.12 --version && \
    /usr/bin/python3.12 -m venv /matterflow/api/venv && \
    /matterflow/api/venv/bin/pip install pipenv

# Install wheel
RUN /matterflow/api/venv/bin/pip install wheel

# Explicitly install dependencies that require compilation 
RUN /matterflow/api/venv/bin/pip install numpy pandas cryptography --only-binary=:all:

# Now install our python dependencies 
RUN . /matterflow/api/venv/bin/activate && \
    pipenv install --verbose && \
    find /matterflow/api -type d -name '__pycache__' -exec rm -r {} + && \
    find /matterflow/api -name '*.pyc' -delete && \
    rm -rf /matterflow/api/venv/lib/python*/site-packages/*.egg-info

RUN rm -rf /root/.cache/pip /usr/local/lib/python*/dist-packages/*.egg-info /usr/local/lib/python*/site-packages/*.egg-info



