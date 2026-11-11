import { CustomCommandMetadata } from "@/types/commands";
import { createFailEmbed } from "@/utils/embeds";
import kv_default from "@/utils/kv";
import {
  ChatInputCommand,
  CommandData,
  Label,
  MessageCommand,
  Modal,
  OnModalKitSubmit,
  TextDisplay,
  TextInput,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  TextInputStyle,
} from "discord.js";
import util from "node:util";

const kv = kv_default;
void kv;

export const command: CommandData = {
  name: "eval",
  description: "Evaluate code",
  options: [
    {
      name: "force",
      description: "Omit some safeguards",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
};

// Dangerous keywords; omitted by using force
const dangerous = [
  "token",
  "destroy",
  "delete",
  "kick",
  "ban",
  "fs",
  "child_process",
];

// Banned keywords; force doesn't omit
const banned = ["env"];

// Fails if any of these are found in the eval's result
const tokens = [
  process.env.TOKEN,
  process.env.API_TOKEN,
  // client.token added in functions below
];

export const message: MessageCommand = async (ctx) => {
  const { message, client } = ctx;

  const msg = message;
  void msg;

  const args = ctx.args();

  if (!message.inGuild()) {
    return;
  }

  const [force, code] =
    args[0] === "--force" ?
      [true, args.slice(1).join(" ")]
    : [false, args.join(" ")];

  if (!code) {
    await message.reply({
      embeds: [createFailEmbed("No code provided")],
    });
    return;
  }

  if (dangerous.some((word) => code.includes(word)) && !force) {
    await message.reply({
      embeds: [createFailEmbed("Dangerous code detected")],
    });
    return;
  }

  if (banned.some((word) => code.includes(word))) {
    await message.reply({
      embeds: [createFailEmbed("Banned code detected")],
    });
    return;
  }

  try {
    const start = performance.now();
    let result = await eval(code);
    const end = performance.now();

    if (typeof result !== "string") {
      result = util.inspect(result, { depth: 1 });
    }
    if (typeof result !== "string") {
      throw "I have no idea how the hell this happened";
    }

    if (
      tokens.concat([client.token!]).some((w) => {
        if (w) {
          return result.includes(w);
        } else {
          return false;
        }
      })
    ) {
      throw "Token found in the eval result";
    }

    const embed = new EmbedBuilder()
      .setTitle("🧪 Eval Result")
      .setColor(0x00ff99)
      .addFields(
        {
          name: "📥 Input",
          value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\``,
        },
        {
          name: "📤 Output",
          value: `\`\`\`js\n${result.slice(0, 1000).replaceAll("`", "\\`")}\n\`\`\``,
        },
        { name: "⏱️ Time", value: `${(end - start).toFixed(2)}ms` },
      );

    message.reply({ embeds: [embed] });

    // eval's error can be one of many types, any doesn't matter here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const errorEmbed = new EmbedBuilder()
      .setTitle("❌ Eval Error")
      .setColor(0xff3333)
      .setDescription(`\`\`\`js\n${err?.message ?? err}\n\`\`\``);

    // If it was to fail for some reason we don't want the bot to crash
    message.reply({ embeds: [errorEmbed] }).catch(() => null);
  }
};

export const chatInput: ChatInputCommand = async (ctx) => {
  const { interaction, client } = ctx;

  if (!interaction.inCachedGuild()) {
    return;
  }

  const force = interaction.options.getBoolean("force");

  // Callback for the modal below
  const callback: OnModalKitSubmit = async (int, modCtx) => {
    await int.deferReply();
    const code = int.fields.getTextInputValue("eval-code");
    void modCtx;

    if (dangerous.some((word) => code.includes(word)) && !force) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Eval Error")
        .setColor(0xff3333)
        .setDescription("Dangerous code detected")
        .addFields({
          name: "📥 Input",
          value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\``,
        });

      await int.editReply({ embeds: [errorEmbed] });
      return;
    }

    if (banned.some((word) => code.includes(word))) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Eval Error")
        .setColor(0xff3333)
        .setDescription("Banned code detected")
        .addFields({
          name: "📥 Input",
          value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\``,
        });

      await int.editReply({ embeds: [errorEmbed] });
      return;
    }

    try {
      const start = performance.now();
      let result = await eval(code);
      const end = performance.now();

      if (typeof result !== "string") {
        result = util.inspect(result, { depth: 1 });
      }
      if (typeof result !== "string") {
        throw "I have no idea how the hell this happened";
      }

      if (
        tokens.concat([client.token!]).some((w) => {
          if (w) {
            return result.includes(w);
          } else {
            return false;
          }
        })
      ) {
        throw "Token found in the eval result";
      }

      const embed = new EmbedBuilder()
        .setTitle("🧪 Eval Result")
        .setColor(0x00ff99)
        .setDescription(`📥 Input\n\`\`\`js\n${code.slice(0, 4000)}\n\`\`\``)
        .addFields(
          {
            name: "📤 Output",
            value: `\`\`\`js\n${result.slice(0, 1000).replaceAll("`", "\\`")}\`\`\``,
          },
          { name: "⏱️ Time", value: `${(end - start).toFixed(2)}ms` },
        );

      await int.editReply({ embeds: [embed] }).catch(() => null);

      // eval's error can be one of many types, any doesn't matter here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Eval Error")
        .setColor(0xff3333)
        .setDescription(`\`\`\`js\n${err?.message ?? err}\n\`\`\``)
        .addFields({
          name: "📥 Input",
          value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\``,
        });

      // If it was to fail for some reason we don't want the bot to crash
      await int.editReply({ embeds: [errorEmbed] }).catch(() => null);
    }
  };

  const modal = (
    <Modal
      customId={`eval-${interaction.user.id}`}
      title="Evaluate code"
      onSubmit={callback}
    >
      <TextDisplay>
        Variables: interaction (command interaction); int (modal interaction);
        ctx, modCtx (context; modal context)
      </TextDisplay>
      <Label label="Code">
        <TextInput style={TextInputStyle.Paragraph} customId="eval-code" />
      </Label>
    </Modal>
  );

  await interaction.showModal(modal);
};

export const metadata: CustomCommandMetadata = {
  aliases: ["e", "eval"],
};
