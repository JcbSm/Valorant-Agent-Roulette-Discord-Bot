import type { AgentRoulette } from "#lib/agent-roulette/AgentRoulette";
import { SapphireClient, LogLevel } from "@sapphire/framework";
import { GatewayIntentBits, type Snowflake } from "discord.js";

export interface BotClient {
    games: Map<Snowflake, AgentRoulette>
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