export type Role = 'super_admin' | 'rwa_admin' | 'staff_manager' | 'resident'

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  rwa_admin: 'RWA Admin / President',
  staff_manager: 'Staff Manager',
  resident: 'Resident / Member',
}

export type RwaStatus = 'Active' | 'Pending' | 'Suspended' | 'Trial' | 'Deactivated'
export type SubscriptionStatus = 'Trial' | 'Pending Approval' | 'Active' | 'Expired' | 'Suspended'

export type FeatureKey =
  | 'complaints'
  | 'announcements'
  | 'notifications'
  | 'analytics'
  | 'csvImport'
  | 'platformBanners'
  | 'advancedRoles'

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  complaints: 'Complaints',
  announcements: 'Announcements',
  notifications: 'Notifications',
  analytics: 'Society analytics',
  csvImport: 'CSV member import',
  platformBanners: 'Platform banners',
  advancedRoles: 'Advanced role configuration',
}

export interface Subscription {
  status: SubscriptionStatus
  startDate: string
  renewalDate: string
  trialEndsAt?: string
}

export interface JoinRequest {
  mode: 'approval' | 'purchase'
  submittedAt: string
  /** Demo-only marker. No money is ever collected. */
  demoPurchaseSucceeded?: boolean
}

export interface Rwa {
  id: string
  name: string
  logo?: string
  address: string
  city: string
  state: string
  pin: string
  units: number
  regNo?: string
  presidentName: string
  presidentPhone: string
  adminName: string
  adminEmail: string
  adminPhone: string
  planId: string
  status: RwaStatus
  subscription: Subscription
  features: FeatureKey[]
  notes?: string
  createdAt: string
  source: 'manual' | 'join' | 'seed'
  joinRequest?: JoinRequest
}

export type MemberStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected'
export type MemberCategory = 'Owner' | 'Tenant' | 'Family member' | 'Other'

export interface Member {
  id: string
  rwaId: string
  name: string
  flat: string
  phone: string
  email: string
  category: MemberCategory
  status: MemberStatus
  createdAt: string
}

export const STAFF_DEPARTMENTS = [
  'Security',
  'Housekeeping',
  'Maintenance',
  'Electrician',
  'Plumber',
  'Facility management',
  'Other',
] as const
export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number]

export interface Staff {
  id: string
  rwaId: string
  name: string
  employeeId: string
  department: StaffDepartment
  designation: string
  phone: string
  responsibilities: string[]
  status: 'Active' | 'Inactive'
  createdAt: string
}

export const COMPLAINT_CATEGORIES = [
  'Maintenance',
  'Security',
  'Housekeeping',
  'Plumbing',
  'Electrical',
  'Parking',
  'Common areas',
  'Other',
] as const
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]

export const COMPLAINT_STATUSES = ['New', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'] as const
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface ComplaintEvent {
  at: string
  actor: string
  text: string
}

export interface Complaint {
  id: string
  code: string
  rwaId: string
  memberId?: string
  residentName: string
  flat: string
  category: ComplaintCategory
  description: string
  priority: Priority
  staffId?: string
  status: ComplaintStatus
  createdAt: string
  resolutionNotes: string
  history: ComplaintEvent[]
}

export interface Announcement {
  id: string
  rwaId: string
  title: string
  body: string
  image?: string
  status: 'Draft' | 'Published'
  expiresAt?: string
  createdAt: string
  publishedAt?: string
}

export const BANNER_PLACEMENTS = ['Home screen', 'Dashboard', 'Banner section', 'Promotional area'] as const
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]
export type BannerTargeting = 'all' | 'selected' | 'specific'
export type BannerStatus = 'Draft' | 'Scheduled' | 'Published' | 'Paused'

export interface Banner {
  id: string
  title: string
  description: string
  /** Either a preset key ("preset:<name>") or an image URL */
  image: string
  ctaLabel: string
  url: string
  placement: BannerPlacement
  audience: 'Residents' | 'RWA admins' | 'Everyone'
  targeting: BannerTargeting
  rwaIds: string[]
  startDate: string
  endDate: string
  priority: number
  status: BannerStatus
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  tagline: string
  price: number
  period: 'month' | 'year'
  residentLimit: number
  staffLimit: number
  modules: FeatureKey[]
  highlights: string[]
  status: 'Enabled' | 'Disabled'
  popular?: boolean
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'Info' | 'Alert' | 'Maintenance' | 'Event'
  scope: 'platform' | 'society'
  audience: 'all' | 'selected'
  rwaIds: string[]
  status: 'Draft' | 'Published'
  createdAt: string
  createdBy: string
}

export const MODULES = [
  'members',
  'staff',
  'complaints',
  'announcements',
  'banners',
  'plans',
  'rwaSettings',
  'analytics',
  'notifications',
  'activityLogs',
] as const
export type Module = (typeof MODULES)[number]

export const MODULE_LABELS: Record<Module, string> = {
  members: 'Members',
  staff: 'Staff',
  complaints: 'Complaints',
  announcements: 'Announcements',
  banners: 'Banners',
  plans: 'Plans',
  rwaSettings: 'RWA Settings',
  analytics: 'Analytics',
  notifications: 'Notifications',
  activityLogs: 'Activity Logs',
}

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'publish', 'approve'] as const
export type Action = (typeof ACTIONS)[number]

export type PermissionMatrix = Record<Role, Record<Module, Record<Action, boolean>>>

export type ActivityType =
  | 'rwa.created'
  | 'rwa.updated'
  | 'rwa.status'
  | 'rwa.join_request'
  | 'member.created'
  | 'member.updated'
  | 'staff.created'
  | 'staff.updated'
  | 'complaint.created'
  | 'complaint.assigned'
  | 'complaint.status'
  | 'banner.published'
  | 'banner.updated'
  | 'plan.assigned'
  | 'plan.updated'
  | 'permission.changed'
  | 'announcement.published'
  | 'notification.published'
  | 'settings.updated'

export interface ActivityLog {
  id: string
  type: ActivityType
  actor: string
  role: Role
  rwaId?: string
  at: string
  description: string
}

export interface PlatformSettings {
  platformName: string
  logo?: string
  brandColor: string
  supportEmail: string
  supportPhone: string
  defaultPlanId: string
  defaultStatus: RwaStatus
  features: Record<FeatureKey, boolean>
}

export interface DemoState {
  version: number
  rwas: Rwa[]
  members: Member[]
  staff: Staff[]
  complaints: Complaint[]
  announcements: Announcement[]
  banners: Banner[]
  plans: Plan[]
  notifications: AppNotification[]
  permissions: PermissionMatrix
  activity: ActivityLog[]
  settings: PlatformSettings
}

export interface Session {
  role: Role
  rwaId: string
}
