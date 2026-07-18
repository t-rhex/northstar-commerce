#!/bin/sh
set -eu

curl --fail --silent --show-error \
  --request PUT \
  --header 'content-type: application/json' \
  --data-binary @- \
  http://elasticsearch:9200/_index_template/northstar-logs <<'JSON'
{
  "index_patterns": ["northstar-logs-*"],
  "priority": 200,
  "template": {
    "settings": {
      "index.number_of_shards": 1,
      "index.number_of_replicas": 0
    },
    "mappings": {
      "dynamic": true,
      "properties": {
        "@timestamp": { "type": "date" },
        "trace": { "properties": { "id": { "type": "keyword" } } },
        "service": { "properties": { "name": { "type": "keyword" } } },
        "event": { "properties": { "action": { "type": "keyword" } } },
        "labels": {
          "properties": {
            "request_id": { "type": "keyword" },
            "checkout_transaction_id": { "type": "keyword" },
            "checkout_step": { "type": "keyword" },
            "checkout_step_status": { "type": "keyword" }
          }
        }
      }
    }
  }
}
JSON

status="$(curl --silent --output /tmp/kibana-data-view.json --write-out '%{http_code}' \
  --request POST \
  --header 'kbn-xsrf: northstar-bootstrap' \
  --header 'content-type: application/json' \
  --data '{"data_view":{"id":"northstar-logs","title":"northstar-logs-*","name":"Northstar application logs","timeFieldName":"@timestamp"},"override":true}' \
  http://kibana:5601/api/data_views/data_view)"

if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
  cat /tmp/kibana-data-view.json
  exit 1
fi

echo "Northstar Elasticsearch template and Kibana data view are ready."
