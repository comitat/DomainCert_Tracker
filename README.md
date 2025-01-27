# DomainCert Tracker

DomainCert Tracker is a URL SSL certificate monitoring and verification tool that automatically extracts information about certificate expiration dates and status, keeping your websites secure.

## Features  
- Add URLs to monitor.
- View certificate validity and expiration details.
- Monitor SSL certificate expiration dates and alert when certificates are invalid or expired.
- Expose Prometheus metrics for monitoring.

## Setup  
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```  
2. Run the application:
   ```
   python app/main.py
   ```
  
## Metrics
  
### DomainCert Tracker exposes two Prometheus metrics:  
- certificate_validity_days: The number of days left until the certificate expires for each monitored URL.  
- invalid_certificates: The counter for the number of invalid certificates detected.  
Metrics are available at the specified METRICS_PORT (default: 8899).  

To monitor these metrics with Prometheus, ensure your Prometheus instance is configured to scrape from this application.  
  
Default path http://127.0.0.1:8899/metrics
  
### Configuration    
You can configure the following environment variables:  
- METRICS_PORT: Port to expose Prometheus metrics (default: 8899).  
- FLASK_PORT: Port for the Flask application (default: 5000).  
  
## Endpoints  
- /add_url: Add a URL to monitor (POST request).  
- /delete_url: Delete a URL from monitoring (POST request).  
- /get_urls: Get the list of all monitored URLs (GET request).  
- /delete_all_urls: Delete all URLs (POST request).  

## API Documentation

The API documentation is available via Swagger UI. You can access it at the following URL:

Swagger API Docs - http://127.0.0.1:5000/apidocs

This provides an interactive interface to explore and test the available endpoints.
