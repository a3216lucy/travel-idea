import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { ConfirmDialogsComponent } from '../confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from '../dialogs/dialogs.component';
import { EndDialogsComponent } from '../end-dialogs/end-dialogs.component';

export interface Item {
  id?: number;
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

  // FullCalendar 标题设置
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
    private dbService: NgxIndexedDBService,
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
    // info 包含了點擊的事件的詳細信息
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
    this.dbService.getAll<Item>('items').subscribe((items: Item[]) => {
      this.dataSource.data = items;
      this.calendarEvents = items.map((item) => ({
        title: item.name,
        start: item.date ? item.date.toISOString() : '', // 检查并转换日期
        // 其他可能需要的属性
      }));
      if (this.calendarComponent && this.calendarComponent.getApi()) {
        this.calendarComponent.getApi().removeAllEvents();
        this.calendarComponent.getApi().addEventSource(this.calendarEvents);
      }
    });
  }

  addItem(newItem: Item): void {
    this.dbService.add<Item>('items', newItem).subscribe(() => {
      this.loadItems();
    });
  }

  updateItem(item: Item): void {
    if (item.id !== undefined) {
      this.dbService.update('items', item).subscribe(() => {
        this.loadItems();
      });
    }
  }

  deleteItem(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogsComponent, {
      width: '250px',
      data: { message: '確定要刪除這個項目嗎？' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dbService.delete('items', id).subscribe(
          () => {
            this.loadItems();
          },
          (error) => {
            console.error('刪除時發生錯誤：', error);
            // 可以進行錯誤處理，例如顯示用戶錯誤消息
          }
        );
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
