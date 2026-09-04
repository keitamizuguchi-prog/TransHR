import { Injectable } from '@angular/core';
import { DepartmentId, DeptMetrics, Employee, SimulationResult, OptimizationObjective } from '../models/types';
import { DEPT_CONFIG, MIN_TOTAL_SALES } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private getUnderfulfillmentCoefficient(
    deptId: 'A' | 'B' | 'C',
    fulfillmentRate: number
  ): number {
    if (deptId === 'A') {
      if (fulfillmentRate >= 1.0) return 1.0;
      if (fulfillmentRate >= 0.9) return 0.85;
      if (fulfillmentRate >= 0.8) return 0.7;
      if (fulfillmentRate >= 0.7) return 0.5;
      return 0.3;
    }

    if (deptId === 'B') {
      if (fulfillmentRate >= 1.0) return 1.0;
      if (fulfillmentRate >= 0.9) return 0.9;
      if (fulfillmentRate >= 0.8) return 0.8;
      if (fulfillmentRate >= 0.7) return 0.65;
      return 0.5;
    }

    // C事業部
    if (fulfillmentRate >= 1.0) return 1.0;
    if (fulfillmentRate >= 0.9) return 0.95;
    if (fulfillmentRate >= 0.8) return 0.9;
    if (fulfillmentRate >= 0.7) return 0.8;
    return 0.7;
  }

  private getOverfulfillmentCoefficient(fulfillmentRate: number): number {
    if (fulfillmentRate <= 1.2) return 1.0;
    if (fulfillmentRate <= 1.4) return 0.95;
    if (fulfillmentRate <= 1.6) return 0.9;
    return 0.8;
  }

  // 公開メソッド：充足率から補正係数を取得（UI表示用）
  getUnderfulfillmentCoefficientPublic(deptId: 'A' | 'B' | 'C', fulfillmentRate: number): number {
    return this.getUnderfulfillmentCoefficient(deptId, fulfillmentRate);
  }

  getOverfulfillmentCoefficientPublic(fulfillmentRate: number): number {
    return this.getOverfulfillmentCoefficient(fulfillmentRate);
  }

  // 充足率から総合補正係数を取得（両方を適用）
  getTotalCorrectionCoefficient(deptId: 'A' | 'B' | 'C', fulfillmentRate: number): number {
    const underCoeff = this.getUnderfulfillmentCoefficient(deptId, fulfillmentRate);
    const overCoeff = this.getOverfulfillmentCoefficient(fulfillmentRate);
    return underCoeff * overCoeff;
  }

  calculateDeptMetrics(
    employees: Employee[],
    deptId: 'A' | 'B' | 'C'
  ): DeptMetrics {
    const config = DEPT_CONFIG[deptId];
    const headcount = employees.length;

    // 社員貢献度と事業部能力値
    const deptAbility = employees.reduce((sum, emp) => {
      const contribution =
        emp.salesPower * config.weights.sales +
        emp.managementPower * config.weights.management +
        emp.pioneeringPower * config.weights.pioneering +
        emp.trainingPower * config.weights.training;
      return sum + contribution;
    }, 0);

    // 基本売上（配置人数が0の場合は0）
    const baseSales = headcount > 0
      ? config.baseSales * (1 + (deptAbility / 100) * config.growthRate)
      : 0;

    // 充足率と補正係数
    const fulfillmentRate = headcount / config.optimalCount;
    const underfulfillmentCoeff = this.getUnderfulfillmentCoefficient(
      deptId,
      fulfillmentRate
    );
    const overfulfillmentCoeff = this.getOverfulfillmentCoefficient(
      fulfillmentRate
    );

    // 最終売上
    const finalSales = baseSales * underfulfillmentCoeff * overfulfillmentCoeff;

    // 事業部コスト（人件費を百万円から億円に換算）
    const deptCost = (employees.reduce((sum, emp) => sum + emp.laborCost * 3, 0)) / 100;

    // 利益
    const profit = finalSales - deptCost;

    return {
      deptId,
      headcount,
      deptAbility,
      baseSales,
      finalSales,
      deptCost,
      profit,
      fulfillmentRate: fulfillmentRate * 100,
    };
  }

  calculateTotalSimulation(employees: Employee[]): SimulationResult {
    // Temp 以外の社員のみを対象
    const assignedEmployees = employees.filter(
      (emp) => emp.assignedDept !== '保留'
    );

    // 各事業部に配置された社員をフィルタリング
    const deptAEmployees = assignedEmployees.filter(
      (emp) => emp.assignedDept === 'A'
    );
    const deptBEmployees = assignedEmployees.filter(
      (emp) => emp.assignedDept === 'B'
    );
    const deptCEmployees = assignedEmployees.filter(
      (emp) => emp.assignedDept === 'C'
    );

    // 各事業部のメトリクスを計算
    const deptA = this.calculateDeptMetrics(deptAEmployees, 'A');
    const deptB = this.calculateDeptMetrics(deptBEmployees, 'B');
    const deptC = this.calculateDeptMetrics(deptCEmployees, 'C');

    // 全社売上・利益
    const totalSales = deptA.finalSales + deptB.finalSales + deptC.finalSales;
    const totalCost = deptA.deptCost + deptB.deptCost + deptC.deptCost;
    const totalProfit = deptA.profit + deptB.profit + deptC.profit;
    const totalHeadcount = assignedEmployees.length;

    // 一人あたり利益（万円単位に変換: 全社利益[億円] × 10,000 / 人数）
    const perCapitaProfit = totalHeadcount > 0 ? (totalProfit * 10000) / totalHeadcount : 0;

    // 未配置人数
    const unplacedCount = employees.filter(emp => emp.assignedDept === '保留').length;

    // アラート発生数（最低人数未達または充足率ペナルティ）
    const deptConfig = DEPT_CONFIG;
    let alertCount = 0;
    const alertDetails: string[] = [];

    if (deptA.headcount < deptConfig['A'].minCount) {
      alertCount++;
      alertDetails.push(`A事業部: 配置人数${deptA.headcount}名（最低配置人数${deptConfig['A'].minCount}名）`);
    }
    if (deptA.fulfillmentRate !== undefined && deptA.fulfillmentRate < 100) {
      if (deptA.headcount >= deptConfig['A'].minCount) {
        alertCount++;
      }
      alertDetails.push(`A事業部: 充足率${(deptA.fulfillmentRate).toFixed(1)}%（ペナルティ適用）`);
    }

    if (deptB.headcount < deptConfig['B'].minCount) {
      alertCount++;
      alertDetails.push(`B事業部: 配置人数${deptB.headcount}名（最低配置人数${deptConfig['B'].minCount}名）`);
    }
    if (deptB.fulfillmentRate !== undefined && deptB.fulfillmentRate < 100) {
      if (deptB.headcount >= deptConfig['B'].minCount) {
        alertCount++;
      }
      alertDetails.push(`B事業部: 充足率${(deptB.fulfillmentRate).toFixed(1)}%（ペナルティ適用）`);
    }

    if (deptC.headcount < deptConfig['C'].minCount) {
      alertCount++;
      alertDetails.push(`C事業部: 配置人数${deptC.headcount}名（最低配置人数${deptConfig['C'].minCount}名）`);
    }
    if (deptC.fulfillmentRate !== undefined && deptC.fulfillmentRate < 100) {
      if (deptC.headcount >= deptConfig['C'].minCount) {
        alertCount++;
      }
      alertDetails.push(`C事業部: 充足率${(deptC.fulfillmentRate).toFixed(1)}%（ペナルティ適用）`);
    }

    return {
      deptA,
      deptB,
      deptC,
      totalSales,
      totalProfit,
      totalCost,
      totalHeadcount,
      perCapitaProfit,
      unplacedCount,
      alertCount,
      alertDetails,
    };
  }

  calcEmployeeContribution(emp: Employee, deptId: DepartmentId): number {
    if (deptId === '保留') {
      return 0;
    }

    const config = DEPT_CONFIG[deptId];
    return (
      emp.salesPower * config.weights.sales +
      emp.managementPower * config.weights.management +
      emp.pioneeringPower * config.weights.pioneering +
      emp.trainingPower * config.weights.training
    );
  }

  generateOptimizationExplanation(
    employees: Employee[],
    result: SimulationResult,
    objective: OptimizationObjective
  ): import('../models/types').OptimizationExplanation {
    const deptAEmployees = employees.filter(e => e.assignedDept === 'A');
    const deptBEmployees = employees.filter(e => e.assignedDept === 'B');
    const deptCEmployees = employees.filter(e => e.assignedDept === 'C');

    const calculateSkillAverage = (emps: Employee[]) => {
      if (emps.length === 0) {
        return { sales: 0, management: 0, pioneering: 0, training: 0 };
      }
      return {
        sales: emps.reduce((sum, e) => sum + e.salesPower, 0) / emps.length,
        management: emps.reduce((sum, e) => sum + e.managementPower, 0) / emps.length,
        pioneering: emps.reduce((sum, e) => sum + e.pioneeringPower, 0) / emps.length,
        training: emps.reduce((sum, e) => sum + e.trainingPower, 0) / emps.length,
      };
    };

    const getHighestSkillName = (avg: { sales: number; management: number; pioneering: number; training: number }) => {
      const skills = [
        { name: '営業スキル', value: avg.sales },
        { name: '管理スキル', value: avg.management },
        { name: '開拓スキル', value: avg.pioneering },
        { name: '育成スキル', value: avg.training },
      ];
      skills.sort((a, b) => b.value - a.value);
      return skills[0];
    };

    const getSecondHighestSkillName = (avg: { sales: number; management: number; pioneering: number; training: number }) => {
      const skills = [
        { name: '営業スキル', value: avg.sales },
        { name: '管理スキル', value: avg.management },
        { name: '開拓スキル', value: avg.pioneering },
        { name: '育成スキル', value: avg.training },
      ];
      skills.sort((a, b) => b.value - a.value);
      return skills[1];
    };

    const deptASkill = calculateSkillAverage(deptAEmployees);
    const deptBSkill = calculateSkillAverage(deptBEmployees);
    const deptCSkill = calculateSkillAverage(deptCEmployees);

    const deptAHighest = getHighestSkillName(deptASkill);
    const deptASecond = getSecondHighestSkillName(deptASkill);
    const deptBHighest = getHighestSkillName(deptBSkill);
    const deptBSecond = getSecondHighestSkillName(deptBSkill);
    const deptCHighest = getHighestSkillName(deptCSkill);
    const deptCSecond = getSecondHighestSkillName(deptCSkill);

    // 全社向け説明文生成
    let overallExplanation = '';
    switch (objective) {
      case 'totalSales':
        overallExplanation = `全社の売上を最大化することを優先し、各事業部の適正な人数配置と、スキルの最適配分を実施しました。`;
        break;
      case 'deptAProfit':
        overallExplanation = `A事業部の利益最大化を最優先とし、A事業部に経営スキルが高い人員を集中配置しました。同時に、B・C事業部の売上維持にも配慮しています。`;
        break;
      case 'deptBSales':
        overallExplanation = `B事業部の売上を最大化することを優先し、B事業部に営業スキルが高い人員を集中配置しました。同時に、A・C事業部の売上維持にも配慮しています。`;
        break;
      case 'deptCSales':
        overallExplanation = `C事業部の売上を最大化することを優先し、C事業部に営業スキルが高い人員を集中配置しました。同時に、A・B事業部の売上維持にも配慮しています。`;
        break;
    }

    return {
      overallExplanation,
      deptA: {
        explanation: `${deptAHighest.name}（平均${deptAHighest.value.toFixed(1)}）を最も重視した配置です。次点で${deptASecond.name}（平均${deptASecond.value.toFixed(1)}）が高く、バランスの取れたチーム構成になっています。`,
        skillAverages: deptASkill,
      },
      deptB: {
        explanation: `${deptBHighest.name}（平均${deptBHighest.value.toFixed(1)}）を最も重視した配置です。次点で${deptBSecond.name}（平均${deptBSecond.value.toFixed(1)}）が高く、バランスの取れたチーム構成になっています。`,
        skillAverages: deptBSkill,
      },
      deptC: {
        explanation: `${deptCHighest.name}（平均${deptCHighest.value.toFixed(1)}）を最も重視した配置です。次点で${deptCSecond.name}（平均${deptCSecond.value.toFixed(1)}）が高く、バランスの取れたチーム構成になっています。`,
        skillAverages: deptCSkill,
      },
    };
  }

  private getScoresForObjective(
    result: SimulationResult,
    objective: OptimizationObjective
  ): { primaryScore: number; secondaryScore: number } {
    switch (objective) {
      case 'totalSales':
        return {
          primaryScore: result.totalSales,
          secondaryScore: 0,
        };
      case 'deptAProfit':
        return {
          primaryScore: result.deptA.profit,
          secondaryScore: result.deptB.finalSales + result.deptC.finalSales,
        };
      case 'deptBSales':
        return {
          primaryScore: result.deptB.finalSales,
          secondaryScore: result.deptA.finalSales + result.deptC.finalSales,
        };
      case 'deptCSales':
        return {
          primaryScore: result.deptC.finalSales,
          secondaryScore: result.deptA.finalSales + result.deptB.finalSales,
        };
      default:
        return {
          primaryScore: result.totalSales,
          secondaryScore: 0,
        };
    }
  }

  private isValidPlacement(result: SimulationResult): boolean {
    const minA = DEPT_CONFIG['A'].minCount;
    const minB = DEPT_CONFIG['B'].minCount;
    const minC = DEPT_CONFIG['C'].minCount;

    return (
      result.deptA.headcount >= minA &&
      result.deptB.headcount >= minB &&
      result.deptC.headcount >= minC &&
      result.totalSales >= MIN_TOTAL_SALES
    );
  }

  private createDeterministicInitialPlacement(employees: Employee[]): Employee[] {
    const result = employees.map(e => ({ ...e }));

    // ロック済み社員は現在の配置を保持、アンロック社員のみ初期配置
    const lockedEmployees = result.filter(e => e.isLocked);
    const unlockedEmployees = result.filter(e => !e.isLocked);

    // ID順でアンロック社員をソート（確定的）
    unlockedEmployees.sort((a, b) => a.id.localeCompare(b.id));

    // 適正人数（ペナルティなし状態）: A:40, B:35, C:25
    const optimalA = 40;
    const optimalB = 35;
    const optimalC = 25;

    // ロック済み社員の現在配置をカウント
    const lockedCountByDept = {
      'A': lockedEmployees.filter(e => e.assignedDept === 'A').length,
      'B': lockedEmployees.filter(e => e.assignedDept === 'B').length,
      'C': lockedEmployees.filter(e => e.assignedDept === 'C').length,
    };

    // 先頭からアンロック社員をA:40, B:35, C:25に配置（ロック済み人数を考慮）
    let deptACount = 0;
    let deptBCount = 0;
    let deptCCount = 0;

    for (const emp of unlockedEmployees) {
      const remainingA = optimalA - lockedCountByDept['A'];
      const remainingB = optimalB - lockedCountByDept['B'];
      const remainingC = optimalC - lockedCountByDept['C'];

      if (deptACount < remainingA) {
        emp.assignedDept = 'A';
        deptACount++;
      } else if (deptBCount < remainingB) {
        emp.assignedDept = 'B';
        deptBCount++;
      } else if (deptCCount < remainingC) {
        emp.assignedDept = 'C';
        deptCCount++;
      } else {
        // 最適人数を超えた社員はTempに配置（再計算時に最適化される）
        emp.assignedDept = '保留';
      }
    }

    return result;
  }

  optimizePlacement(
    employees: Employee[],
    objective: OptimizationObjective
  ): Employee[] {
    const EPSILON = 1e-6;

    // 計測用変数（粗い計測）
    const perfStart = performance.now();
    let iterationCount = 0;
    let totalSimulationCount = 0;
    let totalCandidateCount = 0;
    let simulationTime = 0;

    // 確定的な初期配置（乱数なし）
    let currentEmployees = this.createDeterministicInitialPlacement(employees);

    const initialResult = this.calculateTotalSimulation(currentEmployees);
    console.log('[初期配置後]', {
      'A人数': initialResult.deptA.headcount,
      'B人数': initialResult.deptB.headcount,
      'C人数': initialResult.deptC.headcount,
      '全社売上': initialResult.totalSales.toFixed(2),
      'ロック人数': employees.filter(e => e.isLocked).length,
    });

    interface BestAction {
      type: 'move' | 'swap';
      empIndex?: number;
      newDept?: 'A' | 'B' | 'C' | '保留';
      emp1Index?: number;
      emp2Index?: number;
    }

    let isImproved = true;

    while (isImproved) {
      const iterationStart = performance.now();
      iterationCount++;
      isImproved = false;
      let iterationCandidateCount = 0;

      const currentResult = this.calculateTotalSimulation(currentEmployees);
      totalSimulationCount++;

      const currentScores = this.isValidPlacement(currentResult)
        ? this.getScoresForObjective(currentResult, objective)
        : { primaryScore: -Infinity, secondaryScore: -Infinity };

      let bestPrimaryScore = currentScores.primaryScore;
      let bestSecondaryScore = currentScores.secondaryScore;
      let bestAction: BestAction | null = null;

      // パターン①: 1人移動パターンをすべて試す
      const candidatesForMoveSimulation: Array<{ index: number; targetDept: 'A' | 'B' | 'C' | '保留' }> = [];

      for (let i = 0; i < currentEmployees.length; i++) {
        // ロック済み社員は移動対象外
        if (currentEmployees[i].isLocked) {
          continue;
        }

        const currentDept = currentEmployees[i].assignedDept;
        const allDepts = ['A', 'B', 'C', '保留'] as const;
        const targetDepts = allDepts.filter(d => d !== currentDept);

        for (const targetDept of targetDepts) {
          iterationCandidateCount++;
          candidatesForMoveSimulation.push({ index: i, targetDept });
        }
      }

      // 候補のシミュレーション評価（パターン①）
      for (const candidate of candidatesForMoveSimulation) {
        const originalDept = currentEmployees[candidate.index].assignedDept;
        currentEmployees[candidate.index].assignedDept = candidate.targetDept as any;

        const testResult = this.calculateTotalSimulation(currentEmployees);
        totalSimulationCount++;

        currentEmployees[candidate.index].assignedDept = originalDept;

        if (this.isValidPlacement(testResult)) {
          const testScores = this.getScoresForObjective(testResult, objective);

          // 最適判定: 第一条件で上回るか、または第一条件同点で第二条件が上回った場合
          if (testScores.primaryScore > bestPrimaryScore + EPSILON) {
            bestPrimaryScore = testScores.primaryScore;
            bestSecondaryScore = testScores.secondaryScore;
            bestAction = {
              type: 'move',
              empIndex: candidate.index,
              newDept: candidate.targetDept,
            };
          } else if (
            Math.abs(testScores.primaryScore - bestPrimaryScore) <= EPSILON &&
            testScores.secondaryScore > bestSecondaryScore + EPSILON
          ) {
            bestPrimaryScore = testScores.primaryScore;
            bestSecondaryScore = testScores.secondaryScore;
            bestAction = {
              type: 'move',
              empIndex: candidate.index,
              newDept: candidate.targetDept,
            };
          }
        }
      }

      // パターン②: 2人入れ替えパターンをすべて試す
      const candidatesForSwapSimulation: Array<{ index1: number; index2: number }> = [];

      for (let i = 0; i < currentEmployees.length; i++) {
        for (let j = i + 1; j < currentEmployees.length; j++) {
          // ロック済み社員のスワップは対象外
          if (currentEmployees[i].isLocked || currentEmployees[j].isLocked) {
            continue;
          }

          const deptI = currentEmployees[i].assignedDept;
          const deptJ = currentEmployees[j].assignedDept;

          // 異なる部署の2名のみを対象（Tempを含む）
          if (deptI !== deptJ) {
            iterationCandidateCount++;
            candidatesForSwapSimulation.push({ index1: i, index2: j });
          }
        }
      }

      // 候補のシミュレーション評価（パターン②）
      for (const candidate of candidatesForSwapSimulation) {
        const dept1 = currentEmployees[candidate.index1].assignedDept;
        const dept2 = currentEmployees[candidate.index2].assignedDept;

        currentEmployees[candidate.index1].assignedDept = dept2;
        currentEmployees[candidate.index2].assignedDept = dept1;

        const testResult = this.calculateTotalSimulation(currentEmployees);
        totalSimulationCount++;

        currentEmployees[candidate.index1].assignedDept = dept1;
        currentEmployees[candidate.index2].assignedDept = dept2;

        if (this.isValidPlacement(testResult)) {
          const testScores = this.getScoresForObjective(testResult, objective);

          // 最適判定: 第一条件で上回るか、または第一条件同点で第二条件が上回った場合
          if (testScores.primaryScore > bestPrimaryScore + EPSILON) {
            bestPrimaryScore = testScores.primaryScore;
            bestSecondaryScore = testScores.secondaryScore;
            bestAction = {
              type: 'swap',
              emp1Index: candidate.index1,
              emp2Index: candidate.index2,
            };
          } else if (
            Math.abs(testScores.primaryScore - bestPrimaryScore) <= EPSILON &&
            testScores.secondaryScore > bestSecondaryScore + EPSILON
          ) {
            bestPrimaryScore = testScores.primaryScore;
            bestSecondaryScore = testScores.secondaryScore;
            bestAction = {
              type: 'swap',
              emp1Index: candidate.index1,
              emp2Index: candidate.index2,
            };
          }
        }
      }
      totalCandidateCount += iterationCandidateCount;

      // 反復単位の計測（粗い計測）
      const iterationEnd = performance.now();
      simulationTime += iterationEnd - iterationStart;

      // 状態を更新
      if (bestAction) {
        if (bestAction.type === 'move') {
          currentEmployees[bestAction.empIndex!].assignedDept = bestAction.newDept!;
        } else if (bestAction.type === 'swap') {
          const temp = currentEmployees[bestAction.emp1Index!].assignedDept;
          currentEmployees[bestAction.emp1Index!].assignedDept = currentEmployees[bestAction.emp2Index!].assignedDept;
          currentEmployees[bestAction.emp2Index!].assignedDept = temp;
        }
        isImproved = true;
      }
    }

    // 計測結果をログ出力（粗い計測）
    const perfEnd = performance.now();
    const totalTime = perfEnd - perfStart;
    const avgTimePerSimulation = simulationTime / totalSimulationCount;
    const avgCandidatesPerIteration = totalCandidateCount / iterationCount;

    console.log('[最適化パフォーマンス計測結果（粗い計測）]', {
      '全体実行時間(ms)': totalTime.toFixed(2),
      '反復回数': iterationCount,
      '総候補数': totalCandidateCount,
      '1反復あたりの平均候補数': avgCandidatesPerIteration.toFixed(2),
      '総シミュレーション実行回数': totalSimulationCount,
      '1反復あたりの平均時間(ms)': (simulationTime / iterationCount).toFixed(4),
    });

    const finalResult = this.calculateTotalSimulation(currentEmployees);
    console.log('[最適化完了後]', {
      'A人数': finalResult.deptA.headcount,
      'B人数': finalResult.deptB.headcount,
      'C人数': finalResult.deptC.headcount,
      '全社売上': finalResult.totalSales.toFixed(2),
    });

    // パフォーマンスAPI用のメモリ解放
    performance.clearMarks();
    performance.clearMeasures();

    return currentEmployees;
  }
}
