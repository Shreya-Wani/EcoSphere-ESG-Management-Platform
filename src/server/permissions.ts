import { Session } from 'next-auth'

type Role = 'ADMIN' | 'ESG_MANAGER' | 'HR_MANAGER' | 'AUDITOR' | 'COMPLIANCE_OFFICER' | 'EMPLOYEE'
type Entity =
  | 'department'
  | 'category'
  | 'emissionFactor'
  | 'productProfile'
  | 'goal'
  | 'carbon'
  | 'csrActivity'
  | 'participation'
  | 'policy'
  | 'acknowledgement'
  | 'audit'
  | 'complianceIssue'
  | 'challenge'
  | 'challengeParticipation'
  | 'badge'
  | 'reward'
  | 'notification'
  | 'esgConfig'

type Action = 'create' | 'read' | 'update' | 'delete' | 'approve'

const ALL_ROLES: Role[] = [
  'ADMIN',
  'ESG_MANAGER',
  'HR_MANAGER',
  'AUDITOR',
  'COMPLIANCE_OFFICER',
  'EMPLOYEE',
]

// Convention: `delete` mirrors `update` for every entity — whoever can edit a
// record can remove it — so the delete affordances the UI shows to a "manage"
// role actually succeed instead of 403-ing. Self-service actions employees
// perform on their OWN behalf (joining a CSR activity, acknowledging a policy)
// are open to every authenticated role.
const permissionMatrix: Record<Entity, Record<Action, Role[]>> = {
  department: {
    create: ['ADMIN'],
    read: ALL_ROLES,
    update: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
  },
  category: {
    create: ['ADMIN'],
    read: ALL_ROLES,
    update: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
  },
  emissionFactor: {
    create: ['ADMIN', 'ESG_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'ESG_MANAGER'],
    delete: ['ADMIN', 'ESG_MANAGER'],
    approve: ['ADMIN', 'ESG_MANAGER'],
  },
  productProfile: {
    create: ['ADMIN', 'ESG_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'ESG_MANAGER'],
    delete: ['ADMIN', 'ESG_MANAGER'],
    approve: ['ADMIN', 'ESG_MANAGER'],
  },
  goal: {
    create: ['ADMIN', 'ESG_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'ESG_MANAGER'],
    delete: ['ADMIN', 'ESG_MANAGER'],
    approve: ['ADMIN', 'ESG_MANAGER'],
  },
  carbon: {
    create: ['ADMIN', 'ESG_MANAGER', 'EMPLOYEE'],
    read: ALL_ROLES,
    update: ['ADMIN', 'ESG_MANAGER'],
    delete: ['ADMIN', 'ESG_MANAGER'],
    approve: ['ADMIN', 'ESG_MANAGER'],
  },
  csrActivity: {
    create: ['ADMIN', 'HR_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'HR_MANAGER'],
    delete: ['ADMIN', 'HR_MANAGER'],
    approve: ['ADMIN', 'HR_MANAGER'],
  },
  participation: {
    // Any employee (of any role) can join a CSR activity on their own behalf.
    create: ALL_ROLES,
    read: ALL_ROLES,
    update: ['ADMIN', 'HR_MANAGER'],
    delete: ['ADMIN', 'HR_MANAGER'],
    approve: ['ADMIN', 'HR_MANAGER'],
  },
  policy: {
    create: ['ADMIN', 'COMPLIANCE_OFFICER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'COMPLIANCE_OFFICER'],
    delete: ['ADMIN', 'COMPLIANCE_OFFICER'],
    approve: ['ADMIN', 'COMPLIANCE_OFFICER'],
  },
  acknowledgement: {
    // Everyone acknowledges the policies that apply to them.
    create: ALL_ROLES,
    read: ALL_ROLES,
    update: ['ADMIN', 'COMPLIANCE_OFFICER'],
    delete: ['ADMIN', 'COMPLIANCE_OFFICER'],
    approve: ['ADMIN', 'COMPLIANCE_OFFICER'],
  },
  audit: {
    create: ['ADMIN', 'AUDITOR'],
    read: ALL_ROLES,
    update: ['ADMIN', 'AUDITOR'],
    delete: ['ADMIN', 'AUDITOR'],
    approve: ['ADMIN', 'AUDITOR'],
  },
  complianceIssue: {
    create: ['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR'],
    read: ALL_ROLES,
    update: ['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR'],
    delete: ['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR'],
    approve: ['ADMIN', 'COMPLIANCE_OFFICER'],
  },
  challenge: {
    create: ['ADMIN', 'HR_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'HR_MANAGER'],
    delete: ['ADMIN', 'HR_MANAGER'],
    approve: ['ADMIN', 'HR_MANAGER'],
  },
  challengeParticipation: {
    // Any employee can join a challenge and submit their own proof.
    create: ALL_ROLES,
    read: ALL_ROLES,
    update: ['ADMIN', 'HR_MANAGER'],
    delete: ['ADMIN', 'HR_MANAGER'],
    approve: ['ADMIN', 'HR_MANAGER'],
  },
  badge: {
    create: ['ADMIN'],
    read: ALL_ROLES,
    update: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
  },
  reward: {
    create: ['ADMIN', 'HR_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN', 'HR_MANAGER'],
    delete: ['ADMIN', 'HR_MANAGER'],
    approve: ['ADMIN', 'HR_MANAGER'],
  },
  notification: {
    create: ['ADMIN', 'ESG_MANAGER', 'HR_MANAGER'],
    read: ALL_ROLES,
    update: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
  },
  esgConfig: {
    create: ['ADMIN'],
    read: ALL_ROLES,
    update: ['ADMIN'],
    delete: ['ADMIN'],
    approve: ['ADMIN'],
  },
}

export function hasPermission(session: Session | null, entity: Entity, action: Action): boolean {
  if (!session?.user) return false

  const role = (session.user as any).role as Role
  const allowedRoles = permissionMatrix[entity][action]

  return allowedRoles.includes(role)
}

export function requirePermission(session: Session | null, entity: Entity, action: Action) {
  if (!hasPermission(session, entity, action)) {
    throw new Response('Forbidden', { status: 403 })
  }
}

export const permissions = permissionMatrix
