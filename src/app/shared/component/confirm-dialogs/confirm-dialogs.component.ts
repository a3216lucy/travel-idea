import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialogs',
  templateUrl: './confirm-dialogs.component.html',
  styleUrls: ['./confirm-dialogs.component.scss'],
})
export class ConfirmDialogsComponent {
  message: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    this.message = data.message;
  }

  onConfirm(): void {
    // 將 true 傳遞給父組件，表示用戶確定操作
    this.dialogRef.close(true);
  }

  onCancel(): void {
    // 將 false 傳遞給父組件，表示用戶取消操作
    this.dialogRef.close(false);
  }
}
