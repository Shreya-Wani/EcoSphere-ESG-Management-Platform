// =============================================================
// EcoSphere — Drizzle ORM Schema (Neon Postgres)
// File: src/db/schema.ts
// OWNER: Shivam. FROZEN after Phase 0 — all changes go through him.
// Push with: npx drizzle-kit push   (no migration files in hackathon)
// =============================================================
import {
  pgTable, pgEnum, text, varchar, integer, real, boolean,
  timestamp, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------- ENUMS ----------
export const roleEnum = pgEnum("role", [
  "ADMIN", "ESG_MANAGER", "HR_MANAGER", "AUDITOR", "COMPLIANCE_OFFICER", "EMPLOYEE",
]);
export const esgCategoryEnum = pgEnum("esg_category", ["ENVIRONMENTAL", "SOCIAL", "GOVERNANCE"]);
export const categoryTypeEnum = pgEnum("category_type", ["CSR_ACTIVITY", "CHALLENGE"]);
export const emissionCategoryEnum = pgEnum("emission_category", ["FUEL", "ELECTRICITY", "MATERIAL", "TRANSPORT"]);
export const carbonStatusEnum = pgEnum("carbon_status", ["DRAFT", "CONFIRMED", "VALIDATED", "NEEDS_REVIEW", "POSTED"]);
export const goalStatusEnum = pgEnum("goal_status", ["DRAFT", "ACTIVE", "ON_TRACK", "COMPLETED", "EXPIRED"]);
export const approvalStatusEnum = pgEnum("approval_status", ["PENDING", "APPROVED", "REJECTED"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["DRAFT", "ACTIVE", "UNDER_REVIEW", "COMPLETED", "ARCHIVED"]);
export const participationStatusEnum = pgEnum("participation_status", ["JOINED", "PROOF_SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"]);
export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);
export const severityEnum = pgEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const complianceStatusEnum = pgEnum("compliance_status", ["OPEN", "UNDER_REVIEW", "RESOLVED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["APPROVAL", "BADGE", "COMPLIANCE", "POLICY_REMINDER", "REWARD"]);
export const statusEnum = pgEnum("record_status", ["ACTIVE", "INACTIVE"]);

const id = () => text("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at").defaultNow().notNull();

// ---------- ORG BACKBONE ----------
export const departments = pgTable("departments", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 12 }).notNull(),
  headId: text("head_id"), // FK to users added via relation (circular)
  parentId: text("parent_id"),
  employeeCount: integer("employee_count").default(0).notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("departments_code_uq").on(t.code)]);

export const users = pgTable("users", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("EMPLOYEE").notNull(),
  departmentId: text("department_id").references(() => departments.id),
  totalXp: integer("total_xp").default(0).notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("users_email_uq").on(t.email),
  index("users_department_idx").on(t.departmentId),
  index("users_role_idx").on(t.role),
]);

export const categories = pgTable("categories", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  type: categoryTypeEnum("type").notNull(), // CSR_ACTIVITY | CHALLENGE
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
});

// ---------- ENVIRONMENTAL (owner: Mitesh) ----------
export const emissionFactors = pgTable("emission_factors", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  category: emissionCategoryEnum("category").notNull(),
  unit: varchar("unit", { length: 24 }).notNull(),            // L, kWh, kg, km
  co2PerUnit: real("co2_per_unit").notNull(),                  // kg CO2e per unit
  source: varchar("source", { length: 160 }),
  country: varchar("country", { length: 80 }),
  effectiveDate: timestamp("effective_date"),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
});

export const productEsgProfiles = pgTable("product_esg_profiles", {
  id: id(),
  product: varchar("product", { length: 160 }).notNull(),
  emissionFactorId: text("emission_factor_id").references(() => emissionFactors.id),
  recyclable: boolean("recyclable").default(false).notNull(),
  hazardous: boolean("hazardous").default(false).notNull(),
  greenAlternative: varchar("green_alternative", { length: 160 }),
  carbonCategory: emissionCategoryEnum("carbon_category"),
  createdAt: createdAt(),
});

export const environmentalGoals = pgTable("environmental_goals", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  departmentId: text("department_id").references(() => departments.id).notNull(),
  targetCo2: real("target_co2").notNull(),                     // tonnes
  currentCo2: real("current_co2").default(0).notNull(),
  deadline: timestamp("deadline"),
  status: goalStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
}, (t) => [index("goals_department_idx").on(t.departmentId), index("goals_status_idx").on(t.status)]);

export const carbonTransactions = pgTable("carbon_transactions", {
  id: id(),
  reference: varchar("reference", { length: 24 }).notNull(),   // CT-00001 (app-generated)
  sourceModule: varchar("source_module", { length: 40 }).default("Manual").notNull(), // Manual|Fleet|Purchase|Expense|Manufacturing
  product: varchar("product", { length: 160 }),
  quantity: real("quantity").notNull(),
  emissionFactorId: text("emission_factor_id").references(() => emissionFactors.id).notNull(),
  calculatedCo2: real("calculated_co2").notNull(),             // quantity * co2PerUnit (server-computed)
  departmentId: text("department_id").references(() => departments.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: carbonStatusEnum("status").default("DRAFT").notNull(),
  createdById: text("created_by_id").references(() => users.id),
}, (t) => [
  uniqueIndex("carbon_ref_uq").on(t.reference),
  index("carbon_department_idx").on(t.departmentId),
  index("carbon_status_idx").on(t.status),
]);

// ---------- SOCIAL (owner: Hetvi) ----------
export const csrActivities = pgTable("csr_activities", {
  id: id(),
  title: varchar("title", { length: 160 }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  description: text("description"),
  date: timestamp("date"),
  evidenceRequired: boolean("evidence_required").default(true).notNull(),
  points: integer("points").default(50).notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
}, (t) => [index("csr_status_idx").on(t.status)]);

export const employeeParticipations = pgTable("employee_participations", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  activityId: text("activity_id").references(() => csrActivities.id).notNull(),
  proofUrl: text("proof_url"),
  approvalStatus: approvalStatusEnum("approval_status").default("PENDING").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  completionDate: timestamp("completion_date"),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("participation_user_activity_uq").on(t.userId, t.activityId), // idempotent join
  index("participation_status_idx").on(t.approvalStatus),
]);

// ---------- GOVERNANCE (owner: Hetvi) ----------
export const esgPolicies = pgTable("esg_policies", {
  id: id(),
  title: varchar("title", { length: 160 }).notNull(),
  type: varchar("type", { length: 80 }),
  departmentId: text("department_id").references(() => departments.id),
  description: text("description"),
  version: varchar("version", { length: 16 }).default("1.0").notNull(),
  effectiveDate: timestamp("effective_date"),
  mandatory: boolean("mandatory").default(true).notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
});

export const policyAcknowledgements = pgTable("policy_acknowledgements", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  policyId: text("policy_id").references(() => esgPolicies.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("ack_user_policy_uq").on(t.userId, t.policyId)]); // idempotent

export const audits = pgTable("audits", {
  id: id(),
  title: varchar("title", { length: 160 }).notNull(),
  departmentId: text("department_id").references(() => departments.id),
  auditorId: text("auditor_id").references(() => users.id),
  date: timestamp("date"),
  findings: text("findings"),
  status: complianceStatusEnum("status").default("OPEN").notNull(),
  createdAt: createdAt(),
});

export const complianceIssues = pgTable("compliance_issues", {
  id: id(),
  auditId: text("audit_id").references(() => audits.id),
  description: text("description").notNull(),
  severity: severityEnum("severity").default("MEDIUM").notNull(),
  departmentId: text("department_id").references(() => departments.id),
  ownerId: text("owner_id").references(() => users.id).notNull(),   // REQUIRED (business rule)
  dueDate: timestamp("due_date").notNull(),                          // REQUIRED (business rule)
  status: complianceStatusEnum("status").default("OPEN").notNull(),
  resolutionDate: timestamp("resolution_date"),
  createdAt: createdAt(),
}, (t) => [index("issues_status_idx").on(t.status), index("issues_due_idx").on(t.dueDate)]);

// ---------- GAMIFICATION (owner: Shreya) ----------
export const challenges = pgTable("challenges", {
  id: id(),
  title: varchar("title", { length: 160 }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  esgCategory: esgCategoryEnum("esg_category").default("ENVIRONMENTAL").notNull(),
  description: text("description"),
  difficulty: difficultyEnum("difficulty").default("MEDIUM").notNull(),
  xpReward: integer("xp_reward").notNull(),                    // from XP rules (Easy 100 / Med 200 / Hard 300)
  evidenceRequired: boolean("evidence_required").default(true).notNull(),
  badgeId: text("badge_id"),                                    // optional badge awarded on completion
  deadline: timestamp("deadline"),
  maxParticipants: integer("max_participants"),
  status: challengeStatusEnum("status").default("DRAFT").notNull(),
  createdAt: createdAt(),
}, (t) => [index("challenges_status_idx").on(t.status)]);

export const challengeParticipations = pgTable("challenge_participations", {
  id: id(),
  challengeId: text("challenge_id").references(() => challenges.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  progress: integer("progress").default(0).notNull(),          // 0..100
  proofUrl: text("proof_url"),
  status: participationStatusEnum("status").default("JOINED").notNull(),
  xpAwarded: integer("xp_awarded").default(0).notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("cp_user_challenge_uq").on(t.userId, t.challengeId),
  index("cp_status_idx").on(t.status),
]);

export const badges = pgTable("badges", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 16 }).default("🏅").notNull(), // emoji is fine for hackathon
  // unlock rule kept simple + machine-checkable:
  unlockXp: integer("unlock_xp"),                               // award when totalXp >= unlockXp
  unlockChallenges: integer("unlock_challenges"),               // or completed-challenge count >=
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
});

export const badgeAwards = pgTable("badge_awards", {
  id: id(),
  badgeId: text("badge_id").references(() => badges.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("badge_user_uq").on(t.badgeId, t.userId)]); // idempotent auto-award

export const rewards = pgTable("rewards", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  pointsRequired: integer("points_required").notNull(),
  stock: integer("stock").default(0).notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: createdAt(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: id(),
  rewardId: text("reward_id").references(() => rewards.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  pointsSpent: integer("points_spent").notNull(),
  createdAt: createdAt(),
}, (t) => [index("redemption_user_idx").on(t.userId)]);

export const xpLedger = pgTable("xp_ledger", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),                          // negative = reward redemption
  source: varchar("source", { length: 120 }).notNull(),        // "challenge:<id>" | "csr:<id>" | "bonus:streak" | "redeem:<id>"
  createdAt: createdAt(),
}, (t) => [index("xp_user_idx").on(t.userId)]);

// ---------- SCORING (owner: Shivam) ----------
export const departmentScores = pgTable("department_scores", {
  id: id(),
  departmentId: text("department_id").references(() => departments.id).notNull(),
  period: varchar("period", { length: 7 }).notNull(),           // "2026-07"
  environmental: real("environmental").default(0).notNull(),    // 0..100
  social: real("social").default(0).notNull(),
  governance: real("governance").default(0).notNull(),
  total: real("total").default(0).notNull(),                    // weighted
  rank: integer("rank"),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("score_dept_period_uq").on(t.departmentId, t.period),
  index("score_period_idx").on(t.period),
]);

// ---------- PLATFORM (owner: Shivam) ----------
export const notifications = pgTable("notifications", {
  id: id(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  read: boolean("read").default(false).notNull(),
  createdAt: createdAt(),
}, (t) => [index("notif_user_idx").on(t.userId), index("notif_read_idx").on(t.read)]);

export const esgConfig = pgTable("esg_config", {
  id: id(),                                                     // singleton row, seeded
  weightEnvironmental: real("weight_environmental").default(0.4).notNull(),
  weightSocial: real("weight_social").default(0.3).notNull(),
  weightGovernance: real("weight_governance").default(0.3).notNull(),
  autoEmissionCalc: boolean("auto_emission_calc").default(true).notNull(),
  evidenceRequired: boolean("evidence_required").default(true).notNull(),
  badgeAutoAward: boolean("badge_auto_award").default(true).notNull(),
  emailAlerts: boolean("email_alerts").default(false).notNull(),
  xpEasy: integer("xp_easy").default(100).notNull(),
  xpMedium: integer("xp_medium").default(200).notNull(),
  xpHard: integer("xp_hard").default(300).notNull(),
  streakBonusEnabled: boolean("streak_bonus_enabled").default(true).notNull(),   // +10% after 4 weeks
  deptMultiplierEnabled: boolean("dept_multiplier_enabled").default(true).notNull(), // lowest dept 1.15x
  earlyBirdEnabled: boolean("early_bird_enabled").default(false).notNull(),      // +20 XP if joined <48h
});

// ---------- RELATIONS (query-layer sugar) ----------
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  participations: many(employeeParticipations),
  challengeParticipations: many(challengeParticipations),
  badges: many(badgeAwards),
  xp: many(xpLedger),
  notifications: many(notifications),
}));
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  goals: many(environmentalGoals),
  scores: many(departmentScores),
  carbon: many(carbonTransactions),
}));
export const challengesRelations = relations(challenges, ({ many }) => ({
  participations: many(challengeParticipations),
}));
export const csrActivitiesRelations = relations(csrActivities, ({ many }) => ({
  participations: many(employeeParticipations),
}));
export const auditsRelations = relations(audits, ({ many }) => ({
  issues: many(complianceIssues),
}));

// LEVEL THRESHOLDS (constant, not a table — from wireframe)
// 1 Sprout 0–500 · 2 Grower 500–1500 · 3 Steward 1500–3000 · 4 Champion 3000–6000 · 5 Guardian 6000+
export const LEVELS = [
  { level: 1, name: "Sprout", min: 0 },
  { level: 2, name: "Grower", min: 500 },
  { level: 3, name: "Steward", min: 1500 },
  { level: 4, name: "Champion", min: 3000 },
  { level: 5, name: "Guardian", min: 6000 },
] as const;
