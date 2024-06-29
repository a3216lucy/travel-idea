import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item, availablePeople } from '@app/constants/table.model';

/**
 * 新增／編輯 Modal 元件
 */
@Component({
  selector: 'app-dialogs',
  templateUrl: './dialogs.component.html',
  styleUrls: ['./dialogs.component.scss'],
})
export class DialogsComponent {
  availablePeople = availablePeople;
  item: Item;

  constructor(
    public dialogRef: MatDialogRef<DialogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.item = data.item
      ? { ...data.item }
      : {
          id: '',
          name: '',
          date: new Date(),
          amount: 0,
          isPaid: false,
          paidPerson: '',
          selectedCurrency: 'TWD',
          people: [],
          shareAmount: 0,
          editing: false,
        };
  }

  onSave(): void {
    const itemToSave = {
      ...this.item,
      // 在保存時將 date 屬性轉換為 ISO 字符串
      date: this.item.date.toISOString(),
      shareAmount: this.item.people.length
        ? this.item.amount / this.item.people.length
        : 0,
    };
    this.dialogRef.close(itemToSave);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  isValid(): boolean {
    const baseValid =
      !!this.item.name &&
      !!this.item.date &&
      this.item.amount > 0 &&
      !!this.item.selectedCurrency &&
      this.item.people.length > 0;

    if (this.item.isPaid) {
      return baseValid && !!this.item.paidPerson;
    }

    return baseValid;
  }
}
