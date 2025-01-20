from flask import Flask, request, render_template, jsonify
from flasgger import Swagger, swag_from
import threading
import time
import logging
import logging.config
from config import LOGGING_CONFIG, METRICS_PORT, FLASK_PORT
from cert_manager import add_url, delete_url, get_cert_info
from system_monitor import monitor_system
from metrics import start_metrics_server

# Применяем конфигурацию логирования из config.py
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
Swagger(app)

urls = {}

@app.route('/')
def index():
    return render_template('index.html', urls=urls)

@app.route('/add_url', methods=['POST'])
@swag_from({
    'tags': ['Certificate Management'],
    'parameters': [
        {
            'name': 'url',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'url': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'URL added successfully'},
        400: {'description': 'Invalid input'},
        500: {'description': 'Internal server error'}
    }
})
def add_url_route():
    data = request.json
    url = data.get('url')
    if not url:
        logger.warning("URL is required")
        return jsonify({"error": "URL is required"}), 400
    try:
        result = add_url(url, urls)
        return jsonify({"message": "URL added successfully", "data": result}), 200
    except Exception as e:
        logger.error(f"Error adding URL {url}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/delete_url', methods=['POST'])
@swag_from({
    'tags': ['Certificate Management'],
    'parameters': [
        {
            'name': 'domain',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'domain': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {'description': 'URL deleted successfully'},
        404: {'description': 'URL not found'}
    }
})
def delete_url_route():
    data = request.json
    domain = data.get('domain')
    return delete_url(domain, urls)

@app.route('/delete_all_urls', methods=['POST'])
def delete_all_urls():
    global urls
    try:
        urls = {}
        return jsonify({"message": "All URLs successfully deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_urls', methods=['GET'])
@swag_from({
    'tags': ['Certificate Management'],
    'responses': {
        200: {'description': 'List of URLs', 'schema': {'type': 'object'}}
    }
})
def get_urls():
    return jsonify(urls)

def start_servers():
    threading.Thread(target=start_metrics_server, args=(METRICS_PORT,), daemon=True).start()
    threading.Thread(target=monitor_system, daemon=True).start()
    start_flask_server()

def start_flask_server():
    app.run(debug=True, port=FLASK_PORT, use_reloader=False)

if __name__ == '__main__':
    logger.info(f"Starting Flask server on port {FLASK_PORT}")
    start_servers()