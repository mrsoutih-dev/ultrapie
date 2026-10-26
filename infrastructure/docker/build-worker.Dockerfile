# Hardened Disposable Build Worker for Ultrapie
FROM node:20-alpine

# Security: Install git and essential build tools, then drop privileges
RUN apk add --no-cache git bash python3 make g++ \
    && addgroup -S appbuild && adduser -S appbuild -G appbuild

WORKDIR /workspace

# Run as non-root unprivileged user
USER appbuild

# Set restricted environment
ENV NODE_ENV=production
ENV CI=true

# Entrypoint script will clone repo / unpack source and run framework-specific build
CMD ["node", "-v"]
