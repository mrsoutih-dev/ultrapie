# Quarantine and Asset Scanning Worker for Ultrapie
FROM alpine:3.20

# Install ClamAV daemon and clamscan utility
RUN apk add --no-cache clamav clamav-libunrar ca-certificates

# Setup clamav directories
RUN mkdir -p /var/lib/clamav /var/log/clamav /quarantine \
    && chown -R clamav:clamav /var/lib/clamav /var/log/clamav /quarantine

USER clamav

# Default command performs local definition check
CMD ["clamscan", "--version"]
