import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { ChatInputCommand } from "@sapphire/framework"

// Set name and desc
@ApplyOptions<Command.Options>({
    name: 'start',
    description: 'Start Agent Roullette'
})

export default class extends Command {
    public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
        registry.registerChatInputCommand(
            (command) => command
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        
        // If no guild, exit
        if (!interaction.guild) return;

        await interaction.deferReply({ ephemeral: true });

        await interaction.editReply({ content: 'Hello World!' })
    }
}