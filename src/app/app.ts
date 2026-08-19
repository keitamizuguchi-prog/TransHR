import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentId, Employee, SimulationResult, OptimizationObjective, ObjectiveComparisonResult } from './models/types';
import { CalculatorService } from './services/calculator.service';
import { DEPT_CONFIG, MIN_TOTAL_SALES } from './constants/app.constants';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styles: [`
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    .file-input-section {
      margin-bottom: 30px;
      text-align: center;
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .file-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-input-group label {
      font-weight: bold;
      color: #333;
      font-size: 14px;
    }
    .file-input-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .file-input-section input[type="file"] {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      flex: 1;
    }
    .clear-button {
      padding: 8px 16px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
      white-space: nowrap;
    }
    .clear-button:hover {
      background-color: #c82333;
    }
    .clear-button:active {
      background-color: #bd2130;
    }
    .dashboard {
      margin-bottom: 40px;
    }
    .total-metrics {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .total-metric {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    .total-metric h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
    }
    .total-metric .value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    .dept-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .dept-card {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .dept-card h3 {
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #007bff;
      color: #007bff;
    }
    .dept-card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .dept-card-row:last-child {
      border-bottom: none;
    }
    .dept-card-row label {
      color: #666;
      font-weight: bold;
    }
    .dept-card-row .value {
      color: #333;
    }
    .employees-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .employees-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .dept-lists {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .dept-list {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    .dept-list-header {
      background-color: #007bff;
      color: white;
      padding: 12px;
      font-weight: bold;
      font-size: 16px;
    }
    .dept-list-content {
      max-height: 600px;
      overflow-y: auto;
    }
    .employee-row {
      padding: 12px;
      border-bottom: 1px solid #eee;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .employee-row:last-child {
      border-bottom: none;
    }
    .employee-id {
      font-weight: bold;
      color: #333;
    }
    .employee-stats {
      font-size: 12px;
      color: #666;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .employee-stat {
      display: flex;
      justify-content: space-between;
    }
    .employee-stat label {
      font-weight: bold;
      margin-right: 4px;
    }
    .employee-contribution {
      padding: 6px;
      background-color: #e7f3ff;
      border-radius: 4px;
      font-weight: bold;
      color: #0056b3;
      text-align: center;
    }
    .employee-select {
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }
    .employee-select:hover {
      border-color: #007bff;
    }
    .empty-message {
      padding: 20px;
      text-align: center;
      color: #999;
      font-style: italic;
    }
    .optimization-section {
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border-left: 5px solid #28a745;
    }
    .optimization-selector {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }
    .optimization-selector label {
      font-weight: bold;
      color: #333;
      margin: 0;
    }
    .objective-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
    }
    .objective-select:hover {
      border-color: #007bff;
    }
    .objective-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }
    .optimization-button {
      padding: 8px 20px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
    }
    .optimization-button:hover {
      background-color: #218838;
    }
    .optimization-button:active {
      background-color: #1e7e34;
    }
    .comparison-button {
      padding: 8px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
    }
    .comparison-button:hover {
      background-color: #0056b3;
    }
    .comparison-button:active {
      background-color: #004085;
    }
    .comparison-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-top: 40px;
      margin-bottom: 20px;
    }
    .comparison-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .comparison-table-wrapper {
      overflow-x: auto;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .comparison-table thead {
      background-color: #007bff;
      color: white;
    }
    .comparison-table th {
      padding: 12px 8px;
      text-align: center;
      font-weight: bold;
      border: 1px solid #0056b3;
    }
    .comparison-table td {
      padding: 12px 8px;
      text-align: center;
      border: 1px solid #ddd;
    }
    .comparison-table tbody tr:nth-child(odd) {
      background-color: #f9f9f9;
    }
    .comparison-table tbody tr:hover {
      background-color: #f0f0f0;
    }
    .comparison-table .objective-name {
      text-align: left;
      font-weight: bold;
      color: #333;
      background-color: #e7f3ff;
    }
  `]
})
export class App {
  @ViewChild('mainFileInput') mainFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('additionalFileInput') additionalFileInput!: ElementRef<HTMLInputElement>;

  protected employees = signal<Employee[]>([]);
  protected mainEmployees = signal<Employee[]>([]);
  protected simulationResult = signal<SimulationResult | null>(null);
  protected objectiveComparisonResults = signal<ObjectiveComparisonResult[]>([]);
  protected additionalFileLoaded = signal<boolean>(false);
  protected deptIds: DepartmentId[] = ['A', 'B', 'C', 'Temp'];
  protected deptConfig = DEPT_CONFIG;
  protected minTotalSales = MIN_TOTAL_SALES;
  protected selectedObjective: OptimizationObjective = 'totalSales';

  constructor(private calculatorService: CalculatorService) {}

  get deptAEmployees(): Employee[] {
    return this.getEmployeesByDept('A');
  }

  get deptBEmployees(): Employee[] {
    return this.getEmployeesByDept('B');
  }

  get deptCEmployees(): Employee[] {
    return this.getEmployeesByDept('C');
  }

  get tempEmployees(): Employee[] {
    return this.getEmployeesByDept('Temp');
  }

  private getEmployeesByDept(deptId: DepartmentId): Employee[] {
    return this.employees()
      .filter((emp) => emp.assignedDept === deptId)
      .sort((a, b) => {
        const contribA = this.calculatorService.calcEmployeeContribution(a, deptId);
        const contribB = this.calculatorService.calcEmployeeContribution(b, deptId);
        return contribB - contribA;
      });
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parseResult = this.parseCSV(csvText);

      if (parseResult.error) {
        alert(parseResult.error);
        return;
      }

      const employees = parseResult.employees;

      for (let i = 0; i < employees.length; i++) {
        if (i < 40) {
          employees[i].assignedDept = 'A';
        } else if (i < 75) {
          employees[i].assignedDept = 'B';
        } else if (i < 100) {
          employees[i].assignedDept = 'C';
        } else {
          employees[i].assignedDept = 'Temp';
        }
      }

      this.mainEmployees.set(employees);
      this.employees.set(employees);
      this.additionalFileLoaded.set(false);
      this.updateSimulation();
      console.log('計算結果:', this.simulationResult());
    };
    reader.readAsText(file);
  }

  clearMainFile(): void {
    this.mainFileInput.nativeElement.value = '';
    this.mainEmployees.set([]);
    this.employees.set([]);
    this.simulationResult.set(null);
    this.objectiveComparisonResults.set([]);
    this.additionalFileLoaded.set(false);
    if (this.additionalFileInput) {
      this.additionalFileInput.nativeElement.value = '';
    }
  }

  clearAdditionalFile(): void {
    this.additionalFileInput.nativeElement.value = '';
    this.employees.set([...this.mainEmployees()]);
    this.additionalFileLoaded.set(false);
    this.updateSimulation();
  }

  onAdditionalFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parseResult = this.parseCSV(csvText);

      if (parseResult.error) {
        alert(parseResult.error);
        return;
      }

      const additionalEmployees = parseResult.employees;

      additionalEmployees.forEach((emp) => {
        emp.assignedDept = 'Temp';
      });

      const updatedEmployees = [...this.mainEmployees(), ...additionalEmployees];
      this.employees.set(updatedEmployees);
      this.additionalFileLoaded.set(true);

      this.updateSimulation();
      console.log('追加候補者読み込み完了:', this.simulationResult());
    };
    reader.readAsText(file);
  }

  onDeptChange(employee: Employee, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newDept = target?.value || '';
    if (!newDept) return;

    const previousDept = employee.assignedDept;

    employee.assignedDept = newDept as DepartmentId;
    this.updateSimulation();

    const result = this.simulationResult();
    if (result && this.isConstraintViolated(result)) {
      alert('制約条件（全社売上58億円以上、または各事業部の最低配置人数）を満たさないため、移動できません。');

      employee.assignedDept = previousDept;
      this.updateSimulation();
      target.value = previousDept;
    }
  }

  private isConstraintViolated(result: SimulationResult): boolean {
    if (result.totalSales < this.minTotalSales) {
      return true;
    }

    if (result.deptA.headcount < this.deptConfig['A'].minCount) {
      return true;
    }

    if (result.deptB.headcount < this.deptConfig['B'].minCount) {
      return true;
    }

    if (result.deptC.headcount < this.deptConfig['C'].minCount) {
      return true;
    }

    return false;
  }

  private updateSimulation(): void {
    const result = this.calculatorService.calculateTotalSimulation(
      this.employees()
    );
    this.simulationResult.set(result);
  }

  runOptimization(): void {
    const optimizedEmployees = this.calculatorService.optimizePlacement(
      this.employees(),
      this.selectedObjective
    );

    this.employees.set(optimizedEmployees);

    const assignedEmployees = optimizedEmployees.filter(
      emp => emp.assignedDept !== 'Temp'
    );
    const deptAEmployees = assignedEmployees.filter(
      emp => emp.assignedDept === 'A'
    );
    const deptBEmployees = assignedEmployees.filter(
      emp => emp.assignedDept === 'B'
    );
    const deptCEmployees = assignedEmployees.filter(
      emp => emp.assignedDept === 'C'
    );

    deptAEmployees.sort((a, b) => {
      const contribA = this.calculatorService.calcEmployeeContribution(a, 'A');
      const contribB = this.calculatorService.calcEmployeeContribution(b, 'A');
      return contribB - contribA;
    });

    deptBEmployees.sort((a, b) => {
      const contribA = this.calculatorService.calcEmployeeContribution(a, 'B');
      const contribB = this.calculatorService.calcEmployeeContribution(b, 'B');
      return contribB - contribA;
    });

    deptCEmployees.sort((a, b) => {
      const contribA = this.calculatorService.calcEmployeeContribution(a, 'C');
      const contribB = this.calculatorService.calcEmployeeContribution(b, 'C');
      return contribB - contribA;
    });

    this.updateSimulation();
  }

  runAllOptimizationsComparison(): void {
    const originalEmployees = this.employees().map(e => ({ ...e }));

    const objectives: OptimizationObjective[] = [
      'totalSales',
      'deptAProfit',
      'deptBSales',
      'deptCSales',
    ];

    const objectiveLabels = [
      '課題1: 全社売上最大化',
      '課題2: A事業部利益最大化',
      '課題3: B事業部売上最大化',
      '課題4: C事業部売上最大化',
    ];

    const results: ObjectiveComparisonResult[] = [];

    for (let i = 0; i < objectives.length; i++) {
      const objective = objectives[i];
      const objectiveLabel = objectiveLabels[i];

      const optimizedEmployees = this.calculatorService.optimizePlacement(
        originalEmployees,
        objective
      );

      const simResult = this.calculatorService.calculateTotalSimulation(
        optimizedEmployees
      );

      results.push({
        objectiveName: objectiveLabel,
        deptAHeadcount: simResult.deptA.headcount,
        deptBHeadcount: simResult.deptB.headcount,
        deptCHeadcount: simResult.deptC.headcount,
        totalSales: simResult.totalSales,
        totalProfit: simResult.totalProfit,
        deptASales: simResult.deptA.finalSales,
        deptAProfit: simResult.deptA.profit,
        deptBSales: simResult.deptB.finalSales,
        deptBProfit: simResult.deptB.profit,
        deptCSales: simResult.deptC.finalSales,
        deptCProfit: simResult.deptC.profit,
      });
    }

    this.objectiveComparisonResults.set(results);

    this.employees.set(originalEmployees);
    this.updateSimulation();

    console.log('目的間結果比較完了:', results);
  }

  getEmployeeContribution(employee: Employee): number {
    return this.calculatorService.calcEmployeeContribution(
      employee,
      employee.assignedDept
    );
  }

  private parseCSV(csvText: string): { employees: Employee[]; error?: string } {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { employees: [] };
    }

    const dataLines = lines.slice(1);
    const employees: Employee[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',').map((v) => v.trim());

      if (values.length < 6) {
        return {
          employees: [],
          error: `CSVの${i + 2}行目のデータが不正です。（例: 能力値は0〜100、人件費は1〜20の範囲で入力してください）`,
        };
      }

      const salesPower = parseFloat(values[1]);
      const managementPower = parseFloat(values[2]);
      const pioneeringPower = parseFloat(values[3]);
      const trainingPower = parseFloat(values[4]);
      const laborCost = parseFloat(values[5]);

      if (
        isNaN(salesPower) ||
        isNaN(managementPower) ||
        isNaN(pioneeringPower) ||
        isNaN(trainingPower) ||
        isNaN(laborCost)
      ) {
        return {
          employees: [],
          error: `CSVの${i + 2}行目のデータが不正です。（例: 能力値は0〜100、人件費は1〜20の範囲で入力してください）`,
        };
      }

      if (
        salesPower < 0 ||
        salesPower > 100 ||
        managementPower < 0 ||
        managementPower > 100 ||
        pioneeringPower < 0 ||
        pioneeringPower > 100 ||
        trainingPower < 0 ||
        trainingPower > 100
      ) {
        return {
          employees: [],
          error: `CSVの${i + 2}行目のデータが不正です。（例: 能力値は0〜100、人件費は1〜20の範囲で入力してください）`,
        };
      }

      if (laborCost < 1 || laborCost > 20) {
        return {
          employees: [],
          error: `CSVの${i + 2}行目のデータが不正です。（例: 能力値は0〜100、人件費は1〜20の範囲で入力してください）`,
        };
      }

      employees.push({
        id: values[0],
        salesPower,
        managementPower,
        pioneeringPower,
        trainingPower,
        laborCost,
        assignedDept: 'Temp',
      });
    }

    return { employees };
  }
}
