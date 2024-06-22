import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Currency, Item } from '@app/constants/table.model';
import { ConfirmDialogsComponent } from '@app/shared/component/confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from '@app/shared/component/dialogs/dialogs.component';
import { EndDialogsComponent } from '@app/shared/component/end-dialogs/end-dialogs.component';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timeGrid';
import { map } from 'rxjs';

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
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('table') table: ElementRef | undefined;
  view: 'table' | 'calendar' = 'table';
  separatorKeysCodes: number[] = [13, 188];
  dataSource = new MatTableDataSource<Item>();
  displayedColumns: string[] = [
    'name',
    'date',
    'amount',
    'isPaid',
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

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: 'zh-tw',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
    },
    buttonText: {
      today: '今天',
      month: '月',
      week: '週',
      day: '日',
      list: '列表',
    },
    // show the prev/next text
    buttonIcons: true,
    weekNumbers: true,
    // can click day/week names to navigate views
    navLinks: true,
    editable: true,
    // allow "more" link when too many events
    dayMaxEvents: true,
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(
    private renderer: Renderer2,
    private db: AngularFireDatabase,
    public dialog: MatDialog
  ) {}

  toggleView() {
    this.view = this.view === 'table' ? 'calendar' : 'table';
  }

  ngAfterViewInit() {
    this.loadItems();
    this.setUpColumnResize();
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      this.calendarComponent.getApi().removeAllEvents();
      this.calendarComponent.getApi().addEventSource(this.calendarEvents);
    }
  }

  setUpColumnResize() {
    if (this.table) {
      const thElements = this.table.nativeElement.querySelectorAll('th');
      thElements.forEach((th: HTMLElement, index: number) => {
        const resize = this.renderer.createElement('div');
        this.renderer.addClass(resize, 'resizer');
        this.renderer.listen(resize, 'mousedown', (event) =>
          this.onMouseDown(event, index)
        );
        this.renderer.appendChild(th, resize);
      });
    }
  }

  loadItems(): void {
    this.db
      .list<Item>('items')
      .valueChanges()
      .pipe(
        map((value: Item[]) =>
          value.map((item) => {
            const numPeople = item?.people.length;
            const shareAmount = numPeople > 0 ? item.amount / numPeople : 0;
            const date = new Date(item.date);
            return {
              ...item,
              editing: false,
              shareAmount: shareAmount,
              date: date,
            };
          })
        )
      )
      .subscribe((items: Item[]) => {
        // 將資料指派給 MatTableDataSource
        this.dataSource.data = items;

        // 更新其他需要同步更新的資料，如日曆事件等
        this.calendarEvents = items.map((item) => ({
          title: item.name,
          start: item.date,
        }));
        // 更新日曆事件
        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.calendarComponent.getApi().removeAllEvents();
          this.calendarComponent.getApi().addEventSource(this.calendarEvents);
        }
      });
  }

  /**
   * 新增表單項目
   * @param newItem 要新增的項目
   */
  addItem(newItem: Item): void {
    const itemsRef = this.db.list<Item>('items').push(newItem);
    if (itemsRef.key) {
      // 使用 Firebase 生成的唯一 key 作為 id
      newItem.id = itemsRef.key;
      this.db
        .object(`items/${itemsRef.key}`)
        .update(newItem)
        .then(() => {
          // 新增後重新載入資料
          this.loadItems();
        });
    }
  }

  /**
   * 更新表單
   * @param item 要更新的項目
   */
  updateItem(item: Item): void {
    if (item.id) {
      const itemRef = this.db.object(`items/${item.id}`);
      itemRef.update(item).then(() => {
        this.loadItems();
      });
    }
  }

  /**
   * 刪除表單項目
   * @param id 要刪除的項目 ID
   */
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

  /**
   * 滑鼠事件處理函式
   * @param event 事件
   * @param colIndex 欄位索引
   * @returns 無回傳值
   */
  onMouseDown(event: MouseEvent, colIndex: number): void {
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

  ngOnDestroy() {
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }

  /**
   * 處理日曆事件點擊事件
   * @param info 事件資訊
   */
  handleEventClick(info: any) {
    const dialogRef = this.dialog.open(EndDialogsComponent, {
      width: '500px',
      data: { event: info.event },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // 可以在 Modal 關閉後執行一些操作
    });
  }

  /**
   * 開啟新增 Modal
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogsComponent, {
      width: '500px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: Item) => {
      if (result) {
        this.addItem(result);
      }
    });
  }

  /**
   * 開啟編輯 Modal
   * @param item 要編輯的項目
   */
  openEditDialog(item: Item): void {
    const dialogRef = this.dialog.open(DialogsComponent, {
      width: '500px',
      data: { item },
    });

    dialogRef.afterClosed().subscribe((result: Item) => {
      if (result) {
        if (!result.id) {
          this.addItem(result);
        } else {
          this.updateItem(result);
        }
      }
    });
  }
}
