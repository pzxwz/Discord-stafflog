require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SlashCommandBuilder, REST, Routes } = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
    new SlashCommandBuilder()
        .setName("stafflog")
        .setDescription("Registra uma ação de staff log")
        .addUserOption(option => 
            option.setName("membro")
                .setDescription("Membro a ser registrado")
                .setRequired(true))
        .addRoleOption(option => 
            option.setName("cargo")
                .setDescription("Cargo do membro")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("ação")
                .setDescription("Tipo de ação")
                .setRequired(true)
                .addChoices(
                    { name: "Entrou na equipe", value: "entrou" },
                    { name: "Foi promovido", value: "promovido" },
                    { name: "Foi removido", value: "removido" },
                    { name: "Saiu da equipe", value: "saiu" }
                )
        )
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
    console.log(`Logado como ${client.user.tag}`);

    try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
    } catch (error) {
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === "stafflog") {
        const member = interaction.options.getUser("membro");
        const role = interaction.options.getRole("cargo");
        const action = interaction.options.getString("acao");

        // Verifica se o usuário tem o cargo permitido
        if (!interaction.member.roles.cache.has(process.env.ROLE_ID)) {
            return interaction.reply({ content: "❌ Você não tem permissão para usar este comando!", ephemeral: true });
        }

        const logChannel = interaction.guild.channels.cache.get(process.env.STAFF_LOG_CHANNEL_ID);
        if (!logChannel) {
            return interaction.reply({ content: "❌ Canal de logs não encontrado!", ephemeral: true });
        }

        let embed = new EmbedBuilder();

        switch (action) {
            case "entrou":
                embed.setColor("Blue").setDescription(`📥 | O membro ${member} ingressou na equipe como ${role}`);
                break;
            case "promovido":
                embed.setColor("Green").setDescription(`📥 | O membro ${member} foi promovido para ${role}`);
                break;
            case "removido":
                embed.setColor("Red").setDescription(`📤 | O membro ${member} foi removido da equipe com o cargo ${role}`);
                break;
            case "saiu":
                embed.setColor("Red").setDescription(`📤 | O membro ${member} saiu da equipe com o cargo ${role}`);
                break;
        }

        await logChannel.send({ embeds: [embed] });
        await interaction.reply({ content: "✅ Staff-log registrada com sucesso!", ephemeral: true });
    }
});

client.login(process.env.TOKEN);
