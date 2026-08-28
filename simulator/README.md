# DeployGuard Production Incident Simulator

The **DeployGuard Production Simulator** is a lightweight, deterministic TypeScript component that models a live software production environment. It provides realistic service metrics, deployment history, incident reports, and log traces for the DeployGuard AI Incident Response Agent to query and analyze.

---

## 🎯 What the Simulator Represents

The simulator models a target microservice infrastructure comprising:
- **`payment-api`**: High-throughput payment processing service.
- **`user-api`**: User management & authentication service.
- **`order-api`**: Order management and checkout orchestration service.
- **`database`**: Primary PostgreSQL database cluster.

---

## 🚨 Incident Scenario

1. **Baseline**: `payment-api` running version `1.8.2` (Deployment `#183`) was fully healthy.
2. **Change Event**: Deployment `#184` was released, updating `payment-api` to version `1.8.3` ("Payment gateway connection pool optimization").
3. **Incident Trigger**: Immediately post-deployment, `payment-api` experienced connection pool exhaustion:
   - **Status**: `CRITICAL`
   - **Error Rate**: `47.2%` (threshold: 5.0%)
   - **Average Latency**: `1840 ms`
   - **Healthy Instances**: `2` / **Unhealthy Instances**: `5`
4. **Log Footprint**:
   - `HTTP 500 POST /v1/charge - Payment processing failed: DB Connection Timeout after 5000ms`
   - `Database connection acquire timeout: pool exhausted for primary-db cluster`
   - Pod readiness probe timeouts on TCP port 8080

---

## 🛠️ Setup & Installation

From the project root:

```bash
cd simulator
npm install
```

---

## 🚀 Usage Commands

### 1. Run Development Mode (Direct TS execution)
```bash
npm run dev
```

### 2. Build TypeScript Code
```bash
npm run build
```

### 3. Run Compiled Production Output
```bash
npm run start
```

### 4. Run Automated Tests
```bash
npm run test
```

---

## 🧪 Testing

The test suite validates:
- Presence and correct health metrics of `payment-api`, `user-api`, `order-api`, and `database`.
- Existence and metadata of deployment `#184`.
- Association of the active incident with `payment-api`.
- Log evidence of payment failures and database connection timeouts.
- Simulated rollback via `rollbackDeployment("184")` restoring `payment-api` to v1.8.2 and healthy status.
- Error handling for unknown deployment IDs and non-active deployment rollback attempts.

