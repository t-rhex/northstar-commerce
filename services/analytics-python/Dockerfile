FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY services/analytics-python/requirements.lock.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.lock.txt
COPY services/analytics-python/app.py .
RUN useradd --create-home --uid 10001 northstar
USER northstar
EXPOSE 4008
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "4008", "--no-access-log"]
