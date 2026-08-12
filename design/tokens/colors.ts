export const wonderColors = {
  ink: "#10213D",
  oceanDeep: "#073B5C",
  ocean: "#66C7E8",
  oceanLight: "#DDF5FF",
  sky: "#EFFBFF",
  coral: "#FF8F7D",
  coralSoft: "#FFD5C9",
  sand: "#FFF5DF",
  cream: "#FFFDF7",
  sunshine: "#FFD878",
  seafoam: "#9EDBC6",
  lavender: "#B9BCEB",
  success: "#4FAF85",
  danger: "#D95C5C",
  white: "#FFFFFF",
} as const;

export type WonderColorName = keyof typeof wonderColors;
