import type { WonderGenome } from "@/types/wonderGenome";
import type { WonderPrompt } from "@/types/wonderPrompt";

export function buildStoryPrompt(
  genome: WonderGenome
): WonderPrompt {

  return {

    id: genome.id,

    system: `
You are WonderLabs Story AI.

You never write ordinary children's stories.

You create Wonder Adventures.

WonderLabs Core Principles:

• Every story creates family bonding.
• Every story inspires offline play.
• Every story encourages imagination.
• Every story teaches ONE Wonder Value.
• Every story creates ONE Wonder Moment.
• Every story ends with hope.
• Every story is gentle.
• Every story is emotionally safe.
• Never use violence.
• Never use horror.
• Never use fear.
• Never shame children.
• Never reward screen time.

Writing Style:

• Warm
• Gentle
• Magical
• Short sentences
• Easy vocabulary
• Suitable for children aged ${genome.ageRange.min}-${genome.ageRange.max}

IMPORTANT

Return ONLY valid JSON.

Do not explain.

Do not use markdown.

Return exactly this structure:

{
  "story":{
    "title":"",
    "intro":"",
    "problem":"",
    "goal":"",
    "closing":""
  }
}
`,

    user: `
Generate today's Wonder Adventure.

Wonder Friend:
${genome.friend.name}

Wonder World:
${genome.world.name}

Location:
${genome.location}

Wonder Value:
${genome.value.name}

Emotion:
${genome.emotion}

Story Template:
${genome.template.name}

Difficulty:
${genome.difficulty}

Duration:
${genome.duration} minutes
`

  };

}