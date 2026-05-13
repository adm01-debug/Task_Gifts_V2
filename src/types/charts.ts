// Recharts Tooltip Types
export interface RechartsTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

export interface RechartsTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

// BI Dashboard Types
export interface TrendData {
  month: string;
  totalUsers: number;
  totalXp: number;
  punctualityRate: number;
  trainingRate: number;
  adoption: number;
}

export interface DepartmentData {
  name: string;
  employeeCount: number;
  totalXp: number;
  avgLevel: number;
  punctualityRate: number;
  questsCompleted: number;
  score: number;
}

export interface WeeklyEngagementData {
  day: string;
  quests: number;
}

// Bitrix24 Types
export interface BitrixTimemanSettings {
  UF_TIMEMAN: boolean;
  UF_TM_ALLOWED_DELTA: number;
  UF_TM_FREE: boolean;
  UF_TM_MAX_STATE: number;
  UF_TM_MIN_STATE: number;
}

export interface BitrixTimemanReport {
  ID: string;
  USER_ID: string;
  DATE_START: string;
  DATE_FINISH: string;
  DURATION: number;
  PAUSES: number;
  ACTIVE: boolean;
}

export interface BitrixUnreadCounters {
  TOTAL: number;
  CHAT: number;
  NOTIFY: number;
  LINES: number;
}

export interface BitrixChatInfo {
  ID: string;
  TYPE: string;
  NAME: string;
  OWNER: string;
  AVATAR?: string;
  USERS: string[];
  MESSAGE_COUNT: number;
  DATE_CREATE: string;
}

export interface BitrixUserStatus {
  ID: string;
  STATUS: string;
  IDLE: boolean;
  MOBILE: boolean;
  DESKTOP: boolean;
}

// Shop Service Types
export interface ShopPurchaseRow {
  id: string;
  user_id: string;
  reward_id: string;
  quantity: number;
  total_coins: number;
  status: string;
  notes: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  reward: {
    id: string;
    name: string;
    description: string | null;
    price_coins: number;
    category: string;
    rarity: string;
    image_url: string | null;
    stock: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

// Achievement Types
export interface AchievementRecord {
  icon: string;
  name: string;
  rarity: string;
  xp_reward: number;
}

// Profile Types for DepartmentsManager
export interface ProfileBasic {
  id: string;
  display_name: string | null;
  email: string | null;
  level: number;
  xp: number;
}
