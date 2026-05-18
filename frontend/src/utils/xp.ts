export const getLevelFromXp = (xp: number): number => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  
  // Exponential scaling for Level 6+ (2000, 4000, 8000...)
  let level = 6;
  let threshold = 2000;
  while (xp >= threshold * 2) {
    level++;
    threshold *= 2;
  }
  return level;
};

export const getXpThresholdForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 500;
  if (level === 5) return 1000;
  if (level === 6) return 2000;
  
  // L7+ thresholds double each time
  return 2000 * Math.pow(2, level - 6);
};

export const getXpProgressPercentage = (xp: number, currentLevel: number): number => {
  const currentThreshold = getXpThresholdForLevel(currentLevel);
  const nextThreshold = getXpThresholdForLevel(currentLevel + 1);
  const xpNeededForNext = nextThreshold - currentThreshold;
  const xpEarnedInLevel = xp - currentThreshold;
  
  if (xpNeededForNext <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((xpEarnedInLevel / xpNeededForNext) * 100)));
};

export const getLevelTitle = (level: number): string => {
  if (level <= 1) return 'Starter';
  if (level === 2) return 'Consistent';
  if (level === 3) return 'Momentum Builder';
  if (level === 4) return 'Flow State';
  if (level === 5) return 'Unstoppable';
  return 'Legend';
};
