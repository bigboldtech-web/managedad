import { Vertical } from "@prisma/client";

export interface PlaybookConstants {
  vertical: Vertical;
  goodCpc: number;
  goodCpa: number;
  goodRoas: number;
  goodCtr: number;
  creativeRotationDays: number;
  peakHours: number[];
  weekendBoost?: number;
}

const D2C: PlaybookConstants = {
  vertical: "D2C",
  goodCpc: 8,
  goodCpa: 250,
  goodRoas: 4.0,
  goodCtr: 0.025,
  creativeRotationDays: 21,
  peakHours: [20, 21, 22, 23],
};

const SAAS: PlaybookConstants = {
  vertical: "SAAS",
  goodCpc: 45,
  goodCpa: 3500,
  goodRoas: 2.5,
  goodCtr: 0.018,
  creativeRotationDays: 45,
  peakHours: [10, 11, 14, 15, 16],
};

const REAL_ESTATE: PlaybookConstants = {
  vertical: "REAL_ESTATE",
  goodCpc: 35,
  goodCpa: 2500,
  goodRoas: 8.0,
  goodCtr: 0.022,
  creativeRotationDays: 30,
  peakHours: [11, 12, 19, 20, 21],
  weekendBoost: 1.4,
};

const EDTECH: PlaybookConstants = {
  vertical: "EDTECH",
  goodCpc: 12,
  goodCpa: 600,
  goodRoas: 3.5,
  goodCtr: 0.028,
  creativeRotationDays: 28,
  peakHours: [9, 10, 17, 18, 19, 20],
};

const LEAD_GEN: PlaybookConstants = {
  vertical: "LEAD_GEN",
  goodCpc: 20,
  goodCpa: 800,
  goodRoas: 3.0,
  goodCtr: 0.020,
  creativeRotationDays: 30,
  peakHours: [10, 11, 14, 15, 16, 17],
};

const OTHER: PlaybookConstants = {
  vertical: "OTHER",
  goodCpc: 20,
  goodCpa: 800,
  goodRoas: 3.0,
  goodCtr: 0.020,
  creativeRotationDays: 30,
  peakHours: [10, 11, 14, 15, 16, 17, 20, 21],
};

const PLAYBOOKS: Record<Vertical, PlaybookConstants> = {
  D2C,
  SAAS,
  REAL_ESTATE,
  EDTECH,
  LEAD_GEN,
  OTHER,
};

export function getPlaybook(vertical: Vertical): PlaybookConstants {
  return PLAYBOOKS[vertical] ?? OTHER;
}
