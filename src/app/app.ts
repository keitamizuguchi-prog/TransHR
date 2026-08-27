import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepartmentId, Employee, SimulationResult, OptimizationObjective, ObjectiveComparisonResult, MatrixComparisonResult } from './models/types';
import { CalculatorService } from './services/calculator.service';
import { AuthService } from './services/auth.service';
import { DEPT_CONFIG, MIN_TOTAL_SALES, FULFILLMENT_RATE_THRESHOLDS } from './constants/app.constants';
import { BaseChartDirective } from 'ng2-charts';
import { Chart as ChartJS, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import type { ChartOptions } from 'chart.js';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, BaseChartDirective],
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
      flex-direction: column;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 24px;
      gap: 20px;
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
    .header-tabs {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 0;
    }
    .header-tab {
      padding: 12px 20px;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .header-tab.active {
      color: #2196f3;
      border-bottom-color: #2196f3;
    }
    .header-tab:hover {
      color: #1a1a1a;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
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
    /* ヘッダー下部 */
    .header-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 24px;
      background-color: #fafbfc;
      border-top: 1px solid #e2e8f0;
    }
    .header-bottom-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .file-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-bottom-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .file-label-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    .header-button-danger {
      background-color: #dc3545;
      color: white;
    }
    .header-button-danger:hover {
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
    /* 左側：事業部エリア */
    .left-section {
      flex: 1;
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
    /* 左側：統計情報パネル（40%・2列グリッド） */
    .dept-stats-panel {
      flex: 0 0 40%;
      padding: 14px;
      border-right: 1px solid #f0f4f8;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
      align-content: start;
      background-color: #fafbfc;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
    }
    .stat-label {
      color: #666;
      font-weight: 600;
      flex-shrink: 0;
      font-size: 11px;
    }
    .stat-value {
      color: #1a1a1a;
      font-weight: 600;
      text-align: left;
      font-size: 13px;
    }
    .stat-divider {
      grid-column: 1 / -1;
      border-top: 1px solid #e0e0e0;
      margin-top: 2px;
    }
    /* 右側：従業員グリッド（残り幅いっぱい） */
    .employees-grid {
      flex: 1 1 0;
      min-width: 0;
      padding: 14px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
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
    .employee-mini-card.candidate {
      background-color: #f0f7ff;
      border-color: #90caf9;
    }
    .candidate-badge {
      align-self: flex-start;
      font-size: 8px;
      font-weight: 700;
      color: #1565c0;
      background-color: #bbdefb;
      padding: 1px 5px;
      border-radius: 8px;
    }
    .emp-id {
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .emp-lock-btn {
      width: 100%;
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background-color: white;
      font-size: 10px;
      cursor: pointer;
      margin-top: 4px;
      transition: all 0.2s ease;
    }
    .emp-lock-btn:hover {
      background-color: #f0f0f0;
      border-color: #999;
    }
    /* 右側：一時置き場 */
    .right-section {
      flex: 0 0 300px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: flex-basis 0.2s ease;
    }
    .right-section.collapsed {
      flex: 0 0 auto;
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
    .temp-panel.collapsed {
      width: 44px;
    }
    .temp-header {
      padding: 12px 16px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e8e8e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .temp-header.collapsed {
      flex-direction: column;
      padding: 12px 8px;
      border-bottom: none;
      height: 100%;
      justify-content: flex-start;
    }
    .temp-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .temp-title-vertical {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      writing-mode: vertical-rl;
      letter-spacing: 1px;
    }
    .temp-badge {
      font-size: 11px;
      background-color: #e0e0e0;
      color: #333;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .temp-toggle-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      color: #555;
      flex-shrink: 0;
    }
    .temp-toggle-btn:hover {
      background-color: #eef2f7;
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
    /* スクロールバーを非表示 */
    .left-section::-webkit-scrollbar,
    .temp-list::-webkit-scrollbar,
    .employees-grid::-webkit-scrollbar,
    .comparison-sections::-webkit-scrollbar {
      display: none;
    }
    .left-section,
    .temp-list,
    .employees-grid,
    .comparison-sections {
      -ms-overflow-style: none;
      scrollbar-width: none;
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
  protected objectiveComparisonResultsWithAdditional = signal<ObjectiveComparisonResult[]>([]);
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
  protected currentScreen = signal<'dashboard' | 'objective' | 'matrix'>('dashboard');
  protected tempPanelOpen = signal<boolean>(true);

  // グラフ用データ
  protected matrixChartLabels = signal<string[]>([]);
  protected matrixChartData = signal<any>({
    labels: [],
    datasets: [
      {
        label: '売上差分(億円)',
        data: [],
        backgroundColor: '#2196f3',
        borderColor: '#1976d2',
        borderWidth: 1,
      },
      {
        label: '利益差分(億円)',
        data: [],
        backgroundColor: '#28a745',
        borderColor: '#1e7e34',
        borderWidth: 1,
      },
    ],
  });
  protected matrixChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || 0;
            return `${context.dataset.label}: ${value.toFixed(2)}億円`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: '差分(億円)',
        },
      },
      y: {
        stacked: false,
      },
    },
  };

  // 目的別比較用グラフデータ
  protected objectiveChartDataSource = signal<'main' | 'additional'>('main');

  protected objectiveChartData1 = signal<any>({
    labels: [],
    datasets: [
      { label: '全社売上(億円)', data: [], backgroundColor: '#2196f3', borderColor: '#1976d2', borderWidth: 1 },
      { label: '全社利益(億円)', data: [], backgroundColor: '#28a745', borderColor: '#1e7e34', borderWidth: 1 },
    ],
  });

  protected objectiveChartOptions1: ChartOptions<'bar'> = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: ${value.toFixed(2)}億円`;
          },
        },
      },
    },
    scales: {
      y: { stacked: false, title: { display: true, text: '金額(億円)' } },
      x: { stacked: false },
    },
  };

  protected objectiveChartData2 = signal<any>({
    labels: [],
    datasets: [
      { label: 'A部売上(億円)', data: [], backgroundColor: '#FF6B6B', borderColor: '#E63946', borderWidth: 1 },
      { label: 'B部売上(億円)', data: [], backgroundColor: '#4ECDC4', borderColor: '#2C9B9E', borderWidth: 1 },
      { label: 'C部売上(億円)', data: [], backgroundColor: '#FFE66D', borderColor: '#FFD93D', borderWidth: 1 },
    ],
  });

  protected objectiveChartOptions2: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || 0;
            return `${context.dataset.label}: ${value.toFixed(2)}億円`;
          },
        },
      },
    },
    scales: {
      x: { stacked: true, title: { display: true, text: '売上(億円)' } },
      y: { stacked: false },
    },
  };

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

  goToDashboard(): void {
    this.currentScreen.set('dashboard');
  }

  toggleTempPanel(): void {
    this.tempPanelOpen.update(open => !open);
  }

  goToObjectiveComparison(): void {
    this.currentScreen.set('objective');
    if (this.objectiveComparisonResults().length === 0) {
      this.runAllOptimizationsComparison();
    }
  }

  goToMatrixComparison(): void {
    this.currentScreen.set('matrix');
    if (this.matrixComparisonResults().length === 0) {
      this.runMatrixComparison();
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

    if (this.additionalFileName() !== '' && fileName === this.additionalFileName()) {
      alert('採用予定ファイルと同じファイルは選択できません。');
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

      const newEmployees = parseResult.employees;

      // 新しい社員を全員Temp（一時置き場）に設定
      for (let i = 0; i < newEmployees.length; i++) {
        newEmployees[i].assignedDept = 'Temp';
        newEmployees[i].source = 'existing';
      }

      // 既存の社員と新しい社員を統合（一時置き場に追加するのみ、配置計算は行わない）
      const currentEmployees = this.employees();
      const combinedEmployees = [...currentEmployees, ...newEmployees];

      // 更新：ファイル名を追記（複数選択対応）
      if (this.mainFileName() === '') {
        this.mainFileName.set(fileName);
      } else {
        this.mainFileName.set(this.mainFileName() + ', ' + fileName);
      }

      this.employees.set(combinedEmployees);
      this.mainEmployees.set(combinedEmployees);
      this.tempPanelOpen.set(true);
      console.log('従業員ファイル読み込み完了。一時置き場に追加された社員数:', newEmployees.length);
    };
    reader.readAsText(file);
  }

  clearEmployeeFile(): void {
    this.mainFileInput.nativeElement.value = '';
    const remainingEmployees = this.employees().filter((emp) => emp.source !== 'existing');
    this.employees.set(remainingEmployees);
    this.mainEmployees.set([]);
    this.mainFileName.set('');
    this.simulationResult.set(this.createEmptyResult());
    this.objectiveComparisonResults.set([]);
    this.matrixComparisonResults.set([]);
    this.optimizationExecuted.set(false);
  }

  clearCandidateFile(): void {
    if (this.additionalFileInput) {
      this.additionalFileInput.nativeElement.value = '';
    }
    const remainingEmployees = this.employees().filter((emp) => emp.source !== 'candidate');
    this.employees.set(remainingEmployees);
    this.additionalFileLoaded.set(false);
    this.additionalFileName.set('');
    this.matrixComparisonResults.set([]);
    this.objectiveComparisonResultsWithAdditional.set([]);
    this.updateSimulation();
  }

  onAdditionalFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const fileName = file.name;

    if (this.mainFileName() !== '' && fileName === this.mainFileName()) {
      alert('従業員ファイルと同じファイルは選択できません。');
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
        emp.source = 'candidate';
      });

      // 現在の状態を保持して、採用予定ファイルの社員を一時置き場に追加するのみ（配置計算は行わない）
      const currentEmployees = this.employees();
      const updatedEmployees = [...currentEmployees, ...additionalEmployees];
      this.employees.set(updatedEmployees);
      this.additionalFileLoaded.set(true);
      this.tempPanelOpen.set(true);

      // 追加ファイル名を更新
      if (this.additionalFileName() === '') {
        this.additionalFileName.set(fileName);
      } else {
        this.additionalFileName.set(this.additionalFileName() + ', ' + fileName);
      }

      console.log('採用予定ファイル読み込み完了。一時置き場に追加された採用候補者数:', additionalEmployees.length);
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
    } else {
      // 配置変更が成功した場合、比較結果をリセット（再計算が必要な状態にする）
      this.objectiveComparisonResults.set([]);
      this.objectiveComparisonResultsWithAdditional.set([]);
      this.matrixComparisonResults.set([]);
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
      this.tempPanelOpen.set(false);
    }, 100);
  }

  runAllOptimizationsComparison(): void {
    this.isProcessing.set(true);

    setTimeout(() => {
      const mainEmployeesOnly = this.mainEmployees().map(e => ({ ...e }));
      const allEmployees = this.employees().map(e => ({ ...e }));

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

      const mainResults: ObjectiveComparisonResult[] = [];

      for (let i = 0; i < objectives.length; i++) {
        const objective = objectives[i];
        const objectiveLabel = objectiveLabels[i];

        const optimizedEmployees = this.calculatorService.optimizePlacement(
          mainEmployeesOnly,
          objective
        );

        const simResult = this.calculatorService.calculateTotalSimulation(
          optimizedEmployees
        );

        mainResults.push({
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

      this.objectiveComparisonResults.set(mainResults);

      if (this.additionalFileLoaded()) {
        const additionalResults: ObjectiveComparisonResult[] = [];

        for (let i = 0; i < objectives.length; i++) {
          const objective = objectives[i];
          const objectiveLabel = objectiveLabels[i];

          const optimizedEmployees = this.calculatorService.optimizePlacement(
            allEmployees,
            objective
          );

          const simResult = this.calculatorService.calculateTotalSimulation(
            optimizedEmployees
          );

          additionalResults.push({
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

        this.objectiveComparisonResultsWithAdditional.set(additionalResults);
        console.log('採用予定者を含む目的間結果比較完了:', additionalResults);
      } else {
        this.objectiveComparisonResultsWithAdditional.set([]);
      }

      this.optimizationExecuted.set(true);
      this.employees.set(allEmployees);
      this.updateSimulation();

      console.log('目的間結果比較完了（メイン）:', mainResults);
      this.updateObjectiveChartData();
      this.isProcessing.set(false);
    }, 100);
  }

  toggleObjectiveDataSource(source: 'main' | 'additional'): void {
    this.objectiveChartDataSource.set(source);
    this.updateObjectiveChartData();
  }

  private updateObjectiveChartData(): void {
    const dataSource = this.objectiveChartDataSource();
    const results = dataSource === 'main'
      ? this.objectiveComparisonResults()
      : this.objectiveComparisonResultsWithAdditional();

    if (results.length === 0) {
      return;
    }

    const labels = results.map(r => r.objectiveName);
    const totalSalesData = results.map(r => r.totalSales);
    const totalProfitData = results.map(r => r.totalProfit);
    const deptASalesData = results.map(r => r.deptASales);
    const deptBSalesData = results.map(r => r.deptBSales);
    const deptCSalesData = results.map(r => r.deptCSales);

    // グラフA: 全社売上・利益
    this.objectiveChartData1.set({
      labels: labels,
      datasets: [
        {
          label: '全社売上(億円)',
          data: totalSalesData,
          backgroundColor: '#2196f3',
          borderColor: '#1976d2',
          borderWidth: 1
        },
        {
          label: '全社利益(億円)',
          data: totalProfitData,
          backgroundColor: '#28a745',
          borderColor: '#1e7e34',
          borderWidth: 1
        },
      ],
    });

    // グラフB: 各部門売上内訳
    this.objectiveChartData2.set({
      labels: labels,
      datasets: [
        {
          label: 'A部売上(億円)',
          data: deptASalesData,
          backgroundColor: '#FF6B6B',
          borderColor: '#E63946',
          borderWidth: 1
        },
        {
          label: 'B部売上(億円)',
          data: deptBSalesData,
          backgroundColor: '#4ECDC4',
          borderColor: '#2C9B9E',
          borderWidth: 1
        },
        {
          label: 'C部売上(億円)',
          data: deptCSalesData,
          backgroundColor: '#FFE66D',
          borderColor: '#FFD93D',
          borderWidth: 1
        },
      ],
    });
  }

  getFulfillmentRateColor(fulfillmentRate: number | undefined): { bg: string; text: string } {
    if (!fulfillmentRate) return { bg: '#f0f0f0', text: '#333' };

    if (fulfillmentRate >= 100 && fulfillmentRate <= FULFILLMENT_RATE_THRESHOLDS.OPTIMAL_MAX) {
      // 100%～120%：緑（適正）
      return { bg: '#d4edda', text: '#155724' };
    } else if (fulfillmentRate >= FULFILLMENT_RATE_THRESHOLDS.CAUTION_MIN && fulfillmentRate < 100) {
      // 90%～100%：黄色（注意）
      return { bg: '#fff3cd', text: '#856404' };
    } else if (fulfillmentRate >= FULFILLMENT_RATE_THRESHOLDS.WARNING_MIN && fulfillmentRate < FULFILLMENT_RATE_THRESHOLDS.CAUTION_MIN) {
      // 80%～90%：黄色（注意）
      return { bg: '#fff3cd', text: '#856404' };
    } else if (fulfillmentRate >= FULFILLMENT_RATE_THRESHOLDS.CRITICAL_MIN && fulfillmentRate < FULFILLMENT_RATE_THRESHOLDS.WARNING_MIN) {
      // 70%～80%：橙色（警告）
      return { bg: '#ffe5cc', text: '#cc6600' };
    } else {
      // 70%未満：赤（危険）
      return { bg: '#f8d7da', text: '#721c24' };
    }
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
      this.updateMatrixChartData();
      console.log('マトリクス比較結果:', results);
      this.isProcessing.set(false);
    }, 100);
  }

  private updateMatrixChartData(): void {
    const results = this.matrixComparisonResults();
    if (results.length === 0) {
      return;
    }

    const labels = results.map(r => r.objectiveName);
    const salesDiffData = results.map(r => r.salesDiff);
    const profitDiffData = results.map(r => r.profitDiff);

    this.matrixChartLabels.set(labels);
    this.matrixChartData.set({
      labels: labels,
      datasets: [
        {
          label: '売上差分(億円)',
          data: salesDiffData,
          backgroundColor: (context: any) => {
            return context.parsed.x >= 0 ? '#2196f3' : '#dc3545';
          },
          borderColor: (context: any) => {
            return context.parsed.x >= 0 ? '#1976d2' : '#c82333';
          },
          borderWidth: 1,
        },
        {
          label: '利益差分(億円)',
          data: profitDiffData,
          backgroundColor: (context: any) => {
            return context.parsed.x >= 0 ? '#28a745' : '#dc3545';
          },
          borderColor: (context: any) => {
            return context.parsed.x >= 0 ? '#1e7e34' : '#c82333';
          },
          borderWidth: 1,
        },
      ],
    });
  }

  exportPlacementToCsv(): void {
    if (this.currentScreen() === 'dashboard') {
      this.exportDashboardToCsv();
    } else if (this.currentScreen() === 'objective') {
      this.exportObjectiveComparisonToCsv();
    } else if (this.currentScreen() === 'matrix') {
      this.exportMatrixComparisonToCsv();
    }
  }

  private exportDashboardToCsv(): void {
    const result = this.simulationResult();
    const rows: string[] = [];

    // 全社サマリー
    rows.push('全社サマリー');
    rows.push('項目,値');
    rows.push(`全社売上(億円),${result.totalSales.toFixed(2)}`);
    rows.push(`全社利益(億円),${result.totalProfit.toFixed(2)}`);
    rows.push('');

    // 各事業部統計
    const depts = [
      { name: 'A事業部', metrics: result.deptA },
      { name: 'B事業部', metrics: result.deptB },
      { name: 'C事業部', metrics: result.deptC },
    ];

    for (const dept of depts) {
      rows.push(dept.name);
      rows.push('項目,値');
      rows.push(`配置人数,${dept.metrics.headcount}名`);
      rows.push(`充足率,${dept.metrics.fulfillmentRate?.toFixed(1) || 0}%`);
      rows.push(`基本売上(億円),${dept.metrics.baseSales.toFixed(2)}`);
      rows.push(`最終売上(億円),${dept.metrics.finalSales.toFixed(2)}`);
      rows.push(`コスト(億円),${dept.metrics.deptCost.toFixed(2)}`);
      rows.push(`利益(億円),${dept.metrics.profit.toFixed(2)}`);
      rows.push('');
    }

    // 人材配置一覧
    rows.push('人材配置一覧');
    rows.push('ID,氏名,営業力,管理力,開拓力,育成力,人件費,配置先');
    for (const emp of this.employees()) {
      rows.push(
        `${emp.id},${emp.name},${emp.salesPower.toFixed(1)},${emp.managementPower.toFixed(1)},${emp.pioneeringPower.toFixed(1)},${emp.trainingPower.toFixed(1)},${emp.laborCost},${emp.assignedDept}`
      );
    }

    this.downloadCsv(rows.join('\n'), 'dashboard_result.csv');
  }

  private exportObjectiveComparisonToCsv(): void {
    const rows: string[] = [];

    // メインファイルのみの比較結果
    rows.push('目的別結果比較（従業員ファイルのみ）');
    rows.push('課題,全社売上(億円),全社利益(億円),A部人数,A部売上(億円),B部人数,B部売上(億円),C部人数,C部売上(億円)');
    for (const result of this.objectiveComparisonResults()) {
      rows.push(
        `${result.objectiveName},${result.totalSales.toFixed(2)},${result.totalProfit.toFixed(2)},${result.deptAHeadcount},${result.deptASales.toFixed(2)},${result.deptBHeadcount},${result.deptBSales.toFixed(2)},${result.deptCHeadcount},${result.deptCSales.toFixed(2)}`
      );
    }

    // 採用予定者を含む比較結果（存在する場合）
    if (this.objectiveComparisonResultsWithAdditional().length > 0) {
      rows.push('');
      rows.push('目的別結果比較（採用予定者を含む）');
      rows.push('課題,全社売上(億円),全社利益(億円),A部人数,A部売上(億円),B部人数,B部売上(億円),C部人数,C部売上(億円)');
      for (const result of this.objectiveComparisonResultsWithAdditional()) {
        rows.push(
          `${result.objectiveName},${result.totalSales.toFixed(2)},${result.totalProfit.toFixed(2)},${result.deptAHeadcount},${result.deptASales.toFixed(2)},${result.deptBHeadcount},${result.deptBSales.toFixed(2)},${result.deptCHeadcount},${result.deptCSales.toFixed(2)}`
        );
      }
    }

    this.downloadCsv(rows.join('\n'), 'objective_comparison.csv');
  }

  private exportMatrixComparisonToCsv(): void {
    const rows: string[] = [];

    rows.push('採用前後結果比較');
    rows.push('課題,採用前人数配置,採用前全社売上(億円),採用後人数配置,採用後全社売上(億円),売上差分(億円),利益差分(億円)');
    for (const result of this.matrixComparisonResults()) {
      rows.push(
        `${result.objectiveName},${result.beforePlacement},${result.beforeTotalSales.toFixed(2)},${result.afterPlacement},${result.afterTotalSales.toFixed(2)},${result.salesDiff.toFixed(2)},${result.profitDiff.toFixed(2)}`
      );
    }

    this.downloadCsv(rows.join('\n'), 'matrix_comparison.csv');
  }

  private downloadCsv(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
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

      if (values.length < 7) {
        return {
          employees: [],
          error: `CSVの${i + 2}行目のデータが不正です。（例: 能力値は0〜100、人件費は1〜20の範囲で入力してください）`,
        };
      }

      const salesPower = parseFloat(values[2]);
      const managementPower = parseFloat(values[3]);
      const pioneeringPower = parseFloat(values[4]);
      const trainingPower = parseFloat(values[5]);
      const laborCost = parseFloat(values[6]);

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
        name: values[1],
        salesPower,
        managementPower,
        pioneeringPower,
        trainingPower,
        laborCost,
        assignedDept: 'Temp',
        source: 'existing',
        isLocked: false,
      });
    }

    return { employees };
  }
}
