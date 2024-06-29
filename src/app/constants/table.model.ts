export interface Item {
  id?: string;
  name: string;
  date: Date;
  amount: number;
  isPaid: boolean;
  paidPerson: string;
  selectedCurrency: string;
  people: string[];
  shareAmount: number;
  editing: boolean;
}

export interface Currency {
  name: string;
  code: string;
}

export interface SettlementData {
  name: string;
  spend: Spend[];
}

export const availablePeople: string[] = ['懶君', '周肉', '魚鵑'];

export interface Spend {
  currency: string;
  totalSpent: { [key: string]: number };
  unpaidTotal: { [key: string]: number };
  settlements: Settlement[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  currency: string;
}
