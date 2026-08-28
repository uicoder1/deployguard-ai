# DeployGuard Architecture

## System Overview

```text
User
  ↓
DeployGuard Agent
  ↓
TrueForge
  ├── Gemini model
  ├── MCP tools
  ├── Sandbox
  └── Human approval
       ↓
Production Simulator
```

## Component Details

### 1. User Interface & Operator Interaction
- **Role**: Allows SREs, developers, or system operators to observe ongoing incident investigations and approve/deny suggested remediation plans.
- **Location**: `frontend/`

### 2. DeployGuard Agent
- **Role**: Core autonomous incident response agent orchestrator built on TrueForge.
- **Responsibilities**:
  - Ingesting alert signals and telemetry.
  - Formulating diagnostic strategies.
  - Interacting with MCP tools to execute diagnostic probes.
  - Synthesizing remediation steps and requesting human approval.

### 3. TrueForge (Agent Harness)
- **Role**: TrueFoundry's open-source agent execution harness providing safe runtime guarantees, model execution, tool integration, and policy enforcement.
  - **Gemini Model**: Foundation LLM powering decision-making, natural language reasoning, and root-cause analysis.
  - **MCP Tools**: Model Context Protocol servers/tools enabling standardized tool calling across infrastructure services.
  - **Sandbox**: Isolated computational sandbox ensuring commands, queries, and scripts are executed safely.
  - **Human Approval**: Interactive approval gate preventing unauthorized or high-risk actions from reaching production environments automatically.

### 4. Production Simulator
- **Role**: A controlled local environment simulating real-world application services, microservices, databases, and synthetic fault conditions.
- **Location**: `simulator/`
- **Remediation**: Exposes `rollbackDeployment` to safely simulate rolling back a service deployment without contacting real infrastructure.

## Remediation Policy & Human-in-the-Loop Guardrails
- **Autonomous Investigation**: Read-only tools (`get_service_status`, `get_service_logs`, `get_recent_deployments`, `get_deployment_details`) are called automatically to inspect telemetry.
- **Human Approval Gate**: `rollback_deployment` requires explicit human operator confirmation. The agent presents affected service, deployment ID, current & rollback versions, reason, and risk analysis.
- **Post-Rollback Verification**: After an approved rollback succeeds, `get_service_status` is called to verify system recovery.

