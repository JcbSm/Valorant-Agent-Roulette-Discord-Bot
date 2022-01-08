export interface ValAgent {

    name: string;
    default: boolean;
    emoji: string;

}

export class ValAgent {

    constructor(name: string, emoji: string, isDefault: boolean = false) {

        this.name = name;
        this.default = isDefault;
        this.emoji = emoji;

    }

}