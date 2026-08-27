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
      (emp) => emp.assignedDept !== 'Temp'
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

    // 全社売上
    const totalSales = deptA.finalSales + deptB.finalSales + deptC.finalSales;
    const totalProfit = deptA.profit + deptB.profit + deptC.profit;

    return {
      deptA,
      deptB,
      deptC,
      totalSales,
      totalProfit,
    };
  }

  calcEmployeeContribution(emp: Employee, deptId: DepartmentId): number {
    if (deptId === 'Temp') {
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
        emp.assignedDept = 'A';
      }
    }

    return result;
  }

  optimizePlacement(
    employees: Employee[],
    objective: OptimizationObjective
  ): Employee[] {
    const EPSILON = 1e-6;

    // 計測用変数
    const perfStart = performance.now();
    let iterationCount = 0;
    let totalSimulationCount = 0;
    let totalCandidateCount = 0;
    let candidateEnumerationTime = 0;
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
      newDept?: 'A' | 'B' | 'C';
      emp1Index?: number;
      emp2Index?: number;
    }

    let isImproved = true;

    while (isImproved) {
      iterationCount++;
      isImproved = false;
      let iterationCandidateCount = 0;

      const simStart = performance.now();
      const currentResult = this.calculateTotalSimulation(currentEmployees);
      totalSimulationCount++;
      simulationTime += performance.now() - simStart;

      const currentScores = this.isValidPlacement(currentResult)
        ? this.getScoresForObjective(currentResult, objective)
        : { primaryScore: -Infinity, secondaryScore: -Infinity };

      let bestPrimaryScore = currentScores.primaryScore;
      let bestSecondaryScore = currentScores.secondaryScore;
      let bestAction: BestAction | null = null;

      // パターン①: 1人移動パターンをすべて試す
      const enumStart1 = performance.now();
      for (let i = 0; i < currentEmployees.length; i++) {
        // ロック済み社員は移動対象外
        if (currentEmployees[i].isLocked) {
          continue;
        }

        const currentDept = currentEmployees[i].assignedDept as 'A' | 'B' | 'C';
        const otherDepts = (['A', 'B', 'C'] as const).filter(d => d !== currentDept);

        for (const targetDept of otherDepts) {
          iterationCandidateCount++;
          const testEmployees = currentEmployees.map(e => ({ ...e }));
          testEmployees[i].assignedDept = targetDept;

          const simStart2 = performance.now();
          const testResult = this.calculateTotalSimulation(testEmployees);
          totalSimulationCount++;
          simulationTime += performance.now() - simStart2;

          if (this.isValidPlacement(testResult)) {
            const testScores = this.getScoresForObjective(testResult, objective);

            // 最適判定: 第一条件で上回るか、または第一条件同点で第二条件が上回った場合
            if (testScores.primaryScore > bestPrimaryScore + EPSILON) {
              bestPrimaryScore = testScores.primaryScore;
              bestSecondaryScore = testScores.secondaryScore;
              bestAction = {
                type: 'move',
                empIndex: i,
                newDept: targetDept,
              };
            } else if (
              Math.abs(testScores.primaryScore - bestPrimaryScore) <= EPSILON &&
              testScores.secondaryScore > bestSecondaryScore + EPSILON
            ) {
              bestPrimaryScore = testScores.primaryScore;
              bestSecondaryScore = testScores.secondaryScore;
              bestAction = {
                type: 'move',
                empIndex: i,
                newDept: targetDept,
              };
            }
          }
        }
      }
      candidateEnumerationTime += performance.now() - enumStart1;

      // パターン②: 2人入れ替えパターンをすべて試す
      const enumStart2 = performance.now();
      for (let i = 0; i < currentEmployees.length; i++) {
        for (let j = i + 1; j < currentEmployees.length; j++) {
          // ロック済み社員のスワップは対象外
          if (currentEmployees[i].isLocked || currentEmployees[j].isLocked) {
            continue;
          }

          const deptI = currentEmployees[i].assignedDept as 'A' | 'B' | 'C';
          const deptJ = currentEmployees[j].assignedDept as 'A' | 'B' | 'C';

          // 異なる部署の2名のみを対象
          if (deptI !== deptJ) {
            iterationCandidateCount++;
            const testEmployees = currentEmployees.map(e => ({ ...e }));
            const temp = testEmployees[i].assignedDept;
            testEmployees[i].assignedDept = testEmployees[j].assignedDept;
            testEmployees[j].assignedDept = temp;

            const simStart3 = performance.now();
            const testResult = this.calculateTotalSimulation(testEmployees);
            totalSimulationCount++;
            simulationTime += performance.now() - simStart3;

            if (this.isValidPlacement(testResult)) {
              const testScores = this.getScoresForObjective(testResult, objective);

              // 最適判定: 第一条件で上回るか、または第一条件同点で第二条件が上回った場合
              if (testScores.primaryScore > bestPrimaryScore + EPSILON) {
                bestPrimaryScore = testScores.primaryScore;
                bestSecondaryScore = testScores.secondaryScore;
                bestAction = {
                  type: 'swap',
                  emp1Index: i,
                  emp2Index: j,
                };
              } else if (
                Math.abs(testScores.primaryScore - bestPrimaryScore) <= EPSILON &&
                testScores.secondaryScore > bestSecondaryScore + EPSILON
              ) {
                bestPrimaryScore = testScores.primaryScore;
                bestSecondaryScore = testScores.secondaryScore;
                bestAction = {
                  type: 'swap',
                  emp1Index: i,
                  emp2Index: j,
                };
              }
            }
          }
        }
      }
      candidateEnumerationTime += performance.now() - enumStart2;
      totalCandidateCount += iterationCandidateCount;

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

    // 計測結果をログ出力
    const perfEnd = performance.now();
    const totalTime = perfEnd - perfStart;
    const avgTimePerSimulation = simulationTime / totalSimulationCount;
    const avgCandidatesPerIteration = totalCandidateCount / iterationCount;
    const simulationPercentage = (simulationTime / totalTime) * 100;
    const enumerationPercentage = (candidateEnumerationTime / totalTime) * 100;

    console.log('[最適化パフォーマンス計測結果]', {
      '全体実行時間(ms)': totalTime.toFixed(2),
      '反復回数': iterationCount,
      '総候補数': totalCandidateCount,
      '1反復あたりの平均候補数': avgCandidatesPerIteration.toFixed(2),
      '総シミュレーション実行回数': totalSimulationCount,
      '候補評価1回あたりの平均時間(ms)': avgTimePerSimulation.toFixed(4),
      '候補列挙の合計時間(ms)': candidateEnumerationTime.toFixed(2),
      'シミュレーションの合計時間(ms)': simulationTime.toFixed(2),
      '候補列挙の時間割合(%)': enumerationPercentage.toFixed(2),
      'シミュレーションの時間割合(%)': simulationPercentage.toFixed(2),
    });

    const finalResult = this.calculateTotalSimulation(currentEmployees);
    console.log('[最適化完了後]', {
      'A人数': finalResult.deptA.headcount,
      'B人数': finalResult.deptB.headcount,
      'C人数': finalResult.deptC.headcount,
      '全社売上': finalResult.totalSales.toFixed(2),
    });

    return currentEmployees;
  }
}
