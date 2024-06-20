import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item } from '../table/table.component';

@Component({
  selector: 'app-dialogs',
  templateUrl: './dialogs.component.html',
  styleUrls: ['./dialogs.component.scss'],
})
export class DialogsComponent {
  item: Item = {
    name: '',
    amount: 0,
    selectedCurrency: 'TWD',
    people: [],
    shareAmount: 0,
    editing: false,
  };

  constructor(
    public dialogRef: MatDialogRef<DialogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onSave(): void {
    this.dialogRef.close(this.item);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
