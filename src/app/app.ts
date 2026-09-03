import { Component, signal, computed, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepartmentId, Employee, SimulationResult, OptimizationObjective, ObjectiveComparisonResult, MatrixComparisonResult, PlacementSnapshot } from './models/types';
import { CalculatorService } from './services/calculator.service';
import { AuthService } from './services/auth.service';
import { DEPT_CONFIG, MIN_TOTAL_SALES, FULFILLMENT_RATE_THRESHOLDS } from './constants/app.constants';
import { BaseChartDirective } from 'ng2-charts';
import { Chart as ChartJS, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement, LineController, LineElement, PointElement } from 'chart.js';
import type { ChartOptions } from 'chart.js';
import Plugin from 'chartjs-plugin-datalabels';

ChartJS.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, ArcElement, Plugin);

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
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      color: var(--text-primary);
    }
    /* 全体レイアウト */
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-page);
    }
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 40px;
      background-color: var(--bg-page);
    }
    /* ヘッダー */
    .app-header {
      display: flex;
      flex-direction: column;
      background-color: var(--glass-bg);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 20px;
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
      color: var(--text-strong);
      white-space: nowrap;
    }
    .header-tabs {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 0;
    }
    .header-tab {
      padding: 8px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .header-tab.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }
    .header-tab:hover {
      color: var(--text-strong);
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
      padding: 5px 10px;
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      font-size: 12px;
      background-color: var(--glass-bg-strong);
      color: var(--text-primary);
      cursor: pointer;
      transition: border-color 0.2s ease;
    }
    .header-select:hover {
      border-color: var(--accent-primary);
    }
    .header-select:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-primary-soft);
    }
    .header-button {
      padding: 5px 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .header-button-primary {
      background-color: var(--accent-positive);
      color: #ffffff;
    }
    .header-button-primary:hover {
      background-color: #248a3d;
    }
    .header-button-secondary {
      background-color: var(--glass-bg-strong);
      color: var(--text-primary);
    }
    .header-button-secondary:hover {
      background-color: var(--glass-border-strong);
    }
    .file-label {
      padding: 3px 8px;
      background-color: var(--glass-bg-strong);
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      font-size: 11px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .file-label:hover {
      background-color: var(--glass-border-strong);
    }
    .file-name {
      font-size: 12px;
      color: var(--text-secondary);
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
      border-left: 1px solid var(--glass-border);
      padding-left: 12px;
    }
    .user-email {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .header-button-logout {
      background-color: var(--accent-danger);
      color: white;
      padding: 6px 10px;
      font-size: 12px;
    }
    .header-button-logout:hover {
      background-color: #d70015;
    }
    /* ヘッダー下部（完全1行ツールバー） */
    .header-bottom {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: nowrap;
      gap: 8px;
      padding: 4px 16px;
      background-color: var(--glass-bg-soft);
      border-top: 1px solid var(--glass-border);
    }
    .file-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .header-bottom-right {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .file-label-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    /* ファイル取り消しボタン（アイコンのみ） */
    .file-clear-btn {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 50%;
      cursor: pointer;
      font-size: 11px;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .file-clear-btn:hover {
      background: var(--accent-danger-soft);
      color: var(--accent-danger);
    }
    /* メイン画面ラッパー */
    .main-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 8px;
      padding: 8px;
    }
    /* 左側：事業部エリア */
    .left-section {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* サマリーバーラッパー */
    .summary-bar-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 4px;
      position: relative;
    }
    .summary-badge-group {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      min-height: 0;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-badge.unplaced {
      background-color: var(--glass-bg-strong);
      color: var(--text-secondary);
    }
    .status-badge.alert {
      background-color: var(--accent-danger);
      color: white;
    }
    /* サマリーバー（1行コンパクト） */
    .summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: var(--glass-bg);
      padding: 2px 12px;
      border-radius: var(--radius-card);
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--glass-border);
    }
    .summary-item {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 0 6px;
      border-radius: 8px;
      background: var(--glass-bg-soft);
    }
    .summary-item-primary {
      background: var(--accent-positive-soft);
    }
    .summary-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .summary-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--accent-primary);
      line-height: 1.1;
    }
    .summary-value-primary {
      font-size: 18px;
      font-weight: 800;
      color: var(--accent-positive);
    }
    /* 事業部カードコンテナ（残り高さいっぱいに拡張） */
    .dept-cards-container {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 8px;
      width: 100%;
      flex-grow: 1;
      min-height: 0;
    }
    /* 事業部カード（横分割・縦いっぱいに拡張） */
    .dept-card-large {
      flex: 1 1 0;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      background: var(--glass-bg);
      border-radius: var(--radius-card);
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--glass-border);
      overflow: hidden;
    }
    .dept-header {
      padding: 4px 8px;
      background-color: var(--glass-bg-soft);
      border-bottom: 1px solid var(--glass-border);
      flex-shrink: 0;
    }
    .dept-name {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .dept-content {
      display: flex;
      flex: 1;
      min-height: 0;
    }
    /* 統計情報パネル（幅いっぱい・上下に均等配置） */
    .dept-stats-panel {
      width: 100%;
      padding: 2px 8px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
      align-content: space-between;
      background-color: transparent;
      overflow-y: hidden;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0;
      font-size: 14px;
      min-width: 0;
    }
    .stat-label {
      color: var(--text-secondary);
      font-weight: 600;
      flex-shrink: 0;
      font-size: 13px;
      white-space: nowrap;
    }
    .stat-value {
      color: var(--text-primary);
      font-weight: 600;
      text-align: left;
      font-size: 14px;
    }
    .stat-divider {
      grid-column: 1 / -1;
      border-top: 1px solid var(--glass-border);
      margin: 0;
    }
    /* 補正係数バッジ（条件付きスタイル・アラートバッジ風） */
    .stat-badge-item {
      grid-column: 1 / -1;
      border-radius: 6px;
      padding: 2px 6px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .stat-badge-item .stat-label,
    .stat-badge-item .stat-value {
      color: inherit;
    }
    .stat-badge-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    .stat-badge-note {
      font-size: 10px;
      font-weight: 700;
      color: inherit;
      white-space: nowrap;
    }
    /* 財務指標（横一列） */
    .stat-finance-row {
      grid-column: 1 / -1;
      display: flex;
      gap: 4px;
    }
    .stat-finance-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .stat-finance-item .stat-label {
      font-size: 12px;
    }
    .stat-finance-item .stat-value {
      font-size: 22px;
      font-weight: bold;
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
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-tile);
      padding: 10px 12px;
      font-size: 10px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }
    .employee-mini-card:hover {
      border-color: var(--accent-primary);
      box-shadow: 0 2px 8px var(--accent-primary-soft);
    }
    .employee-mini-card.locked {
      background-color: var(--accent-warning-soft);
      border-color: var(--accent-warning);
    }
    .employee-mini-card.candidate {
      background-color: var(--accent-positive-soft);
      border-color: var(--accent-positive);
    }
    .candidate-badge {
      align-self: flex-start;
      font-size: 8px;
      font-weight: 700;
      color: #ffffff;
      background-color: var(--accent-positive);
      padding: 1px 5px;
      border-radius: 8px;
    }
    .emp-id {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .emp-abilities {
      font-size: 9px;
      color: var(--text-secondary);
      line-height: 1.1;
      display: flex;
      flex-direction: row;
      gap: 2px;
      justify-content: space-between;
    }
    .emp-select {
      width: 100%;
      padding: 3px 6px;
      height: 32px;
      border: 1px solid var(--glass-border);
      border-radius: 3px;
      font-size: 9px;
      cursor: pointer;
      background-color: var(--glass-bg-strong);
      color: var(--text-primary);
    }
    .emp-lock-btn {
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .emp-lock-btn:hover {
      background-color: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
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
      background: var(--glass-bg);
      border-radius: var(--radius-card);
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--glass-border);
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
      background-color: var(--glass-bg-soft);
      border-bottom: 1px solid var(--glass-border);
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
      color: var(--text-strong);
    }
    .temp-title-vertical {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-strong);
      writing-mode: vertical-rl;
      letter-spacing: 1px;
    }
    .temp-badge {
      font-size: 11px;
      background-color: var(--glass-bg-strong);
      color: var(--text-primary);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .temp-toggle-btn {
      background: none;
      border: 1px solid var(--glass-border);
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .temp-toggle-btn:hover {
      background-color: var(--glass-bg-strong);
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
      color: var(--text-tertiary);
      font-size: 12px;
      text-align: center;
    }
    /* 下部セクション */
    .comparison-sections {
      padding: 16px;
      background-color: var(--bg-page);
      border-top: 1px solid var(--glass-border);
      overflow-y: auto;
    }
    .comparison-section {
      background: var(--glass-bg);
      padding: 16px;
      border-radius: var(--radius-card);
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--glass-border);
      margin-bottom: 16px;
    }
    .section-title {
      margin: 0 0 12px 0;
      color: var(--text-strong);
      font-size: 14px;
      font-weight: 700;
    }
    /* テーブル */
    .comparison-table-wrapper {
      overflow-x: auto;
      border-radius: var(--radius-tile);
      border: 1px solid var(--glass-border);
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .comparison-table thead {
      background-color: var(--accent-primary-soft);
      color: var(--accent-primary);
    }
    .comparison-table th {
      padding: 10px 8px;
      text-align: center;
      font-weight: 600;
      border: 1px solid var(--glass-border-strong);
    }
    .comparison-table td {
      padding: 8px;
      text-align: right;
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
    }
    .comparison-table tbody tr:nth-child(odd) {
      background-color: var(--glass-bg-soft);
    }
    .comparison-table tbody tr:hover {
      background-color: var(--accent-primary-soft);
    }
    .comparison-table .objective-name {
      text-align: left;
      font-weight: 600;
      color: var(--text-strong);
      background-color: var(--glass-bg-strong);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
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
      color: var(--accent-positive);
    }
    .text-danger {
      color: var(--accent-danger);
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
      background: linear-gradient(135deg, var(--glass-bg-soft) 0%, rgba(255, 255, 255, 0.01) 100%);
      border-radius: var(--radius-card);
      border: 1px dashed var(--glass-border-strong);
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
      color: var(--text-strong);
    }
    .empty-state-description {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .empty-state-hint {
      padding: 12px 16px;
      background-color: var(--glass-bg);
      border-radius: var(--radius-tile);
      border: 1px solid var(--glass-border);
    }
    /* スケルトンローディング */
    .dept-cards-skeleton {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .skeleton-card {
      height: 240px;
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 25%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: var(--radius-card);
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
      color: var(--text-tertiary);
    }
    /* アニメーション */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* 部門表示メニューアイテム */
    .dept-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary);
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    .dept-menu-item:hover {
      background: var(--glass-bg-soft);
    }
    /* 検索トグルと部門フィルターのレイアウト */
    .manual-search-toggle-with-filters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-shrink: 0;
      background: var(--glass-bg);
      border-bottom: 1px solid var(--glass-border);
      padding: 8px 16px;
    }
    .search-toggle-section {
      flex: 1;
      min-width: 0;
    }
    .search-toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--glass-bg-soft);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      color: var(--text-primary);
      width: 100%;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .search-toggle-btn:hover {
      background: var(--glass-border);
    }
    .toggle-icon {
      font-size: 12px;
      flex-shrink: 0;
      color: var(--text-secondary);
    }
    .toggle-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .selection-badge {
      background-color: var(--accent-primary);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
    /* ピル型部門フィルター */
    .dept-filter-pills {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      align-items: center;
    }
    .dept-filter-pill {
      padding: 4px 12px;
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      background-color: var(--glass-bg-soft);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dept-filter-pill:hover {
      border-color: var(--accent-primary);
      background-color: var(--glass-bg);
    }
    .dept-filter-pill.active {
      background-color: var(--accent-primary-soft);
      color: var(--accent-primary);
      border-color: var(--accent-primary);
      font-weight: 700;
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
  protected previousSimulationResult = signal<SimulationResult>(this.createEmptyResult());
  protected optimizationExplanation = signal<any>(null);
  protected objectiveComparisonResults = signal<ObjectiveComparisonResult[]>([]);
  protected objectiveComparisonResultsWithAdditional = signal<ObjectiveComparisonResult[]>([]);
  protected matrixComparisonResults = signal<MatrixComparisonResult[]>([]);
  protected additionalFileLoaded = signal<boolean>(false);
  protected optimizationExecuted = signal<boolean>(false);
  protected isProcessing = signal<boolean>(false);
  protected mainFileName = signal<string>('');
  protected additionalFileName = signal<string>('');
  protected toastMessage = signal<string>('');
  protected toastVisible = signal<boolean>(false);
  protected toastType = signal<'success' | 'warning'>('warning');
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  protected deptIds: DepartmentId[] = ['A', 'B', 'C', 'Temp'];
  protected deptConfig = DEPT_CONFIG;
  protected minTotalSales = MIN_TOTAL_SALES;
  protected selectedObjective: OptimizationObjective = 'totalSales';
  protected optimizationReason: string = '';
  protected currentScreen = signal<'dashboard' | 'objective' | 'matrix' | 'manual'>('dashboard');
  protected tempPanelOpen = signal<boolean>(true);

  // サイドバー・配置案スナップショット管理
  private static readonly SNAPSHOT_STORAGE_KEY = 'transhr_placement_snapshots';
  protected sidebarOpen = signal<boolean>(false);
  protected savedPlansExpanded = signal<boolean>(false);
  protected savedSnapshots = signal<PlacementSnapshot[]>([]);

  // 従業員一括配置管理
  employeeSearchQuery: string = '';
  employeeSearchResults: Employee[] = [];
  selectedEmployeesForBulkChange: Employee[] = [];
  bulkChangeDept: string = '';

  // 手動調整タブ用検索機能
  manualSearchQuery = signal<string>('');
  selectedForBulkMove = signal<Set<string>>(new Set());
  selectedMoveDestination = signal<string>('');
  manualSearchPanelOpen = signal<boolean>(false);

  // 手動調整タブ用部門表示制御
  visibleDepts = signal<Set<string>>(new Set(['A', 'B', 'C']));

  // 手動調整タブ用高度フィルター
  manualFilterDept = signal<string>('');
  manualFilterSkillType = signal<'' | 'sales' | 'management' | 'pioneering' | 'training'>('');
  manualFilterSkillValue = signal<number>(0);

  private static readonly SKILL_FIELD_MAP: Record<string, keyof Employee> = {
    sales: 'salesPower',
    management: 'managementPower',
    pioneering: 'pioneeringPower',
    training: 'trainingPower',
  };

  manualSearchResults = computed(() => {
    const query = this.manualSearchQuery().toLowerCase().trim();
    const filterDept = this.manualFilterDept();
    const filterSkillType = this.manualFilterSkillType();
    const filterSkillValue = this.manualFilterSkillValue();

    return this.employees().filter(emp => {
      if (query && !emp.id.toLowerCase().includes(query) && !emp.name.toLowerCase().includes(query)) {
        return false;
      }

      if (filterDept && emp.assignedDept !== filterDept) {
        return false;
      }

      if (filterSkillType) {
        const field = App.SKILL_FIELD_MAP[filterSkillType];
        const skillValue = emp[field] as number;
        if (skillValue < filterSkillValue) {
          return false;
        }
      }

      return true;
    });
  });

  // ロックされた社員が1人でも存在するか（固定条件での再計算ボタン表示制御）
  hasLockedEmployees = computed(() => {
    return this.employees().some(emp => emp.isLocked);
  });

  // グラフ用データ
  protected matrixChartLabels = signal<string[]>([]);
  protected matrixChartData = signal<any>({
    labels: [],
    datasets: [
      {
        label: '売上差分(億円)',
        data: [],
        backgroundColor: '#0056d2',
        borderColor: '#003fa3',
        borderWidth: 1,
      },
      {
        label: '利益差分(億円)',
        data: [],
        backgroundColor: '#34c759',
        borderColor: '#248a3d',
        borderWidth: 1,
      },
    ],
  });
  protected matrixChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1d1d1f',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            const label = context.dataset.label || '';
            if (label.includes('一人あたり')) {
              return `${label}: ${value.toFixed(0)}万円`;
            }
            return `${label}: ${value.toFixed(2)}億円`;
          },
        },
      },
      datalabels: {
        formatter: (value: number, context: any) => {
          const label = context.dataset.label || '';
          if (label.includes('一人あたり')) {
            return value.toFixed(0);
          }
          return value.toFixed(2);
        },
        color: '#1d1d1f',
        font: {
          size: 12,
          weight: 'bold',
        },
        anchor: 'end',
        align: 'top',
        offset: 10,
      },
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: '課題',
          color: '#86868b',
        },
        ticks: {
          color: '#86868b',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        stacked: false,
        title: {
          display: true,
          text: '売上・利益差分(億円)',
          color: '#86868b',
        },
        ticks: {
          color: '#86868b',
        },
        grid: {
          drawOnChartArea: true,
          color: 'rgba(0, 0, 0, 0.08)',
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        stacked: false,
        title: {
          display: true,
          text: '一人あたり利益差分(万円)',
          color: '#86868b',
        },
        beginAtZero: true,
        ticks: {
          color: '#86868b',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // アラート詳細表示
  protected showAlertModal = signal<boolean>(false);
  protected alertDetailsToShow = signal<string[]>([]);

  // 目的別比較用グラフデータ
  protected objectiveChartDataSource = signal<'main' | 'additional'>('main');
  protected currentObjectiveResults = computed(() => {
    return this.objectiveChartDataSource() === 'main'
      ? this.objectiveComparisonResults()
      : this.objectiveComparisonResultsWithAdditional();
  });

  protected objectiveChartData1 = signal<any>({
    labels: [],
    datasets: [
      { label: '全社売上(億円)', data: [], backgroundColor: '#0056d2', borderColor: '#003fa3', borderWidth: 1 },
      { label: '全社利益(億円)', data: [], backgroundColor: '#34c759', borderColor: '#248a3d', borderWidth: 1 },
    ],
  });

  protected objectiveChartOptions1: ChartOptions<'bar'> = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#1d1d1f' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: ${value.toFixed(2)}億円`;
          },
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: {
          size: 10,
          weight: 'bold',
        },
        formatter: (value) => {
          return value ? `${(value as number).toFixed(2)}` : '';
        },
        color: '#1d1d1f',
      },
    },
    scales: {
      y: {
        stacked: false,
        title: { display: true, text: '金額(億円)', color: '#86868b' },
        ticks: { color: '#86868b' },
        grid: { color: 'rgba(0, 0, 0, 0.08)' },
      },
      x: {
        stacked: false,
        ticks: { color: '#86868b' },
        grid: { color: 'rgba(0, 0, 0, 0.08)' },
      },
    },
  };

  protected objectiveChartData2List = signal<any[]>([]);

  protected objectiveChartOptions2: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#1d1d1f' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const value = context.parsed || 0;
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toFixed(2)}億円 (${percent}%)`;
          },
        },
      },
      datalabels: {
        formatter: (value, context) => {
          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
          const percent = ((value / total) * 100).toFixed(1);
          return [`${percent}%`, `${value.toFixed(2)}億円`];
        },
        color: '#fff',
        font: {
          size: 11,
          weight: 'bold',
        },
        textAlign: 'center',
      },
    },
  };

  constructor(
    protected calculatorService: CalculatorService,
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
    this.loadSnapshotsFromStorage();
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

  showAlertDetails(): void {
    const result = this.simulationResult();
    if (result && result.alertDetails && result.alertDetails.length > 0) {
      this.alertDetailsToShow.set(result.alertDetails);
      this.showAlertModal.set(true);
    }
  }

  closeAlertModal(): void {
    this.showAlertModal.set(false);
  }

  goToDashboard(): void {
    this.currentScreen.set('dashboard');
  }

  toggleTempPanel(): void {
    this.tempPanelOpen.update(open => !open);
  }

  // ===== サイドバー・配置案スナップショット =====

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSavedPlans(): void {
    this.savedPlansExpanded.update(expanded => !expanded);
  }

  private loadSnapshotsFromStorage(): void {
    try {
      const raw = localStorage.getItem(App.SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlacementSnapshot[];
        this.savedSnapshots.set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('配置案の読み込みに失敗しました:', error);
      this.savedSnapshots.set([]);
    }
  }

  private persistSnapshots(): void {
    try {
      localStorage.setItem(App.SNAPSHOT_STORAGE_KEY, JSON.stringify(this.savedSnapshots()));
    } catch (error) {
      console.error('配置案の保存に失敗しました:', error);
    }
  }

  saveCurrentPlacement(): void {
    if (this.employees().length === 0) {
      alert('保存できる配置がありません。従業員データを読み込んでください。');
      return;
    }

    const defaultName = `配置案 ${this.savedSnapshots().length + 1}`;
    const name = window.prompt('配置案の名前を入力してください', defaultName);
    if (name === null) return;

    const trimmedName = name.trim() || defaultName;
    const result = this.simulationResult();

    const snapshot: PlacementSnapshot = {
      id: `snapshot_${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString(),
      employees: this.employees().map(emp => ({ ...emp })),
      selectedObjective: this.selectedObjective,
      optimizationExecuted: this.optimizationExecuted(),
      kpi: {
        totalSales: result.totalSales,
        totalProfit: result.totalProfit,
        perCapitaProfit: result.perCapitaProfit,
      },
    };

    this.savedSnapshots.update(snapshots => [snapshot, ...snapshots]);
    this.persistSnapshots();
    this.showToast(`配置案「${trimmedName}」を保存しました`, 'success');
  }

  loadSnapshot(snapshot: PlacementSnapshot): void {
    const restoredEmployees = snapshot.employees.map(emp => ({ ...emp }));
    this.employees.set(restoredEmployees);

    // メイン従業員（採用予定者を除外）も復元
    const mainOnly = restoredEmployees.filter(emp => emp.source !== 'candidate');
    this.mainEmployees.set(mainOnly);

    this.selectedObjective = snapshot.selectedObjective;
    this.optimizationExecuted.set(snapshot.optimizationExecuted);

    this.updateSimulation();

    // 比較結果は再計算が必要なためリセット
    this.objectiveComparisonResults.set([]);
    this.objectiveComparisonResultsWithAdditional.set([]);
    this.matrixComparisonResults.set([]);

    // 手動調整タブへ遷移してサイドバーを閉じる
    this.currentScreen.set('manual');
    this.closeSidebar();

    // 復元直後から差分を表示するために、復元後の状態を基準とする
    this.previousSimulationResult.set(this.simulationResult());

    this.showToast(`配置案「${snapshot.name}」を復元しました`, 'success');
  }

  deleteSnapshot(snapshot: PlacementSnapshot, event: Event): void {
    event.stopPropagation();
    if (!window.confirm(`配置案「${snapshot.name}」を削除しますか？`)) return;

    this.savedSnapshots.update(snapshots => snapshots.filter(s => s.id !== snapshot.id));
    this.persistSnapshots();
  }

  toggleDeptVisibility(dept: string): void {
    this.visibleDepts.update(visible => {
      const newSet = new Set(visible);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  }

  isDeptVisible(dept: string): boolean {
    return this.visibleDepts().has(dept);
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

  goToManualAdjustment(): void {
    this.currentScreen.set('manual');
    this.previousSimulationResult.set(this.simulationResult());
  }

  toggleManualSearchPanel(): void {
    this.manualSearchPanelOpen.update(v => !v);
    console.log('toggleManualSearchPanel called, new state:', this.manualSearchPanelOpen());
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const allIds = new Set(this.manualSearchResults().map(e => e.id));
      this.selectedForBulkMove.set(allIds);
    } else {
      this.selectedForBulkMove.set(new Set());
    }
  }

  toggleManualSelectEmployee(empId: string): void {
    this.selectedForBulkMove.update(set => {
      const newSet = new Set(set);
      if (newSet.has(empId)) {
        newSet.delete(empId);
      } else {
        newSet.add(empId);
      }
      return newSet;
    });
  }

  isManualEmployeeSelected(empId: string): boolean {
    return this.selectedForBulkMove().has(empId);
  }

  bulkMoveToManualDept(deptId: DepartmentId): void {
    const selectedIds = this.selectedForBulkMove();
    if (selectedIds.size === 0) return;

    // ロック状態の社員が選択に含まれているか確認
    const lockedEmployees = this.employees().filter(emp => selectedIds.has(emp.id) && emp.isLocked);
    if (lockedEmployees.length > 0) {
      this.showToast('ロックされた従業員が含まれています。ロック状態を解除してから移動してください。');
      return;
    }

    // 配置変更前の状態を保存（ロールバック用・差分表示用）
    const previousEmployees = [...this.employees()];
    const stateBefore = this.simulationResult();

    this.employees.update(emps =>
      emps.map(emp =>
        selectedIds.has(emp.id) ? { ...emp, assignedDept: deptId } : emp
      )
    );

    // シミュレーション結果を再計算してサマリーを更新
    this.updateSimulation();

    const result = this.simulationResult();
    if (result) {
      // 手動配置時は最低配置人数のみチェック（全社売上58億円の制約は警告のみ）
      const violationMessage = this.getConstraintViolationMessageManual(result);
      if (violationMessage) {
        alert(violationMessage);
        // ロールバック
        this.employees.set(previousEmployees);
        this.updateSimulation();
        return;
      }

      // 全社売上58億円未満の場合は警告をトースト表示（3秒間）
      if (result.totalSales < this.minTotalSales) {
        this.showToast(`警告: 全社売上が58億円を下回っています（現在値: ${result.totalSales.toFixed(2)}億円）`);
      }
    }

    this.selectedForBulkMove.set(new Set());
    this.selectedMoveDestination.set('');
    this.manualSearchQuery.set('');
    this.manualSearchPanelOpen.set(false);

    // 一括移動成功時に、操作前の状態を前回の状態として保存（差分表示用）
    this.previousSimulationResult.set(stateBefore);
  }

  bulkLockManualEmployees(): void {
    const selectedIds = this.selectedForBulkMove();
    if (selectedIds.size === 0) return;

    this.employees.update(emps =>
      emps.map(emp =>
        selectedIds.has(emp.id) ? { ...emp, isLocked: true } : emp
      )
    );

    this.selectedForBulkMove.set(new Set());
    this.manualSearchQuery.set('');
    this.manualSearchPanelOpen.set(false);
  }

  bulkUnlockManualEmployees(): void {
    const selectedIds = this.selectedForBulkMove();
    if (selectedIds.size === 0) return;

    this.employees.update(emps =>
      emps.map(emp =>
        selectedIds.has(emp.id) ? { ...emp, isLocked: false } : emp
      )
    );

    this.selectedForBulkMove.set(new Set());
    this.manualSearchQuery.set('');
    this.manualSearchPanelOpen.set(false);
  }

  clearManualSearch(): void {
    this.manualSearchQuery.set('');
    this.selectedForBulkMove.set(new Set());
    this.selectedMoveDestination.set('');
    this.manualFilterDept.set('');
    this.manualFilterSkillType.set('');
    this.manualFilterSkillValue.set(0);
  }

  clearManualFilters(): void {
    this.manualFilterDept.set('');
    this.manualFilterSkillType.set('');
    this.manualFilterSkillValue.set(0);
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
      totalCost: 0,
      totalHeadcount: 0,
      perCapitaProfit: 0,
      unplacedCount: 0,
      alertCount: 0,
      alertDetails: [],
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

  showToast(message: string, type: 'success' | 'warning' = 'warning'): void {
    if (this.toastTimeoutId !== null) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    this.toastTimeoutId = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimeoutId = null;
    }, 3000);
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
      this.showToast(`${newEmployees.length}名の従業員データを読み込みました`, 'success');
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
    // 採用予定社員を削除
    const remainingEmployees = this.employees().filter((emp) => emp.source !== 'candidate');

    // 元の従業員の配置先を一時置き場にリセット（再現性の確保）
    const resetEmployees = remainingEmployees.map(emp => ({
      ...emp,
      assignedDept: 'Temp' as DepartmentId
    }));

    this.employees.set(resetEmployees);
    this.additionalFileLoaded.set(false);
    this.additionalFileName.set('');
    this.matrixComparisonResults.set([]);
    this.objectiveComparisonResultsWithAdditional.set([]);
    this.optimizationExecuted.set(false);
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

      this.showToast(`${additionalEmployees.length}名の採用予定データを読み込みました`, 'success');
      console.log('採用予定ファイル読み込み完了。一時置き場に追加された採用候補者数:', additionalEmployees.length);
    };
    reader.readAsText(file);
  }

  onDeptChange(employee: Employee, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newDept = target?.value || '';
    if (!newDept) return;

    // ロック状態の社員は移動を防止
    if (employee.isLocked) {
      this.showToast('ロックされた従業員です。ロック状態を解除してから移動してください。');
      target.value = employee.assignedDept;
      return;
    }

    const previousDept = employee.assignedDept;

    // 操作前の状態をキャッシュして、操作後の差分表示用に保存
    const stateBefore = this.simulationResult();

    employee.assignedDept = newDept as DepartmentId;

    // mainEmployeesにも同じ社員がいれば更新（採用予定者除外）
    if (employee.source !== 'candidate') {
      const mainEmp = this.mainEmployees().find(e => e.id === employee.id);
      if (mainEmp) {
        mainEmp.assignedDept = newDept as DepartmentId;
      }
    }

    // シグナルを明示的に更新してAngularに変更を通知（重要）
    this.employees.set([...this.employees()]);

    this.updateSimulation();

    const result = this.simulationResult();
    if (result) {
      // 手動配置時は最低配置人数のみチェック（全社売上58億円の制約は警告のみ）
      const violationMessage = this.getConstraintViolationMessageManual(result);
      if (violationMessage) {
        alert(violationMessage);
        employee.assignedDept = previousDept;
        // mainEmployeesもロールバック
        if (employee.source !== 'candidate') {
          const mainEmp = this.mainEmployees().find(e => e.id === employee.id);
          if (mainEmp) {
            mainEmp.assignedDept = previousDept;
          }
        }
        // ロールバック時もシグナルを更新
        this.employees.set([...this.employees()]);
        this.updateSimulation();
        target.value = previousDept;
        return;
      }

      // 全社売上58億円未満の場合は警告をトースト表示（3秒間）
      if (result.totalSales < this.minTotalSales) {
        this.showToast(`警告: 全社売上が58億円を下回っています（現在値: ${result.totalSales.toFixed(2)}億円）`);
      }
    }

    // 配置変更が成功した場合、比較結果をリセット（再計算が必要な状態にする）
    this.objectiveComparisonResults.set([]);
    this.objectiveComparisonResultsWithAdditional.set([]);
    this.matrixComparisonResults.set([]);

    // 配置変更成功時に、操作前の状態を前回の状態として保存（差分表示用）
    this.previousSimulationResult.set(stateBefore);
  }


  private updateSimulation(): void {
    const result = this.calculatorService.calculateTotalSimulation(
      this.employees()
    );
    this.simulationResult.set(result);

    // 一時置き場に誰も残っていなければ、パネルを自動的に閉じる
    const tempEmployeesCount = this.employees().filter(emp => emp.assignedDept === 'Temp').length;
    if (tempEmployeesCount === 0) {
      this.tempPanelOpen.set(false);
    }
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

      // mainEmployees も更新（採用予定者を除外）
      const mainOnlyEmployees = optimizedEmployees.filter(emp => emp.source !== 'candidate');
      this.mainEmployees.set(mainOnlyEmployees);

      this.updateSimulation();

      // 説明テキストを生成
      const explanation = this.calculatorService.generateOptimizationExplanation(
        optimizedEmployees,
        this.simulationResult(),
        this.selectedObjective
      );
      this.optimizationExplanation.set(explanation);

      this.isProcessing.set(false);
    }, 100);
  }

  // ロックされた社員を固定制約として、未ロック社員のみ全社売上最大化で再計算
  runOptimizationWithLocks(): void {
    if (!this.hasLockedEmployees()) return;

    this.isProcessing.set(true);

    setTimeout(() => {
      // ロック済み社員は現在の事業部を固定変数として維持し、
      // 未ロック社員のみを対象に「全社売上最大化」で最適化を実行
      const optimizedEmployees = this.calculatorService.optimizePlacement(
        this.employees(),
        'totalSales'
      );

      this.employees.set(optimizedEmployees);

      this.optimizationReason = '【固定条件での再計算】ロックされた社員を現在の事業部に固定したまま、未ロック社員のみを対象に全社売上が最大となる配置を算出しました。';
      this.optimizationExecuted.set(true);

      // mainEmployees も更新（採用予定者を除外）
      const mainOnlyEmployees = optimizedEmployees.filter(emp => emp.source !== 'candidate');
      this.mainEmployees.set(mainOnlyEmployees);

      // シミュレーション結果とKPIを即座に反映
      this.updateSimulation();
      this.previousSimulationResult.set(this.simulationResult());

      // 説明テキストを生成
      const explanation = this.calculatorService.generateOptimizationExplanation(
        optimizedEmployees,
        this.simulationResult(),
        'totalSales'
      );
      this.optimizationExplanation.set(explanation);

      // 比較結果は再計算が必要なためリセット
      this.objectiveComparisonResults.set([]);
      this.objectiveComparisonResultsWithAdditional.set([]);
      this.matrixComparisonResults.set([]);

      const result = this.simulationResult();
      if (result.totalSales < this.minTotalSales) {
        this.showToast(`警告: 全社売上が58億円を下回っています（現在値: ${result.totalSales.toFixed(2)}億円）`);
      } else {
        this.showToast('固定条件で最適配置を再計算しました', 'success');
      }

      this.isProcessing.set(false);
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

        // 従業員の配置をリセット（一時置き場に）して最適化を実行
        const mainEmployeesForOptimization = mainEmployeesOnly.map(emp => ({
          ...emp,
          assignedDept: 'Temp' as DepartmentId
        }));

        const optimizedEmployees = this.calculatorService.optimizePlacement(
          mainEmployeesForOptimization,
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
          totalHeadcount: simResult.totalHeadcount,
          totalSales: simResult.totalSales,
          totalProfit: simResult.totalProfit,
          totalCost: simResult.totalCost,
          perCapitaProfit: simResult.perCapitaProfit,
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

          // 採用予定者の配置を一時置き場にリセットして最適化を実行
          const allEmployeesForOptimization = allEmployees.map(emp => {
            if (emp.source === 'candidate') {
              return { ...emp, assignedDept: 'Temp' as DepartmentId };
            }
            return { ...emp };
          });

          const optimizedEmployees = this.calculatorService.optimizePlacement(
            allEmployeesForOptimization,
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
            totalHeadcount: simResult.totalHeadcount,
            totalSales: simResult.totalSales,
            totalProfit: simResult.totalProfit,
            totalCost: simResult.totalCost,
            perCapitaProfit: simResult.perCapitaProfit,
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

  toggleObjectiveDataSourceWithCheck(source: 'main' | 'additional'): void {
    if (!this.additionalFileLoaded()) {
      alert('採用予定ファイルを読み込んでください');
      return;
    }
    this.toggleObjectiveDataSource(source);
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
          backgroundColor: '#0056d2',
          borderColor: '#003fa3',
          borderWidth: 1
        },
        {
          label: '全社利益(億円)',
          data: totalProfitData,
          backgroundColor: '#34c759',
          borderColor: '#248a3d',
          borderWidth: 1
        },
      ],
    });

    // グラフB: 課題ごとの部門別売上内訳（円グラフ）
    const chartData2List = results.map((result) => ({
      labels: ['A部', 'B部', 'C部'],
      datasets: [
        {
          data: [result.deptASales, result.deptBSales, result.deptCSales],
          backgroundColor: ['#0056d2', '#34c759', '#ff9500'],
          borderColor: ['#003fa3', '#248a3d', '#c93400'],
          borderWidth: 2,
        },
      ],
    }));

    this.objectiveChartData2List.set(chartData2List);
  }

  getFulfillmentRateColor(fulfillmentRate: number | undefined): { bg: string; text: string } {
    if (!fulfillmentRate) return { bg: 'rgba(142, 142, 147, 0.14)', text: '#86868b' };

    if (fulfillmentRate >= 100 && fulfillmentRate <= 120) {
      // 100%～120%：エメラルド（適正）
      return { bg: 'rgba(52, 199, 89, 0.1)', text: '#34c759' };
    } else if (fulfillmentRate >= 90 && fulfillmentRate < 100) {
      // 90%～100%：薄いエメラルド
      return { bg: 'rgba(52, 199, 89, 0.08)', text: '#34c759' };
    } else if (fulfillmentRate >= 80 && fulfillmentRate < 90) {
      // 80%～90%：薄いエメラルド
      return { bg: 'rgba(52, 199, 89, 0.08)', text: '#34c759' };
    } else if (fulfillmentRate >= 70 && fulfillmentRate < 80) {
      // 70%～80%：アンバー
      return { bg: 'rgba(255, 149, 0, 0.12)', text: '#ff9500' };
    } else {
      // その他：レッド
      return { bg: 'rgba(255, 59, 48, 0.1)', text: '#ff3b30' };
    }
  }

  getCorrectionCoefficientColor(coefficient: number | undefined): { bg: string; text: string } {
    if (coefficient === undefined || coefficient === null) return { bg: 'rgba(142, 142, 147, 0.14)', text: '#86868b' };

    if (coefficient >= 1.0) {
      // 1.00：エメラルド（最適）
      return { bg: 'rgba(52, 199, 89, 0.1)', text: '#34c759' };
    } else if (coefficient >= 0.9) {
      // 0.90～0.99：薄いエメラルド
      return { bg: 'rgba(52, 199, 89, 0.08)', text: '#34c759' };
    } else if (coefficient >= 0.7) {
      // 0.70～0.89：アンバー
      return { bg: 'rgba(255, 149, 0, 0.12)', text: '#ff9500' };
    } else {
      // 0.70未満：レッド
      return { bg: 'rgba(255, 59, 48, 0.1)', text: '#ff3b30' };
    }
  }

  getCoefficientColorForRange(coefficient: number | undefined): string {
    if (coefficient === undefined || coefficient === null) return 'rgba(142, 142, 147, 0.14)';
    if (coefficient >= 1.0) return 'rgba(52, 199, 89, 0.1)';
    if (coefficient >= 0.9) return 'rgba(52, 199, 89, 0.08)';
    if (coefficient >= 0.7) return 'rgba(255, 149, 0, 0.12)';
    return 'rgba(255, 59, 48, 0.1)';
  }

  getPenaltyBadge(coefficient: number | undefined): { bg: string; text: string; label: string } {
    if (coefficient === undefined || coefficient === null) {
      return { bg: 'rgba(142, 142, 147, 0.14)', text: '#86868b', label: '‐' };
    }
    if (coefficient >= 1.0) {
      return { bg: 'rgba(52, 199, 89, 0.1)', text: '#34c759', label: 'ペナルティなし' };
    }
    return { bg: 'rgba(255, 59, 48, 0.1)', text: '#ff3b30', label: 'ペナルティあり' };
  }

  getPenaltyText(totalCoeff: number, fulfillmentRate: number | undefined): string {
    if (!fulfillmentRate) return '-';
    if (totalCoeff >= 1.0) return 'ペナルティなし';
    const penaltyPercent = Math.round((1 - totalCoeff) * 100);
    return `${penaltyPercent}%のペナルティ`;
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

  isHighestSkill(employee: Employee, skillType: 'sales' | 'management' | 'pioneering' | 'training'): boolean {
    const skills = {
      sales: employee.salesPower,
      management: employee.managementPower,
      pioneering: employee.pioneeringPower,
      training: employee.trainingPower,
    };
    const maxSkill = Math.max(...Object.values(skills));
    return skills[skillType] === maxSkill;
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
        const perCapitaProfitDiff = afterResult.perCapitaProfit - beforeResult.perCapitaProfit;

        results.push({
          objectiveName: objectiveLabel,
          beforePlacement: this.getPlacementString(beforeResult),
          beforeTotalSales: beforeResult.totalSales,
          beforeTotalProfit: beforeResult.totalProfit,
          beforePerCapitaProfit: beforeResult.perCapitaProfit,
          afterPlacement: this.getPlacementString(afterResult),
          afterTotalSales: afterResult.totalSales,
          afterTotalProfit: afterResult.totalProfit,
          afterPerCapitaProfit: afterResult.perCapitaProfit,
          salesDiff,
          profitDiff,
          perCapitaProfitDiff,
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
    const perCapitaProfitDiffData = results.map(r => r.perCapitaProfitDiff);

    this.matrixChartLabels.set(labels);
    this.matrixChartData.set({
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: '売上差分(億円)',
          data: salesDiffData,
          backgroundColor: (context: any) => {
            return context.parsed.x >= 0 ? '#0056d2' : '#ff3b30';
          },
          borderColor: (context: any) => {
            return context.parsed.x >= 0 ? '#003fa3' : '#d70015';
          },
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'bar',
          label: '利益差分(億円)',
          data: profitDiffData,
          backgroundColor: (context: any) => {
            return context.parsed.x >= 0 ? '#34c759' : '#ff3b30';
          },
          borderColor: (context: any) => {
            return context.parsed.x >= 0 ? '#248a3d' : '#d70015';
          },
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: '一人あたり利益差分(万円)',
          data: perCapitaProfitDiffData,
          borderColor: '#ff9500',
          backgroundColor: 'rgba(255, 180, 84, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ff9500',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
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

  // 従業員一括配置管理メソッド
  onEmployeeSearchInput(): void {
    const query = this.employeeSearchQuery.trim();
    if (query.length === 0) {
      this.employeeSearchResults = [];
      return;
    }

    // 社員番号用：大文字で検索
    const queryUpperCase = query.toUpperCase();
    // 名前用：そのまま（日本語対応）
    const queryLower = query.toLowerCase();

    console.log('検索クエリ:', query, 'queryLower:', queryLower);
    console.log('従業員数:', this.employees().length);

    this.employeeSearchResults = this.employees().filter(emp => {
      const id = emp.id.toUpperCase();
      const name = emp.name ? emp.name.toLowerCase() : '';
      const matches = id.includes(queryUpperCase) || name.includes(queryLower);
      if (matches) {
        console.log('マッチ:', emp.id, emp.name);
      }
      return matches;
    });

    console.log('検索結果数:', this.employeeSearchResults.length);
  }

  isEmployeeSelected(emp: Employee): boolean {
    return this.selectedEmployeesForBulkChange.some(selected => selected.id === emp.id);
  }

  toggleEmployeeSelection(emp: Employee): void {
    const index = this.selectedEmployeesForBulkChange.findIndex(selected => selected.id === emp.id);
    if (index >= 0) {
      this.selectedEmployeesForBulkChange.splice(index, 1);
    } else {
      this.selectedEmployeesForBulkChange.push(emp);
    }
  }

  clearEmployeeSearch(): void {
    this.employeeSearchQuery = '';
    this.employeeSearchResults = [];
    this.selectedEmployeesForBulkChange = [];
    this.bulkChangeDept = '';
  }

  private getConstraintViolationMessage(result: SimulationResult): string | null {
    // 制約1: 全社売上が58億円を下回らない（最適配置時のハード制約）
    if (result.totalSales < MIN_TOTAL_SALES) {
      return `操作不可: 全社売上が58億円を下回ります（現在値: ${result.totalSales.toFixed(2)}億円）`;
    }

    // 制約2: 各事業部が最低配置人数を下回らない
    const deptConstraints = [
      { deptId: 'A', headcount: result.deptA.headcount, minCount: DEPT_CONFIG.A.minCount },
      { deptId: 'B', headcount: result.deptB.headcount, minCount: DEPT_CONFIG.B.minCount },
      { deptId: 'C', headcount: result.deptC.headcount, minCount: DEPT_CONFIG.C.minCount }
    ];

    for (const constraint of deptConstraints) {
      if (constraint.headcount < constraint.minCount) {
        return `操作不可: ${constraint.deptId}事業部の人数が最低配置人数(${constraint.minCount}名)を下回ります（現在値: ${constraint.headcount}名）`;
      }
    }

    return null;
  }

  // 手動配置時の制約チェック（最低配置人数のみ）
  private getConstraintViolationMessageManual(result: SimulationResult): string | null {
    // 制約: 各事業部が最低配置人数を下回らない
    const deptConstraints = [
      { deptId: 'A', headcount: result.deptA.headcount, minCount: DEPT_CONFIG.A.minCount },
      { deptId: 'B', headcount: result.deptB.headcount, minCount: DEPT_CONFIG.B.minCount },
      { deptId: 'C', headcount: result.deptC.headcount, minCount: DEPT_CONFIG.C.minCount }
    ];

    for (const constraint of deptConstraints) {
      if (constraint.headcount < constraint.minCount) {
        return `操作不可: ${constraint.deptId}事業部の人数が最低配置人数(${constraint.minCount}名)を下回ります（現在値: ${constraint.headcount}名）`;
      }
    }

    return null;
  }

  applyBulkChange(): void {
    if (this.selectedEmployeesForBulkChange.length === 0 || !this.bulkChangeDept) {
      console.log('applyBulkChange中止: 選択者なし');
      return;
    }

    // 選択された従業員の配置先を変更（仮の状態）
    const updatedEmployees = this.employees().map(emp => {
      const isSelected = this.selectedEmployeesForBulkChange.some(selected => selected.id === emp.id);
      if (isSelected) {
        return { ...emp, assignedDept: this.bulkChangeDept as DepartmentId };
      }
      return emp;
    });

    // 制約チェック
    const simResult = this.calculatorService.calculateTotalSimulation(updatedEmployees);
    console.log('制約チェック - 全社売上:', simResult.totalSales, '億円');
    console.log('MIN_TOTAL_SALES:', MIN_TOTAL_SALES);
    console.log('部門人数:', { A: simResult.deptA.headcount, B: simResult.deptB.headcount, C: simResult.deptC.headcount });

    const violationMessage = this.getConstraintViolationMessage(simResult);
    console.log('制約違反メッセージ:', violationMessage);

    if (violationMessage) {
      alert(violationMessage);
      return;
    }

    // 制約チェックOKならば実際に変更を適用
    this.employees.set(updatedEmployees);
    this.updateSimulation();

    // 配置変更が成功した場合、比較結果をリセット（再計算が必要な状態にする）
    this.objectiveComparisonResults.set([]);
    this.objectiveComparisonResultsWithAdditional.set([]);
    this.matrixComparisonResults.set([]);

    // 検索と選択をクリア
    this.clearEmployeeSearch();
    console.log('一括変更完了');
  }

  applyBulkLock(): void {
    if (this.selectedEmployeesForBulkChange.length === 0) {
      return;
    }

    // 選択された従業員をロック
    const updatedEmployees = this.employees().map(emp => {
      const isSelected = this.selectedEmployeesForBulkChange.some(selected => selected.id === emp.id);
      if (isSelected) {
        return { ...emp, isLocked: true };
      }
      return emp;
    });

    this.employees.set(updatedEmployees);

    // 選択済みリストの isLocked フラグも更新
    this.selectedEmployeesForBulkChange = this.selectedEmployeesForBulkChange.map(emp => ({
      ...emp,
      isLocked: true,
    }));

    console.log(`${this.selectedEmployeesForBulkChange.length}名をロックしました`);
  }

  applyBulkUnlock(): void {
    if (this.selectedEmployeesForBulkChange.length === 0) {
      return;
    }

    // 選択された従業員をロック解除
    const updatedEmployees = this.employees().map(emp => {
      const isSelected = this.selectedEmployeesForBulkChange.some(selected => selected.id === emp.id);
      if (isSelected) {
        return { ...emp, isLocked: false };
      }
      return emp;
    });

    this.employees.set(updatedEmployees);

    // 選択済みリストの isLocked フラグも更新
    this.selectedEmployeesForBulkChange = this.selectedEmployeesForBulkChange.map(emp => ({
      ...emp,
      isLocked: false,
    }));

    console.log(`${this.selectedEmployeesForBulkChange.length}名をロック解除しました`);
  }
}
