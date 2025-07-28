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

export type Item = Account | Service | Debt | Currency;

// Component-level types that include database fields like 'archived'
export type AccountItem = Account & { archived?: boolean };
export type ServiceItem = Service & { archived?: boolean };
export type DebtItem = Debt & { archived?: boolean };
export type CurrencyItem = Currency & { archived?: boolean };
export type ComponentItem = AccountItem | ServiceItem | DebtItem | CurrencyItem;

// Database item types (before processing)
export type DbItem = {
    _id: string;
    userId: string;
    type: 'account' | 'service' | 'debt' | 'currency';
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

export type ItemFormData = AccountFormData | ServiceFormData | DebtFormData | CurrencyFormData;

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
