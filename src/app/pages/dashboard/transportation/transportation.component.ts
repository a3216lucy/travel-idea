import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Component({
  selector: 'app-transportation',
  templateUrl: './transportation.component.html',
  styleUrls: ['./transportation.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransportationComponent implements OnInit {
  accordionItems: {
    header: {
      headerText: string;
      totalPrice: number;
      isEditing: boolean;
    };
    contentText: string;
    isEditing: boolean;
    steps: {
      title: string;
      price: number;
      start: string;
      end: string;
      content: string;
      isEditing: boolean;
    }[];
  }[] = [];

  constructor(private db: AngularFireDatabase) {}

  ngOnInit() {
    this.loadAccordionItems();
  }

  loadAccordionItems() {
    this.db
      .list('accordionItems')
      .valueChanges()
      .subscribe((items: any[]) => {
        this.accordionItems = items.map((item) => ({
          header: {
            headerText: item.header?.headerText || '',
            totalPrice: item.header?.totalPrice || 0,
            isEditing: false,
          },
          contentText: item.contentText || '',
          isEditing: false,
          steps: item.steps || [],
        }));

        // 載入時計算每個項目的 totalPrice
        this.calculateTotalPrices();
      });
  }

  addAccordionItem() {
    const index = this.accordionItems.length + 1;
    this.accordionItems.push({
      header: {
        headerText: `Header ${index}`,
        totalPrice: 0,
        isEditing: false,
      },
      contentText: `Content ${index}`,
      isEditing: false,
      steps: [],
    });
  }

  editAccordionItem(index: number) {
    this.accordionItems[index].header.isEditing = true;
  }

  saveAccordionItem(index: number) {
    this.accordionItems[index].header.isEditing = false;
    this.saveContentToFirebase(index);
  }

  removeAccordionItem(index: number) {
    this.accordionItems.splice(index, 1);
    this.db
      .object(`accordionItems/${index}`)
      .remove()
      .then(() => console.log('Item removed from Firebase'))
      .catch((error) =>
        console.error('Error removing item from Firebase', error)
      );
  }

  onContentChanged(event: any, index: number) {
    const content = event.html || '';
    if (this.accordionItems[index].contentText !== content) {
      this.accordionItems[index].contentText = content;
    }
  }

  saveContentToFirebase(index: number) {
    const item = this.accordionItems[index];

    const sanitizedItem = {
      header: {
        headerText: item.header.headerText || '',
        totalPrice: item.header.totalPrice || 0,
      },
      contentText: item.contentText || '',
      steps: item.steps || [],
    };

    this.db
      .object(`accordionItems/${index}`)
      .set(sanitizedItem)
      .then(() => console.log('Content saved to Firebase'))
      .catch((error) =>
        console.error('Error saving content to Firebase', error)
      );
  }

  addStep(index: number) {
    this.accordionItems[index].steps.push({
      title: '',
      price: 0,
      start: '',
      end: '',
      content: '',
      isEditing: true,
    });
  }

  editStep(accordionIndex: number, stepIndex: number) {
    this.accordionItems[accordionIndex].steps[stepIndex].isEditing = true;
  }

  saveStepContent(accordionIndex: number, stepIndex: number) {
    this.accordionItems[accordionIndex].steps[stepIndex].isEditing = false;
    this.saveContentToFirebase(accordionIndex);
    this.calculateTotalPrices();
  }

  removeStep(accordionIndex: number, stepIndex: number) {
    this.accordionItems[accordionIndex].steps.splice(stepIndex, 1);
    this.saveContentToFirebase(accordionIndex);
    this.calculateTotalPrices();
  }

  onStepContentChanged(event: any, accordionIndex: number, stepIndex: number) {
    const content = event.html || '';
    if (
      this.accordionItems[accordionIndex].steps[stepIndex].content !== content
    ) {
      this.accordionItems[accordionIndex].steps[stepIndex].content = content;
    }
  }

  calculateTotalPrices() {
    this.accordionItems.forEach((item) => {
      let total = 0;
      item.steps.forEach((step) => {
        total += step.price;
      });
      item.header.totalPrice = total;
    });
  }

  saveAccordionHeader(index: number) {
    this.accordionItems[index].header.isEditing = false;
    // 這裡可以加入將標題保存到後端的邏輯
    this.saveContentToFirebase(index); // 假設這個方法可以保存整個項目到 Firebase
  }
}
