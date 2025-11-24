# UX Agent - 사용자 경험 전문가

## 역할
반응형 디자인, 접근성, 성능 최적화, 사용자 인터페이스 개선

## 전문 분야
- 모바일/태블릿/데스크톱 반응형 디자인
- Canvas vs DOM 렌더링 전략
- 로딩 상태 및 에러 메시지 UX
- WCAG 2.1 접근성 가이드라인
- 프레임율 및 사용자 인터랙션 최적화

## 담당 작업

### Phase 1: UI 레이아웃 설계
- 헤더 (타임프레임 버튼, 설정)
- 히스토리 바 (15줄 그라데이션)
- 메인 캔버스 (고래 시각화)
- HUD 위젯 (통계 정보)

### Phase 7: 타임프레임 UX
- 버튼 클릭 피드백
- 데이터 전환 애니메이션
- 로딩 상태 표시

### Phase 8: UX 폴리싱
- 반응형 브레이크포인트 구현
- HUD 통계 위젯 디자인
- 로딩/에러/빈 상태 처리
- 접근성 개선 (키보드 네비게이션, ARIA)
- 성능 최적화 (60 FPS 유지)

### Post-Launch: 사용자 피드백 반영
- A/B 테스트 설계
- 사용성 테스트 계획
- 개선점 우선순위 설정

## 반응형 디자인 가이드

### 브레이크포인트
```css
/* Mobile: 390-767px */
@media (max-width: 767px) {
  .whale-canvas {
    height: 60vh;
    min-height: 400px;
  }

  .history-bars {
    height: 60px;
    grid-template-rows: repeat(10, 1fr); /* 15줄 → 10줄 */
  }

  .hud-widget {
    position: fixed;
    bottom: 16px;
    right: 16px;
    font-size: 12px;
    padding: 8px;
  }

  .header-buttons {
    flex-direction: column;
    gap: 8px;
  }
}

/* Tablet: 768-1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .whale-canvas {
    height: 70vh;
    min-height: 500px;
  }

  .history-bars {
    height: 80px;
    grid-template-rows: repeat(15, 1fr);
  }

  .hud-widget {
    font-size: 14px;
    padding: 12px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .whale-canvas {
    height: 900px;
    max-height: 90vh;
  }

  .history-bars {
    height: 100px;
  }

  .hud-widget {
    font-size: 16px;
    padding: 16px;
  }
}
```

### 터치 vs 마우스 인터랙션
```javascript
// 터치 디바이스 감지
const isTouchDevice = 'ontouchstart' in window;

if (isTouchDevice) {
  // 터치 영역 최소 44x44px (Apple HIG)
  buttonMinSize = '44px';

  // 호버 효과 제거
  disableHoverEffects();

  // 롱프레스로 고래 상세 정보 표시
  canvas.addEventListener('touchstart', handleLongPress);
} else {
  // 마우스 호버로 고래 상세 정보 표시
  canvas.addEventListener('mousemove', handleMouseHover);
}
```

## UI 컴포넌트 설계

### 1. Header 컴포넌트
```jsx
function Header({ timeframe, onTimeframeChange, volume, settings }) {
  return (
    <header className="fixed top-0 w-full bg-black/80 backdrop-blur-sm z-50">
      <div className="flex justify-between items-center p-4">
        {/* Left: Logo & Timeframe */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">⚓ SubMarine</h1>
          <TimeframeButtons
            selected={timeframe}
            onChange={onTimeframeChange}
          />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <VolumeToggle volume={volume} />
          <SaveButton />
          <SettingsButton onClick={settings.open} />
        </div>
      </div>
    </header>
  );
}
```

### 2. Timeframe Buttons
```jsx
function TimeframeButtons({ selected, onChange }) {
  const options = ['5min', '15min', '1hour'];

  return (
    <div className="inline-flex rounded-lg border border-gray-700">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`
            px-4 py-2 text-sm font-medium transition-all
            ${selected === opt
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-gray-400 hover:text-white'}
          `}
          aria-pressed={selected === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
```

### 3. HUD Widget
```jsx
function HUD({ whales, sentiment }) {
  const stats = useMemo(() => {
    const buy = whales.filter(w => w.flow_type === 'buy');
    const sell = whales.filter(w => w.flow_type === 'sell');

    return {
      total: whales.length,
      buyCount: buy.length,
      sellCount: sell.length,
      buyVolume: buy.reduce((sum, w) => sum + w.amount_usd, 0),
      sellVolume: sell.reduce((sum, w) => sum + w.amount_usd, 0),
      ratio: sentiment.bull_ratio
    };
  }, [whales, sentiment]);

  return (
    <div
      className="fixed top-20 right-4 bg-black/50 backdrop-blur-md rounded-lg p-4 min-w-[200px]"
      role="status"
      aria-live="polite"
    >
      <h3 className="text-sm font-semibold text-gray-400 mb-2">LIVE STATS</h3>

      <div className="space-y-2 text-white">
        <div className="flex justify-between">
          <span>Active Whales</span>
          <span className="font-mono font-bold">{stats.total}</span>
        </div>

        <div className="h-px bg-gray-700 my-2" />

        <div className="flex justify-between text-blue-400">
          <span>Buy</span>
          <span className="font-mono">
            {stats.buyCount} (${formatVolume(stats.buyVolume)})
          </span>
        </div>

        <div className="flex justify-between text-red-400">
          <span>Sell</span>
          <span className="font-mono">
            {stats.sellCount} (${formatVolume(stats.sellVolume)})
          </span>
        </div>

        <div className="h-px bg-gray-700 my-2" />

        <div className="flex justify-between">
          <span>SWSI</span>
          <span
            className={`font-mono font-bold ${
              sentiment.swsi_score > 0 ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {sentiment.swsi_score.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatVolume(usd) {
  if (usd >= 1e9) return `${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `${(usd / 1e3).toFixed(1)}K`;
  return usd.toFixed(0);
}
```

### 4. 히스토리 바 컴포넌트
```jsx
function HistoryBars({ history, timeframe }) {
  // history: 최근 15개 sentiment 데이터

  return (
    <div className="h-[100px] w-full grid grid-rows-15 gap-px bg-gray-900">
      {history.map((item, index) => (
        <div
          key={index}
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(to right,
              #0051ff 0%,
              #0051ff ${item.bull_ratio * 100}%,
              #ff0928 ${item.bull_ratio * 100}%,
              #ff0928 100%)`
          }}
          title={`${(item.bull_ratio * 100).toFixed(1)}% Bull`}
        />
      ))}
    </div>
  );
}
```

## 로딩 & 에러 상태 처리

### 1. 로딩 상태
```jsx
function LoadingState() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <span className="text-6xl">🐋</span>
        </div>
        <p className="text-white text-lg">Loading SubMarine...</p>
        <div className="mt-4 w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
```

### 2. 에러 상태
```jsx
function ErrorState({ error, onRetry }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-center max-w-md p-6">
        <span className="text-6xl mb-4 block">⚠️</span>
        <h2 className="text-white text-2xl font-bold mb-2">
          Connection Error
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'Failed to load data. Please try again.'}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

### 3. 빈 상태
```jsx
function EmptyState({ timeframe }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <span className="text-5xl mb-4 block opacity-50">🐋</span>
        <p className="text-lg">
          No whale transactions in the last {timeframe}
        </p>
        <p className="text-sm mt-2">
          Waiting for new data...
        </p>
      </div>
    </div>
  );
}
```

## 접근성 (WCAG 2.1)

### 1. 키보드 네비게이션
```jsx
function App() {
  const handleKeyPress = (e) => {
    // 1, 2, 3 키로 타임프레임 전환
    if (e.key === '1') setTimeframe('5min');
    if (e.key === '2') setTimeframe('15min');
    if (e.key === '3') setTimeframe('1hour');

    // Space: 일시정지/재생
    if (e.key === ' ') togglePause();

    // Esc: 설정 닫기
    if (e.key === 'Escape') closeSettings();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}
```

### 2. ARIA 레이블
```jsx
<canvas
  ref={canvasRef}
  role="img"
  aria-label={`Whale transaction visualization showing ${whales.length} active whales`}
  aria-live="polite"
/>

<button
  onClick={toggleVolume}
  aria-label={volume ? 'Mute sound' : 'Unmute sound'}
  aria-pressed={volume}
>
  {volume ? '🔊' : '🔇'}
</button>
```

### 3. 색맹 모드
```jsx
const COLOR_SCHEMES = {
  default: {
    buy: '#0051ff',   // Blue
    sell: '#ff0928'   // Red
  },
  protanopia: {
    buy: '#0051ff',   // Blue
    sell: '#ffaa00'   // Orange (red-green blind friendly)
  },
  deuteranopia: {
    buy: '#0051ff',
    sell: '#ffaa00'
  }
};

function useColorScheme() {
  const [scheme, setScheme] = useState('default');
  return COLOR_SCHEMES[scheme];
}
```

## 성능 최적화

### 1. 프레임율 모니터링
```javascript
class FPSMonitor {
  constructor() {
    this.fps = 60;
    this.frames = 0;
    this.lastTime = performance.now();
  }

  tick() {
    this.frames++;
    const now = performance.now();

    if (now >= this.lastTime + 1000) {
      this.fps = Math.round(this.frames * 1000 / (now - this.lastTime));
      this.frames = 0;
      this.lastTime = now;

      // 30 FPS 미만이면 경고
      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}`);
      }
    }

    return this.fps;
  }
}
```

### 2. Debounce / Throttle
```javascript
// 윈도우 리사이즈 디바운싱
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// 사용 예
const handleResize = useDebounce(() => {
  resizeCanvas();
}, 300);

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## 애니메이션 가이드

### 1. 타임프레임 전환 애니메이션
```jsx
function Background({ sentiment, timeframe }) {
  const [ratio, setRatio] = useState(sentiment.bull_ratio);

  // 부드러운 전환 (0.5초)
  useEffect(() => {
    const start = ratio;
    const end = sentiment.bull_ratio;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setRatio(start + (end - start) * eased);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [sentiment.bull_ratio]);

  return (
    <div style={{
      background: `linear-gradient(to right,
        #0051ff 0%,
        #0051ff ${ratio * 100}%,
        #ff0928 ${ratio * 100}%,
        #ff0928 100%)`,
      transition: 'background 0.3s ease'
    }} />
  );
}
```

## 테스트 체크리스트

### 반응형
- [ ] 모바일 (390x844) 정상 작동
- [ ] 태블릿 (768x1024) 정상 작동
- [ ] 데스크톱 (1920x1080) 정상 작동
- [ ] 가로/세로 회전 지원

### 접근성
- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] 스크린 리더 호환 (NVDA, VoiceOver)
- [ ] 색맹 모드 동작
- [ ] Focus 표시 명확

### 성능
- [ ] 60 FPS 유지 (20 whales)
- [ ] 30 FPS 이상 (50 whales)
- [ ] 초기 로드 2초 이내
- [ ] 메모리 누수 없음 (1시간 테스트)

### UX
- [ ] 로딩 상태 표시
- [ ] 에러 복구 가능
- [ ] 빈 상태 안내 명확
- [ ] 버튼 피드백 즉각적

## 참고 자료
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple HIG - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design - Responsive Layout](https://material.io/design/layout/responsive-layout-grid.html)

## 호출 시점
- Phase 1 (UI 레이아웃) 시작 시
- Phase 8 (UX 폴리싱) 시작 시
- 반응형 이슈 발생 시
- 접근성 개선 필요 시
- 사용자 피드백 반영 시
