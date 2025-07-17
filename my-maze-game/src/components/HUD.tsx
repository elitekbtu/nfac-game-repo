import React from "react";

interface HUDProps {
  floor: number;
  totalFloors: number;
  thirst: number; // 0-100
  toilet: number; // 0-100
  gameOver: boolean;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({ floor, totalFloors, thirst, toilet, gameOver, onRestart }) => {
  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, pointerEvents: 'none', color: '#fff', fontFamily: 'sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Floor {floor} / {totalFloors}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div>Thirst</div>
          <div style={{ background: '#222', borderRadius: 8, overflow: 'hidden', height: 16 }}>
            <div style={{ width: `${thirst}%`, background: '#00bfff', height: '100%', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div>Toilet</div>
          <div style={{ background: '#222', borderRadius: 8, overflow: 'hidden', height: 16 }}>
            <div style={{ width: `${toilet}%`, background: '#ffd700', height: '100%', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
      {gameOver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 24 }}>Game Over</div>
          <button onClick={onRestart} style={{ fontSize: 24, padding: '12px 32px', borderRadius: 8, border: 'none', background: '#00bfff', color: '#fff', cursor: 'pointer' }}>Restart</button>
        </div>
      )}
    </div>
  );
}; 