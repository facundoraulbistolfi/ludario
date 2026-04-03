import { buildMoveSegments, getTokenFacing, IDLE_TOKEN_FACING, PCFG, SAFE, stepsFromStart } from "./board";
import type { ExecuteMoveResult, GameMode, RouletteSection, Token, TokenMap } from "./types";

const DIVERTIDO_WEIGHTS = [1, 2, 3, 4, 5, 6] as const;
const HARDCORE_WEIGHTS = [1, 2, 3, 5, 8, 12] as const;
const GHOST_CHANCE: Record<"divertido" | "hardcore", number> = { divertido: 20, hardcore: 15 };

export const SECTION_COLORS = ["#2121DE", "#FF0000", "#00FFFF", "#FFB8FF", "#FF7722", "#FFE000"];

export function cloneTokens(tokens: TokenMap): TokenMap {
  const next: TokenMap = {};
  for (const key in tokens) {
    next[key] = tokens[key].map((token: Token) => ({ ...token }));
  }
  return next;
}

export function createTokens(playerCount: number): TokenMap {
  const tokens: TokenMap = {};
  for (let player = 0; player < playerCount; player += 1) {
    tokens[player] = [0, 1, 2, 3].map((baseSlot) => ({
      id: `${player}-${baseSlot}`,
      state: "base" as const,
      pathIdx: -1,
      homeIdx: -1,
      baseSlot,
      facing: IDLE_TOKEN_FACING,
    }));
  }
  return tokens;
}

export function canTokenMove(token: Token, pid: number, dice: number): boolean {
  if (token.state === "finished") return false;
  if (token.state === "base") return dice === 6;
  if (token.state === "path") return stepsFromStart(pid, token.pathIdx) + dice <= 57;
  return token.homeIdx + dice <= 5;
}

export function allInBase(playerTokens: Token[]): boolean {
  return playerTokens.every((token) => token.state === "base");
}

export function isSweating(token: Token, pid: number, allTokens: TokenMap, playerCount: number): boolean {
  if (token.state !== "path") return false;
  const behindIdx = (token.pathIdx + 51) % 52;
  for (let player = 0; player < playerCount; player += 1) {
    if (player === pid) continue;
    if ((allTokens[player] || []).some((other) => other.state === "path" && other.pathIdx === behindIdx)) {
      return true;
    }
  }
  return false;
}

export function getRouletteConfig(mode: GameMode, isAllBase: boolean): RouletteSection[] {
  if (isAllBase) {
    const ghostWeight = GHOST_CHANCE[mode === "hardcore" ? "hardcore" : "divertido"];
    return [
      { value: 6, label: "👻", weight: ghostWeight, color: "#00FF88" },
      { value: 0, label: "✕", weight: 100 - ghostWeight, color: "#330011" },
    ];
  }

  const weights = mode === "hardcore" ? HARDCORE_WEIGHTS : DIVERTIDO_WEIGHTS;
  return [6, 5, 4, 3, 2, 1].map((value, index) => ({
    value,
    label: String(value),
    weight: weights[index],
    color: SECTION_COLORS[index],
  }));
}

export function resolveRouletteAngle(angle: number, sections: RouletteSection[]): number {
  const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
  const normalized = ((360 - (angle % 360)) % 360 + 360) % 360;
  let cumulative = 0;

  for (const section of sections) {
    cumulative += (section.weight / totalWeight) * 360;
    if (normalized < cumulative) return section.value;
  }

  return sections[sections.length - 1]?.value ?? 1;
}

export function executeMove(allTokens: TokenMap, pid: number, tokenId: string, dice: number, playerCount: number): ExecuteMoveResult {
  const nextTokens = cloneTokens(allTokens);
  const tokenIndex = nextTokens[pid].findIndex((token) => token.id === tokenId);
  const token = nextTokens[pid][tokenIndex];
  const segments = buildMoveSegments(token, pid, dice);
  const capturedTokenIds: string[] = [];

  if (token.state === "base" && dice === 6) {
    token.state = "path";
    token.pathIdx = PCFG[pid].startIdx;
    token.homeIdx = -1;
  } else if (token.state === "path") {
    const totalSteps = stepsFromStart(pid, token.pathIdx) + dice;
    if (totalSteps <= 51) {
      token.pathIdx = (PCFG[pid].startIdx + totalSteps - 1) % 52;
    } else {
      const homeIdx = totalSteps - 52;
      token.pathIdx = -1;
      if (homeIdx >= 5) {
        token.state = "finished";
        token.homeIdx = 5;
      } else {
        token.state = "home";
        token.homeIdx = homeIdx;
      }
    }
  } else if (token.state === "home") {
    token.homeIdx += dice;
    if (token.homeIdx >= 5) {
      token.homeIdx = 5;
      token.state = "finished";
    }
  }

  token.facing = token.state === "base" || token.state === "finished"
    ? IDLE_TOKEN_FACING
    : segments[segments.length - 1]?.facing ?? getTokenFacing(token, pid);

  let captured = false;
  if (token.state === "path" && !SAFE.has(token.pathIdx)) {
    for (let player = 0; player < playerCount; player += 1) {
      if (player === pid) continue;
      nextTokens[player].forEach((other) => {
        if (other.state === "path" && other.pathIdx === token.pathIdx) {
          other.state = "base";
          other.pathIdx = -1;
          other.homeIdx = -1;
          other.facing = IDLE_TOKEN_FACING;
          captured = true;
          capturedTokenIds.push(other.id);
        }
      });
    }
  }

  const finished = nextTokens[pid].every((piece) => piece.state === "finished");
  return { tokens: nextTokens, captured, capturedTokenIds, finished, segments };
}
