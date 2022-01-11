import { Gamemode } from "../lib/Gamemode";
import type { Customs } from "lib/Customs";
import { ButtonInteraction, MessageActionRow, MessageAttachment, MessageEmbed, SelectMenuInteraction } from "discord.js";
import type { ValAgent } from "lib/ValAgent";
import type { Player } from "lib/Players";
import { colors } from "../constants.json";

export default class extends Gamemode {
    constructor(customs: Customs) {
        super(customs, 'blind pick', 'Pick an opponents agent for them.')
    }

    async run() {

        const defaultAgents: ValAgent[] = [...this.customs.agents].filter(a => a.default);
        const nonDefaultAgents: ValAgent[] = [...this.customs.agents].filter(a => !a.default);

        let picking = [];

        for (const [,player] of this.customs.players) {

            picking.push(new Promise(async (resolve) => {

                let sent = await player.user.send({ embeds: [ this.getAgentListEmbed(player) ], components: [
                    new MessageActionRow({
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'SELECT_MENU',
                                customId: 'agentSelectMenu',
                                maxValues: nonDefaultAgents.length,
                                minValues: 0,
                                placeholder: 'Select available agents',
                                options: nonDefaultAgents.map(a => {
    
                                    return {
                                        label: a.name,
                                        value: a.name,
                                        emoji: a.emoji
                                    }
    
                                })
                            }
                        ]
                    }),
                    new MessageActionRow({
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                customId: 'agentConfirm',
                                label: 'CONFIRM',
                                style: 'DANGER'
                            },
                            {
                                type: 'BUTTON',
                                customId: 'agentReset',
                                label: 'RESET',
                                style: 'SECONDARY'
                            }
                        ]
                    })
                ]});
    
                const collector = sent.createMessageComponentCollector({ time: 60*1000 });
    
                collector.on('collect', (interaction: SelectMenuInteraction | ButtonInteraction) => {
    
                    if (interaction.isButton()) {
    
                        switch (interaction.customId) {
    
                            case 'agentReset':
                                player.agents = [...defaultAgents];
                                break;
    
                            case 'agentConfirm':
                                interaction.update({ embeds: [this.getAgentListEmbed(player, true)], components: [] });
                                collector.stop();
                                return;
    
                        }
    
                    } else if (interaction.isSelectMenu()) {
    
                        player.agents = [...defaultAgents].concat(...[...nonDefaultAgents].filter(a => interaction.values.includes(a.name)));
    
                    }
    
                    interaction.update({ embeds: [ this.getAgentListEmbed(player) ]});
    
                });
    
                collector.on('end', async () => {
                    await sent.edit({ embeds: [ this.getAgentListEmbed(player, true) ], components: [] });
                    console.log(player.user.username + ' has chosen.')
                    resolve(null);
                })

            }));

        }

        await Promise.all(picking);
        setTimeout(() => this.agentSelection(), 5000);

    }

    async agentSelection() {

        let selected: ValAgent[][] = [[], []];

        let shuffledPlayers = [...this.customs.players.values()]
            .map(player => ({ player, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({player}) => player);

        for (const [ ,player] of this.customs.players) {

            player.selectionMessage = await player.user.send({ embeds: [{
                title: 'AGENT SELECT',
                description: `Starting...`,
                color: colors.valRed
            }]})!

        }

        for (let i = 0; i < this.customs.players.size; i++) {

            const pickingPlayer = [...this.customs.players.values()][i];

            let index = shuffledPlayers.findIndex(p => p.user.id === pickingPlayer.user.id);
            let targetIndex = index + 1 < shuffledPlayers.length ? index + 1 : 0;
            let targetPlayer = shuffledPlayers[targetIndex];

            //console.log(`${pickingPlayer.user.tag} picking for ${targetPlayer.user.tag}`);
            
            const pickable = this.getPickableAgents(selected, targetPlayer);

            let sent = [];
            // Messages
            for (const [,player] of this.customs.players) {

                sent.push(new Promise(async (resolve) => {
                    
                    // Picking player message
                    if (player.user.id === pickingPlayer.user.id) {
                        
                        await player.selectionMessage.edit({ embeds: [ this.getWaitingEmbed(pickingPlayer) ], components: [{
                            type: 'ACTION_ROW',
                            components: [
                                {
                                    type: 'SELECT_MENU',
                                    maxValues: 1,
                                    minValues: 1,
                                    customId: 'agentSelect',
                                    placeholder: "Pick an agent.",
                                    options: pickable.map(a => {
                                        return {
                                            label: a.name,
                                            value: a.name,
                                            emoji: a.emoji
                                        }
                                    })
                                }
                            ]
                        }] })

                    } else {

                        await player.selectionMessage.edit({ embeds: [ this.getWaitingEmbed(pickingPlayer) ] })

                    }

                    resolve(player.selectionMessage);

                }))

            }

            // wait for all messages to be edited
            await Promise.all(sent);

            const selection = await pickingPlayer.selectionMessage.awaitMessageComponent({ componentType: 'SELECT_MENU', time: 25*1000}).catch(() => undefined);
            selection ? await selection.update({ components: [] }) : await pickingPlayer.selectionMessage.edit({ components: [] });;

            const picked = selection?.values[0] ? pickable.find(a => a.name === selection.values[0])! : pickable[Math.floor(Math.random()*pickable.length)];

            targetPlayer.selectedAgent = picked;
            targetPlayer.selectedBy = pickingPlayer;
            selected[targetPlayer.team].push(picked);

        }

        await this.updateCustomsMessage();

        for (const [, player] of this.customs.players) {

            
            const agentFileName = player.selectedAgent.name.replace(/\//gi, '').toLowerCase();

            player.selectionMessage.edit({
                embeds: [
                    {
                        title: player.selectedAgent.name,
                        description: `Chosen by \`${player.selectedBy.user.tag}\`\n\n[\`Back to server...\`](${this.customs.message.url})`,
                        thumbnail: {
                            url: `attachment://${agentFileName}.png`
                        },
                        color: colors.valRed
                    }
                ],
                files: [ new MessageAttachment(`./src/assets/agents/${agentFileName}.png`, `${agentFileName}.png`)],
            })

        }

    }

    async updateCustomsMessage() {

        await this.customs.message.edit({ embeds: [
            new MessageEmbed({
                title: 'CUSTOMS',
                description: `Leader: <@${this.customs.interaction.user.id}>\nPlayers: \`${this.customs.players.size}/10\`\n\u200b`,
                fields: [
                    {
                        name: 'TEAM 1',
                        value: '\u200b\n' + this.getTeam1List() + '\n\u200b',
                        inline: true
                    },
                    {
                        name: '\u200b',
                        value: '\u200b',
                        inline: true
                    },
                    {
                        name: 'TEAM 2',
                        value: '\u200b\n' + this.getTeam2List() + '\n\u200b',
                        inline: true
                    },
                    {
                        name: 'CURRENT MAP',
                        value: this.customs.map.name
                    }
                ],
                color: colors.valRed,
                image: {
                    url: `attachment://${this.customs.map.name}.png`
                }
            })
        ]})

    }

    getTeam1List(): string {

        return [...this.customs.players.values()].filter(p => p.team === 0).map((p: Player) => `**${p.selectedAgent.name}**\n${this.customs.client.emojis.resolve(p.selectedAgent.emojiID)} <@${p.user.id}>\n\u200b`).join('\n');

    }

    getTeam2List(): string {

        return [...this.customs.players.values()].filter(p => p.team === 1).map((p: Player) => `**${p.selectedAgent.name}**\n${this.customs.client.emojis.resolve(p.selectedAgent.emojiID)} <@${p.user.id}>\n\u200b`).join('\n');

    }

    getPickableAgents(selected: ValAgent[][], player: Player): ValAgent[] {

        return player.agents.filter(a => !selected[player.team].includes(a))

    }

    getWaitingEmbed(pickingPlayer: Player) {

        return new MessageEmbed({
            title: 'AGENT SELECT',
            description: `Waiting on \`${pickingPlayer.user.tag}\` to select an agent for someone.`,
            color: colors.valRed,
        })

    }

    getAgentListEmbed(player: Player, confirmed: boolean = false) {
        return confirmed ? {
            title: 'Selected Agents',
            description: player.agents.map(a => `${this.customs.client.emojis.resolve(a.emojiID)} - **${a.name}**`).join('\n'),
            color: colors.valDarkGrey
        } : {
            title: 'Available Agents',
            description: `${player.agents.map(a => `${this.customs.client.emojis.resolve(a.emojiID)} - **${a.name}**`).join('\n')}\n\nPlease select which others you own below. (No lying!)`,
            color: colors.valDarkGrey
        }
    }

}