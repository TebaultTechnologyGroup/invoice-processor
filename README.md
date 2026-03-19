# Finance AP Invoice Processor — Demo App

Multi-agent AI demo built on **AWS Amplify Gen2 + Bedrock (Claude Sonnet 3.5)**.  
Demonstrates a 3-agent orchestration pattern for Accounts Payable automation.

---

## What it does

1. **Extraction agent** — parses invoice fields, validates data quality, assigns a confidence score
2. **PO matching agent** — validates against open purchase orders, checks budget availability
3. **Compliance agent** — applies policy rules, duplicate detection, generates audit trail + decision

Each agent calls Claude via Bedrock sequentially. Results animate in one by one so the hiring manager can clearly see the orchestration happening.

---

## Architecture

```
React (Amplify Hosting)
    └── Amplify Data client (generateClient)
            └── AppSync GraphQL API
                    └── processInvoice mutation
                            └── Lambda (TypeScript orchestrator)
                                    ├── Agent 1: Extraction   → Bedrock Claude
                                    ├── Agent 2: PO Matching  → Bedrock Claude
                                    └── Agent 3: Compliance   → Bedrock Claude
```

The mutation is defined in `amplify/data/resource.ts` using `defineData` with a custom schema.
Amplify Gen2 wires the AppSync mutation → Lambda automatically; no manual API Gateway setup needed.

---

## Setup

### Prerequisites
- AWS account with Bedrock model access for `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Node.js 18+
- AWS CLI configured
- Amplify CLI: `npm install -g @aws-amplify/cli`

### 1. Clone and install

```bash
git clone <your-repo>
cd finance-ap-demo
npm install
```

### 2. Initialize Amplify Gen2

```bash
npx ampx configure
npx ampx sandbox   # for local dev, or:
npx ampx pipeline-deploy --branch main   # for CI/CD
```

This will:
- Create the Lambda function (`invoiceProcessor`)
- Create an HTTP API Gateway endpoint
- Grant the Lambda IAM permission to call Bedrock
- Output the API URL into `amplify_outputs.json`

### 3. Run locally

```bash
npm run dev
```

The app reads `amplify_outputs.json` for the API URL automatically.

### 4. Deploy

```bash
# Connect your GitHub repo in the Amplify Console
# Set branch to main — Amplify handles build + hosting
```

---

## Fake data

Five pre-built invoices covering all interesting scenarios:

| Invoice | Scenario |
|---------|----------|
| Acme Office Supplies | Clean match, within PO budget |
| TechForce IT Solutions | Over PO remaining balance — flagged |
| Meridian Consulting | Low PO balance, near-expiry — escalated |
| SupplyChain Direct | **No PO reference** — no-PO escalation rule triggers |
| CloudHost Inc | Clean match, straightforward approval |

---

## Talking points for the interview

- **Orchestration pattern**: each agent has a scoped system prompt and passes structured JSON to the next — this is the foundation of production multi-agent systems
- **Why sequential vs parallel**: compliance needs extraction + matching outputs; sequential is correct here, not a shortcut
- **Human-in-the-loop**: the escalate decision is a gate — in production this would trigger an approval workflow (email, Slack, or Jira ticket)
- **Extending this**: add an Amplify Data (DynamoDB) table to persist run history; add S3 for invoice PDF uploads; add Cognito for role-based access
- **AWS-native**: entire stack runs in your AWS account — no third-party API keys, works with existing IAM, CloudTrail logs everything

---

## Swap to Anthropic API (optional)

If you prefer the direct Anthropic API instead of Bedrock, replace the `callClaude` function in `handler.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  return (msg.content[0] as any).text;
}
```

Then add `ANTHROPIC_API_KEY` as an Amplify environment variable.

---

## Project structure

```
finance-ap-demo/
├── amplify/
│   ├── backend.ts                          # Amplify Gen2 backend definition
│   └── functions/
│       └── invoiceProcessor/
│           ├── handler.ts                  # Lambda orchestrator + 3 agents
│           └── resource.ts                 # Function config
├── src/
│   ├── App.tsx                             # Main UI
│   ├── components/
│   │   ├── AgentPanel.tsx                  # Animated agent output card
│   │   ├── InvoiceCard.tsx                 # Invoice display
│   │   └── ResultDetail.tsx                # Per-agent result rendering
│   ├── data/
│   │   └── fakeData.ts                     # 5 invoices + 4 POs
│   └── types/
│       └── agents.ts                       # TypeScript types
├── package.json
└── README.md
```
