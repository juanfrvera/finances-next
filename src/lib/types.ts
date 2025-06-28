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
    type: 'account';
    createDate: string;
    editDate: string;
};

export type Service = {
    _id: string;
    name: string;
    cost: number;
    currency: string;
    isManual: boolean;
    type: 'service';
    createDate: string;
    editDate: string;
};

export type Debt = {
    _id: string;
    name: string;
    amount: number;
    currency: string;
    type: 'debt';
    createDate: string;
    editDate: string;
};

export type Currency = {
    _id: string;
    name: string;
    symbol: string;
    rate: number;
    type: 'currency';
    createDate: string;
    editDate: string;
};

export type Item = Account | Service | Debt | Currency;
