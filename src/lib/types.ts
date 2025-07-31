// Shared types for the application

export type Transaction = {
    _id: string;
    itemId: string;
    amount: number;
    note: string;
    date: string;
};

export type Account = {
    _id: string;
    name: string;
    balance: number;
    currency: string;
    currencyId?: string;
    type: 'account';
    createDate: string;
    editDate: string;
    userId: string;
};

export type Service = {
    _id: string;
    name: string;
    cost: number;
    currency: string;
    currencyId?: string;
    isManual: boolean;
    notes?: string;
    type: 'service';
    createDate: string;
    editDate: string;
    userId: string;
};

export type Debt = {
    _id: string;
    description: string;
    withWho: string;
    personId?: string;
    amount: number;
    currency: string;
    currencyId?: string;
    theyPayMe: boolean;
    type: 'debt';
    createDate: string;
    editDate: string;
    userId: string;
    // Payment status fields (calculated from transactions)
    paymentStatus?: 'paid' | 'partially_paid' | 'unpaid';
    totalPaid?: number;
    remainingAmount?: number;
    transactionCount?: number;
};

export type Currency = {
    _id: string;
    currency: string;
    type: 'currency';
    createDate: string;
    editDate: string;
    userId: string;
    // For currency items that track account balances
    value?: number;
    accountBreakdown?: { id: string; name: string; balance: number }[];
};

export type Investment = {
    _id: string;
    name: string;
    tag: string;
    initialValue: number;
    currency?: string;
    currencyId?: string;
    accountId?: string;
    description?: string;
    expectedReturn?: number;
    expectedCashOutDate?: string;
    currentValue?: number;
    isFinished?: boolean;
    type: 'investment';
    createDate: string;
    editDate: string;
    userId: string;
    // Calculated fields
    totalGainLoss?: number;
    gainLossPercentage?: number;
    valueHistory?: InvestmentValueUpdate[];
};

export type InvestmentValueUpdate = {
    _id: string;
    investmentId: string;
    value: number;
    date: string;
    note?: string;
    userId: string;
};

// Entity types for the new entity system
export type CurrencyEntity = {
    _id: string;
    name: string;
    userId: string;
    createDate: string;
    editDate: string;
};

export type PersonEntity = {
    _id: string;
    name: string;
    userId: string;
    createDate: string;
    editDate: string;
};

export type Item = Account | Service | Debt | Currency | Investment;

// Component-level types that include database fields like 'archived'
export type AccountItem = Account & { archived?: boolean };
export type ServiceItem = Service & { archived?: boolean };
export type DebtItem = Debt & { archived?: boolean };
export type CurrencyItem = Currency & { archived?: boolean };
export type InvestmentItem = Investment & { archived?: boolean };
export type ComponentItem = AccountItem | ServiceItem | DebtItem | CurrencyItem | InvestmentItem;

// Database item types (before processing)
export type DbItem = {
    _id: string;
    userId: string;
    type: 'account' | 'service' | 'debt' | 'currency' | 'investment';
    createDate: string;
    editDate: string;
    archived?: boolean;
    name?: string;
    balance?: number;
    cost?: number;
    currency?: string;
    currencyId?: string;
    isManual?: boolean;
    notes?: string;
    description?: string;
    withWho?: string;
    personId?: string;
    amount?: number;
    theyPayMe?: boolean;
    value?: number;
    accountBreakdown?: { id: string; name: string; balance: number }[];
    // Payment status fields (calculated)
    paymentStatus?: 'paid' | 'partially_paid' | 'unpaid';
    totalPaid?: number;
    remainingAmount?: number;
    transactionCount?: number;
    // Investment fields
    tag?: string;
    initialValue?: number;
    expectedReturn?: number;
    expectedCashOutDate?: string;
    currentValue?: number;
    isFinished?: boolean;
    totalGainLoss?: number;
    gainLossPercentage?: number;
    valueHistory?: InvestmentValueUpdate[];
    accountId?: string;
};

// Form data types
export type AccountFormData = {
    name: string;
    balance: number;
    currency: string;
};

export type ServiceFormData = {
    name: string;
    cost: number;
    currency: string;
    isManual: boolean;
    notes?: string;
};

export type DebtFormData = {
    description: string;
    withWho: string;
    amount: number;
    currency: string;
    theyPayMe: boolean;
};

export type CurrencyFormData = {
    currency: string;
};

export type InvestmentFormData = {
    name: string;
    tag: string;
    initialValue: number;
    currency?: string;
    accountId?: string;
    description?: string;
    expectedReturn?: number;
    expectedCashOutDate?: string;
};

export type InvestmentValueUpdateFormData = {
    value: number;
    note?: string;
    date?: string;
};

export type ItemFormData = AccountFormData | ServiceFormData | DebtFormData | CurrencyFormData | InvestmentFormData;

// Payment status info
export type PaymentStatusInfo = {
    totalPaid: number;
    remainingAmount: number;
    paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
    transactionCount: number;
};

// Dashboard props
export type DashboardProps = {
    items: Item[];
    archivedItems: Item[];
    availableCurrencies: CurrencyEntity[];
    availablePersons: PersonEntity[];
};
