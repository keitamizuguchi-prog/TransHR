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
