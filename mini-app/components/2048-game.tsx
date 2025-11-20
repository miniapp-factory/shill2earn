"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < TILE_VALUES.length; i++) {
    cumulative += TILE_PROBABILITIES[i];
    if (rand < cumulative) return TILE_VALUES[i];
  }
  return TILE_VALUES[0];
}

function cloneGrid(grid: number[][]) {
  return grid.map(row => [...row]);
}

export function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Add a random tile to an empty spot
  const addRandomTile = (g: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = getRandomTile();
    return g;
  };

  // Initialize board with two tiles
  useEffect(() => {
    let g = cloneGrid(grid);
    g = addRandomTile(g);
    g = addRandomTile(g);
    setGrid(g);
  }, []);

  // Move logic
  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let moved = false;
    let newGrid = cloneGrid(grid);
    let newScore = score;

    const combine = (tiles: number[]) => {
      const result: number[] = [];
      let skip = false;
      for (let i = 0; i < tiles.length; i++) {
        if (skip) {
          skip = false;
          continue;
        }
        if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
          result.push(tiles[i] * 2);
          newScore += tiles[i] * 2;
          skip = true;
          moved = true;
        } else {
          result.push(tiles[i]);
        }
      }
      while (result.length < GRID_SIZE) result.push(0);
      return result;
    };

    for (let i = 0; i < GRID_SIZE; i++) {
      let line: number[];
      if (direction === "left" || direction === "right") {
        line = newGrid[i];
        if (direction === "right") line = [...line].reverse();
        const merged = combine(line);
        if (direction === "right") merged.reverse();
        newGrid[i] = merged;
      } else {
        line = newGrid.map(row => row[i]);
        if (direction === "down") line = [...line].reverse();
        const merged = combine(line);
        if (direction === "down") merged.reverse();
        for (let r = 0; r < GRID_SIZE; r++) newGrid[r][i] = merged[r];
      }
    }

    // Check if any tile moved
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] !== grid[r][c]) moved = true;
      }
    }

    if (!moved) return;

    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(newScore);

    // Check win
    if (newGrid.flat().includes(2048)) setWon(true);

    // Check game over
    const hasEmpty = newGrid.flat().some(v => v === 0);
    const canMerge = () => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
          if (newGrid[r][c] === newGrid[r][c + 1]) return true;
        }
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 1; r++) {
          if (newGrid[r][c] === newGrid[r + 1][c]) return true;
        }
      }
      return false;
    };
    if (!hasEmpty && !canMerge()) setGameOver(true);
  };

  const handleKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        move("up");
        break;
      case "ArrowDown":
        move("down");
        break;
      case "ArrowLeft":
        move("left");
        break;
      case "ArrowRight":
        move("right");
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grid, score, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">2048</h1>
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((value, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-12 w-12 rounded-md text-xl font-semibold ${
              value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {value || ""}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move("up")}>↑</Button>
        <Button onClick={() => move("left")}>←</Button>
        <Button onClick={() => move("right")}>→</Button>
        <Button onClick={() => move("down")}>↓</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <Share
          text={`I scored ${score} in 2048! ${url}`}
          className="mt-4"
        />
      )}
      {won && <div className="text-xl font-bold mt-2">You won!</div>}
    </div>
  );
}
