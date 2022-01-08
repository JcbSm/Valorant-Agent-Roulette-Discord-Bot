import { Gamemode } from "../lib/Gamemode";
import type { Customs } from "lib/Customs";

export default class extends Gamemode {
    constructor(customs: Customs) {
        super(customs, 'standard', 'Regular Valorant customs.')
    }

    run() {

        console.log("Running standard gamemode");
        console.log(this.customs.interaction.user.username, this.customs.players.size);
        return;

    }
}