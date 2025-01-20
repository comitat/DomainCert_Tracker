from prometheus_client import start_http_server, Gauge, Counter
import logging

logger = logging.getLogger(__name__)

certificate_validity_days = Gauge('certificate_validity_days', 'Days until the certificate expires', ['hostname'])
invalid_certificates = Counter('invalid_certificates', 'Number of invalid certificates detected')
checked_certificates = Counter('checked_certificates', 'Total number of certificates checked')
expiring_soon_certificates = Gauge('expiring_soon_certificates', 'Number of certificates expiring soon')
last_check_timestamp = Gauge('last_check_timestamp', 'Timestamp of the last certificate check')

def start_metrics_server(METRICS_PORT):
    try:
        logger.info(f"Starting metrics server on port {METRICS_PORT}...")
        start_http_server(METRICS_PORT)
        logger.info(f"Metrics server started on port {METRICS_PORT}")
    except Exception as e:
        logger.error(f"Metrics server error: {e}")
