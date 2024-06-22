import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../pages/table/table.component';

@Injectable({
  providedIn: 'root',
})
export class FireStoreService {
  private collectionName = 'items';

  constructor(private fireStore: AngularFirestore) {}

  getItems(): Observable<Item[]> {
    return this.fireStore
      .collection<Item>(this.collectionName)
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Item;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
  }

  addItem(item: Item): Promise<void> {
    const id = this.fireStore.createId();
    return this.fireStore.doc<Item>(`${this.collectionName}/${id}`).set(item);
  }

  updateItem(item: Item): Promise<void> {
    return this.fireStore
      .doc<Item>(`${this.collectionName}/${item.id}`)
      .update(item);
  }

  deleteItem(id: string): Promise<void> {
    return this.fireStore.doc<Item>(`${this.collectionName}/${id}`).delete();
  }
}
