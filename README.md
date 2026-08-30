# DeployGuard

AI-powered production incident response agent built on [TrueForge](https://github.com/truefoundry/trueforge) for The Agent Harness Hackathon.

DeployGuard investigates production incidents, finds the likely cause, recommends a fix, and asks for human approval before taking a risky action such as a rollback.

---

## 🔗 Links

- **Live Dashboard:** https://dashboard-seven-alpha-60.vercel.app/
- **GitHub:** https://github.com/uicoder1/deployguard-ai
- **Demo Video:** ADD_YOUR_VIDEO_LINK
- **TrueForge:** https://github.com/truefoundry/trueforge
- **Qodo Reviewed PR:** https://github.com/uicoder1/deployguard-ai/pull/2
- **Blog Post:** ADD_YOUR_BLOG_LINK

---

## What DeployGuard Does

When a production service starts failing, DeployGuard collects information from different production tools instead of relying on a single model response.

It checks:

- Service health and metrics
- Application logs
- Recent deployments
- Deployment details
- Production simulator state

The agent then connects the evidence, identifies the likely cause, and recommends what should be done.

For risky actions, it stops and asks the user for approval.

### Example

The `payment-api` service has:

- 47.2% error rate
- 1840ms latency
- 2 of 7 instances healthy
- Deployment #184 running version 1.8.3

The agent finds database connection pool errors after deployment #184 and recommends rolling back to version 1.8.2.

After the user approves the rollback:

```text
Investigation
     ↓
Collect evidence
     ↓
Find likely root cause
     ↓
Recommend rollback
     ↓
Human approval
     ↓
rollback_deployment
     ↓
Verify recovery
     ↓
Audit record
```

The production environment is simulated, so no real production infrastructure is changed.

---

## Architecture

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │    TrueForge    │
                  │   Agent Harness │
                  └────────┬────────┘
                           │
                    Gemini Reasoning
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        MCP Server                 Daytona Sandbox
             │                           │
       Production Tools            Isolated Execution
             │
     ┌───────┼────────┬──────────────┐
     │       │        │              │
     ▼       ▼        ▼              ▼
  Service   Logs   Deployments   Deployment Details
  Status
     │
     └───────────────┬──────────────────┘
                     ▼
              Evidence Correlation
                     │
                     ▼
               Root Cause Analysis
                     │
                     ▼
            Remediation Recommendation
                     │
                     ▼
              HUMAN APPROVAL
                     │
                     ▼
             rollback_deployment
                     │
                     ▼
            Production Simulator
                     │
                     ▼
             Recovery Verification
                     │
                     ▼
                Audit Record
```

### How TrueForge is used

TrueForge is the runtime for the DeployGuard agent. It handles the agent execution loop, model calls, MCP tools, sandbox execution, and human approval flow.

DeployGuard connects its Streamable HTTP MCP server to TrueForge. The MCP server exposes the production investigation and remediation tools.

DeployGuard also uses TrueForge's Daytona-backed sandbox for isolated file and code execution.

This means TrueForge is part of the actual workflow, not just a wrapper around a model call.

---

## MCP Tools

DeployGuard exposes five tools through its MCP server:

| Tool | Purpose |
|---|---|
| `get_service_status` | Gets service health and metrics |
| `get_service_logs` | Gets recent application logs |
| `get_recent_deployments` | Gets recent deployment history |
| `get_deployment_details` | Gets details about a deployment |
| `rollback_deployment` | Performs a simulated rollback |

---

## Safety

Rollback is treated as a potentially destructive action.

DeployGuard does not automatically call `rollback_deployment`.

The agent first explains:

- Which service is affected
- Which deployment caused the problem
- Current and target versions
- Why the rollback is recommended
- The risk involved

It then waits for explicit human approval.

After approval, the rollback is executed in the production simulator and the agent checks the service again.

---

## Sandbox

TrueForge is configured with Daytona as the sandbox provider.

The sandbox provides isolated execution for files and code without running those operations directly on the host environment.

Example test:

```text
Create deployguard-demo.txt
             ↓
Write test content
             ↓
Read the file
             ↓
Return the result
```

---

## Demo Scenario

The main incident used in the demo is:

```text
Service:          payment-api
Deployment:       #184
Version:          1.8.3
Error rate:       47.2%
Average latency:  1840ms
Healthy pods:     2/7
```

After the approved rollback:

```text
Version:          1.8.3 → 1.8.2
Error rate:       47.2% → 0.1%
Latency:          1840ms → 45ms
Healthy pods:     2/7 → 7/7
Status:           CRITICAL → HEALTHY
```

---

## Qodo Code Review Evidence

Substantive hackathon changes were developed through GitHub pull requests and reviewed by Qodo before merging.

### Representative PR

**PR #2: feat: add audited rollback remediation**

https://github.com/uicoder1/deployguard-ai/pull/2

Qodo identified reliability and correctness issues around rollback audit handling and keeping historical audit records reliable.

The findings were addressed by improving the rollback audit flow and refreshing the resulting service state.

The PR was reviewed by Qodo, the findings were resolved, and the final implementation was reviewed before being merged into `main`.

The pull request contains the Qodo review history, resolved findings, and follow-up review.

---

## Project Structure

```text
deployguard-ai/
├── dashboard/       # DeployGuard dashboard
├── frontend/        # Frontend application
├── mcp-server/      # Streamable HTTP MCP server
├── simulator/       # Production incident simulator
└── docs/            # Project documentation
```

---

## Running Locally

### MCP Server

```bash
cd mcp-server
npm install
npm test
npm start
```

The MCP server runs on:

```text
http://127.0.0.1:8791/mcp
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

---

## AI Development Disclosure

AI coding assistants were used during development for implementation, debugging, documentation, and code review preparation.

The project architecture, technical decisions, testing, and final implementation were reviewed and understood by the project author.

---

## License

MIT License.