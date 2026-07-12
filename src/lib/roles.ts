export type Role =
  | 'ADMIN'
  | 'ESG_MANAGER'
  | 'HR_MANAGER'
  | 'AUDITOR'
  | 'COMPLIANCE_OFFICER'
  | 'EMPLOYEE'

/**
 * Client-side permission helpers for showing/hiding UI affordances only.
 * The server permission matrix (permissions.ts) is the authoritative gate
 * and independently returns 403 — this just avoids offering dead buttons.
 * These MUST stay in sync with permissions.ts.
 */
const isAny =
  (...roles: Role[]) =>
  (r: Role) =>
    roles.includes(r)

export const can = {
  // --- Environmental (Mitesh) ---
  manageEmissionFactor: isAny('ADMIN', 'ESG_MANAGER'),
  manageProductProfile: isAny('ADMIN', 'ESG_MANAGER'),
  manageGoal: isAny('ADMIN', 'ESG_MANAGER'),
  createCarbon: isAny('ADMIN', 'ESG_MANAGER', 'EMPLOYEE'),
  manageCarbon: isAny('ADMIN', 'ESG_MANAGER'), // edit / delete / advance status

  // --- Categories & Departments (Shivam / admin master data) ---
  manageCategory: isAny('ADMIN'),
  manageDepartment: isAny('ADMIN'),

  // --- Social (Hetvi) ---
  manageCsr: isAny('ADMIN', 'HR_MANAGER'),
  joinActivity: isAny('ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'),
  approveParticipation: isAny('ADMIN', 'HR_MANAGER'),

  // --- Governance (Hetvi) ---
  managePolicy: isAny('ADMIN', 'COMPLIANCE_OFFICER'),
  acknowledge: isAny('ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'),
  manageAudit: isAny('ADMIN', 'AUDITOR'),
  manageCompliance: isAny('ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR'),
  resolveCompliance: isAny('ADMIN', 'COMPLIANCE_OFFICER'),

  // --- Gamification (Shreya) ---
  manageChallenge: isAny('ADMIN', 'HR_MANAGER'),
  joinChallenge: isAny('ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'),
  approveChallenge: isAny('ADMIN', 'HR_MANAGER'),
  manageReward: isAny('ADMIN', 'HR_MANAGER'),
  redeemReward: isAny('ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'),
  manageBadge: isAny('ADMIN'),

  // --- Platform ---
  recalculate: isAny('ADMIN', 'ESG_MANAGER'),
  manageConfig: isAny('ADMIN'),

  /** @deprecated prefer the entity-specific manage* helper. Kept for existing callers. */
  remove: isAny('ADMIN'),
}
