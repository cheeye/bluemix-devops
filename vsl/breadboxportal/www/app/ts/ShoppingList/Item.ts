module ShoppingList {

	export class Item {
		name: string;
		checked: boolean;
		image: string;
		decoration: string;
		constructor(obj, name) {
			if (obj && obj.name) {
				this.name = obj.name;
			}
			else if (name) {
				this.name = name;
			}
			if (obj && obj.checked) {
				this.checked = obj.checked;
			}
			if (obj && obj.image) {
				this.image = obj.image;
			}
			this.decoration = this.getDecoration();
		}
		
		//Returns whether the item should be striked through.
		getDecoration(): string {
			if (this.checked) {
				return "line-through";
			}
			else {
				return "none";
			}
		}

		compress(): Object {
			return { "name": this.name, "checked": this.checked, "image": this.image };
		}
	}

}