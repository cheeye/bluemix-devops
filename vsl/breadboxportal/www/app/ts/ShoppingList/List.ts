/// <reference path="Item.ts" />
module ShoppingList {
	
	export class List {
		static rev: string;
		private items: Item[] = [];
		constructor(arr: Item[]) {
			if (!arr) {
				return;
			}
			for (var i = 0; i < arr.length; i++) {
				arr[i].getDecoration = Item.prototype.getDecoration;
				this.items.push(new ShoppingList.Item(arr[i], null));
			};
		}
		
		//Adds an new item to the list. Returns length of array.
		add(item: Item): number {
			return this.items.unshift(item);
		}
		
		concat(items: Item[]): void {
			this.items.concat(items);
			this.items.forEach(function(element) {
				element.getDecoration = Item.prototype.getDecoration;
			}, this);
		}
		
		contains(name: string): boolean {
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i].name == name) {
					return true;
				}
			}
			return false;
		}
		
		//Returns the length of the list.
		count(): number {
			return this.items.length;
		}
		
		//Returns the items array.
		getItems(): Item[] {
			return this.items;
		}
		
		//Goes through array and counts number of checked items.
		numberChecked(): number {
			return this.items.filter(function(item) {
				return item.checked;
			}).length;
		}
		
		//Removes an item from the list.
		remove(item: Item): void {
			var i = this.items.indexOf(item);
			this.items.splice(i, 1);
		}

		removeAll(): void {
			this.items = [];
		}

		//Removes all the checked items from the list.
		removeChecked(): void {
			this.items = this.items.filter(function(item) {
				return !item.checked;
			});
		}
	}
	
}