import { SapphireClient, LogLevel } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

export interface BotClient {

}

export class BotClient extends SapphireClient {
    constructor() {
        super({
            intents: [ GatewayIntentBits.Guilds ],
            partials: [],
            logger: { level: LogLevel.Debug }
        });
    }
}