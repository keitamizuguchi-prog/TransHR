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
    body, html {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    /* 全体レイアウト */
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background-color: #f8fafc;
    }
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 40px;
      background-color: #f8fafc;
    }
    /* ヘッダー */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 24px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      gap: 20px;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .header-left {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .header-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      white-space: nowrap;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      overflow-x: auto;
    }
    .header-control-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .header-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 13px;
      background-color: white;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }
    .header-select:hover {
      border-color: #2196f3;
    }
    .header-select:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }
    .header-button {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .header-button-primary {
      background-color: #28a745;
      color: white;
    }
    .header-button-primary:hover {
      background-color: #218838;
    }
    .header-button-secondary {
      background-color: #f0f0f0;
      color: #333;
    }
    .header-button-secondary:hover {
      background-color: #e0e0e0;
    }
    .file-label {
      padding: 8px 12px;
      background-color: #f0f0f0;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .file-label:hover {
      background-color: #e0e0e0;
    }
    .file-name {
      font-size: 12px;
      color: #666;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-user {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      border-left: 1px solid #e2e8f0;
      padding-left: 12px;
    }
    .user-email {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
    }
    .header-button-logout {
      background-color: #dc3545;
      color: white;
      padding: 6px 10px;
      font-size: 12px;
    }
    .header-button-logout:hover {
      background-color: #c82333;
    }
    /* メイン画面ラッパー */
    .main-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 16px;
      padding: 16px;
    }
    /* 左側：事業部エリア（75%） */
    .left-section {
      flex: 0 0 75%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    /* サマリーバー */
    .summary-bar {
      display: flex;
      gap: 16px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f4f8;
    }
    .summary-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-label {
      font-size: 11px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    /* 事業部カードコンテナ */
    .dept-cards-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    /* 事業部カード（横分割） */
    .dept-card-large {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f4f8;
      overflow: hidden;
    }
    .dept-header {
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e8e8e8;
    }
    .dept-name {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .dept-content {
      display: flex;
      min-height: 200px;
    }
    /* 左側：統計情報パネル（30%） */
    .dept-stats-panel {
      flex: 0 0 30%;
      padding: 14px;
      border-right: 1px solid #f0f4f8;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: #fafbfc;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .stat-label {
      color: #666;
      font-weight: 600;
      flex-shrink: 0;
    }
    .stat-value {
      color: #1a1a1a;
      font-weight: 600;
      text-align: right;
    }
    .stat-profit {
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
      margin-top: 4px;
    }
    /* 右側：従業員グリッド（70%） */
    .employees-grid {
      flex: 0 0 70%;
      padding: 14px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      align-content: start;
    }
    .employee-mini-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 8px;
      font-size: 10px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .employee-mini-card:hover {
      border-color: #2196f3;
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
    }
    .employee-mini-card.locked {
      background-color: #fffbf0;
      border-color: #ffc107;
    }
    .emp-id {
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
    }
    .emp-abilities {
      font-size: 9px;
      color: #666;
      line-height: 1.2;
    }
    .emp-select {
      width: 100%;
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 9px;
      cursor: pointer;
    }
    /* 右側：一時置き場（25%） */
    .right-section {
      flex: 0 0 25%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    /* 一時置き場パネル */
    .temp-panel {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f4f8;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .temp-header {
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e8e8e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .temp-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .temp-badge {
      font-size: 11px;
      background-color: #e0e0e0;
      color: #333;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .temp-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .temp-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      font-size: 12px;
      text-align: center;
    }
    /* 下部セクション */
    .comparison-sections {
      padding: 16px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      overflow-y: auto;
    }
    .comparison-section {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #f0f4f8;
      margin-bottom: 16px;
    }
    .section-title {
      margin: 0 0 12px 0;
      color: #1a1a1a;
      font-size: 14px;
      font-weight: 700;
    }
    /* テーブル */
    .comparison-table-wrapper {
      overflow-x: auto;
      border-radius: 6px;
      border: 1px solid #e8e8e8;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .comparison-table thead {
      background-color: #2196f3;
      color: white;
    }
    .comparison-table th {
      padding: 10px 8px;
      text-align: center;
      font-weight: 600;
      border: 1px solid #1976d2;
    }
    .comparison-table td {
      padding: 8px;
      text-align: right;
      border: 1px solid #e8e8e8;
    }
    .comparison-table tbody tr:nth-child(odd) {
      background-color: #fafbfc;
    }
    .comparison-table tbody tr:hover {
      background-color: #f0f6ff;
    }
    .comparison-table .objective-name {
      text-align: left;
      font-weight: 600;
      color: #1a1a1a;
      background-color: #e7f3ff;
    }
    /* スクロールバー */
    .left-section::-webkit-scrollbar,
    .temp-list::-webkit-scrollbar,
    .employees-grid::-webkit-scrollbar,
    .comparison-sections::-webkit-scrollbar {
      width: 6px;
    }
    .left-section::-webkit-scrollbar-track,
    .temp-list::-webkit-scrollbar-track,
    .employees-grid::-webkit-scrollbar-track,
    .comparison-sections::-webkit-scrollbar-track {
      background: transparent;
    }
    .left-section::-webkit-scrollbar-thumb,
    .temp-list::-webkit-scrollbar-thumb,
    .employees-grid::-webkit-scrollbar-thumb,
    .comparison-sections::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }
    .left-section::-webkit-scrollbar-thumb:hover,
    .temp-list::-webkit-scrollbar-thumb:hover,
    .employees-grid::-webkit-scrollbar-thumb:hover,
    .comparison-sections::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
    /* ステータス */
    .text-success {
      color: #28a745;
    }
    .text-danger {
      color: #dc3545;
    }
    /* 無効状態 */
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    /* ファイル未選択時のガイダンス */
    .empty-state-guide {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
      border-radius: 8px;
      border: 2px dashed #e2e8f0;
    }
    .empty-state-content {
      text-align: center;
      padding: 60px 40px;
    }
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.6;
    }
    .empty-state-title {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .empty-state-description {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
    .empty-state-hint {
      padding: 12px 16px;
      background-color: white;
      border-radius: 6px;
      border: 1px solid #e8e8e8;
    }
    /* スケルトンローディング */
    .dept-cards-skeleton {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .skeleton-card {
      height: 240px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 8px;
    }
    @keyframes skeleton-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    .temp-empty-skeleton {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #ccc;
    }
    /* アニメーション */
    @keyframes spin {
      to { transform: rotate(360deg); }
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
    console.log('[App] ngOnInit started');

    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('[App] User updated:', user?.email || 'No user');
        this.currentUser.set(user);
      });

    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        console.log('[App] Authentication state changed:', isAuth);
        this.isAuthenticated.set(isAuth);
      });

    this.setupActivityListener();
    console.log('[App] ngOnInit completed');
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

  private setupActivityListener(): void {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        if (this.authService.isAuthenticated()) {
          this.authService.resetSessionTimeout();
        }
      });
    });
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
