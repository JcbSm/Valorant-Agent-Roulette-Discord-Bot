import type { Snowflake } from "discord.js";
import type { Player } from "./Players";

export interface AgentRoulette {
    players: Player[];
    messageID: Snowflake;
}

export class AgentRoulette {

}