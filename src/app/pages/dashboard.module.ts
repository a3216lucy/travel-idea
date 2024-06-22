import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SharedComponentsModule } from '../shared/component/shared-components.module';
import { SharedMaterialModule } from '../shared/shared-material/shared-material.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TableComponent } from './table/table.component';

const components = [TableComponent, DashboardComponent];

@NgModule({
  declarations: [...components],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedComponentsModule,
    FullCalendarModule,
  ],
  exports: [...components],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule {}
