export type StaffRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "support"
  | "moderator";

export type AccountStatus = "active" | "disabled" | "banned";
export type UserStatus = "active" | "banned";
export type CatalogType = "frame" | "entry" | "badge" | "wallpaper";
export type AssignDuration = "1" | "7" | "30" | "custom" | "permanent";
export type LedgerDirection = "credit" | "debit";
export type WalletOwnerType = "user" | "reseller";
export type WalletCurrency = "coin" | "diamond";
export type UserItemStatus = "active" | "expired" | "removed";
export type CountryCode = "PK" | "IN" | "BD";
export type AgencyStatus = "active" | "suspended" | "frozen";
export type HostStatus = "active" | "suspended" | "frozen";
export type ComplaintStatus =
  | "received"
  | "under_review"
  | "action_taken"
  | "rejected"
  | "closed";
export type SosStatus =
  | "open"
  | "acknowledged"
  | "handling"
  | "escalated"
  | "resolved";
export type FreezeStatus =
  | "pending_review"
  | "frozen"
  | "restored"
  | "confirmed";
export type PayoutStatus =
  | "draft"
  | "calculated"
  | "holding"
  | "released"
  | string;

export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string | string[];
  data: T;
  timestamp: string;
  errors?: string | string[];
  path?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
};

export type Staff = {
  id: string;
  email: string;
  username: string;
  totpEnabled: boolean;
  status: AccountStatus;
  roles: StaffRole[];
  role: StaffRole;
  createdAt: string;
};

export type AdminLoginResult =
  | ({
      requires2fa: false;
      staff: Staff;
    } & TokenPair)
  | {
      requires2fa: true;
      challengeToken: string;
    };

export type ResellerPermissions = {
  canRecharge: boolean;
  canAssignFrame: boolean;
  canAssignEntry: boolean;
  canAssignBadge: boolean;
  canRemove: boolean;
  canSetExpiry: boolean;
  canViewSosAlerts?: boolean;
  canViewComplaintEvidence?: boolean;
  dailyRechargeLimit: number | null;
  dailyFrameLimit: number | null;
  dailyEntryLimit: number | null;
  dailyBadgeLimit: number | null;
};

export type Reseller = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  creditLimit: number;
  commissionRate: number;
  status: AccountStatus;
  permissions: ResellerPermissions;
  isOfficial?: boolean;
  officialId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConsumerUser = {
  id: string;
  publicId: string;
  username: string;
  displayName: string;
  email: string | null;
  phone?: string | null;
  country: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  deviceIds?: string[];
  isOfficial?: boolean;
  officialId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

/** App/host auth public user (no phone) */
export type AppUser = {
  id: string;
  publicId: string;
  username: string;
  email: string | null;
  displayName: string;
  country: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  isOfficial?: boolean;
  officialId?: string | null;
};

export type CatalogItem = {
  id: string;
  type: CatalogType;
  name: string;
  description: string | null;
  assetUrl: string;
  price: number;
  isActive: boolean;
  resellerAccess: boolean;
  eligibility: string;
  defaultExpiryDays: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboard = {
  dau: number;
  mau: number;
  revenue: number;
  activeRooms: number;
  pendingWithdrawals: number;
  flaggedReports: number;
  usersTotal: number;
  usersBanned: number;
  resellersTotal: number;
  coinsInCirculation: number;
  pendingPayouts?: number;
  openSos?: number;
  openComplaints?: number;
  frozenWallets?: number;
};

export type AuditLog = {
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  reason?: string | null;
  caseNumber?: string | null;
  createdAt: string;
};

export type RoleCatalogItem = {
  slug: StaffRole;
  name?: string;
  description?: string;
};

export type LedgerEntry = {
  id: string;
  direction?: LedgerDirection;
  amount?: number;
  currency?: WalletCurrency;
  note?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type ResellerDashboard = {
  reseller: Reseller;
  wallet: {
    coinBalance: number;
    diamondBalance: number;
    creditLimit: number;
    available: number;
  };
  today: {
    coinTransfers: number;
    itemAssignments: number;
  };
};

export type ResellerLimits = {
  permissions: ResellerPermissions;
  usageToday: {
    recharge: number;
    frame: number;
    entry: number;
    badge: number;
  };
};

export type ResellerUserLookup = {
  id: string;
  publicId: string;
  username: string;
  displayName: string;
  country: string | null;
  status: UserStatus;
  coinBalance: number;
  isOfficial?: boolean;
  officialId?: string | null;
};

export type SalesReport = {
  from: string | null;
  to: string | null;
  coinTransfers: number;
  itemSales: number;
  total: number;
  count: number;
  commissionRate?: number;
  commission?: number;
};

export type AssignedItem = {
  id: string;
  status?: UserItemStatus;
  catalogItemId?: string;
  expiresAt?: string | null;
  [key: string]: unknown;
};

export type Agency = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  country: CountryCode | string;
  status: AgencyStatus;
  sharePercent?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AgencyDashboard = {
  agency: Agency;
  hostCount: number;
  shareTotal: number;
  wallet: { coinBalance: number };
};

export type AgencyShareItem = {
  id: string;
  batchId: string;
  amount: number;
  createdAt: string;
};

export type HostProfile = {
  id: string;
  userId: string;
  agencyId: string | null;
  country: CountryCode | string;
  status: HostStatus;
  protectionLocked?: boolean;
  protectionLockedUntil?: string | null;
  protectionCaseNumber?: string | null;
  user?: {
    publicId: string;
    username: string;
    displayName: string;
    isOfficial?: boolean;
    officialId?: string | null;
  };
  agency?: {
    id: string;
    displayName: string;
    country: string;
  } | null;
};

export type LiveRoom = {
  id: string;
  title: string;
  hostId?: string;
  backgroundCatalogItemId?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type DeviceRecord = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  lastSeenAt: string | null;
  isNew: boolean;
};

export type Complaint = {
  id: string;
  targetId: string;
  targetType?: string;
  summary: string;
  severity?: string;
  type?: string;
  status: ComplaintStatus;
  evidence?: { type: string; url: string }[];
  events?: unknown[];
  protectionLock?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export type SosAlert = {
  id: string;
  status: SosStatus;
  message?: string | null;
  roomId?: string | null;
  assignedResellerId?: string | null;
  trail?: unknown[];
  createdAt?: string;
  overdue?: boolean;
  [key: string]: unknown;
};

export type CountryRule = {
  code: string;
  name: string;
  currency: string;
  payoutHoldDays: number;
  isActive: boolean;
};

export type SalaryRule = {
  id: string;
  countryCode: string;
  name: string;
  requiredHours?: number | null;
  requiredDays?: number | null;
  requiredBeans?: number | null;
  salaryAmount?: number | null;
  bonusAmount?: number | null;
  agencySharePercent?: number | null;
};

export type SalaryPeriod = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
};

export type PayoutBatch = {
  id: string;
  periodId?: string;
  status: PayoutStatus;
  holdUntil?: string | null;
  items?: PayoutItem[];
  [key: string]: unknown;
};

export type PayoutItem = {
  id: string;
  partyType: "host" | "agency" | string;
  amount: number;
  corrections?: unknown[];
  [key: string]: unknown;
};

export type FreezeCase = {
  id: string;
  ownerId: string;
  ownerType: string;
  freezeType: string;
  reason: string;
  status: FreezeStatus;
  createdAt?: string;
  [key: string]: unknown;
};

export type FraudCase = {
  id: string;
  status?: string;
  amount?: number;
  note?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type BackupSettings = {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  disabledReason?: string | null;
};

export type BackupRun = {
  id?: string;
  status: string;
  manual?: boolean;
  path?: string | null;
  snapshot?: string | null;
  error?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type HostSalaryView = {
  wallet: { coinBalance: number; diamondBalance: number };
  lines: {
    period: string;
    liveHours: number;
    liveDays: number;
    beans?: number;
    targetMet?: boolean;
    earned: number;
    bonus: number;
    deductions: number;
    deductionReason?: string | null;
    status: string;
    hold?: boolean;
  }[];
};
