import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepartmentId, Employee, SimulationResult, OptimizationObjective, ObjectiveComparisonResult, MatrixComparisonResult } from './models/types';
import { CalculatorService } from './services/calculator.service';
import { AuthService } from './services/auth.service';
import { DEPT_CONFIG, MIN_TOTAL_SALES } from './constants/app.constants';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  styles: [`
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: #1a1a1a;
      margin-bottom: 32px;
      font-size: 28px;
      font-weight: 600;
    }
    h2 {
      color: #1a1a1a;
      font-size: 19px;
      font-weight: 700;
      border-bottom: 2px solid #007bff;
      padding-bottom: 12px;
      margin-top: 0;
      margin-bottom: 22px;
      letter-spacing: -0.3px;
    }
    /* ファイル入力セクション */
    .file-input-section {
      margin-bottom: 24px;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .file-input-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      min-width: 250px;
    }
    .file-input-group label {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
    .file-input-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .file-input-section input[type="file"] {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      flex: 1;
      transition: border-color 0.3s ease;
      background: white;
    }
    .file-input-section input[type="file"]:hover {
      border-color: #007bff;
    }
    /* ボタンスタイル統一 */
    button {
      transition: all 0.25s ease;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    /* Primary ボタン（主操作） */
    .optimization-button {
      padding: 11px 24px;
      background-color: #28a745;
      color: white;
      font-size: 14px;
      min-width: 140px;
      box-shadow: 0 2px 4px rgba(40, 167, 69, 0.25);
      font-weight: 700;
    }
    .optimization-button:hover {
      background-color: #218838;
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.35);
      transform: translateY(-2px);
    }
    .optimization-button:active {
      background-color: #1e7e34;
      box-shadow: 0 1px 2px rgba(40, 167, 69, 0.25);
      transform: translateY(0);
    }
    /* Secondary ボタン（補助操作） */
    .comparison-button {
      padding: 9px 16px;
      background-color: #6c757d;
      color: white;
      font-size: 13px;
      box-shadow: 0 1px 2px rgba(108, 117, 125, 0.15);
      font-weight: 600;
    }
    .comparison-button:hover {
      background-color: #5a6268;
      box-shadow: 0 2px 4px rgba(108, 117, 125, 0.25);
    }
    .comparison-button:active {
      background-color: #545b62;
      box-shadow: 0 1px 2px rgba(108, 117, 125, 0.15);
    }
    /* Danger ボタン（取り消す） */
    .clear-button {
      padding: 7px 12px;
      background-color: #fff;
      color: #dc3545;
      border: 1px solid #dc3545;
      font-weight: 600;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: none;
    }
    .clear-button:hover {
      background-color: #dc3545;
      color: white;
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.25);
    }
    .clear-button:active {
      background-color: #bd2130;
      border-color: #bd2130;
      box-shadow: 0 1px 2px rgba(220, 53, 69, 0.15);
    }
    /* セクション間の統一된 余白 */
    .dashboard + .optimization-section,
    .optimization-section + .comparison-section,
    .comparison-section + .comparison-section,
    .comparison-section + .employees-section,
    .employees-section + .comparison-section {
      margin-top: 32px;
    }
    /* ダッシュボード */
    .dashboard {
      margin-bottom: 32px;
    }
    .total-metrics {
      display: flex;
      gap: 20px;
      margin-bottom: 32px;
    }
    .total-metric {
      flex: 1;
      background: white;
      padding: 28px 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      text-align: center;
      border-top: 4px solid #007bff;
    }
    .total-metric:nth-child(2) {
      border-top-color: #28a745;
    }
    .total-metric h3 {
      margin: 0 0 14px 0;
      color: #999;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .total-metric .value {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    /* 事業部カード */
    .dept-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .dept-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border-top: 5px solid #007bff;
    }
    .dept-card h3 {
      margin: 0 0 20px 0;
      padding: 0;
      border: none;
      color: #0056b3;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .dept-card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      gap: 16px;
    }
    .dept-card-row:last-child {
      border-bottom: none;
    }
    .dept-card-row label {
      color: #666;
      font-weight: 600;
      flex-shrink: 0;
    }
    .dept-card-row .value {
      color: #333;
      text-align: right;
      font-weight: 500;
    }
    /* 最適化セクション */
    .optimization-section {
      margin-bottom: 24px;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border-left: 5px solid #28a745;
    }
    .optimization-selector {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .optimization-selector label {
      font-weight: 600;
      color: #333;
      margin: 0;
      font-size: 14px;
    }
    .objective-select {
      padding: 9px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background-color: white;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }
    .objective-select:hover {
      border-color: #007bff;
    }
    .objective-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    /* テーブル共通スタイル */
    .comparison-section {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      margin-top: 32px;
      margin-bottom: 32px;
    }
    .comparison-table-wrapper {
      overflow-x: auto;
      border-radius: 4px;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .comparison-table thead {
      background-color: #007bff;
      color: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .comparison-table th {
      padding: 12px 9px;
      text-align: center;
      font-weight: 600;
      border: 1px solid #0056b3;
      font-size: 11px;
      line-height: 1.4;
    }
    .comparison-table td {
      padding: 11px 9px;
      text-align: right;
      border: 1px solid #e8e8e8;
      font-size: 12px;
    }
    .comparison-table tbody tr:nth-child(odd) {
      background-color: #fafbfc;
    }
    .comparison-table tbody tr:nth-child(even) {
      background-color: #fff;
    }
    .comparison-table tbody tr:hover {
      background-color: #f0f6ff;
    }
    .comparison-table .objective-name {
      text-align: left;
      font-weight: 600;
      color: #0c2540;
      background-color: #e7f3ff;
    }
    .comparison-table tbody tr:nth-child(odd) .objective-name {
      background-color: #ddeafb;
    }
    .comparison-table tbody tr:nth-child(even) .objective-name {
      background-color: #e7f3ff;
    }
    /* 社員リストセクション */
    .employees-section {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      margin-bottom: 32px;
    }
    .employees-section h2 {
      margin: 0 0 20px 0;
    }
    .dept-lists {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .dept-list {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .dept-list-header {
      background-color: #007bff;
      color: white;
      padding: 14px 16px;
      font-weight: 700;
      font-size: 15px;
      border-bottom: 2px solid #0056b3;
    }
    .dept-list-content {
      max-height: 600px;
      overflow-y: auto;
    }
    .employee-row {
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.15s ease;
    }
    .employee-row:hover {
      background-color: #f5f8fc;
      border-left: 3px solid #007bff;
      padding-left: 13px;
    }
    .employee-row.locked {
      background-color: #fffbf0;
      border-left: 3px solid #ffc107;
      padding-left: 13px;
    }
    .employee-row.locked:hover {
      background-color: #fff8e8;
    }
    .lock-button {
      color: #666;
      border-color: #999;
      background: white;
    }
    .lock-button:hover {
      background-color: #f0f0f0;
      border-color: #666;
    }
    .lock-button-locked {
      color: white;
      background-color: #ffc107;
      border-color: #ffc107;
      font-weight: 600;
    }
    .lock-button-locked:hover {
      background-color: #ffb300;
      border-color: #ffb300;
    }
    .employee-row:last-child {
      border-bottom: none;
    }
    .employee-id {
      font-weight: 700;
      color: #1a1a1a;
      font-size: 14px;
    }
    .employee-stats {
      font-size: 12px;
      color: #666;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .employee-stat {
      display: flex;
      justify-content: space-between;
    }
    .employee-stat label {
      font-weight: 600;
      margin-right: 6px;
    }
    .employee-contribution {
      padding: 8px 10px;
      background-color: #e7f3ff;
      border-radius: 4px;
      font-weight: 600;
      color: #0056b3;
      text-align: center;
      font-size: 12px;
    }
    .employee-select {
      padding: 7px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      transition: border-color 0.2s ease;
    }
    .employee-select:hover {
      border-color: #007bff;
    }
    .employee-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    }
    .empty-message {
      padding: 24px 16px;
      text-align: center;
      color: #999;
      font-style: italic;
      font-size: 13px;
    }
    /* ステータスメッセージ */
    .text-success {
      color: #28a745;
      font-weight: 600;
    }
    .text-danger {
      color: #dc3545;
      font-weight: 600;
    }
    .alert {
      padding: 16px;
      margin-bottom: 20px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 14px;
      line-height: 1.5;
    }
    .alert-info {
      background-color: #d1ecf1;
      border-color: #bee5eb;
      color: #0c5460;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .alert-info::before {
      content: 'ℹ️';
      flex-shrink: 0;
      font-size: 16px;
    }
    /* アニメーション */
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    /* ボタンの無効状態 */
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    select:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class App implements OnInit, OnDestroy {
  @ViewChild('mainFileInput') mainFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('additionalFileInput') additionalFileInput!: ElementRef<HTMLInputElement>;

  protected currentUser = signal<any>(null);
  protected isAuthenticated = signal<boolean>(false);
  private destroy$ = new Subject<void>();

  protected employees = signal<Employee[]>([]);
  protected mainEmployees = signal<Employee[]>([]);
  protected simulationResult = signal<SimulationResult>(this.createEmptyResult());
  protected objectiveComparisonResults = signal<ObjectiveComparisonResult[]>([]);
  protected matrixComparisonResults = signal<MatrixComparisonResult[]>([]);
  protected additionalFileLoaded = signal<boolean>(false);
  protected optimizationExecuted = signal<boolean>(false);
  protected isProcessing = signal<boolean>(false);
  protected mainFileName = signal<string>('');
  protected additionalFileName = signal<string>('');
  protected deptIds: DepartmentId[] = ['A', 'B', 'C', 'Temp'];
  protected deptConfig = DEPT_CONFIG;
  protected minTotalSales = MIN_TOTAL_SALES;
  protected selectedObjective: OptimizationObjective = 'totalSales';
  protected optimizationReason: string = '';

  constructor(
    private calculatorService: CalculatorService,
    protected authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser.set(user);
      });

    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated.set(isAuth);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      alert('ログインに失敗しました');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました');
    }
  }

  private createEmptyResult(): SimulationResult {
    return {
      deptA: {
        deptId: 'A',
        headcount: 0,
        deptAbility: 0,
        baseSales: 0,
        finalSales: 0,
        deptCost: 0,
        profit: 0,
      },
      deptB: {
        deptId: 'B',
        headcount: 0,
        deptAbility: 0,
        baseSales: 0,
        finalSales: 0,
        deptCost: 0,
        profit: 0,
      },
      deptC: {
        deptId: 'C',
        headcount: 0,
        deptAbility: 0,
        baseSales: 0,
        finalSales: 0,
        deptCost: 0,
        profit: 0,
      },
      totalSales: 0,
      totalProfit: 0,
    };
  }

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

    const fileName = file.name;

    // すでに同じファイルが選択されているかチェック
    if (this.mainFileName() === fileName) {
      alert(`「${fileName}」は既に選択されています。別のファイルを選択するか、「取り消す」ボタンで削除してください。`);
      event.target.value = '';
      return;
    }

    // 追加ファイルと同じかチェック
    if (this.additionalFileName() === fileName) {
      alert(`「${fileName}」は追加候補者ファイルとして既に選択されています。別のファイルを選択してください。`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parseResult = this.parseCSV(csvText);

      if (parseResult.error) {
        alert(parseResult.error);
        event.target.value = '';
        return;
      }

      const employees = parseResult.employees;

      for (let i = 0; i < employees.length; i++) {
        employees[i].assignedDept = 'Temp';
      }

      this.mainFileName.set(fileName);
      this.mainEmployees.set(employees);
      this.employees.set(employees);
      this.additionalFileLoaded.set(false);
      this.additionalFileName.set('');
      this.optimizationExecuted.set(false);
      this.updateSimulation();
      console.log('計算結果:', this.simulationResult());
    };
    reader.readAsText(file);
  }

  clearMainFile(): void {
    this.mainFileInput.nativeElement.value = '';
    this.mainEmployees.set([]);
    this.employees.set([]);
    this.simulationResult.set(this.createEmptyResult());
    this.objectiveComparisonResults.set([]);
    this.matrixComparisonResults.set([]);
    this.additionalFileLoaded.set(false);
    this.additionalFileName.set('');
    this.mainFileName.set('');
    this.optimizationExecuted.set(false);
    if (this.additionalFileInput) {
      this.additionalFileInput.nativeElement.value = '';
    }
  }

  clearAdditionalFile(): void {
    this.additionalFileInput.nativeElement.value = '';
    this.employees.set([...this.mainEmployees()]);
    this.additionalFileLoaded.set(false);
    this.additionalFileName.set('');
    this.matrixComparisonResults.set([]);
    this.updateSimulation();
  }

  onAdditionalFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const fileName = file.name;

    // すでに同じファイルが選択されているかチェック
    if (this.additionalFileName() === fileName) {
      alert(`「${fileName}」は既に選択されています。別のファイルを選択するか、「取り消す」ボタンで削除してください。`);
      event.target.value = '';
      return;
    }

    // メインファイルと同じかチェック
    if (this.mainFileName() === fileName) {
      alert(`「${fileName}」はメインファイルとして既に選択されています。別のファイルを選択してください。`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parseResult = this.parseCSV(csvText);

      if (parseResult.error) {
        alert(parseResult.error);
        event.target.value = '';
        return;
      }

      const additionalEmployees = parseResult.employees;

      additionalEmployees.forEach((emp) => {
        emp.assignedDept = 'Temp';
      });

      // 現在の最適化済み配置を mainEmployees に反映
      this.mainEmployees.set(this.employees());

      const updatedEmployees = [...this.mainEmployees(), ...additionalEmployees];
      this.employees.set(updatedEmployees);
      this.additionalFileLoaded.set(true);
      this.additionalFileName.set(fileName);

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
    this.isProcessing.set(true);

    setTimeout(() => {
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

      switch (this.selectedObjective) {
        case 'totalSales':
          this.optimizationReason = '【最適化の根拠】全社売上 >= 58億円および各部署の最低人数制約を満たしつつ、全社の合計売上が最大となる人員配置を算出しました。';
          break;
        case 'deptAProfit':
          this.optimizationReason = '【最適化の根拠】A事業部の利益を最大化しつつ、副目的としてB・C事業部の売上合計が最も高くなる組み合わせを選出しました。';
          break;
        case 'deptBSales':
          this.optimizationReason = '【最適化の根拠】B事業部の売上を最大化しつつ、副目的としてA・C事業部の売上合計が最も高くなる組み合わせを選出しました。';
          break;
        case 'deptCSales':
          this.optimizationReason = '【最適化の根拠】C事業部の売上を最大化しつつ、副目的としてA・B事業部の売上合計が最も高くなる組み合わせを選出しました。';
          break;
      }

      this.optimizationExecuted.set(true);
      this.updateSimulation();
      this.isProcessing.set(false);
    }, 100);
  }

  runAllOptimizationsComparison(): void {
    this.isProcessing.set(true);

    setTimeout(() => {
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

      this.optimizationExecuted.set(true);
      this.employees.set(originalEmployees);
      this.updateSimulation();

      console.log('目的間結果比較完了:', results);
      this.isProcessing.set(false);
    }, 100);
  }

  getEmployeeContribution(employee: Employee): number {
    return this.calculatorService.calcEmployeeContribution(
      employee,
      employee.assignedDept
    );
  }

  toggleLock(employee: Employee): void {
    employee.isLocked = !employee.isLocked;
  }

  private getPlacementString(result: SimulationResult): string {
    return `A:${result.deptA.headcount}, B:${result.deptB.headcount}, C:${result.deptC.headcount}`;
  }

  runMatrixComparison(): void {
    this.isProcessing.set(true);

    setTimeout(() => {
      const baseEmployees = this.mainEmployees();
      const additionalEmployees = this.employees().filter(
        emp => !baseEmployees.find(be => be.id === emp.id)
      );

      if (baseEmployees.length === 0 || additionalEmployees.length === 0) {
        alert('メインファイルと追加ファイルの両方が必要です。');
        this.isProcessing.set(false);
        return;
      }

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

      const results: MatrixComparisonResult[] = [];

      for (let i = 0; i < objectives.length; i++) {
        const objective = objectives[i];
        const objectiveLabel = objectiveLabels[i];

        // 採用前（100名）での最適化
        const beforeOptimized = this.calculatorService.optimizePlacement(
          baseEmployees,
          objective
        );
        const beforeResult = this.calculatorService.calculateTotalSimulation(
          beforeOptimized
        );

        // 採用後（110名）での最適化
        const allEmployees = [...baseEmployees, ...additionalEmployees];
        const afterOptimized = this.calculatorService.optimizePlacement(
          allEmployees,
          objective
        );
        const afterResult = this.calculatorService.calculateTotalSimulation(
          afterOptimized
        );

        // 差分を計算
        const salesDiff = afterResult.totalSales - beforeResult.totalSales;
        const profitDiff = afterResult.totalProfit - beforeResult.totalProfit;

        results.push({
          objectiveName: objectiveLabel,
          beforePlacement: this.getPlacementString(beforeResult),
          beforeTotalSales: beforeResult.totalSales,
          beforeTotalProfit: beforeResult.totalProfit,
          afterPlacement: this.getPlacementString(afterResult),
          afterTotalSales: afterResult.totalSales,
          afterTotalProfit: afterResult.totalProfit,
          salesDiff,
          profitDiff,
        });
      }

      this.matrixComparisonResults.set(results);
      console.log('マトリクス比較結果:', results);
      this.isProcessing.set(false);
    }, 100);
  }

  exportPlacementToCsv(): void {
    const rows: string[] = ['ID,営業力,管理力,開拓力,育成力,人件費,配置先'];

    for (const emp of this.employees()) {
      const row = [
        emp.id,
        emp.salesPower.toFixed(1),
        emp.managementPower.toFixed(1),
        emp.pioneeringPower.toFixed(1),
        emp.trainingPower.toFixed(1),
        emp.laborCost.toString(),
        emp.assignedDept,
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'placement_result.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        isLocked: false,
      });
    }

    return { employees };
  }
}
