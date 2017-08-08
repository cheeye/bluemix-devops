module ShoppingList {
	
	export class Suggestion {
		name: string;
		id: number;
		reason: string;
		
		constructor(num, itemName, reason ) {
			this.name = itemName;
			this.id = num;
			this.reason = reason;
		}
		
	}
	
}