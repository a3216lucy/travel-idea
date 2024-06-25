import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Component({
  selector: 'app-transportation',
  templateUrl: './transportation.component.html',
  styleUrls: ['./transportation.component.scss'],
})
export class TransportationComponent implements OnInit {
  accordionItems: {
    headerText: string;
    contentText: string;
    headerDescription: string;
    isEditing: boolean;
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
          headerText: item.headerText || '',
          contentText: item.contentText || '',
          headerDescription: item.headerDescription || '',
          isEditing: false,
        }));
      });
  }

  addAccordionItem() {
    const index = this.accordionItems.length + 1;
    this.accordionItems.push({
      headerText: `Header ${index}`,
      contentText: '',
      headerDescription: `Description ${index}`,
      isEditing: false,
    });
  }

  editAccordionItem(index: number) {
    this.accordionItems[index].isEditing = true;
  }

  saveAccordionItem(index: number) {
    this.accordionItems[index].isEditing = false;
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
    const content = event.html || ''; // 确保 content 是一个字符串
    if (this.accordionItems[index].contentText !== content) {
      this.accordionItems[index].contentText = content;
    }
  }

  saveContentToFirebase(index: number) {
    const item = this.accordionItems[index];

    // 確保所有字段都被定義
    const sanitizedItem = {
      headerText: item.headerText || '',
      contentText: item.contentText || '',
      headerDescription: item.headerDescription || '',
    };

    this.db
      .object(`accordionItems/${index}`)
      .set(sanitizedItem)
      .then(() => console.log('Content saved to Firebase'))
      .catch((error) =>
        console.error('Error saving content to Firebase', error)
      );
  }
}
