export interface WonderMoment {

  id: string;

  genomeId: string;

  storyId: string;

  createdAt: string;

  title: string;

  description: string;

  familyReflection: string;

  emotion:

    | "happy"
    | "excited"
    | "curious"
    | "kind"
    | "brave"
    | "creative";

  photoUrl?: string;

  tags: string[];

}