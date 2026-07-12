// =============================================================
// EcoSphere — Seed script
// Idempotent: clears child→parent, then inserts. Safe to re-run.
// Run with: npm run db:seed
// NEVER prints the DB connection string. Logs demo login table only.
// =============================================================
import 'dotenv/config'
import { hash } from 'bcryptjs'
import { db } from './index'
import {
  departments,
  users,
  categories,
  emissionFactors,
  productEsgProfiles,
  environmentalGoals,
  carbonTransactions,
  csrActivities,
  employeeParticipations,
  esgPolicies,
  policyAcknowledgements,
  audits,
  complianceIssues,
  challenges,
  challengeParticipations,
  badges,
  badgeAwards,
  rewards,
  rewardRedemptions,
  xpLedger,
  departmentScores,
  notifications,
  esgConfig,
} from './schema'

const PERIOD = '2026-07'
const DEMO_PASSWORD = 'demo1234'

async function clearAll() {
  // Delete children before parents to satisfy FKs.
  await db.delete(xpLedger)
  await db.delete(rewardRedemptions)
  await db.delete(badgeAwards)
  await db.delete(challengeParticipations)
  await db.delete(employeeParticipations)
  await db.delete(policyAcknowledgements)
  await db.delete(complianceIssues)
  await db.delete(notifications)
  await db.delete(departmentScores)
  await db.delete(carbonTransactions)
  await db.delete(environmentalGoals)
  await db.delete(productEsgProfiles)
  await db.delete(challenges)
  await db.delete(rewards)
  await db.delete(badges)
  await db.delete(audits)
  await db.delete(esgPolicies)
  await db.delete(csrActivities)
  await db.delete(emissionFactors)
  await db.delete(categories)
  await db.delete(esgConfig)
  await db.delete(users)
  await db.delete(departments)
}

async function main() {
  console.log('🌱 Seeding EcoSphere...')
  await clearAll()

  const passwordHash = await hash(DEMO_PASSWORD, 10)

  // ---------- DEPARTMENTS ----------
  const [mfg, log, cor, rnd] = await db
    .insert(departments)
    .values([
      { name: 'Manufacturing', code: 'MFG', employeeCount: 120 },
      { name: 'Logistics', code: 'LOG', employeeCount: 64 },
      { name: 'Corporate', code: 'COR', employeeCount: 38 },
      { name: 'R&D', code: 'RND', employeeCount: 27 },
    ])
    .returning()

  // ---------- USERS (all roles; password demo1234) ----------
  const [admin, esgMgr, hrMgr, auditor, compliance, priya, karan, aditi] = await db
    .insert(users)
    .values([
      { name: 'Admin User', email: 'admin@ecosphere.dev', passwordHash, role: 'ADMIN', departmentId: cor.id, totalXp: 3200 },
      { name: 'Esha Green', email: 'esg@ecosphere.dev', passwordHash, role: 'ESG_MANAGER', departmentId: mfg.id, totalXp: 1980 },
      { name: 'Harish Rao', email: 'hr@ecosphere.dev', passwordHash, role: 'HR_MANAGER', departmentId: cor.id, totalXp: 1450 },
      { name: 'Anita Dsa', email: 'auditor@ecosphere.dev', passwordHash, role: 'AUDITOR', departmentId: cor.id, totalXp: 640 },
      { name: 'Colin Fox', email: 'compliance@ecosphere.dev', passwordHash, role: 'COMPLIANCE_OFFICER', departmentId: cor.id, totalXp: 820 },
      { name: 'Priya Nair', email: 'priya@ecosphere.dev', passwordHash, role: 'EMPLOYEE', departmentId: mfg.id, totalXp: 6250 },
      { name: 'Karan Mehta', email: 'karan@ecosphere.dev', passwordHash, role: 'EMPLOYEE', departmentId: log.id, totalXp: 540 },
      { name: 'Aditi Shah', email: 'aditi@ecosphere.dev', passwordHash, role: 'EMPLOYEE', departmentId: rnd.id, totalXp: 2100 },
    ])
    .returning()

  // ---------- ESG CONFIG (singleton) ----------
  await db.insert(esgConfig).values({
    weightEnvironmental: 0.4,
    weightSocial: 0.3,
    weightGovernance: 0.3,
    autoEmissionCalc: true,
    evidenceRequired: true,
    badgeAutoAward: true,
    emailAlerts: false,
    xpEasy: 100,
    xpMedium: 200,
    xpHard: 300,
    streakBonusEnabled: true,
    deptMultiplierEnabled: true,
    earlyBirdEnabled: false,
  })

  // ---------- EMISSION FACTORS ----------
  const [diesel, petrol, electricity, paper, flight, steel] = await db
    .insert(emissionFactors)
    .values([
      { name: 'Diesel', category: 'FUEL', unit: 'L', co2PerUnit: 2.68, source: 'DEFRA 2024', country: 'IN' },
      { name: 'Petrol', category: 'FUEL', unit: 'L', co2PerUnit: 2.31, source: 'DEFRA 2024', country: 'IN' },
      { name: 'Electricity', category: 'ELECTRICITY', unit: 'kWh', co2PerUnit: 0.82, source: 'CEA India', country: 'IN' },
      { name: 'Office Paper', category: 'MATERIAL', unit: 'kg', co2PerUnit: 1.3, source: 'EPA', country: 'IN' },
      { name: 'Domestic Flight', category: 'TRANSPORT', unit: 'km', co2PerUnit: 0.25, source: 'ICAO', country: 'IN' },
      { name: 'Recycled Steel', category: 'MATERIAL', unit: 'kg', co2PerUnit: 1.9, source: 'worldsteel', country: 'IN' },
    ])
    .returning()

  // ---------- CATEGORIES ----------
  const [catEnv, catCommunity, catEnergy, catMobility] = await db
    .insert(categories)
    .values([
      { name: 'Environment', type: 'CSR_ACTIVITY' },
      { name: 'Community', type: 'CSR_ACTIVITY' },
      { name: 'Energy', type: 'CHALLENGE' },
      { name: 'Mobility', type: 'CHALLENGE' },
    ])
    .returning()

  // ---------- PRODUCT ESG PROFILES ----------
  await db.insert(productEsgProfiles).values([
    { product: 'Steel Casing', emissionFactorId: steel.id, recyclable: true, hazardous: false, greenAlternative: 'Recycled Aluminium', carbonCategory: 'MATERIAL' },
    { product: 'A4 Paper Ream', emissionFactorId: paper.id, recyclable: true, hazardous: false, greenAlternative: 'Digital Documents', carbonCategory: 'MATERIAL' },
    { product: 'Fleet Diesel', emissionFactorId: diesel.id, recyclable: false, hazardous: true, greenAlternative: 'EV Fleet', carbonCategory: 'FUEL' },
  ])

  // ---------- ENVIRONMENTAL GOALS ----------
  await db.insert(environmentalGoals).values([
    { name: 'Reduce Fleet Emissions', departmentId: log.id, targetCo2: 500, currentCo2: 390, status: 'ACTIVE' },
    { name: 'Cut Packaging Waste', departmentId: mfg.id, targetCo2: 120, currentCo2: 98, status: 'ON_TRACK' },
    { name: 'Office Energy Neutral', departmentId: cor.id, targetCo2: 80, currentCo2: 80, status: 'COMPLETED' },
  ])

  // ---------- CARBON TRANSACTIONS (CT-00001..) ----------
  const ref = (n: number) => `CT-${String(n).padStart(5, '0')}`
  const carbonRows = [
    { factor: diesel, qty: 320, dept: log, status: 'CONFIRMED' as const, module: 'Fleet' },
    { factor: electricity, qty: 4200, dept: mfg, status: 'VALIDATED' as const, module: 'Expense' },
    { factor: petrol, qty: 180, dept: log, status: 'DRAFT' as const, module: 'Fleet' },
    { factor: paper, qty: 65, dept: cor, status: 'CONFIRMED' as const, module: 'Purchase' },
    { factor: flight, qty: 1450, dept: cor, status: 'NEEDS_REVIEW' as const, module: 'Expense' },
    { factor: steel, qty: 900, dept: mfg, status: 'VALIDATED' as const, module: 'Manufacturing' },
    { factor: electricity, qty: 2100, dept: rnd, status: 'DRAFT' as const, module: 'Manual' },
    { factor: diesel, qty: 75, dept: mfg, status: 'CONFIRMED' as const, module: 'Fleet' },
  ]
  await db.insert(carbonTransactions).values(
    carbonRows.map((r, i) => ({
      reference: ref(i + 1),
      sourceModule: r.module,
      product: r.factor.name,
      quantity: r.qty,
      emissionFactorId: r.factor.id,
      calculatedCo2: Math.round(r.qty * r.factor.co2PerUnit * 100) / 100,
      departmentId: r.dept.id,
      status: r.status,
      createdById: esgMgr.id,
    })),
  )

  // ---------- CSR ACTIVITIES ----------
  const [treePlant, bloodDon, beachClean, esgWorkshop] = await db
    .insert(csrActivities)
    .values([
      { title: 'Tree Plantation Drive', categoryId: catEnv.id, description: 'Plant 500 saplings', evidenceRequired: true, points: 100 },
      { title: 'Blood Donation Camp', categoryId: catCommunity.id, description: 'Company-wide donation drive', evidenceRequired: false, points: 60 },
      { title: 'Beach Cleanup', categoryId: catEnv.id, description: 'Coastal waste collection', evidenceRequired: true, points: 80 },
      { title: 'ESG Awareness Workshop', categoryId: catCommunity.id, description: 'Sustainability training', evidenceRequired: false, points: 40 },
    ])
    .returning()

  // ---------- EMPLOYEE PARTICIPATIONS (mixed approval states) ----------
  // Spread createdAt across the fiscal year so the report time-range
  // filters (This month / This quarter / FY26) return distinct results:
  // two rows land in the current month, three earlier in FY26.
  const seedNow = new Date()
  const fyYear = seedNow.getFullYear()
  const daysAgo = (n: number) => {
    const d = new Date(seedNow)
    d.setDate(d.getDate() - n)
    return d
  }
  const participationSeed = [
    { user: priya, activity: treePlant, status: 'APPROVED' as const, points: 100, createdAt: daysAgo(3) },
    { user: karan, activity: treePlant, status: 'APPROVED' as const, points: 100, createdAt: daysAgo(1) },
    { user: aditi, activity: beachClean, status: 'PENDING' as const, points: 0, createdAt: new Date(fyYear, 2, 12) },
    { user: karan, activity: bloodDon, status: 'APPROVED' as const, points: 60, createdAt: new Date(fyYear, 4, 8) },
    { user: priya, activity: esgWorkshop, status: 'REJECTED' as const, points: 0, createdAt: new Date(fyYear, 1, 18) },
  ]
  await db.insert(employeeParticipations).values(
    participationSeed.map((p) => ({
      userId: p.user.id,
      activityId: p.activity.id,
      proofUrl: p.activity.evidenceRequired ? 'https://example.com/proof.jpg' : null,
      approvalStatus: p.status,
      pointsEarned: p.points,
      completionDate: p.status === 'APPROVED' ? p.createdAt : null,
      createdAt: p.createdAt,
    })),
  )
  // xp_ledger rows for approved CSR participations
  const csrXp = participationSeed
    .filter((p) => p.status === 'APPROVED')
    .map((p) => ({ userId: p.user.id, amount: p.points, source: `csr:${p.activity.id}` }))
  if (csrXp.length) await db.insert(xpLedger).values(csrXp)

  // ---------- ESG POLICIES ----------
  const [antiCorruption, dataPrivacy, sustainability] = await db
    .insert(esgPolicies)
    .values([
      { title: 'Anti-Corruption Policy', type: 'Governance', departmentId: cor.id, description: 'Zero tolerance for bribery.', mandatory: true },
      { title: 'Data Privacy Policy', type: 'Governance', departmentId: cor.id, description: 'GDPR-aligned data handling.', mandatory: true },
      { title: 'Sustainability Policy', type: 'Environmental', departmentId: mfg.id, description: 'Net-zero commitments.', mandatory: false },
    ])
    .returning()

  // ---------- POLICY ACKNOWLEDGEMENTS ----------
  await db.insert(policyAcknowledgements).values([
    { userId: priya.id, policyId: antiCorruption.id },
    { userId: priya.id, policyId: dataPrivacy.id },
    { userId: karan.id, policyId: antiCorruption.id },
    { userId: aditi.id, policyId: sustainability.id },
  ])

  // ---------- AUDITS ----------
  const [wasteAudit, vendorAudit] = await db
    .insert(audits)
    .values([
      { title: 'Q2 Waste Audit', departmentId: mfg.id, auditorId: auditor.id, findings: 'Segregation gaps in packaging line.', status: 'UNDER_REVIEW' },
      { title: 'Vendor Compliance Check', departmentId: log.id, auditorId: auditor.id, findings: 'Two vendors missing ESG certification.', status: 'RESOLVED' },
    ])
    .returning()

  // ---------- COMPLIANCE ISSUES (ownerId + dueDate REQUIRED) ----------
  // The OPEN overdue issue is dated in the current month (shows under every
  // range); the RESOLVED one is earlier in FY26 (shows only under FY26), so
  // the Governance report's closure rate differs across time ranges.
  const pastDue = daysAgo(2) // due 2 days ago → overdue
  const futureDue = new Date()
  futureDue.setDate(futureDue.getDate() + 20)
  await db.insert(complianceIssues).values([
    {
      auditId: wasteAudit.id,
      description: 'Install labelled waste bins on packaging line.',
      severity: 'HIGH',
      departmentId: mfg.id,
      ownerId: compliance.id,
      dueDate: pastDue, // OPEN + overdue → demo the overdue flag
      status: 'OPEN',
      createdAt: daysAgo(8),
    },
    {
      auditId: vendorAudit.id,
      description: 'Collect ESG certs from flagged vendors.',
      severity: 'MEDIUM',
      departmentId: log.id,
      ownerId: compliance.id,
      dueDate: futureDue,
      status: 'RESOLVED',
      resolutionDate: new Date(fyYear, 3, 2),
      createdAt: new Date(fyYear, 1, 10),
    },
    {
      auditId: vendorAudit.id,
      description: 'Update supplier code-of-conduct documentation.',
      severity: 'LOW',
      departmentId: log.id,
      ownerId: compliance.id,
      dueDate: new Date(fyYear, 5, 20),
      status: 'RESOLVED',
      resolutionDate: new Date(fyYear, 5, 18),
      createdAt: new Date(fyYear, 5, 5), // Jun 5 → inside the trailing-quarter window
    },
  ])

  // ---------- BADGES ----------
  const [greenBeginner, carbonSaver, teamPlayer, champion] = await db
    .insert(badges)
    .values([
      { name: 'Green Beginner', description: 'Earn your first 100 XP', icon: '🌱', unlockXp: 100 },
      { name: 'Carbon Saver', description: 'Reach 500 XP', icon: '♻️', unlockXp: 500 },
      { name: 'Team Player', description: 'Complete 3 challenges', icon: '🤝', unlockChallenges: 3 },
      { name: 'Sustainability Champion', description: 'Reach 3000 XP', icon: '🏆', unlockXp: 3000 },
    ])
    .returning()

  // ---------- BADGE AWARDS (high-XP users) ----------
  await db.insert(badgeAwards).values([
    { badgeId: greenBeginner.id, userId: priya.id },
    { badgeId: carbonSaver.id, userId: priya.id },
    { badgeId: champion.id, userId: priya.id },
    { badgeId: greenBeginner.id, userId: admin.id },
    { badgeId: carbonSaver.id, userId: admin.id },
    { badgeId: champion.id, userId: admin.id },
    { badgeId: greenBeginner.id, userId: aditi.id },
    { badgeId: carbonSaver.id, userId: aditi.id },
  ])

  // ---------- CHALLENGES (mixed statuses; difficulty→xpReward) ----------
  const [chDraft, chActive, chReview, chDone, chActive2] = await db
    .insert(challenges)
    .values([
      { title: 'Cycle to Work Week', categoryId: catMobility.id, esgCategory: 'ENVIRONMENTAL', difficulty: 'EASY', xpReward: 100, status: 'DRAFT', badgeId: teamPlayer.id },
      { title: 'Switch Off Campaign', categoryId: catEnergy.id, esgCategory: 'ENVIRONMENTAL', difficulty: 'MEDIUM', xpReward: 200, status: 'ACTIVE' },
      { title: 'Zero Waste Lunch', categoryId: catEnv.id, esgCategory: 'SOCIAL', difficulty: 'MEDIUM', xpReward: 200, status: 'UNDER_REVIEW' },
      { title: 'Solar Pledge', categoryId: catEnergy.id, esgCategory: 'ENVIRONMENTAL', difficulty: 'HARD', xpReward: 300, status: 'COMPLETED' },
      { title: 'Carpool Challenge', categoryId: catMobility.id, esgCategory: 'ENVIRONMENTAL', difficulty: 'HARD', xpReward: 300, status: 'ACTIVE' },
    ])
    .returning()

  // ---------- CHALLENGE PARTICIPATIONS (across lifecycle) ----------
  const cpSeed = [
    { challenge: chActive, user: karan, progress: 40, status: 'JOINED' as const, xp: 0 },
    { challenge: chReview, user: aditi, progress: 100, status: 'PROOF_SUBMITTED' as const, xp: 0 },
    { challenge: chDone, user: priya, progress: 100, status: 'COMPLETED' as const, xp: 300 },
    { challenge: chActive2, user: priya, progress: 100, status: 'APPROVED' as const, xp: 300 },
  ]
  await db.insert(challengeParticipations).values(
    cpSeed.map((c) => ({
      challengeId: c.challenge.id,
      userId: c.user.id,
      progress: c.progress,
      proofUrl: c.progress === 100 ? 'https://example.com/challenge-proof.jpg' : null,
      status: c.status,
      xpAwarded: c.xp,
    })),
  )
  const chXp = cpSeed
    .filter((c) => c.xp > 0)
    .map((c) => ({ userId: c.user.id, amount: c.xp, source: `challenge:${c.challenge.id}` }))
  if (chXp.length) await db.insert(xpLedger).values(chXp)

  // ---------- REWARDS ----------
  const [coffee, plantKit, dayOff] = await db
    .insert(rewards)
    .values([
      { name: 'Coffee Voucher', description: 'Free coffee for a week', pointsRequired: 200, stock: 10 },
      { name: 'Plant Kit', description: 'Desk plant starter kit', pointsRequired: 500, stock: 5 },
      { name: 'Day Off', description: 'One paid day off', pointsRequired: 2000, stock: 2 },
    ])
    .returning()

  // ---------- REWARD REDEMPTION (+ negative xp_ledger) ----------
  await db.insert(rewardRedemptions).values([
    { rewardId: coffee.id, userId: priya.id, pointsSpent: 200 },
  ])
  await db.insert(xpLedger).values([
    { userId: priya.id, amount: -200, source: `redeem:${coffee.id}` },
  ])

  // ---------- DEPARTMENT SCORES (one per dept, current period) ----------
  const scoreSeed = [
    { dept: mfg, env: 72, soc: 65, gov: 80 },
    { dept: log, env: 58, soc: 60, gov: 70 },
    { dept: cor, env: 85, soc: 78, gov: 90 },
    { dept: rnd, env: 68, soc: 55, gov: 62 },
  ]
  const withTotals = scoreSeed.map((s) => ({
    ...s,
    total: Math.round((s.env * 0.4 + s.soc * 0.3 + s.gov * 0.3) * 100) / 100,
  }))
  withTotals.sort((a, b) => b.total - a.total)
  await db.insert(departmentScores).values(
    withTotals.map((s, i) => ({
      departmentId: s.dept.id,
      period: PERIOD,
      environmental: s.env,
      social: s.soc,
      governance: s.gov,
      total: s.total,
      rank: i + 1,
    })),
  )

  // ---------- NOTIFICATIONS (for admin) ----------
  await db.insert(notifications).values([
    { userId: admin.id, type: 'APPROVAL', title: 'New participation pending', body: 'Aditi Shah submitted proof for Beach Cleanup.' },
    { userId: admin.id, type: 'COMPLIANCE', title: 'Overdue compliance issue', body: 'Waste bin installation is past due.' },
  ])

  // ---------- LOGIN TABLE (never prints DB password) ----------
  console.log('\n✅ Seed complete. Demo logins (all password: demo1234):\n')
  console.table([
    { email: 'admin@ecosphere.dev', role: 'ADMIN' },
    { email: 'esg@ecosphere.dev', role: 'ESG_MANAGER' },
    { email: 'hr@ecosphere.dev', role: 'HR_MANAGER' },
    { email: 'auditor@ecosphere.dev', role: 'AUDITOR' },
    { email: 'compliance@ecosphere.dev', role: 'COMPLIANCE_OFFICER' },
    { email: 'priya@ecosphere.dev', role: 'EMPLOYEE' },
    { email: 'karan@ecosphere.dev', role: 'EMPLOYEE' },
    { email: 'aditi@ecosphere.dev', role: 'EMPLOYEE' },
  ])
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
