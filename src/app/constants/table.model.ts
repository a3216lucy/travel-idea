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
