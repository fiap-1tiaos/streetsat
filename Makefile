.PHONY: install install-dev test lint train collect api dashboard docker-up docker-down demo \
        sls-deploy sls-invoke-scraper sls-invoke-inference sls-invoke-alerter sls-remove \
        sls-deploy-local sls-start-local sls-reset-local sls-upload-models \
        sls-logs-live sls-queue-status sls-s3-status sls-logs-scraper sls-logs-inference sls-logs-alerter sls-monitor

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements-dev.txt

test:
	pytest tests/ -v --cov=src --cov-report=term-missing

lint:
	black src/ dashboard/ aws/ scripts/ tests/
	isort src/ dashboard/ aws/ scripts/ tests/
	flake8 src/ dashboard/ aws/ scripts/ --max-line-length=100 --ignore=E501,W503

train:
	docker exec streetsat-api python scripts/train_model.py

collect:
	docker exec streetsat-api python scripts/collect_realtime.py

api:
	uvicorn src.api.fastapi_app:app --host 0.0.0.0 --port 8000 --reload

dashboard:
	docker exec streetsat-api python dashboard/app.py

demo:
	docker exec streetsat-api python scripts/demo_dashboard.py

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down -v

docker-logs:
	docker-compose logs -f

setup-env:
	cp .env.example .env.local
	@echo "Edit .env.local with your credentials"

demo-nlp:
	docker exec streetsat-api python scripts/demo_nlp.py

demo-inference:
	docker exec streetsat-api python scripts/demo_inference.py

# Serverless / LocalStack
sls-deploy:
	rm -rf .serverless && serverless deploy --stage dev

sls-invoke-scraper:
	. venv/bin/activate && PYTHONPATH=$(PWD) serverless invoke local -f scraper --stage dev

sls-invoke-inference:
	. venv/bin/activate && PYTHONPATH=$(PWD) serverless invoke local -f inference --stage dev --data '{"Records":[]}'

sls-invoke-alerter:
	. venv/bin/activate && PYTHONPATH=$(PWD) serverless invoke local -f alerter --stage dev --data '{"Records":[]}'

sls-remove:
	aws --endpoint-url=http://localhost:4566 cloudformation delete-stack --stack-name streetsat-dev
	aws --endpoint-url=http://localhost:4566 cloudformation wait stack-delete-complete --stack-name streetsat-dev 2>/dev/null || true

# Reset completo: limpa recursos órfãos do LocalStack antes de redesployar
# Use quando o deploy falhar com ResourceConflictException ou Lambda::Version errors
sls-reset-local:
	@echo "Limpando recursos LocalStack órfãos..."
	@aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings 2>/dev/null | \
	  python3 -c "import sys,json; [print(m['UUID']) for m in json.load(sys.stdin).get('EventSourceMappings',[])]" | \
	  while read uuid; do \
	    aws --endpoint-url=http://localhost:4566 lambda delete-event-source-mapping --uuid "$$uuid" > /dev/null 2>&1; \
	    echo "  ESM $$uuid removido"; \
	  done
	@for fn in scraper inference alerter api; do \
	  aws --endpoint-url=http://localhost:4566 lambda delete-function \
	    --function-name "streetsat-dev-$$fn" > /dev/null 2>&1 && echo "  Função streetsat-dev-$$fn removida" || true; \
	done
	@for q in scraping inference alerts; do \
	  url=$$(aws --endpoint-url=http://localhost:4566 sqs get-queue-url \
	    --queue-name "streetsat-$${q}-dev" --query QueueUrl --output text 2>/dev/null); \
	  [ -n "$$url" ] && aws --endpoint-url=http://localhost:4566 sqs delete-queue \
	    --queue-url "$$url" > /dev/null 2>&1 && echo "  Fila streetsat-$${q}-dev removida" || true; \
	done
	@aws --endpoint-url=http://localhost:4566 cloudformation delete-stack --stack-name streetsat-dev > /dev/null 2>&1 || true
	@aws --endpoint-url=http://localhost:4566 cloudformation wait stack-delete-complete --stack-name streetsat-dev > /dev/null 2>&1 || true
	@echo "✅ Reset concluído. Execute 'make sls-deploy-local' para redesployar."

# Deploy lambdas para LocalStack (requer docker-compose up previamente)
# Reset automático antes de cada deploy — LocalStack falha em stack updates com Lambda::Version
sls-deploy-local:
	npm install
	$(MAKE) sls-reset-local
	. venv/bin/activate && PYTHONPATH=$(PWD) serverless deploy --stage dev --force
	$(MAKE) sls-upload-models

# Sobe infraestrutura + deploya lambdas — pipeline roda automaticamente a partir daí
sls-start-local:
	docker-compose up -d
	@echo "Aguardando LocalStack ficar saudável..."
	@until curl -sf http://localhost:4566/_localstack/health > /dev/null 2>&1; do sleep 2; done
	@echo "LocalStack pronto. Instalando plugins e deployando lambdas..."
	npm install
	. venv/bin/activate && PYTHONPATH=$(PWD) serverless deploy --stage dev
	@echo ""
	$(MAKE) sls-upload-models
	@echo "✅ Pipeline ativo no LocalStack:"
	@echo "   → scraper  : dispara a cada 5 min via EventBridge"
	@echo "   → inference : dispara via SQS (InferenceQueue) automaticamente"
	@echo "   → alerter   : dispara via SQS (AlertQueue) automaticamente"
	@echo ""
	@echo "   Logs: make sls-logs-live"
	@echo "   API:  http://localhost:8000"

# Sobe model files para o S3 do LocalStack (necessário para Lambda inference)
sls-upload-models:
	@echo "Fazendo upload dos arquivos de modelo para s3://streetsat-models-dev/models/"
	@aws --endpoint-url=http://localhost:4566 s3 mb s3://streetsat-models-dev 2>/dev/null || true
	@aws --endpoint-url=http://localhost:4566 s3 cp models/modelo_rf.pkl \
	  s3://streetsat-models-dev/models/modelo_rf.pkl && echo "  ✅ modelo_rf.pkl"
	@aws --endpoint-url=http://localhost:4566 s3 cp models/encoders.pkl \
	  s3://streetsat-models-dev/models/encoders.pkl && echo "  ✅ encoders.pkl"
	@aws --endpoint-url=http://localhost:4566 s3 cp models/model_metadata.json \
	  s3://streetsat-models-dev/models/model_metadata.json && echo "  ✅ model_metadata.json"
	@echo "Upload concluído. Lambda inference vai baixar para /tmp no cold start."

# ─── Monitoramento ────────────────────────────────────────────────────────────

# Logs ao vivo do LocalStack (ctrl+c para sair)
sls-logs-live:
	docker-compose logs -f localstack

# Status das filas SQS
sls-queue-status:
	@echo "=== InferenceQueue ==="
	@aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
	  --queue-url http://localhost:4566/000000000000/streetsat-inference-dev \
	  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible 2>/dev/null \
	  || echo "  Fila não encontrada (lambdas deployadas?)"
	@echo "=== AlertQueue ==="
	@aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
	  --queue-url http://localhost:4566/000000000000/streetsat-alerts-dev \
	  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible 2>/dev/null \
	  || echo "  Fila não encontrada (lambdas deployadas?)"

# Arquivos salvos pelo scraper no S3
sls-s3-status:
	@echo "=== Arquivos em s3://streetsat-models-dev/raw/occurrences/ ==="
	@aws --endpoint-url=http://localhost:4566 s3 ls \
	  s3://streetsat-models-dev/raw/occurrences/ --recursive 2>/dev/null \
	  || echo "  Bucket vazio ou não existe ainda"

# Arquivos do modelo de treinamento no S3 (deve conter modelo_rf.pkl, encoders.pkl e model_metadata.json)
sls-model-status:
	@echo "=== Arquivos em s3://streetsat-models-dev/models/ ==="
	@aws --endpoint-url=http://localhost:4566 s3 ls \
	  s3://streetsat-models-dev/models/ --recursive 2>/dev/null \
	  || echo "  Bucket vazio ou não existe ainda"

# Última execução de cada lambda (CloudWatch Logs)
_sls-last-log:
	@STREAM=$$(aws --endpoint-url=http://localhost:4566 logs describe-log-streams \
	  --log-group-name /aws/lambda/streetsat-dev-$(FUNC) \
	  --order-by LastEventTime --descending \
	  --query 'logStreams[0].logStreamName' --output text 2>/dev/null); \
	if [ "$$STREAM" = "None" ] || [ -z "$$STREAM" ]; then \
	  echo "  Nenhum log ainda para streetsat-dev-$(FUNC)"; \
	else \
	  aws --endpoint-url=http://localhost:4566 logs get-log-events \
	    --log-group-name /aws/lambda/streetsat-dev-$(FUNC) \
	    --log-stream-name "$$STREAM" \
	    --query 'events[].message' --output text 2>/dev/null; \
	fi

sls-logs-scraper:
	@echo "=== Logs: scraper (última execução) ==="
	@$(MAKE) _sls-last-log FUNC=scraper

sls-logs-inference:
	@echo "=== Logs: inference (última execução) ==="
	@$(MAKE) _sls-last-log FUNC=inference

sls-logs-alerter:
	@echo "=== Logs: alerter (última execução) ==="
	@$(MAKE) _sls-last-log FUNC=alerter

# Painel consolidado: filas + S3 + últimos logs de cada lambda
sls-monitor:
	@echo "╔══════════════════════════════════════════════════════╗"
	@echo "║        Streetsat — Monitor LocalStack Pipeline        ║"
	@echo "╚══════════════════════════════════════════════════════╝"
	@echo ""
	@$(MAKE) sls-queue-status
	@echo ""
	@$(MAKE) sls-s3-status
	@echo ""
	@$(MAKE) sls-logs-scraper
	@echo ""
	@$(MAKE) sls-logs-inference
	@echo ""
	@$(MAKE) sls-logs-alerter
