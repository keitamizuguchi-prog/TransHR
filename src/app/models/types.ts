export type DepartmentId = 'A' | 'B' | 'C' | '保留';
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

export interface DeptSkillAverage {
  sales: number;
  management: number;
  pioneering: number;
  training: number;
}

export interface OptimizationExplanation {
  overallExplanation: string;
  deptA: {
    explanation: string;
    skillAverages: DeptSkillAverage;
  };
  deptB: {
    explanation: string;
    skillAverages: DeptSkillAverage;
  };
  deptC: {
    explanation: string;
    skillAverages: DeptSkillAverage;
  };
}

export interface SimulationResult {
  deptA: DeptMetrics;
  deptB: DeptMetrics;
  deptC: DeptMetrics;
  totalSales: number;
  totalProfit: number;
  totalCost: number;
  totalHeadcount: number;
  perCapitaProfit: number;
  unplacedCount: number;
  alertCount: number;
  alertDetails: string[];
  explanation?: OptimizationExplanation;
}

export interface ObjectiveComparisonResult {
  objectiveName: string;
  deptAHeadcount: number;
  deptBHeadcount: number;
  deptCHeadcount: number;
  totalHeadcount: number;
  totalSales: number;
  totalProfit: number;
  totalCost: number;
  perCapitaProfit: number;
  deptASales: number;
  deptAProfit: number;
  deptBSales: number;
  deptBProfit: number;
  deptCSales: number;
  deptCProfit: number;
}

export interface PlacementSnapshot {
  id: string;
  name: string;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy?: string;
  memo?: string;
  mainFileName?: string;
  additionalFileName?: string;
  employees: Employee[];
  selectedObjective: OptimizationObjective;
  optimizationExecuted: boolean;
  kpi: {
    totalSales: number;
    totalProfit: number;
    perCapitaProfit: number;
  };
  hasRecruitData: boolean;
  simulationResult?: SimulationResult;
  objectiveComparisonResults?: ObjectiveComparisonResult[];
  objectiveComparisonResultsWithAdditional?: ObjectiveComparisonResult[];
  matrixComparisonResults?: MatrixComparisonResult[];
}

export interface MatrixComparisonResult {
  objectiveName: string;

  beforePlacement: string;
  beforeTotalSales: number;
  beforeTotalProfit: number;
  beforePerCapitaProfit: number;

  afterPlacement: string;
  afterTotalSales: number;
  afterTotalProfit: number;
  afterPerCapitaProfit: number;

  salesDiff: number;
  profitDiff: number;
  perCapitaProfitDiff: number;
}
