import { DepartmentConfig } from '../models/types';

export const MIN_TOTAL_SALES = 58;

export const DEPT_CONFIG: Record<'A' | 'B' | 'C', DepartmentConfig> = {
  A: {
    baseSales: 10,
    growthRate: 0.06,
    optimalCount: 40,
    minCount: 30,
    weights: {
      sales: 0.45,
      management: 0.35,
      pioneering: 0.1,
      training: 0.1,
    },
  },
  B: {
    baseSales: 7,
    growthRate: 0.12,
    optimalCount: 35,
    minCount: 20,
    weights: {
      sales: 0.35,
      management: 0.2,
      pioneering: 0.3,
      training: 0.15,
    },
  },
  C: {
    baseSales: 2,
    growthRate: 0.25,
    optimalCount: 25,
    minCount: 10,
    weights: {
      sales: 0.2,
      management: 0.1,
      pioneering: 0.5,
      training: 0.2,
    },
  },
};

// 充足率の閾値（パーセント）
export const FULFILLMENT_RATE_THRESHOLDS = {
  CRITICAL_MIN: 70,      // 70%未満 = 赤
  WARNING_MIN: 80,       // 80%以上70%未満 = 橙
  CAUTION_MIN: 90,       // 90%以上80%未満 = 黄
  OPTIMAL_MAX: 120,      // 100%～120% = 緑
};
