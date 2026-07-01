# Travel Expense App — Design Spec
Date: 2026-07-01

## Context

使用者需要一個旅遊記帳 PWA，用來追蹤每次旅行的支出。支援多幣別（每筆可個別設定匯率）、多人分攤（自訂比例）、類別與付款方式分類，最終產出結算清單。資料本機儲存，支援 JSON/CSV 匯出備份。

---

## Platform

- **Web App (PWA)** — 支援手機安裝、離線使用
- 技術：React 18 + Vite + vite-plugin-pwa
- 手機優先 UI（Tailwind CSS）

---

## Data Model

### Trip
```ts
interface Trip {
  id: string
  name: string
  baseCurrency: string        // 本位幣，e.g. "TWD"
  members: Member[]
  expenses: Expense[]
  createdAt: string
}

interface Member {
  id: string
  name: string
}
```

### Expense
```ts
interface Expense {
  id: string
  date: string                // ISO 日期
  description: string
  category: Category          // 餐飲、交通、住宿、購物、票券、其他
  paymentMethod: string       // 現金、信用卡、行動支付（可自訂）
  paidBy: string              // memberId
  amount: number              // 原始金額
  currency: string            // 原始幣別，e.g. "JPY"
  exchangeRate: number        // 對 baseCurrency 的匯率（手動輸入）
  splits: Split[]
}

interface Split {
  memberId: string
  ratio: number               // 比例值，e.g. 1/2/3 → 系統換算成實際金額
}
```

**換算**：`amount × exchangeRate = 本位幣金額`

**分攤金額**：`本位幣金額 × (自己的 ratio / 所有 ratio 總和)`

---

## Settlement Logic

1. 每筆費用換算成本位幣後，依 splits 比例算出每人應付金額
2. 對比每人實際付款總額，得出「淨欠款」
3. 用貪婪演算法產生最小轉帳清單（誰付誰多少）

---

## Screens

### 1. 旅行列表頁（首頁）
- 顯示所有旅行卡片：名稱、日期區間、本位幣總支出
- 新增旅行：設定名稱、本位幣、成員列表
- 每張卡片可點入詳情、長按刪除
- 全域匯出 JSON / CSV

### 2. 旅行詳情頁（三個 Tab）

**Tab 1 — 支出列表**
- 依日期分組
- 每筆顯示：類別 icon、描述、付款人、原始金額 + 幣別、本位幣換算金額
- 點入編輯；滑動刪除

**Tab 2 — 新增/編輯支出**
- 欄位：日期、描述、類別（下拉）、付款方式（下拉）
- 金額 + 幣別選擇 + 匯率（預設帶入同幣別最近一筆匯率）
- 付款人選擇
- 分攤設定：勾選參與成員，各自輸入比例數值

**Tab 3 — 結算**
- 各人總覽表：已付金額 / 應付金額 / 差額
- 最小轉帳清單：「A 付給 B：$XXX TWD」

### 3. 設定頁
- 管理類別（預設 + 自訂）
- 管理付款方式（預設 + 自訂）

---

## Tech Stack

| 項目 | 選擇 |
|------|------|
| 框架 | React 18 + TypeScript |
| 打包 | Vite + vite-plugin-pwa |
| 狀態 | Zustand（自動 persist 到 localStorage） |
| 路由 | React Router v6 |
| 樣式 | Tailwind CSS |
| 日期 | date-fns |

---

## Project Structure

```
src/
├── components/
│   ├── ExpenseForm.tsx
│   ├── ExpenseList.tsx
│   ├── SplitEditor.tsx
│   ├── SettlementView.tsx
│   └── TripCard.tsx
├── pages/
│   ├── TripListPage.tsx
│   ├── TripDetailPage.tsx
│   └── SettingsPage.tsx
├── store/
│   └── useTripStore.ts       # Zustand store + localStorage persistence
├── utils/
│   ├── settlement.ts         # 結算計算邏輯
│   ├── currency.ts           # 匯率換算工具
│   └── export.ts             # JSON / CSV 匯出
└── types/
    └── index.ts
```

---

## Exchange Rate UX

- 新增支出時選擇幣別後，自動帶入「此旅行中同幣別最近一筆的匯率」
- 若為首次使用該幣別，欄位留空讓使用者輸入
- 每筆匯率獨立儲存，可覆蓋

---

## Export

- **JSON**：完整資料結構，可用於備份與匯入還原
- **CSV**：每筆支出展平，適合貼入試算表

---

## PWA Behavior

- Service Worker 快取所有靜態資源
- 離線完全可用（無網路依賴）
- 支援「加入主畫面」安裝提示

---

## Verification

1. `npm create vite` 建立專案，確認 dev server 正常
2. 新增旅行 → 新增成員 → 新增多筆不同幣別支出
3. 驗證匯率預帶值邏輯正確
4. 驗證分攤比例計算正確（不同比例、不同人數）
5. 驗證結算清單金額與最小轉帳數量
6. 重整頁面後資料仍保留（localStorage persistence）
7. 匯出 JSON 並確認格式完整；匯出 CSV 並確認欄位正確
8. Chrome DevTools → Application → Manifest 確認 PWA 設定正確
