export const wonderTypography = {
  displayFont: 'var(--font-wonder-display), "Fraunces", Georgia, serif',
  bodyFont: 'var(--font-wonder-body), "Nunito", Arial, sans-serif',
  display: {
    hero: "clamp(2rem, 6vw, 3.5rem)",
    title: "clamp(1.65rem, 5vw, 2.5rem)",
    section: "clamp(1.25rem, 4vw, 1.75rem)",
  },
  body: {
    large: "1.125rem",
    base: "1rem",
    small: "0.875rem",
  },
} as const;
