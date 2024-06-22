import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedMaterialModule } from '../shared-material/shared-material.module';
import { ConfirmDialogsComponent } from './confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from './dialogs/dialogs.component';
import { EndDialogsComponent } from './end-dialogs/end-dialogs.component';

@NgModule({
  declarations: [
    DialogsComponent,
    ConfirmDialogsComponent,
    EndDialogsComponent,
  ],
  imports: [CommonModule, SharedMaterialModule],
})
export class SharedComponentsModule {}
