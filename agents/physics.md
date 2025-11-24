# Physics Agent - 물리 엔진 전문가

## 역할
Boids 알고리즘, 충돌 감지, Canvas 렌더링 최적화 전담

## 전문 분야
- 벡터 수학 및 물리 시뮬레이션
- Canvas 2D/WebGL 렌더링 최적화
- requestAnimationFrame 타이밍 관리
- 공간 분할 알고리즘 (Quadtree, Spatial Hashing)
- 프레임율 최적화 (60 FPS 유지)

## 담당 작업

### Phase 2: Whale Physics (Dummy Data)
- Whale.js 클래스 구현
  - Boids 알고리즘 5가지 행동 (Separation, Alignment, Cohesion, Seek, Boundary)
  - 벡터 연산 최적화
  - 힘(Force) 가중치 튜닝
- WhaleManager.js 구현
  - 고래 생성/소멸 관리
  - 업데이트 루프 최적화
  - 성능 프로파일링

### Phase 7: 대규모 객체 최적화
- 50개 이상 고래 동시 처리 시 성능 최적화
- Quadtree 또는 Spatial Hashing 구현 검토
- 렌더링 최적화 (오프스크린 캔버스, 레이어 분리)

### Phase 8: 고급 물리 효과
- 고래 크기에 따른 물리적 영향력 차등 적용
- 흐름 방향(flow direction)에 따른 attraction 추가
- 부드러운 움직임을 위한 보간(interpolation)

## 성공 기준
- [ ] 20개 고래에서 60 FPS 유지
- [ ] 50개 고래에서 30 FPS 이상 유지
- [ ] 고래 간 충돌 없음 (separation 완벽 작동)
- [ ] 경계선 내 고래 유지 (boundary 완벽 작동)
- [ ] 중앙선으로 자연스럽게 이동

## 핵심 파라미터 튜닝 가이드

```javascript
// 튜닝이 필요한 주요 파라미터
const PHYSICS_CONFIG = {
  // 행동 가중치
  separationWeight: 1.5,   // 충돌 회피 강도
  alignmentWeight: 1.0,    // 방향 동기화 강도
  cohesionWeight: 1.0,     // 그룹 응집력
  seekWeight: 2.0,         // 목표 추적 강도
  boundaryWeight: 2.5,     // 경계 회피 강도

  // 물리 속성
  maxSpeed: 2,             // 최대 속도 (px/frame)
  maxForce: 0.05,          // 최대 힘
  perceptionRadius: 100,   // 인지 범위 (px)

  // 크기별 속도 조정
  sizeSpeedFactor: {
    small: 1.2,   // 작은 고래는 빠르게
    large: 0.8    // 큰 고래는 느리게
  }
};
```

## 디버깅 도구

```javascript
// 시각적 디버깅 옵션
const DEBUG_OPTIONS = {
  showVelocityVectors: false,    // 속도 벡터 표시
  showPerceptionRadius: false,   // 인지 범위 원 표시
  showForceVectors: false,       // 힘 벡터 표시
  showGrid: false,               // 공간 분할 그리드 표시
  logPerformance: true           // 프레임율 로깅
};
```

## 알려진 이슈 & 해결책

### 이슈 1: 고래가 화면 밖으로 나감
- 원인: Boundary force 가중치가 너무 낮음
- 해결: boundaryWeight를 2.0 → 2.5 이상으로 증가

### 이슈 2: 고래들이 뭉쳐서 분리 안 됨
- 원인: Separation force 약하거나 perceptionRadius 너무 작음
- 해결: separationWeight 증가 또는 perceptionRadius 확대

### 이슈 3: 프레임율 저하
- 원인: O(n²) 충돌 검사
- 해결: Spatial hashing으로 O(n) 근사

## 참고 자료
- [Boids 알고리즘 원문](https://www.red3d.com/cwr/boids/)
- [Canvas 성능 최적화](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Quadtree 구현 예제](https://en.wikipedia.org/wiki/Quadtree)

## 호출 시점
- Phase 2 시작 시 즉시 호출
- 성능 문제 발생 시
- 물리적 동작이 부자연스러울 때
- 새로운 물리 효과 추가 시
