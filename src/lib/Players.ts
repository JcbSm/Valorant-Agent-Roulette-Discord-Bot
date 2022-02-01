import type { Message, User } from "discord.js";
import type { ValAgent } from "./ValAgent";

export interface Player {
    user: User;
    team: number;
    agents: Map<String, ValAgent>;
    selectionMessage: Message;
    selectedAgent: ValAgent;
    selectedBy: Player;
}

export class Player {
    
    constructor(user: User, team: 0 | 1, agents: ValAgent[]) {

        this.user = user;
        this.team = team;
        this.agents = new Map(agents.map(a => [a.name, a]));

    }
}