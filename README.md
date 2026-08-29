# DeployGuard

> An AI Incident Response Agent built around [TrueForge](https://github.com/truefoundry/trueforge), TrueFoundry's open-source agent harness.

Built for **The Agent Harness Hackathon**.

---

## 🚀 Overview

**DeployGuard** is an AI-powered production incident response agent designed to investigate, diagnose, and safely remediate software production incidents.

It acts like a virtual Site Reliability Engineer (SRE). When a production service enters a degraded or critical state, DeployGuard uses structured MCP tools to collect service metrics, application logs, deployment history, and Kubernetes state.

The agent correlates this evidence to identify a likely root cause and recommends a remediation.

For potentially destructive actions such as a deployment rollback, DeployGuard requires **explicit human approval before execution**.

DeployGuard is powered by:

- **TrueForge** for agent orchestration and tool execution
- **Gemini** for AI reasoning
- **Model Context Protocol (MCP)** for structured access to production tools
- A simulated production environment for safe incident-response testing
- A web dashboard for incident visibility, remediation, and audit history

---

## 🎯 Problem Statement

Modern cloud infrastructure and microservices generate large amounts of telemetry during outages and degraded states.

During an incident, engineers often need to manually correlate:

- Service health metrics
- Application error logs
- Recent deployments
- Kubernetes workload state
- Deployment changes
- Recovery status

This increases Mean Time to Resolution (MTTR) and creates opportunities for human error, especially during high-pressure production incidents.

DeployGuard addresses this problem by providing an agent that can:

1. Detect and investigate a production incident
2. Collect evidence from multiple structured tools
3. Correlate the evidence
4. Identify a likely root cause
5. Recommend a remediation
6. Pause for human approval before performing a critical action
7. Execute the approved remediation through a tool
8. Verify the resulting service state
9. Record the remediation in an audit trail

---

# 🏗️ Architecture

```text
                         User
                           │
                           ▼
                  ┌─────────────────┐
                  │   TrueForge     │
                  │   Agent Harness │
                  └────────┬────────┘
                           │
                    Gemini Reasoning
                           │
                           ▼
                  ┌─────────────────┐
                  │   MCP Server    │
                  │   DeployGuard   │
                  └────────┬────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Service Status   Logs       Deployments
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                   Kubernetes State
                           │
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
                  ┌──────────────────┐
                  │ HUMAN APPROVAL   │
                  └────────┬─────────┘
                           │
                    Approved?
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