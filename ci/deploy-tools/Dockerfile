FROM docker.arvancloud.ir/alpine:3.20
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache openssh-client bash coreutils
