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
import {
  Currency,
  Item,
  Settlement,
  SettlementData,
  Spend,
  availablePeople,
} from '@app/constants/table.model';
import { ConfirmDialogsComponent } from '@app/shared/component/confirm-dialogs/confirm-dialogs.component';
import { DialogsComponent } from '@app/shared/component/dialogs/dialogs.component';
import { EndDialogsComponent } from '@app/shared/component/end-dialogs/end-dialogs.component';
import { SettleDialogsComponent } from '@app/shared/component/settle-dialogs/settle-dialogs.component';
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
  availablePeople = availablePeople;
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
    buttonIcons: true,
    weekNumbers: true,
    navLinks: true,
    editable: true,
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
    this.refreshCalendarEvents();
  }

  private refreshCalendarEvents() {
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      this.calendarComponent.getApi().removeAllEvents();
      this.calendarComponent.getApi().addEventSource(this.calendarEvents);
    }
  }

  private setUpColumnResize() {
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

  private loadItems(): void {
    this.db
      .list<Item>('items')
      .valueChanges()
      .pipe(map(this.transformItems))
      .subscribe((items: Item[]) => {
        this.dataSource.data = items;
        this.updateCalendarEvents(items);
        this.populateAvailablePeople(items);
      });
  }

  private transformItems(value: Item[]): Item[] {
    return value.map((item) => {
      const numPeople = item?.people.length;
      const shareAmount = numPeople > 0 ? item.amount / numPeople : 0;
      const date = new Date(item.date);
      return {
        ...item,
        editing: false,
        shareAmount,
        date,
      };
    });
  }

  private updateCalendarEvents(items: Item[]) {
    this.calendarEvents = items.map((item) => ({
      title: item.name,
      start: item.date,
    }));
    this.refreshCalendarEvents();
  }

  populateAvailablePeople(items: Item[]): void {
    const availablePeopleSet = new Set<string>();
    items.forEach((item) => {
      item.people.forEach((person) => availablePeopleSet.add(person));
    });
    this.availablePeople = Array.from(availablePeopleSet);
  }

  applyFilter(selectedPerson: string): void {
    if (selectedPerson === 'all') {
      this.loadItems(); // 顯示全部財務紀錄
    } else {
      this.db
        .list<Item>('items')
        .valueChanges()
        .pipe(
          map((items: Item[]) =>
            items.filter(
              (item) =>
                item.paidPerson === selectedPerson ||
                item.people.includes(selectedPerson)
            )
          )
        )
        .subscribe((filteredItems: Item[]) => {
          this.dataSource.data = filteredItems; // 只顯示特定分帳人的財務紀錄
          this.updateCalendarEvents(filteredItems);
        });
    }
  }

  addItem(newItem: Item): void {
    const itemsRef = this.db.list<Item>('items').push(newItem);
    if (itemsRef.key) {
      newItem.id = itemsRef.key;
      this.db
        .object(`items/${itemsRef.key}`)
        .update(newItem)
        .then(() => this.loadItems());
    }
  }

  updateItem(item: Item): void {
    if (item.id) {
      this.db
        .object(`items/${item.id}`)
        .update(item)
        .then(() => this.loadItems());
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
          .then(() => this.loadItems());
      }
    });
  }

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
      this.removeListeners();
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

  private removeListeners() {
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  handleEventClick(info: any) {
    const dialogRef = this.dialog.open(EndDialogsComponent, {
      width: '500px',
      data: { event: info.event },
    });

    dialogRef.afterClosed().subscribe();
  }

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

  openSettleDialog(): void {
    this.db
      .list<Item>('items')
      .valueChanges()
      .pipe(
        map((items: Item[]) => ({
          items: items,
          people: this.calculateSettlements(items),
        }))
      )
      .subscribe((data: { items: Item[]; people: SettlementData[] }) => {
        const dialogRef = this.dialog.open(SettleDialogsComponent, {
          width: '500px',
          height: '400px',
          data: data,
        });

        dialogRef.afterClosed().subscribe();
      });
  }

  /**
   * 計算分帳結果
   * @param items db 資料
   * @returns 分帳結果
   */
  private calculateSettlements(items: Item[]): SettlementData[] {
    const peopleMap: Map<string, SettlementData> = new Map();

    // 遍歷每個項目
    items.forEach((item) => {
      const currency = item.selectedCurrency;

      // 遍歷每個人員
      item.people.forEach((person) => {
        const key = `${person}_${currency}`;

        // 初始化人員的花費數據
        if (!peopleMap.has(key)) {
          peopleMap.set(key, {
            name: person,
            spend: [],
          });
        }

        const personData = peopleMap.get(key)!;

        // 查找或創建對應幣種的花費數據
        let spendData = personData.spend.find(
          (spend) => spend.currency === currency
        );
        if (!spendData) {
          spendData = {
            currency,
            totalSpent: {},
            unpaidTotal: {},
            settlements: [],
          };
          personData.spend.push(spendData);
        }

        // 累計總花費
        if (!spendData.totalSpent[currency]) {
          spendData.totalSpent[currency] = 0;
        }
        spendData.totalSpent[currency] += item.amount / item.people.length;

        // 處理結算邏輯
        if (item.isPaid && item.paidPerson) {
          this.processSettlement(item, person, currency, spendData, peopleMap);
        } else {
          spendData.unpaidTotal[currency] += item.amount / item.people.length;
        }
      });
    });

    // 合併相同人員的花費數據
    return Array.from(peopleMap.values()).map((personData) => ({
      name: personData.name,
      spend: personData.spend.map((spendData) => ({
        currency: spendData.currency,
        totalSpent: spendData.totalSpent,
        unpaidTotal: spendData.unpaidTotal,
        settlements: spendData.settlements,
      })),
    }));
  }

  // 處理結算邏輯的方法
  private processSettlement(
    item: Item,
    person: string,
    currency: string,
    spendData: Spend,
    peopleMap: Map<string, SettlementData>
  ) {
    item.people.forEach((innerPerson) => {
      if (innerPerson !== item.paidPerson) {
        const settlement: Settlement = {
          from: innerPerson,
          to: item.paidPerson,
          amount: item.amount / item.people.length,
          currency,
        };

        // 添加結算記錄
        if (
          !spendData!.settlements.some((s) =>
            this.isEqualSettlement(s, settlement)
          )
        ) {
          spendData!.settlements.push(settlement);
        }

        // 更新付款人的結算記錄
        const paidPersonKey = `${item.paidPerson}_${currency}`;
        const paidPersonData = peopleMap.get(paidPersonKey);
        if (paidPersonData) {
          let paidPersonSpend = paidPersonData.spend.find(
            (spend) => spend.currency === currency
          );
          if (!paidPersonSpend) {
            paidPersonSpend = {
              currency,
              totalSpent: {},
              unpaidTotal: {},
              settlements: [],
            };
            paidPersonData.spend.push(paidPersonSpend);
          }
          if (
            !paidPersonSpend.settlements.some((s) =>
              this.isEqualSettlement(s, settlement)
            )
          ) {
            paidPersonSpend.settlements.push(settlement);
          }
        }
      }
    });
  }

  // 判斷結算是否相等的方法
  private isEqualSettlement(
    settlement1: Settlement,
    settlement2: Settlement
  ): boolean {
    return (
      settlement1.from === settlement2.from &&
      settlement1.to === settlement2.to &&
      settlement1.amount === settlement2.amount &&
      settlement1.currency === settlement2.currency
    );
  }
}
