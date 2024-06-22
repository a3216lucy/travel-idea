import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-end-dialogs',
  templateUrl: './end-dialogs.component.html',
  styleUrls: ['./end-dialogs.component.scss'],
})
export class EndDialogsComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
