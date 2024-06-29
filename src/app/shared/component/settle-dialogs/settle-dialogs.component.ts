import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item, SettlementData } from '@app/constants/table.model';

@Component({
  selector: 'app-settle-dialogs',
  templateUrl: './settle-dialogs.component.html',
})
export class SettleDialogsComponent {
  settledItems: SettlementData[] = [];
  unpaidTotalAmount: { [currency: string]: number } = {};
  Object = Object;

  constructor(
    public dialogRef: MatDialogRef<SettleDialogsComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { items: Item[]; people: SettlementData[] }
  ) {
    this.calculateSettlement();
  }

  calculateSettlement() {
    this.settledItems = [];
    this.unpaidTotalAmount = {};

    const items = this.data.items;

    // 使用 Map 來儲存每個人每種幣別的結算資料
    const peopleMap: Map<string, SettlementData> = new Map();

    // 遍歷每個項目，初始化或更新人員的結算資料
    items.forEach((item) => {
      const currency = item.selectedCurrency;

      item.people.forEach((person) => {
        const key = person;

        // 初始化 personData，如果尚未存在
        if (!peopleMap.has(person)) {
          peopleMap.set(person, {
            name: person,
            spend: [],
          });
        }

        // 確保現在已經存在 personData
        const personData = peopleMap.get(person);

        if (personData) {
          let spendData = personData.spend.find(
            (spend) => spend.currency === currency
          );

          if (!spendData) {
            spendData = {
              currency: currency,
              totalSpent: {},
              unpaidTotal: {},
              settlements: [],
            };
            personData.spend.push(spendData);
          }

          // 初始化 totalSpent 和 unpaidTotal 中的各個幣別
          if (!spendData.totalSpent[currency]) {
            spendData.totalSpent[currency] = 0;
          }
          if (!spendData.unpaidTotal[currency]) {
            spendData.unpaidTotal[currency] = 0;
          }

          spendData.totalSpent[currency] += item.amount / item.people.length;

          // 如果項目是已付款的，則計算結算金額
          if (
            item.isPaid &&
            item.paidPerson &&
            !(item.paidPerson === person && item.people.length === 1)
          ) {
            // 尋找相關的結算對象並記錄
            items.forEach((innerItem) => {
              if (
                innerItem.id !== item.id &&
                innerItem.people.includes(person) &&
                innerItem.selectedCurrency === currency
              ) {
                if (
                  !spendData?.settlements.find(
                    (settlement) =>
                      settlement.from === person &&
                      settlement.to === innerItem.paidPerson &&
                      settlement.currency === currency
                  )
                ) {
                  spendData?.settlements.push({
                    from: person,
                    to: innerItem.paidPerson,
                    amount: innerItem.amount / innerItem.people.length,
                    currency: innerItem.selectedCurrency,
                  });
                }
              }
            });
          }
        }
      });

      // 如果項目是未付款的，則將其加入未付款總金額
      if (!item.isPaid || !item.paidPerson) {
        const person = item.people[0];
        const personData = peopleMap.get(person);

        if (personData) {
          let spendData = personData.spend.find(
            (spend) => spend.currency === item.selectedCurrency
          );
          if (spendData) {
            spendData.unpaidTotal[item.selectedCurrency] +=
              item.amount / item.people.length;
            if (!this.unpaidTotalAmount[item.selectedCurrency]) {
              this.unpaidTotalAmount[item.selectedCurrency] = 0;
            }
            this.unpaidTotalAmount[item.selectedCurrency] +=
              item.amount / item.people.length;
          }
        }
      }
    });

    // 將 Map 中的結算資料轉換為陣列並按照人名和幣別進行排序
    this.settledItems = Array.from(peopleMap.values()).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // 格式化顯示 settledItems 和 settlements，這部分可以用來檢查結果
    console.log('=== 結算結果 ===');
    console.log(this.settledItems);
    this.settledItems.forEach((item) => {
      item.spend.forEach((spend) => {
        Object.keys(spend.totalSpent).forEach((currency) => {
          console.log(
            `${item.name} 在 ${currency} 下總花費：${spend.totalSpent[
              currency
            ].toFixed(2)}`
          );
        });
        Object.keys(spend.unpaidTotal).forEach((currency) => {
          if (spend.unpaidTotal[currency] > 0) {
            console.log(
              `未支付總金額：${spend.unpaidTotal[currency].toFixed(2)}`
            );
          }
        });
        spend.settlements.forEach((settlement) => {
          console.log(
            `${settlement.from} 需支付給 ${
              settlement.to
            } ${settlement.amount.toFixed(2)}`
          );
        });
      });
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
