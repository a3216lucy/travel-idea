import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConfirmDialogsComponent } from '@shared/component/confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from '@shared/component/dialogs/dialogs.component';
import { EndDialogsComponent } from '@shared/component/end-dialogs/end-dialogs.component';
import { SharedMaterialModule } from '@shared/shared-material/shared-material.module';

@NgModule({
  declarations: [
    DialogsComponent,
    ConfirmDialogsComponent,
    EndDialogsComponent,
  ],
  imports: [CommonModule, SharedMaterialModule],
})
export class SharedComponentsModule {}