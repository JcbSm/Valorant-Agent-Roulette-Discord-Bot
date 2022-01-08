import type { Customs } from "./Customs";

export interface Gamemode {
    customs: Customs;
    name: string;
    description: string;
}

export abstract class Gamemode {

    constructor (customs: Customs, name: string, description: string) {

        this.customs = customs;

        this.name = name;
        this.description = description;

    }

    abstract run(): any

}