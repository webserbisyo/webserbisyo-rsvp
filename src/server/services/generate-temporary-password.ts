import "server-only";

import { randomInt } from "node:crypto";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+?";
const ALL = `${UPPER}${LOWER}${DIGITS}${SYMBOLS}`;

export function generateTemporaryPassword(length = 16) {
  const targetLength = Math.max(length, 12);
  const requiredSets = [UPPER, LOWER, DIGITS, SYMBOLS];
  const characters = requiredSets.map((set) => pick(set));

  while (characters.length < targetLength) {
    characters.push(pick(ALL));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

function pick(characters: string) {
  return characters[randomInt(characters.length)];
}
