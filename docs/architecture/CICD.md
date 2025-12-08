# CI/CD y Pruebas - Litper

## Visión General

El pipeline de CI/CD de Litper automatiza pruebas, seguridad, build y deployment siguiendo prácticas de GitOps.

## Pipeline de CI/CD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS                               │
│                                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  LINT   │─▶│  TEST   │─▶│SECURITY │─▶│  BUILD  │─▶│ DEPLOY  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        STAGING                                   │ │
│  │  Auto-deploy on push to main                                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                       PRODUCTION                                 │ │
│  │  Manual approval + Canary deployment                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Etapas del Pipeline

### 1. Lint

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Python Lint (ruff)
      run: |
        pip install ruff
        ruff check backend/
        ruff format --check backend/

    - name: TypeScript Lint (eslint)
      run: |
        cd frontend
        npm ci
        npm run lint
```

### 2. Test

```yaml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: litper_test
    redis:
      image: redis:7

  steps:
    - name: Run Backend Tests
      run: |
        pip install -r requirements.txt
        pytest backend/tests/ -v --cov=backend --cov-report=xml

    - name: Run Frontend Tests
      run: |
        cd frontend
        npm ci
        npm run test:coverage

    - name: Upload Coverage
      uses: codecov/codecov-action@v3
```

### 3. Security Scan

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - name: Dependency Scan (Trivy)
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        severity: 'CRITICAL,HIGH'

    - name: SAST (Semgrep)
      uses: returntocorp/semgrep-action@v1
      with:
        config: p/python

    - name: Secret Detection
      uses: trufflesecurity/trufflehog@main
```

### 4. Build

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - name: Build Docker Image
      run: |
        docker build -t litper/api:${{ github.sha }} .

    - name: Push to Registry
      run: |
        docker push litper/api:${{ github.sha }}
        docker tag litper/api:${{ github.sha }} litper/api:latest
        docker push litper/api:latest
```

### 5. Deploy Staging

```yaml
deploy-staging:
  needs: [build]
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/litper-api \
          api=litper/api:${{ github.sha }} \
          --namespace=staging

    - name: Wait for Rollout
      run: |
        kubectl rollout status deployment/litper-api \
          --namespace=staging --timeout=300s

    - name: Run Smoke Tests
      run: |
        ./scripts/smoke-tests.sh https://staging.litper.co
```

### 6. Deploy Production (Canary)

```yaml
deploy-production:
  needs: [deploy-staging]
  runs-on: ubuntu-latest
  environment: production
  steps:
    # Fase 1: 10% del tráfico
    - name: Canary 10%
      run: |
        kubectl set image deployment/litper-api-canary \
          api=litper/api:${{ github.sha }} \
          --namespace=production
        kubectl scale deployment/litper-api-canary --replicas=1

    - name: Monitor Canary (5min)
      run: |
        ./scripts/monitor-canary.sh --duration=300

    # Fase 2: 50% del tráfico
    - name: Canary 50%
      run: |
        kubectl scale deployment/litper-api-canary --replicas=5

    - name: Monitor Canary (5min)
      run: |
        ./scripts/monitor-canary.sh --duration=300

    # Fase 3: 100% del tráfico
    - name: Full Rollout
      run: |
        kubectl set image deployment/litper-api \
          api=litper/api:${{ github.sha }} \
          --namespace=production
        kubectl scale deployment/litper-api-canary --replicas=0
```

## Estructura de Tests

### Backend (pytest)

```
backend/tests/
├── unit/
│   ├── test_orders.py
│   ├── test_guides.py
│   ├── test_agents.py
│   └── test_security.py
├── integration/
│   ├── test_api_orders.py
│   ├── test_api_guides.py
│   ├── test_webhooks.py
│   └── test_carrier_integrations.py
├── e2e/
│   ├── test_order_flow.py
│   ├── test_tracking_flow.py
│   └── test_incident_flow.py
└── conftest.py
```

### Frontend (vitest)

```
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── OrderList.test.tsx
│   │   └── GuideTracker.test.tsx
├── hooks/
│   └── __tests__/
│       └── useOrders.test.ts
└── pages/
    └── __tests__/
        └── Dashboard.test.tsx
```

## Cobertura de Tests

### Objetivos

| Tipo | Cobertura Mínima |
|------|------------------|
| Unit Tests | 80% |
| Integration Tests | 70% |
| E2E Tests | Flujos críticos |

### Flujos Críticos (E2E)

1. **Flujo de Pedido Completo**
   - Crear pedido → Generar guía → Tracking → Entrega

2. **Flujo de Novedad**
   - Detectar novedad → Notificar → Resolver

3. **Flujo de Chat**
   - Mensaje entrante → Procesar IA → Respuesta

## Ambientes

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| Development | localhost:3000 | Desarrollo local |
| Staging | staging.litper.co | Pruebas pre-producción |
| Production | app.litper.co | Producción |

## Rollback

### Automático

```yaml
# Si error rate > 5% después del deploy
- name: Auto Rollback
  if: failure()
  run: |
    kubectl rollout undo deployment/litper-api \
      --namespace=production
```

### Manual

```bash
# Rollback a versión anterior
kubectl rollout undo deployment/litper-api --namespace=production

# Rollback a versión específica
kubectl rollout undo deployment/litper-api --to-revision=3
```

## Notificaciones

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: '#deployments'
    slack-message: |
      Deploy ${{ job.status }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
```

## Secretos y Variables

### GitHub Secrets

| Secret | Descripción |
|--------|-------------|
| DOCKER_USERNAME | Usuario Docker Hub |
| DOCKER_PASSWORD | Password Docker Hub |
| KUBE_CONFIG | Configuración Kubernetes |
| SLACK_WEBHOOK | Webhook de Slack |
| AWS_ACCESS_KEY_ID | AWS Access Key |
| AWS_SECRET_ACCESS_KEY | AWS Secret Key |

### Variables de Ambiente

| Variable | Staging | Production |
|----------|---------|------------|
| DATABASE_URL | pg://staging... | pg://prod... |
| REDIS_URL | redis://staging... | redis://prod... |
| CLAUDE_API_KEY | sk-test-... | sk-prod-... |

## Archivos de Implementación

- `.github/workflows/main.yml`: Pipeline principal
- `Dockerfile`: Build de imagen
- `scripts/smoke-tests.sh`: Tests de humo
- `scripts/monitor-canary.sh`: Monitoreo de canary
