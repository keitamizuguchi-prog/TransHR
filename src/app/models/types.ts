export type DepartmentId = 'A' | 'B' | 'C' | 'Temp';
export type OptimizationObjective = 'totalSales' | 'deptAProfit' | 'deptBSales' | 'deptCSales';

export type EmployeeSource = 'existing' | 'candidate';

export interface Employee {
  id: string;
  name: string;
  salesPower: number;
  managementPower: number;
  pioneeringPower: number;
  trainingPower: number;
  laborCost: number;
  assignedDept: DepartmentId;
  isLocked?: boolean;
  source: EmployeeSource;
}

export interface DepartmentConfig {
  baseSales: number;
  growthRate: number;
  optimalCount: number;
  minCount: number;
  weights: {
    sales: number;
    management: number;
    pioneering: number;
    training: number;
  };
}

export interface DeptMetrics {
  deptId: DepartmentId;
  headcount: number;
  deptAbility: number;
  baseSales: number;
  finalSales: number;
  deptCost: number;
  profit: number;
  fulfillmentRate?: number;
}

export interface SimulationResult {
  deptA: DeptMetrics;
  deptB: DeptMetrics;
  deptC: DeptMetrics;
  totalSales: number;
  totalProfit: number;
}

export interface ObjectiveComparisonResult {
  objectiveName: string;
  deptAHeadcount: number;
  deptBHeadcount: number;
  deptCHeadcount: number;
  totalSales: number;
  totalProfit: number;
  deptASales: number;
  deptAProfit: number;
  deptBSales: number;
  deptBProfit: number;
  deptCSales: number;
  deptCProfit: number;
}

export interface MatrixComparisonResult {
  objectiveName: string;

  beforePlacement: string;
  beforeTotalSales: number;
  beforeTotalProfit: number;

  afterPlacement: string;
  afterTotalSales: number;
  afterTotalProfit: number;

  salesDiff: number;
  profitDiff: number;
}
