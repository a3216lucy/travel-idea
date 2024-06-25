import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SharedComponentsModule } from '@shared/component/shared-components.module';
import { SharedMaterialModule } from '@shared/shared-material/shared-material.module';
import { QuillModule } from 'ngx-quill';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TableComponent } from './dashboard/table/table.component';
import { TransportationComponent } from './dashboard/transportation/transportation.component';

const components = [TableComponent, DashboardComponent];

@NgModule({
  declarations: [...components, TransportationComponent],
  imports: [
    CommonModule,
    SharedMaterialModule,
    SharedComponentsModule,
    FullCalendarModule,
    QuillModule.forRoot({
      modules: {
        toolbar: [
          [{ header: 1 }, { header: 2 }], // custom button values
          ['bold', 'italic', 'underline'], // toggled buttons
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'], // link and image, video
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          ['clean'], // remove formatting button
          //[{ font: [] }],
          //[{ align: [] }],
          //[{ color: [] }, { background: [] }], // dropdown with defaults from theme
        ],
      },
    }),
  ],
  exports: [...components],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule {}
