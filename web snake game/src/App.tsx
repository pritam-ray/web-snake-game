import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Trophy,
  Zap,
} from 'lucide-react';

// Types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type PowerUp = {
  position: Position;
  type: 'speed' | 'points';
  duration: number;
};

// Constants
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 150;
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }];
const SPEED_BOOST_MULTIPLIER = 1.5;
const POINTS_MULTIPLIER = 2;

function App() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [powerUpActive, setPowerUpActive] = useState<'speed' | 'points' | null>(
    null
  );
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lastDirection, setLastDirection] = useState<Direction>('RIGHT');

  // Generate random position
  const generateRandomPosition = useCallback((): Position => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    return { x, y };
  }, []);

  // Generate food position
  const generateFood = useCallback((): Position => {
    let newPosition;
    do {
      newPosition = generateRandomPosition();
    } while (
      isCollision(newPosition) ||
      (powerUp &&
        newPosition.x === powerUp.position.x &&
        newPosition.y === powerUp.position.y)
    );
    return newPosition;
  }, []);

  // Generate power-up
  const generatePowerUp = useCallback(() => {
    if (Math.random() < 0.2) {
      const position = generateRandomPosition();
      const type = Math.random() < 0.5 ? 'speed' : 'points';
      setPowerUp({
        position,
        type,
        duration: 5000,
      });
    }
  }, []);

  // Check if position is occupied by snake
  const isCollision = (pos: Position): boolean => {
    return snake.some((segment) => segment.x === pos.x && segment.y === pos.y);
  };

  // Handle game over
  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  // Get segment rotation based on position
  const getSegmentRotation = (index: number): number => {
    if (index === 0) {
      switch (direction) {
        case 'UP':
          return 0;
        case 'RIGHT':
          return 90;
        case 'DOWN':
          return 180;
        case 'LEFT':
          return 270;
      }
    }

    const current = snake[index];
    const prev = snake[index - 1];
    const next = snake[index + 1];

    if (!next) return 0;

    if (prev.x < current.x && next.x > current.x) return 0;
    if (prev.x > current.x && next.x < current.x) return 0;
    if (prev.y < current.y && next.y > current.y) return 90;
    if (prev.y > current.y && next.y < current.y) return 90;

    return 45;
  };

  // Move snake
  const moveSnake = useCallback(() => {
    if (!isPlaying || gameOver) return;

    const head = snake[0];
    const newHead = { ...head };
    setLastDirection(direction);

    switch (direction) {
      case 'UP':
        newHead.y = (newHead.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'DOWN':
        newHead.y = (newHead.y + 1) % GRID_SIZE;
        break;
      case 'LEFT':
        newHead.x = (newHead.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'RIGHT':
        newHead.x = (newHead.x + 1) % GRID_SIZE;
        break;
    }

    if (isCollision(newHead)) {
      handleGameOver();
      return;
    }

    const newSnake = [newHead, ...snake];

    if (newHead.x === food.x && newHead.y === food.y) {
      const points = powerUpActive === 'points' ? 2 : 1;
      setScore((prev) => prev + points);
      setCombo((prev) => prev + 1);
      setFood(generateFood());
      generatePowerUp();
    } else {
      newSnake.pop();
      setCombo(0);
    }

    if (
      powerUp &&
      newHead.x === powerUp.position.x &&
      newHead.y === powerUp.position.y
    ) {
      setPowerUpActive(powerUp.type);
      setPowerUp(null);

      if (powerUp.type === 'speed') {
        setSpeed((prev) => prev / SPEED_BOOST_MULTIPLIER);
      }

      setTimeout(() => {
        setPowerUpActive(null);
        if (powerUp.type === 'speed') {
          setSpeed(INITIAL_SPEED);
        }
      }, powerUp.duration);
    }

    setSnake(newSnake);
  }, [snake, direction, food, isPlaying, powerUp, powerUpActive, gameOver]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPlaying((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection('RIGHT');
    setLastDirection('RIGHT');
    setScore(0);
    setCombo(0);
    setSpeed(INITIAL_SPEED);
    setPowerUp(null);
    setPowerUpActive(null);
    setGameOver(false);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            Snake Game
          </h1>
          <div className="flex gap-8 justify-center text-xl">
            <div className="flex items-center gap-2">
              <Trophy size={24} className="text-yellow-500" />
              <p>Score: {score}</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={24} className="text-purple-500" />
              <p>High Score: {highScore}</p>
            </div>
          </div>
          {combo > 1 && (
            <div className="mt-2 text-yellow-400 animate-pulse">
              Combo x{combo}!
            </div>
          )}
        </div>

        <div
          className="relative bg-gradient-to-br from-green-900/20 to-green-800/20 border-4 border-gray-700 rounded-lg shadow-2xl overflow-hidden"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 grid grid-cols-20 grid-rows-20">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div key={i} className="border border-green-900/10" />
            ))}
          </div>

          {/* Food */}
          <div
            className="absolute bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg animate-pulse"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
            }}
          />

          {/* Power-up */}
          {powerUp && (
            <div
              className={`absolute rounded-full animate-bounce shadow-lg ${
                powerUp.type === 'speed'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                  : 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              }`}
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: powerUp.position.x * CELL_SIZE,
                top: powerUp.position.y * CELL_SIZE,
                boxShadow:
                  powerUp.type === 'speed'
                    ? '0 0 15px rgba(59, 130, 246, 0.5)'
                    : '0 0 15px rgba(234, 179, 8, 0.5)',
              }}
            >
              {powerUp.type === 'speed' ? (
                <Zap size={16} className="m-1 text-white" />
              ) : (
                <Trophy size={16} className="m-1 text-white" />
              )}
            </div>
          )}

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute transition-all duration-75 ${
                powerUpActive ? 'animate-pulse' : ''
              }`}
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                transform: `rotate(${getSegmentRotation(index)}deg)`,
                borderRadius: index === 0 ? '8px' : '4px',
                background:
                  index === 0
                    ? 'linear-gradient(45deg, #15803d, #16a34a)'
                    : `linear-gradient(45deg, #22c55e, #15803d)`,
                boxShadow:
                  index === 0
                    ? '0 0 15px rgba(34, 197, 94, 0.3)'
                    : '0 0 5px rgba(34, 197, 94, 0.1)',
                border:
                  index === 0
                    ? '2px solid rgba(255,255,255,0.2)'
                    : '1px solid rgba(255,255,255,0.1)',
                backgroundImage:
                  index === 0
                    ? 'none'
                    : 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.1) 50%)',
                backgroundSize: '6px 6px',
              }}
            >
              {index === 0 && (
                <>
                  <div
                    className="absolute w-2 h-2 bg-white rounded-full top-1 left-1"
                    style={{ boxShadow: '0 0 5px rgba(255,255,255,0.5)' }}
                  />
                  <div
                    className="absolute w-2 h-2 bg-white rounded-full top-1 right-1"
                    style={{ boxShadow: '0 0 5px rgba(255,255,255,0.5)' }}
                  />
                </>
              )}
            </div>
          ))}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div />
            <button
              onClick={() =>
                !gameOver && direction !== 'DOWN' && setDirection('UP')
              }
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              <ArrowUp size={28} />
            </button>
            <div />
            <button
              onClick={() =>
                !gameOver && direction !== 'RIGHT' && setDirection('LEFT')
              }
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              <ArrowLeft size={28} />
            </button>
            <button
              onClick={() =>
                !gameOver && direction !== 'UP' && setDirection('DOWN')
              }
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              <ArrowDown size={28} />
            </button>
            <button
              onClick={() =>
                !gameOver && direction !== 'LEFT' && setDirection('RIGHT')
              }
              className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
            >
              <ArrowRight size={28} />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => !gameOver && setIsPlaying(!isPlaying)}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {powerUpActive && (
          <div
            className={`text-lg font-semibold ${
              powerUpActive === 'speed' ? 'text-blue-400' : 'text-yellow-400'
            } animate-pulse`}
          >
            {powerUpActive === 'speed' ? 'Speed Boost!' : 'Double Points!'}{' '}
            Active
          </div>
        )}

        <div className="text-sm text-gray-400 text-center">
          <p>Use arrow keys to control the snake</p>
          <p>Press spacebar to pause/resume</p>
          <p className="mt-2 text-blue-400">
            Collect power-ups for special abilities!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
