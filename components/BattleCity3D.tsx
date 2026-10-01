// components/BattleCity3D.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { BattleCityHandle, BattleCityParams } from '@/games/battle-city-3d';

const DEFAULT_PARAMS: BattleCityParams = {
    moveSpeed: 4.5,
};

const PLAYER_MAX_HP = 4;
const MAX_ENEMIES = 7;

export default function BattleCity3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<BattleCityHandle | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
    const [enemyAlive, setEnemyAlive] = useState(0);
    const [enemyTotal, setEnemyTotal] = useState(MAX_ENEMIES);
    const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null);
    const [restartKey, setRestartKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPlayerHp(PLAYER_MAX_HP);
        setEnemyAlive(0);
        setEnemyTotal(MAX_ENEMIES);
        setGameOver(null);

        (async () => {
            if (!containerRef.current) return;
            try {
                const mod = await import('@/games/battle-city-3d');
                if (cancelled || !containerRef.current) return;

                const { ready } = mod.initBattleCity(
                    containerRef.current,
                    DEFAULT_PARAMS,
                    {
                        onPlayerHpChange: (hp) => setPlayerHp(hp),
                        onEnemyCountChange: (alive, total) => {
                            setEnemyAlive(alive);
                            setEnemyTotal(total);
                        },
                        onGameOver: (win) => setGameOver(win ? 'win' : 'lose'),
                    }
                );

                const handle = await ready;
                if (cancelled) { handle.destroy(); return; }
                handleRef.current = handle;
                setLoading(false);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load');
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            handleRef.current?.destroy();
            handleRef.current = null;
        };
    }, [restartKey]);

    const restart = () => setRestartKey((k) => k + 1);

    return (
        <div className="battle-city">
            <div className="battle-city-viewport" ref={containerRef}>
                {loading && (
                    <div className="shader-loading">
                        <span className="spinner" /> Loading tank…
                    </div>
                )}
                {error && (
                    <div className="shader-loading" style={{ color: '#ff2e88' }}>
                        ⚠ {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="battle-city-hud">
                        <div className="hud-hp">
                            {Array.from({ length: PLAYER_MAX_HP }).map((_, i) => (
                                <span key={i} className={`hp-heart ${i < playerHp ? 'full' : 'empty'}`}>
                                    ♥
                                </span>
                            ))}
                        </div>
                        <div className="hud-enemies">
                            <span className="hud-label">Enemies</span>
                            <span className="hud-value">
                                {enemyTotal - enemyAlive} / {enemyTotal}
                            </span>
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="battle-city-gameover">
                        <div className={`gameover-title ${gameOver}`}>
                            {gameOver === 'win' ? 'VICTORY' : 'GAME OVER'}
                        </div>
                        <div className="gameover-sub">
                            {gameOver === 'win'
                                ? 'You destroyed all enemy tanks.'
                                : 'Your tank was destroyed.'}
                        </div>
                        <button className="btn btn-primary" onClick={restart}>
                            ↻ Play Again
                        </button>
                    </div>
                )}
            </div>

            <div className="battle-city-hint">
                <span className="hint-item">
                    <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                    <span className="hint-label">Move</span>
                </span>
                <span className="hint-sep">·</span>
                <span className="hint-item">
                    <kbd>SPACE</kbd>
                    <span className="hint-label">Fire</span>
                </span>
            </div>
        </div>
    );
}