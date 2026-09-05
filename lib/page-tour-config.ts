export interface TourStep {
  targetId: string // data-tour attribute value
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface PageTour {
  pageId: string
  title: string
  steps: TourStep[]
}

export const PAGE_TOURS: Record<string, PageTour> = {
  dashboard: {
    pageId: 'dashboard',
    title: 'Dashboard Overview',
    steps: [
      {
        targetId: 'tour-net-worth',
        title: 'Net Worth & Cash Flow',
        description: 'Track your live net worth, monthly income, and monthly expenses at a single glance with real-time updates.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-quick-actions',
        title: 'Quick Actions',
        description: 'Quickly record an expense, add an income, transfer money between accounts, or open deep analytics.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-accounts-summary',
        title: 'Accounts Summary',
        description: 'See all your connected banks, wallets, and cards with their current balances and currency breakdown.',
        placement: 'top',
      },
      {
        targetId: 'tour-recent-activity',
        title: 'Recent Transactions',
        description: 'Your latest financial activities show up here. You can click any transaction to edit, delete, or inspect fees.',
        placement: 'top',
      },
    ],
  },
  transactions: {
    pageId: 'transactions',
    title: 'Transactions Hub',
    steps: [
      {
        targetId: 'tour-add-tx-btn',
        title: 'Add Transaction',
        description: 'Record expenses, income, internal account transfers, and optional fees (like InstaPay or bank transfer fees).',
        placement: 'bottom',
      },
      {
        targetId: 'tour-tx-filters',
        title: 'Search & Filters',
        description: 'Filter transactions by date range, account, category, or search note and description keywords.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-tx-list',
        title: 'Transaction Manager',
        description: 'View full history, select multiple rows for bulk date shifts, or click a row to edit details.',
        placement: 'top',
      },
    ],
  },
  accounts: {
    pageId: 'accounts',
    title: 'Accounts & Held Funds',
    steps: [
      {
        targetId: 'tour-add-account-btn',
        title: 'Add Accounts',
        description: 'Create Bank accounts, Cash wallets, Credit cards, and Savings accounts in your preferred currency.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-accounts-grid',
        title: 'Account Balances',
        description: 'Live calculated balances showing starting balance plus all incomes, minus expenses and transfers.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-held-funds-section',
        title: 'Held Funds Tracker',
        description: 'Manage money you are holding for friends, family, or clients with a full audit log of deposits and payouts.',
        placement: 'top',
      },
    ],
  },
  categories: {
    pageId: 'categories',
    title: 'Categories & Budgets',
    steps: [
      {
        targetId: 'tour-add-category-btn',
        title: 'Create Category',
        description: 'Create custom categories for expenses and income, and assign monthly budget limits to them.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-categories-grid',
        title: 'Monthly Budget Progress',
        description: 'Track how much you have spent in each category this month with live progress bars that reset monthly.',
        placement: 'top',
      },
      {
        targetId: 'tour-category-plans-btn',
        title: 'Manage Plans & Suggestions',
        description: 'Browse suggested category packs or create a customized multi-category budget allocation plan.',
        placement: 'bottom',
      },
    ],
  },
  bills: {
    pageId: 'bills',
    title: 'Bills & Subscriptions',
    steps: [
      {
        targetId: 'tour-add-bill-btn',
        title: 'Add New Bill',
        description: 'Set up recurring bills (Rent, Utilities, Subscriptions) with due dates, reminder dates, and fees.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-bills-summary',
        title: 'Expected Outflow',
        description: 'Track your total upcoming dues and remaining unpaid commitments for the current month.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-bills-timeline',
        title: '3-Tier Bill Timeline',
        description: 'Organized into Overdue, Due This Month, and Due Later. Mark bills as paid in 1-click to auto-record transactions.',
        placement: 'top',
      },
    ],
  },
  budget_planner: {
    pageId: 'budget_planner',
    title: '50/30/20 Budget Planner',
    steps: [
      {
        targetId: 'tour-create-plan-btn',
        title: 'Create Budget Plan',
        description: 'Set up an automated financial plan based on your income, fixed commitments (bills), and 50/30/20 framework.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-active-tracker',
        title: 'Active Plan Tracker',
        description: 'Monitors Bills & Fixed Commitments, Needs (50%), Wants (30%), and Savings (20%) in real time against your spending.',
        placement: 'top',
      },
      {
        targetId: 'tour-plan-buckets',
        title: 'Budget Buckets',
        description: 'Categorized spending gauges showing your remaining safe-to-spend allowance per bucket.',
        placement: 'top',
      },
    ],
  },
  settings: {
    pageId: 'settings',
    title: 'Settings & Customization',
    steps: [
      {
        targetId: 'tour-theme-mode',
        title: 'Appearance & Themes',
        description: 'Switch between Dark Cyber-Glass and Light Glassmorphic themes with seamless transitions.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-video-toggle',
        title: 'Video Background Mode',
        description: 'Toggle cinematic ambient looping video background or use static background photography.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-danger-zone',
        title: 'Account Security & Data',
        description: 'View your profile details, manage sessions, or reset all your financial data safely when needed.',
        placement: 'top',
      },
    ],
  },
  record_transaction: {
    pageId: 'record_transaction',
    title: 'Record Transaction Guide',
    steps: [
      {
        targetId: 'tour-modal-tx-type',
        title: 'Transaction Types',
        description: 'Choose between Income, Expense, Expense Divider (auto-splits residual spending), or Transfer between your accounts.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-modal-tx-amount-date',
        title: 'Amount & Date Selection',
        description: 'Enter the transaction amount and pick a date using quick shortcuts (Yesterday, Today) or a custom calendar date.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-modal-tx-account-category',
        title: 'Account & Category',
        description: 'Select the funding account and categorize this transaction to keep your budget allocations and analytics precise.',
        placement: 'bottom',
      },
      {
        targetId: 'tour-modal-tx-note',
        title: 'Description & Notes',
        description: 'Add an optional description or note (e.g., Monthly cloud server, Dinner with friends) for easy search and tracking.',
        placement: 'top',
      },
      {
        targetId: 'tour-modal-tx-fee',
        title: 'Optional Transaction Fees',
        description: 'Attach manual flat or percentage fees, or toggle InstaPay for automatic Egyptian banking fee calculation.',
        placement: 'top',
      },
      {
        targetId: 'tour-modal-tx-submit',
        title: 'Save & Instant Sync',
        description: 'Click Save Transaction to log your activity and instantly update your account balances and cash flow in real-time.',
        placement: 'top',
      },
    ],
  },
}
