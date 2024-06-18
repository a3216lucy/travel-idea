import { Component, ElementRef, OnDestroy, Renderer2 } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatTableDataSource } from '@angular/material/table';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Item {
  name: string;
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

const ELEMENT_DATA: Item[] = [
  {
    name: 'Item 1',
    amount: 100,
    selectedCurrency: 'TWD',
    people: [],
    shareAmount: 0,
    editing: false,
  },
  {
    name: 'Item 2',
    amount: 200,
    selectedCurrency: 'TWD',
    people: [],
    shareAmount: 0,
    editing: false,
  },
  {
    name: 'Item 3',
    amount: 300,
    selectedCurrency: 'TWD',
    people: [],
    shareAmount: 0,
    editing: false,
  },
];

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnDestroy {
  private mouseMoveListener!: () => void;
  private mouseUpListener!: () => void;
  view: 'table' | 'calendar' = 'table';
  separatorKeysCodes: number[] = [13, 188];
  dataSource = new MatTableDataSource<Item>(ELEMENT_DATA);

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
  };

  availablePeople: string[] = ['懶君', '周肉', '魚鵑'];

  displayedColumns: string[] = [
    'name',
    'amount',
    'selectedCurrency',
    'people',
    'shareAmount',
  ];

  calendarEvents = [
    { title: 'Event 1', date: '2023-06-01' },
    { title: 'Event 2', date: '2023-06-02' },
  ];

  currencies: Currency[] = [
    { name: '台幣', code: 'TWD' },
    { name: '日圓', code: 'JPY' },
    { name: '美金', code: 'USD' },
  ];

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  onMouseDown(event: MouseEvent, colIndex: number) {
    const thElements = this.el.nativeElement.querySelectorAll('th');
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
  }

  addPerson(event: MatChipInputEvent, item: Item) {
    const input = event.input;
    const value = event.value;

    // Add our person
    if ((value || '').trim()) {
      item.people.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  removePerson(person: string, item: Item) {
    const index = item.people.indexOf(person);

    if (index >= 0) {
      item.people.splice(index, 1);
    }
  }

  ngOnDestroy() {
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
  }
}
