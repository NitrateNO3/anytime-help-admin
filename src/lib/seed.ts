import { defaultPermissions } from './permissions'
import type {
  ActivityLog,
  Announcement,
  AppNotification,
  Banner,
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  DemoState,
  FeatureKey,
  Member,
  MemberCategory,
  MemberStatus,
  Plan,
  PlatformSettings,
  Priority,
  Rwa,
  Staff,
  StaffDepartment,
} from './types'

export const STATE_VERSION = 1

// Deterministic PRNG so the seeded demo looks the same on every reset.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const DAY = 86400000
const now = () => Date.now()
const daysAgo = (d: number, hour = 10) => {
  const t = new Date(now() - d * DAY)
  t.setHours(hour, (d * 7) % 60, 0, 0)
  return t.toISOString()
}
const daysAhead = (d: number) => new Date(now() + d * DAY).toISOString()

export const PLAN_IDS = { basic: 'plan_basic', pro: 'plan_pro', enterprise: 'plan_enterprise' }

export function seedPlans(): Plan[] {
  return [
    {
      id: PLAN_IDS.basic,
      name: 'Basic',
      tagline: 'Everything a society needs to get organised.',
      price: 2499,
      period: 'month',
      residentLimit: 250,
      staffLimit: 25,
      modules: ['complaints', 'announcements', 'notifications'],
      highlights: ['Society administration', 'Resident management', 'Staff management', 'Complaints and announcements'],
      status: 'Enabled',
    },
    {
      id: PLAN_IDS.pro,
      name: 'Professional',
      tagline: 'For growing societies that want deeper insight.',
      price: 5999,
      period: 'month',
      residentLimit: 1000,
      staffLimit: 80,
      modules: ['complaints', 'announcements', 'notifications', 'analytics', 'csvImport', 'platformBanners'],
      highlights: [
        'Everything in Basic',
        'Enhanced analytics',
        'Additional administration controls',
        'Expanded banner and announcement tools',
      ],
      status: 'Enabled',
      popular: true,
    },
    {
      id: PLAN_IDS.enterprise,
      name: 'Enterprise',
      tagline: 'Large townships and multi-tower communities.',
      price: 12999,
      period: 'month',
      residentLimit: 5000,
      staffLimit: 300,
      modules: [
        'complaints',
        'announcements',
        'notifications',
        'analytics',
        'csvImport',
        'platformBanners',
        'advancedRoles',
      ],
      highlights: [
        'Everything in Professional',
        'Advanced role configuration',
        'Additional platform management capabilities',
        'Customizable feature availability',
      ],
      status: 'Enabled',
    },
  ]
}

const FIRST = [
  'Aarav', 'Ishita', 'Kabir', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Priya', 'Dev', 'Kavya',
  'Nikhil', 'Tara', 'Siddharth', 'Riya', 'Aditya', 'Neha', 'Karan', 'Pooja', 'Yash', 'Diya', 'Manav', 'Simran',
]
const LAST = ['Sharma', 'Verma', 'Iyer', 'Kapoor', 'Nair', 'Gupta', 'Mehta', 'Reddy', 'Bose', 'Malhotra', 'Joshi', 'Rao']
const STAFF_FIRST = ['Ramesh', 'Suresh', 'Mahesh', 'Lakshmi', 'Gopal', 'Sunita', 'Raju', 'Kamla', 'Prakash', 'Mohan', 'Geeta']

// Fictional numbers in the reserved-looking 98000-xxxxx range; not real contacts.
const fakePhone = (n: number) => `+91 98000 ${String(10000 + n).slice(-5)}`

interface SocietySeed {
  rwa: Omit<Rwa, 'features' | 'subscription'> & { subscription?: Rwa['subscription'] }
  members: number
  staff: number
  complaints: number
  towers: string[]
}

function featuresFor(planId: string, plans: Plan[]): FeatureKey[] {
  return [...(plans.find((p) => p.id === planId)?.modules ?? [])]
}

export function createSeed(): DemoState {
  const r = rng(42)
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)]
  const plans = seedPlans()

  const societies: SocietySeed[] = [
    {
      rwa: {
        id: 'rwa_green_valley',
        name: 'Green Valley Residency',
        address: 'Plot 14, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pin: '201309',
        units: 420,
        regNo: 'UP/RWA/2014/0871',
        presidentName: 'Rajiv Malhotra',
        presidentPhone: fakePhone(101),
        adminName: 'Shalini Verma',
        adminEmail: 'admin@greenvalley.example',
        adminPhone: fakePhone(102),
        planId: PLAN_IDS.pro,
        status: 'Active',
        notes: 'Pilot society. Very engaged committee.',
        createdAt: daysAgo(330),
        source: 'seed',
      },
      members: 22,
      staff: 7,
      complaints: 14,
      towers: ['A', 'B', 'C'],
    },
    {
      rwa: {
        id: 'rwa_sunrise_heights',
        name: 'Sunrise Heights',
        address: '22 Outer Ring Road, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        pin: '560103',
        units: 280,
        regNo: 'KA/BLR/RWA/1129',
        presidentName: 'Lakshmi Iyer',
        presidentPhone: fakePhone(201),
        adminName: 'Arjun Nair',
        adminEmail: 'office@sunriseheights.example',
        adminPhone: fakePhone(202),
        planId: PLAN_IDS.basic,
        status: 'Active',
        createdAt: daysAgo(240),
        source: 'seed',
      },
      members: 16,
      staff: 5,
      complaints: 10,
      towers: ['T1', 'T2'],
    },
    {
      rwa: {
        id: 'rwa_maple',
        name: 'Maple Residency',
        address: 'Baner–Pashan Link Road',
        city: 'Pune',
        state: 'Maharashtra',
        pin: '411045',
        units: 180,
        presidentName: 'Kavya Joshi',
        presidentPhone: fakePhone(301),
        adminName: 'Nikhil Rao',
        adminEmail: 'committee@maple.example',
        adminPhone: fakePhone(302),
        planId: PLAN_IDS.enterprise,
        status: 'Trial',
        notes: 'Evaluating Enterprise for their upcoming second phase.',
        createdAt: daysAgo(120),
        source: 'seed',
        subscription: { status: 'Trial', startDate: daysAgo(12), renewalDate: daysAhead(18), trialEndsAt: daysAhead(18) },
      },
      members: 12,
      staff: 4,
      complaints: 7,
      towers: ['M'],
    },
    {
      rwa: {
        id: 'rwa_lotus',
        name: 'Lotus Enclave',
        address: 'Sector 50, Golf Course Extension',
        city: 'Gurugram',
        state: 'Haryana',
        pin: '122018',
        units: 150,
        presidentName: 'Manav Kapoor',
        presidentPhone: fakePhone(401),
        adminName: 'Simran Bose',
        adminEmail: 'rwa@lotusenclave.example',
        adminPhone: fakePhone(402),
        planId: PLAN_IDS.basic,
        status: 'Suspended',
        notes: 'Suspended pending committee re-election paperwork.',
        createdAt: daysAgo(190),
        source: 'seed',
        subscription: { status: 'Suspended', startDate: daysAgo(190), renewalDate: daysAgo(5) },
      },
      members: 8,
      staff: 3,
      complaints: 4,
      towers: ['L'],
    },
    {
      rwa: {
        id: 'rwa_orchid',
        name: 'Orchid Park Society',
        address: '7 Lake View Road, Kondapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pin: '500084',
        units: 96,
        presidentName: 'Diya Reddy',
        presidentPhone: fakePhone(501),
        adminName: 'Yash Gupta',
        adminEmail: 'orchidpark.rwa@example.com',
        adminPhone: fakePhone(502),
        planId: PLAN_IDS.pro,
        status: 'Pending',
        createdAt: daysAgo(2),
        source: 'join',
        joinRequest: { mode: 'approval', submittedAt: daysAgo(2) },
        subscription: { status: 'Pending Approval', startDate: daysAgo(2), renewalDate: daysAhead(28) },
      },
      members: 0,
      staff: 0,
      complaints: 0,
      towers: [],
    },
  ]

  const rwas: Rwa[] = []
  const members: Member[] = []
  const staff: Staff[] = []
  const complaints: Complaint[] = []
  let complaintSeq = 1001

  const departments: { dept: StaffDepartment; title: string; duties: string[] }[] = [
    { dept: 'Security', title: 'Security Supervisor', duties: ['Main gate', 'Visitor log'] },
    { dept: 'Housekeeping', title: 'Housekeeping Lead', duties: ['Lobby cleaning', 'Garbage collection'] },
    { dept: 'Maintenance', title: 'Maintenance Technician', duties: ['Lift checks', 'Common area repairs'] },
    { dept: 'Electrician', title: 'Electrician', duties: ['DG backup', 'Corridor lighting'] },
    { dept: 'Plumber', title: 'Plumber', duties: ['Water tanks', 'Leak repairs'] },
    { dept: 'Facility management', title: 'Facility Manager', duties: ['Clubhouse', 'Vendor coordination'] },
    { dept: 'Security', title: 'Security Guard', duties: ['Night patrol'] },
  ]

  const complaintTexts: Record<ComplaintCategory, string[]> = {
    Maintenance: ['Lift in tower stops between floors', 'Main door hinge broken in lobby'],
    Security: ['Unknown vehicle parked overnight near gate 2', 'CCTV camera near clubhouse not working'],
    Housekeeping: ['Garbage not collected from floor for two days', 'Staircase not cleaned this week'],
    Plumbing: ['Water leakage from ceiling in bathroom', 'Low water pressure in kitchen tap'],
    Electrical: ['Corridor lights flickering on 4th floor', 'Power socket sparking in common room'],
    Parking: ['Someone keeps parking in my allotted slot', 'Visitor parking blocked by bikes'],
    'Common areas': ['Gym treadmill out of order', 'Children’s play area swing broken'],
    Other: ['Stray dogs near the park at night', 'Request for extra intercom extension'],
  }

  for (const [si, s] of societies.entries()) {
    const sub =
      s.rwa.subscription ??
      ({ status: s.rwa.status === 'Active' ? 'Active' : 'Trial', startDate: s.rwa.createdAt, renewalDate: daysAhead(30 + si * 40) } as const)
    rwas.push({ ...s.rwa, subscription: sub, features: featuresFor(s.rwa.planId, plans) })

    const ageDays = Math.round((now() - new Date(s.rwa.createdAt).getTime()) / DAY)
    const societyMembers: Member[] = []
    for (let i = 0; i < s.members; i++) {
      const first = FIRST[(i * 5 + si * 3) % FIRST.length]
      const last = LAST[(i * 7 + si) % LAST.length]
      const status: MemberStatus = i === s.members - 1 ? 'Pending' : i === s.members - 2 ? 'Pending' : i % 9 === 8 ? 'Inactive' : 'Active'
      const m: Member = {
        id: `mem_${s.rwa.id.slice(4)}_${i + 1}`,
        rwaId: s.rwa.id,
        name: `${first} ${last}`,
        flat: `${s.towers[i % s.towers.length]}-${100 * (1 + (i % 9)) + (i % 4) + 1}`,
        phone: fakePhone(si * 1000 + 600 + i),
        email: `${first}.${last}${i}`.toLowerCase() + '@mail.example',
        category: pick<MemberCategory>(['Owner', 'Owner', 'Tenant', 'Family member']),
        status,
        createdAt: daysAgo(Math.max(1, Math.round(ageDays * (1 - i / Math.max(1, s.members)) - 3)), 9 + (i % 8)),
      }
      societyMembers.push(m)
    }
    members.push(...societyMembers)

    const societyStaff: Staff[] = []
    for (let i = 0; i < s.staff; i++) {
      const d = departments[i % departments.length]
      societyStaff.push({
        id: `stf_${s.rwa.id.slice(4)}_${i + 1}`,
        rwaId: s.rwa.id,
        name: `${STAFF_FIRST[(i + si * 2) % STAFF_FIRST.length]} ${LAST[(i * 3 + si) % LAST.length]}`,
        employeeId: `${s.rwa.name.slice(0, 2).toUpperCase()}-${String(101 + i)}`,
        department: d.dept,
        designation: d.title,
        phone: fakePhone(si * 1000 + 300 + i),
        responsibilities: d.duties,
        status: i === s.staff - 1 && s.staff > 4 ? 'Inactive' : 'Active',
        createdAt: daysAgo(Math.max(1, ageDays - 5 - i * 3)),
      })
    }
    staff.push(...societyStaff)

    const statuses: ComplaintStatus[] = ['New', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Resolved', 'In Progress']
    const priorities: Priority[] = ['Low', 'Medium', 'Medium', 'High', 'Urgent']
    const activeStaff = societyStaff.filter((x) => x.status === 'Active')
    const activeMembers = societyMembers.filter((x) => x.status === 'Active')
    for (let i = 0; i < s.complaints; i++) {
      const category = pick(Object.keys(complaintTexts) as ComplaintCategory[])
      const status = statuses[(i + si) % statuses.length]
      const member = activeMembers[(i * 3) % activeMembers.length]
      const staffMember = ['New', 'Open'].includes(status) ? undefined : activeStaff[i % activeStaff.length]
      const created = daysAgo(Math.max(1, Math.round((Math.min(ageDays, 150) * (s.complaints - i)) / s.complaints)), 8 + (i % 10))
      const history = [{ at: created, actor: member.name, text: 'Complaint raised' }]
      if (staffMember) history.push({ at: created, actor: s.rwa.adminName, text: `Assigned to ${staffMember.name}` })
      if (status !== 'New' && status !== 'Assigned') history.push({ at: created, actor: s.rwa.adminName, text: `Status changed to ${status}` })
      complaints.push({
        id: `cmp_${complaintSeq}`,
        code: `CMP-${complaintSeq++}`,
        rwaId: s.rwa.id,
        memberId: member.id,
        residentName: member.name,
        flat: member.flat,
        category,
        description: pick(complaintTexts[category]),
        priority: pick(priorities),
        staffId: staffMember?.id,
        status,
        createdAt: created,
        resolutionNotes: ['Resolved', 'Closed'].includes(status) ? 'Issue fixed and verified with the resident.' : '',
        history,
      })
    }
  }

  const announcements: Announcement[] = [
    {
      id: 'ann_1',
      rwaId: 'rwa_green_valley',
      title: 'Water supply interruption — Tower B',
      body: 'Overhead tank cleaning on Saturday from 10 AM to 2 PM. Please store water in advance.',
      status: 'Published',
      createdAt: daysAgo(3),
      publishedAt: daysAgo(3),
      expiresAt: daysAhead(4),
    },
    {
      id: 'ann_2',
      rwaId: 'rwa_green_valley',
      title: 'Diwali celebration at the clubhouse',
      body: 'Join us for rangoli, music and dinner at the central lawn. Families welcome!',
      status: 'Published',
      createdAt: daysAgo(10),
      publishedAt: daysAgo(10),
    },
    {
      id: 'ann_3',
      rwaId: 'rwa_green_valley',
      title: 'AGM agenda (draft)',
      body: 'Draft agenda for the annual general meeting. Committee review pending.',
      status: 'Draft',
      createdAt: daysAgo(1),
    },
    {
      id: 'ann_4',
      rwaId: 'rwa_sunrise_heights',
      title: 'New visitor entry process',
      body: 'From Monday, all visitors must be pre-approved by residents in the app.',
      status: 'Published',
      createdAt: daysAgo(6),
      publishedAt: daysAgo(6),
    },
    {
      id: 'ann_5',
      rwaId: 'rwa_sunrise_heights',
      title: 'Pest control schedule',
      body: 'Common-area pest control on the 1st and 15th of every month.',
      status: 'Published',
      createdAt: daysAgo(20),
      publishedAt: daysAgo(20),
    },
    {
      id: 'ann_6',
      rwaId: 'rwa_maple',
      title: 'Welcome to Anytime Help!',
      body: 'Our society is now on Anytime Help. Raise complaints and get updates right from your phone.',
      status: 'Published',
      createdAt: daysAgo(11),
      publishedAt: daysAgo(11),
    },
    {
      id: 'ann_7',
      rwaId: 'rwa_lotus',
      title: 'Committee elections',
      body: 'Nominations for the new RWA committee open next week.',
      status: 'Published',
      createdAt: daysAgo(30),
      publishedAt: daysAgo(30),
    },
  ]

  const banners: Banner[] = [
    {
      id: 'ban_1',
      title: 'Festive season safety tips',
      description: 'Keep your home safe while you travel — five quick checks.',
      image: 'preset:sunset',
      ctaLabel: 'Read tips',
      url: 'https://anytimehelp.example/safety',
      placement: 'Home screen',
      audience: 'Residents',
      targeting: 'all',
      rwaIds: [],
      startDate: daysAgo(5),
      endDate: daysAhead(20),
      priority: 1,
      status: 'Published',
      updatedAt: daysAgo(5),
    },
    {
      id: 'ban_2',
      title: 'Introducing complaint tracking',
      description: 'Residents can now follow every complaint from raised to resolved.',
      image: 'preset:ocean',
      ctaLabel: 'Learn more',
      url: 'https://anytimehelp.example/complaints',
      placement: 'Dashboard',
      audience: 'Everyone',
      targeting: 'selected',
      rwaIds: ['rwa_green_valley', 'rwa_sunrise_heights'],
      startDate: daysAgo(12),
      endDate: daysAhead(10),
      priority: 2,
      status: 'Published',
      updatedAt: daysAgo(12),
    },
    {
      id: 'ban_3',
      title: 'Monsoon maintenance checklist',
      description: 'Waterproofing, drain cleaning and more for your society.',
      image: 'preset:forest',
      ctaLabel: 'View checklist',
      url: 'https://anytimehelp.example/monsoon',
      placement: 'Banner section',
      audience: 'RWA admins',
      targeting: 'all',
      rwaIds: [],
      startDate: daysAhead(7),
      endDate: daysAhead(40),
      priority: 3,
      status: 'Scheduled',
      updatedAt: daysAgo(1),
    },
    {
      id: 'ban_4',
      title: 'Partner offer: home deep cleaning',
      description: 'Illustrative promo slot for partner offers in the resident app.',
      image: 'preset:violet',
      ctaLabel: 'See offer',
      url: 'https://anytimehelp.example/offers',
      placement: 'Promotional area',
      audience: 'Residents',
      targeting: 'specific',
      rwaIds: ['rwa_maple'],
      startDate: daysAgo(20),
      endDate: daysAhead(5),
      priority: 4,
      status: 'Paused',
      updatedAt: daysAgo(4),
    },
    {
      id: 'ban_5',
      title: 'Society AGM toolkit',
      description: 'Templates for notices, minutes and voting — coming soon.',
      image: 'preset:slate',
      ctaLabel: 'Get toolkit',
      url: 'https://anytimehelp.example/agm',
      placement: 'Dashboard',
      audience: 'RWA admins',
      targeting: 'all',
      rwaIds: [],
      startDate: daysAhead(2),
      endDate: daysAhead(30),
      priority: 5,
      status: 'Draft',
      updatedAt: daysAgo(0),
    },
  ]

  const notifications: AppNotification[] = [
    {
      id: 'ntf_1',
      title: 'Scheduled platform maintenance',
      message: 'Anytime Help will be briefly unavailable on Sunday 2–3 AM for upgrades.',
      type: 'Maintenance',
      scope: 'platform',
      audience: 'all',
      rwaIds: [],
      status: 'Published',
      createdAt: daysAgo(4),
      createdBy: 'Anytime Help Team',
    },
    {
      id: 'ntf_2',
      title: 'New analytics dashboard',
      message: 'Professional plan societies can now view complaint resolution trends.',
      type: 'Info',
      scope: 'platform',
      audience: 'selected',
      rwaIds: ['rwa_green_valley', 'rwa_orchid'],
      status: 'Published',
      createdAt: daysAgo(9),
      createdBy: 'Anytime Help Team',
    },
    {
      id: 'ntf_3',
      title: 'Lift maintenance tomorrow',
      message: 'Tower A lifts will be under maintenance from 11 AM to 1 PM.',
      type: 'Alert',
      scope: 'society',
      audience: 'selected',
      rwaIds: ['rwa_green_valley'],
      status: 'Published',
      createdAt: daysAgo(1),
      createdBy: 'Shalini Verma',
    },
  ]

  const activity: ActivityLog[] = [
    { id: 'act_1', type: 'rwa.join_request', actor: 'Yash Gupta', role: 'rwa_admin', rwaId: 'rwa_orchid', at: daysAgo(2, 15), description: 'Orchid Park Society requested to join (Professional plan, manual approval)' },
    { id: 'act_2', type: 'complaint.assigned', actor: 'Shalini Verma', role: 'rwa_admin', rwaId: 'rwa_green_valley', at: daysAgo(1, 12), description: 'CMP-1003 assigned to housekeeping staff' },
    { id: 'act_3', type: 'banner.published', actor: 'Anytime Help Admin', role: 'super_admin', at: daysAgo(5, 11), description: 'Banner “Festive season safety tips” published to all RWAs' },
    { id: 'act_4', type: 'rwa.status', actor: 'Anytime Help Admin', role: 'super_admin', rwaId: 'rwa_lotus', at: daysAgo(6, 17), description: 'Lotus Enclave suspended' },
    { id: 'act_5', type: 'member.created', actor: 'Arjun Nair', role: 'rwa_admin', rwaId: 'rwa_sunrise_heights', at: daysAgo(7, 10), description: 'Resident added to Sunrise Heights' },
    { id: 'act_6', type: 'plan.assigned', actor: 'Anytime Help Admin', role: 'super_admin', rwaId: 'rwa_maple', at: daysAgo(12, 9), description: 'Maple Residency started an Enterprise trial' },
    { id: 'act_7', type: 'staff.created', actor: 'Nikhil Rao', role: 'rwa_admin', rwaId: 'rwa_maple', at: daysAgo(14, 16), description: 'Staff account created for maintenance technician' },
    { id: 'act_8', type: 'rwa.created', actor: 'Anytime Help Admin', role: 'super_admin', rwaId: 'rwa_maple', at: daysAgo(120, 10), description: 'Maple Residency onboarded manually' },
    { id: 'act_9', type: 'rwa.status', actor: 'Anytime Help Admin', role: 'super_admin', rwaId: 'rwa_sunrise_heights', at: daysAgo(238, 13), description: 'Sunrise Heights activated' },
    { id: 'act_10', type: 'rwa.created', actor: 'Anytime Help Admin', role: 'super_admin', rwaId: 'rwa_sunrise_heights', at: daysAgo(240, 10), description: 'Sunrise Heights onboarded manually' },
  ]

  const settings: PlatformSettings = {
    platformName: 'Anytime Help',
    brandColor: '#4f46e5',
    supportEmail: 'support@anytimehelp.example',
    supportPhone: '+91 98000 00000',
    defaultPlanId: PLAN_IDS.basic,
    defaultStatus: 'Trial',
    features: {
      complaints: true,
      announcements: true,
      notifications: true,
      analytics: true,
      csvImport: true,
      platformBanners: true,
      advancedRoles: true,
    },
  }

  return {
    version: STATE_VERSION,
    rwas,
    members,
    staff,
    complaints,
    announcements,
    banners,
    plans,
    notifications,
    permissions: defaultPermissions(),
    activity,
    settings,
  }
}
