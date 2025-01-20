import psutil
import time
import logging
from prometheus_client import Gauge

logger = logging.getLogger(__name__)

memory_usage = Gauge('memory_usage', 'Memory usage in MB')
cpu_usage = Gauge('cpu_usage', 'CPU usage percentage')

def monitor_system():
    while True:
        try:
            memory_usage.set(psutil.virtual_memory().used / (1024 * 1024))
            cpu_usage.set(psutil.cpu_percent(interval=1))
            time.sleep(5)
        except Exception as e:
            logger.error(f"Error monitoring system resources: {str(e)}")
