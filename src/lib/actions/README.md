# Server Actions Organization

This directory contains all server actions organized by functionality:

## Structure

```
/lib/actions/
├── index.ts          # Re-exports all actions for easy importing
├── auth.ts           # Authentication related actions
├── items.ts          # Item management (CRUD, archive/unarchive)
├── transactions.ts   # Transaction management and account balance updates
└── currency.ts       # Currency evolution data processing
```

## Files Overview

### `auth.ts`
- User authentication (login, signup, logout)
- JWT token management
- Session handling with HTTP-only cookies
- User validation and authorization helpers

### `items.ts`
- Core item CRUD operations (`addItemToDb`, `updateItemToDb`, `deleteItemFromDb`)
- Archive/unarchive functionality (`archiveItem`, `unarchiveItem`)
- Database transaction handling for data consistency

### `transactions.ts`
- Account balance management (`updateAccountBalance`)
- Transaction CRUD operations (`createTransaction`, `getTransactions`, `deleteTransaction`)
- Debt payment tracking (`createDebtPayment`, `getDebtPaymentStatus`)
- Balance recalculation and transaction history

### `currency.ts`
- Currency evolution data processing (`getCurrencyEvolutionData`)
- Historical balance calculations
- Account breakdown and ranking
- Data aggregation for charts

## Usage

All actions are re-exported from the main `/app/actions.ts` file for backward compatibility:

```typescript
// Import from the main actions file (recommended)
import { addItemToDb, archiveItem } from '@/app/actions';

// Or import directly from organized modules
import { addItemToDb } from '@/lib/actions/items';
import { getCurrencyEvolutionData } from '@/lib/actions/currency';

// Or import multiple from the index
import { addItemToDb, archiveItem, getCurrencyEvolutionData } from '@/lib/actions';
```

## Benefits of This Organization

1. **Modularity**: Related functions are grouped together
2. **Maintainability**: Easier to find and modify specific functionality
3. **Scalability**: New actions can be added to appropriate modules
4. **Code Reuse**: Individual modules can be imported as needed
5. **Testing**: Each module can be tested independently
6. **Backward Compatibility**: Existing imports continue to work through re-exports
