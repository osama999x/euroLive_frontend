export type StaffRole =
  | "super_admin"
  | "admin"
  | "finance"
  | "support"
  | "moderator";

export type AccountStatus = "active" | "disabled" | "banned";
export type UserStatus = "active" | "banned";
export type CatalogType = "frame" | "entry" | "badge";
export type AssignDuration = "1" | "7" | "30" | "custom" | "permanent";
export type LedgerDirection = "credit" | "debit";
export type WalletOwnerType = "user" | "reseller";
export type WalletCurrency = "coin" | "diamond";
export type UserItemStatus = "active" | "expired" | "removed";

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
  createdAt: string;
  updatedAt: string;
};

export type ConsumerUser = {
  id: string;
  publicId: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  deviceIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
