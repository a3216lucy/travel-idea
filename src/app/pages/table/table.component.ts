import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ConfirmDialogsComponent } from '../../shared/component/confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from '../../shared/component/dialogs/dialogs.component';
import { EndDialogsComponent } from '../../shared/component/end-dialogs/end-dialogs.component';

export interface Item {
  id?: string;
  name: string;
  date: Date;
  amount: number;
  selectedCurrency: string;
  people: string[];
  shareAmount: number;
  editing: boolean;
}

interface Currency {
  name: string;
  code: string;
}

/**
 * 表格頁面
 */
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnDestroy, AfterViewInit {
  private mouseMoveListener!: () => void;
  private mouseUpListener!: () => void;
  view: 'table' | 'calendar' = 'table';
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  separatorKeysCodes: number[] = [13, 188];
  dataSource = new MatTableDataSource<Item>();

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    eventClick: this.handleEventClick.bind(this),
  };

  calendarHeader = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  };

  availablePeople: string[] = ['懶君', '周肉', '魚鵑'];
  displayedColumns: string[] = [
    'name',
    'date',
    'amount',
    'selectedCurrency',
    'people',
    'shareAmount',
    'actions',
  ];

  calendarEvents: any[] = [];
  currencies: Currency[] = [
    { name: '台幣', code: 'TWD' },
    { name: '日圓', code: 'JPY' },
    { name: '美金', code: 'USD' },
  ];

  @ViewChild('table') table: ElementRef | undefined;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private db: AngularFireDatabase,
    public dialog: MatDialog
  ) {}

  ngAfterViewInit() {
    this.loadItems();
    this.setUpColumnResize();
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      this.calendarComponent.getApi().removeAllEvents();
      this.calendarComponent.getApi().addEventSource(this.calendarEvents);
    }
  }

  handleEventClick(info: any) {
    const dialogRef = this.dialog.open(EndDialogsComponent, {
      width: '250px',
      data: { event: info.event },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // 可以在對話框關閉後執行一些操作
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogsComponent, {
      width: '250px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: Item) => {
      if (result) {
        this.addItem(result);
      }
    });
  }

  loadItems(): void {
    this.db
      .list<Item>('items')
      .valueChanges()
      .subscribe((items: Item[]) => {
        this.dataSource.data = items; // 將資料指派給 MatTableDataSource
        // 更新日曆事件等其他需要同步更新的資料
        this.calendarEvents = items.map((item) => ({
          title: item.name,
          start: item.date ? item.date.toISOString() : '',
        }));
        // 更新日曆事件
        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.calendarComponent.getApi().removeAllEvents();
          this.calendarComponent.getApi().addEventSource(this.calendarEvents);
        }
      });
  }

  addItem(newItem: Item): void {
    const itemsRef = this.db.list('items');
    itemsRef.push(newItem).then(() => {
      this.loadItems(); // 新增後重新載入資料
    });
  }

  updateItem(item: Item): void {
    if (item.id) {
      const itemRef = this.db.object(`items/${item.id}`);
      itemRef.update(item).then(() => {
        this.loadItems();
      });
    }
  }

  deleteItem(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogsComponent, {
      width: '250px',
      data: { message: '確定要刪除這個項目嗎？' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.db
          .object(`items/${id}`)
          .remove()
          .then(() => {
            this.loadItems();
          });
      }
    });
  }

  setUpColumnResize() {
    if (this.table) {
      const thElements = this.table.nativeElement.querySelectorAll('th');
      thElements.forEach((th: HTMLElement, index: number) => {
        const resizer = this.renderer.createElement('div');
        this.renderer.addClass(resizer, 'resizer');
        this.renderer.listen(resizer, 'mousedown', (event) =>
          this.onMouseDown(event, index)
        );
        this.renderer.appendChild(th, resizer);
      });
    }
  }

  onMouseDown(event: MouseEvent, colIndex: number) {
    const thElements = this.table?.nativeElement.querySelectorAll('th');
    if (!thElements) return;

    const th = thElements[colIndex];
    const startX = event.pageX;
    const startWidth = th.offsetWidth;

    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.pageX - startX);
      this.renderer.setStyle(th, 'width', `${newWidth}px`);
    };

    const mouseUpHandler = () => {
      this.renderer.removeClass(document.body, 'resizing');
      if (this.mouseMoveListener) this.mouseMoveListener();
      if (this.mouseUpListener) this.mouseUpListener();
    };

    this.renderer.addClass(document.body, 'resizing');
    this.mouseMoveListener = this.renderer.listen(
      'document',
      'mousemove',
      mouseMoveHandler
    );
    this.mouseUpListener = this.renderer.listen(
      'document',
      'mouseup',
      mouseUpHandler
    );
  }

  toggleEditMode(item: Item) {
    item.editing = !item.editing;
    if (!item.editing) {
      this.updateItem(item);
    }
  }

  toggleView() {
    this.view = this.view === 'table' ? 'calendar' : 'table';
  }

  onKeyPress(event: KeyboardEvent, item: Item) {
    if (event.key === 'Enter') {
      this.toggleEditMode(item);
    }
  }

  onBlur(item: Item) {
    this.toggleEditMode(item);
  }

  calculateShareAmount(item: Item) {
    const numPeople = item.people.length;
    item.shareAmount = numPeople > 0 ? item.amount / numPeople : 0;
    this.updateItem(item);
  }

  addPerson(event: MatChipInputEvent, item: Item) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      item.people.push(value.trim());
    }

    if (input) {
      input.value = '';
    }
    this.calculateShareAmount(item);
  }

  removePerson(person: string, item: Item) {
    const index = item.people.indexOf(person);
    if (index >= 0) {
      item.people.splice(index, 1);
    }
    this.calculateShareAmount(item);
  }

  ngOnDestroy() {
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }
}
