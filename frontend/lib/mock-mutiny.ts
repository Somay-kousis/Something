export type Person = { id: string; name: string; role: string; headline?: string; similarityScore: number; reasons: string[] }
export type Investor = { id: string; name: string; stage: string; sectors: string[]; matchScore: number }
export type Idea = { id: string; title: string; summary: string; ownerName: string; similarityScore: number }
export type Patent = { id: string; title: string; number: string; assignee: string; similarityScore: number; description: string }

export type MutinyResponse = {
  people?: Person[]
  investors?: Investor[]
  ideas?: Idea[]
  patents?: Patent[]
  rationale: string
}

export type MutinyMode = "feature" | "match" | "critic" | "support"

export async function queryMutiny(idea: string, mode: MutinyMode) {
  // Simulate server latency
  await new Promise((r) => setTimeout(r, 900))

  const basePeople: Person[] = [
    { id: 'p1', name: 'Ava Reynolds', role: 'CTO @ Nimbus', headline: 'Built scalable infra for ML teams', similarityScore: 0.88, reasons: ['AI/ML overlap','Previous product in climate AI'] },
    { id: 'p2', name: 'Marco Liu', role: 'Product Lead', headline: 'Focused on developer tools', similarityScore: 0.74, reasons: ['Product fit','Similar UX challenge'] },
    { id: 'p3', name: 'Lena Ortiz', role: 'Founder', headline: 'Ex-founder in fintech', similarityScore: 0.62, reasons: ['Payments experience'] },
  ]

  const baseInvestors: Investor[] = [
    { id: 'i1', name: 'Copper Ventures', stage: 'Seed', sectors: ['AI/ML','Fintech'], matchScore: 0.91 },
    { id: 'i2', name: 'North Ridge', stage: 'Series A', sectors: ['Enterprise','DevTools'], matchScore: 0.72 },
  ]

  const baseIdeas: Idea[] = [
    { id: 'idea1', title: 'Auto ML tuning assistant', summary: 'Tool to recommend hyperparameters automatically', ownerName: 'Sam', similarityScore: 0.84 },
    { id: 'idea2', title: 'Paywall micro-insights', summary: 'Analytics for subscription churn', ownerName: 'Dana', similarityScore: 0.58 },
  ]

  const basePatents: Patent[] = [
    { id: 'pat1', title: 'Decentralized Multi-Sig Escrow release framework', number: 'US-1149208-B2', assignee: 'ConsenSys AG', similarityScore: 0.89, description: 'Escrow release verification using on-chain multi-signature triggers.' },
    { id: 'pat2', title: 'Dynamic particle network render scaling', number: 'US-9872115-B1', assignee: 'Vanguard Media Group', similarityScore: 0.71, description: 'Efficient background rendering of node graphs with custom physics limits.' },
  ]

  if (mode === 'feature') {
    return {
      ideas: baseIdeas,
      rationale: `Feature Viability Analysis:
• UX Complexity: Your proposed implementation has high value but risks initial cognitive overload. Recommend introducing a step-by-step progressive disclosure flow.
• Technical Feasibility: SQLite local-first sync with CRDT handles conflicts gracefully, but requires web-workers for large tables.
• Cost Projection: Local processing keeps server overhead close to zero; only pay for peer-broker metadata synchronization.`,
    } as MutinyResponse
  }

  if (mode === 'match') {
    return {
      people: basePeople,
      investors: baseInvestors,
      ideas: baseIdeas,
      patents: basePatents,
      rationale: 'Search Results: Successfully identified 3 co-founders, 2 investors, and 2 active patents with highly relevant overlap to your concept. Recommended next step: Request introduction to Ava Reynolds.',
    } as MutinyResponse
  }

  if (mode === 'critic') {
    return {
      ideas: baseIdeas,
      rationale: `Doubt Assessment (Nothing):
• Friction Point: High switching cost. Founders already use Notion/Slack; convincing them to write ideas here requires immediate feedback loops.
• Churn Risk: Escrows are useful only during active funding. Once funding completes, retention drops if there are no day-to-day coordination hooks.
• Monetization Gaps: Charging a take-rate on developer escrows will push users to deploy their own simple multisigs. Consider charging on analytics instead.`,
    } as MutinyResponse
  }

  // default: support (Something)
  return {
    people: basePeople,
    investors: baseInvestors,
    rationale: `Belief Framework (Something):
• Emotional Resonance: Builders feel isolated. The "Nothing & Something" duality builds instant connection by representing the internal dialogue of every creator.
• Growth Hooks: Shared conviction matches act as high-frequency sharing triggers. When a founder receives a high-quality co-founder match, they share it immediately.
• Value Retention: Milestone escrow turns the platform into a trusted collaboration record, building high lock-in as ideas transform to products.`,
  } as MutinyResponse
}
