// Organized color palettes by category - Dark to Light progression
export const COLOR_CATEGORIES = {
  blacks: {
    label: "سیاه و خاکستری",
    colors: ["#000000", "#1a1a1a", "#333333", "#4d4d4d", "#666666", "#808080", "#999999", "#b3b3b3", "#cccccc", "#e6e6e6", "#f2f2f2", "#ffffff"],
  },
  reds: {
    label: "قرمز",
    colors: ["#5c0a1a", "#7c1d2d", "#9c2d3d", "#c93e4d", "#e85a6a", "#f47a8a", "#f99aaa", "#fcbacf", "#fdd5e0"],
  },
  pinks: {
    label: "صورتی",
    colors: ["#6d1b3d", "#8d2b4d", "#ad4566", "#c95a7d", "#e67a9a", "#f5a3bd", "#fcc5dd", "#fdd5e0"],
  },
  oranges: {
    label: "نارنجی",
    colors: ["#6d2e0f", "#8d4020", "#ad5530", "#ce7043", "#f59a5f", "#fb9c64", "#fdb97a", "#fdd0a0"],
  },
  yellows: {
    label: "زرد",
    colors: ["#664d0f", "#876620", "#a87d30", "#d4a442", "#f0c259", "#f5d775", "#fae08e"],
  },
  limes: {
    label: "سبز فسفری",
    colors: ["#3d5d1f", "#527d2f", "#6b9d42", "#8fbf55", "#aed572", "#cde89e"],
  },
  greens: {
    label: "سبز",
    colors: ["#1d4d2d", "#2d6d3d", "#3d8d4d", "#52b35d", "#6dc76d", "#8fd988", "#b0e5aa"],
  },
  teals: {
    label: "فیروزه‌ای",
    colors: ["#0d4d4d", "#1d6d6d", "#2d8d8d", "#4aadad", "#6ababa", "#8dc7c7", "#b0d9d9"],
  },
  cyans: {
    label: "سیان",
    colors: ["#0a3f5e", "#1d6d8f", "#3a9abc", "#5ab3d3", "#7bcae0", "#9dd9e8", "#bde8f0"],
  },
  blues: {
    label: "آبی",
    colors: ["#1a3a6d", "#2d5a9d", "#4080c4", "#6aacf0", "#8ac5f5", "#aaddfa", "#d0eafd"],
  },
  indigos: {
    label: "آبی‌تیره",
    colors: ["#2d1f5d", "#4a3a8d", "#6a5aad", "#8a7acf", "#a89ae0", "#c8baef", "#ddd5f7"],
  },
  purples: {
    label: "بنفش",
    colors: ["#4a1d6d", "#6a2d8d", "#8a4daa", "#ad6ac7", "#c98ae0", "#dea8f0", "#ebcff7"],
  },
  magentas: {
    label: "سرخابی",
    colors: ["#6d1a5a", "#8d2d75", "#ad4590", "#d056ba", "#e875d5", "#f5a0e8"],
  },
  browns: {
    label: "قهوه‌ای",
    colors: ["#3d2819", "#5d3d2d", "#7d5742", "#9d7560", "#be997e", "#d4b9a3", "#e8d4c8"],
  },
};

export const QUICK_COLORS = Object.values(COLOR_CATEGORIES).flatMap((cat) => cat.colors);
