import type { Snowflake } from "discord.js";

export interface Agent {

    name: string;
    default: boolean;
    emoji: string;
    emojiID: Snowflake;

}

export class Agent {

    constructor(name: string, emoji: string, emojiID: Snowflake, isDefault: boolean = false) {

        this.name = name;
        this.default = isDefault;
        this.emoji = emoji;
        this.emojiID = emojiID;

    }

}