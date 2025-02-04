FROM python:3.11-alpine

COPY requirements.txt .
RUN apk add --no-cache --virtual .build-deps gcc musl-dev python3-dev linux-headers && \
    pip install --no-cache-dir -r requirements.txt && \
    apk del .build-deps && \
    rm -rf /root/.cache/pip

WORKDIR /app
COPY app/ ./app/
EXPOSE 5000 8899
CMD ["python3", "app/app.py"]
