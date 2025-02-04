import ssl
import socket
from datetime import datetime
from flask import jsonify
import logging

logger = logging.getLogger(__name__)

def get_cert_info(hostname):
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

                valid_from = datetime.strptime(cert['notBefore'], "%b %d %H:%M:%S %Y %Z")
                valid_to = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")

                return {
                    "valid_from": valid_from,
                    "valid_to": valid_to,
                    "issuer": dict(x[0] for x in cert['issuer']),
                    "subject": dict(x[0] for x in cert['subject'])
                }
    except Exception as e:
        logger.error(f"Error getting certificate info for {hostname}: {str(e)}")
        raise

def add_url(url, urls):
    try:
        if not url.startswith("http"):
            url = f"https://{url}"

        hostname = url.split("//")[-1].split("/")[0]

        cert_info = get_cert_info(hostname)
        urls[hostname] = {
            "status": "Valid",
            "valid_from": cert_info["valid_from"].strftime("%Y-%m-%d %H:%M:%S"),
            "valid_to": cert_info["valid_to"].strftime("%Y-%m-%d %H:%M:%S"),
            "last_checked": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        return urls[hostname]
    except Exception as e:
        logger.error(f"Error adding URL {url}: {str(e)}")
        return jsonify({"error": str(e)}), 500

def delete_url(domain, urls):
    try:
        if domain in urls:
            del urls[domain]
            return jsonify({"message": f"URL {domain} successfully deleted."}), 200
        else:
            return jsonify({"error": f"URL {domain} not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
