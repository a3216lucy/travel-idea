import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FullCalendarModule } from '@fullcalendar/angular';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { AppComponent } from './app.component';
import { ConfirmDialogsComponent } from './confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from './dialogs/dialogs.component';
import { TableComponent } from './table/table.component';

const dbConfig: DBConfig = {
  name: 'MyDb',
  version: 1,
  objectStoresMeta: [
    {
      store: 'items',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'id', keypath: 'id', options: { unique: true } },
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'amount', keypath: 'amount', options: { unique: false } },
        {
          name: 'selectedCurrency',
          keypath: 'selectedCurrency',
          options: { unique: false },
        },
        { name: 'people', keypath: 'people', options: { unique: false } },
        {
          name: 'shareAmount',
          keypath: 'shareAmount',
          options: { unique: false },
        },
        { name: 'editing', keypath: 'editing', options: { unique: false } },
      ],
    },
  ],
};

@NgModule({
  declarations: [
    AppComponent,
    TableComponent,
    DialogsComponent,
    ConfirmDialogsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    FullCalendarModule,
    MatDialogModule,
    NgxIndexedDBModule.forRoot(dbConfig),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
