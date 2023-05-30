import type { Message, User } from "discord.js";
import type { Agent } from "./Agent";

export interface Player {
    user: User;
    team: number;
    agents: Map<String, Agent>;
    selectionMessage: Message;
    selectedAgent: Agent;
    selectedBy: Player;
}

export class Player {
    
    constructor(user: User, team: 0 | 1, agents: Agent[]) {

        this.user = user;
        this.team = team;
        this.agents = new Map(agents.map(a => [a.name, a]));

    }
}