# SubMarine Design System

**Supabase Amber Theme** - 암호화폐 트레이딩 대시보드를 위한 디자인 시스템

---

## 📋 목차

1. [색상 시스템 (Color System)](#색상-시스템)
2. [타이포그래피 (Typography)](#타이포그래피)
3. [간격 시스템 (Spacing)](#간격-시스템)
4. [테두리 반경 (Border Radius)](#테두리-반경)
5. [전환 효과 (Transitions)](#전환-효과)
6. [컴포넌트 패턴 (Component Patterns)](#컴포넌트-패턴)
7. [Tailwind 설정](#tailwind-설정)

---

## 색상 시스템

### 1. Primary Color (브랜드 컬러 - Amber)

```javascript
primary: {
  DEFAULT: '#ffba16',  // 메인 앰버 컬러
  hover: '#e6a814',    // 호버 상태
  text: '#1f1f1f',     // 프라이머리 버튼 위 텍스트
}
```

**사용 예시:**
```jsx
<button className="bg-primary hover:bg-primary-hover text-primary-text">
  버튼
</button>
```

---

### 2. Surface Colors (배경/UI 그레이스케일)

다크 테마 기반 6단계 그레이스케일:

```javascript
surface: {
  100: '#1C1C1C',  // 앱 전체 배경 (가장 어두움)
  200: '#232323',  // 카드/패널 배경
  300: '#2E2E2E',  // 테두리 (Borders)
  400: '#3E3E3E',  // 인풋 배경 / 호버 상태
  500: '#858585',  // 보조 텍스트 (Muted Text)
  600: '#EDEDED',  // 메인 텍스트
}
```

**사용 예시:**
```jsx
{/* 배경 */}
<div className="bg-surface-100">  {/* 앱 전체 */}
<div className="bg-surface-200">  {/* 카드 */}

{/* 테두리 */}
<div className="border border-surface-300">

{/* 텍스트 */}
<p className="text-surface-600">메인 텍스트</p>
<p className="text-surface-500">보조 텍스트</p>
```

---

### 3. Semantic Colors (의미론적 색상)

```javascript
success: '#3ECF8E',  // Supabase Green - 성공/상승/매수
danger: '#FF4D4D',   // Red - 위험/하락/매도
warning: '#F1C40F',  // Yellow - 경고
```

**사용 예시:**
```jsx
<div className="text-success">+5.2% 상승</div>
<div className="text-danger">-3.1% 하락</div>
<div className="text-warning">주의 필요</div>
```

---

### 4. Alert Tier Colors (알림 등급 색상)

```javascript
tier: {
  s: '#ffba16',  // Amber - 최고 등급 (글로우 효과)
  a: '#F1C40F',  // Yellow - 중요
  b: '#EDEDED',  // White - 주의
  c: '#858585',  // Gray - 일반
}
```

**사용 예시:**
```jsx
<div className="bg-tier-s">S등급 알림</div>
<div className="tier-s-glow">S등급 글로우 효과</div>
```

---

### 5. Legacy Colors (하위 호환성)

```javascript
mist: '#858585',     // surface-500과 동일
brand: {
  DEFAULT: '#ffba16', // primary와 동일
  hover: '#e6a814',   // primary-hover와 동일
}
```

---

## 타이포그래피

### Font Families

```javascript
fontFamily: {
  sans: ['Inter', 'sans-serif'],      // 본문/UI 텍스트
  display: ['Inter', 'sans-serif'],   // 헤딩
  mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],  // 코드/숫자
}
```

**사용 예시:**
```jsx
<h1 className="font-display">헤딩</h1>
<p className="font-sans">본문 텍스트</p>
<code className="font-mono">0x1234...</code>
```

### Font Weights (Tailwind 기본)

- `font-normal` - 400
- `font-medium` - 500
- `font-semibold` - 600
- `font-bold` - 700

---

## 간격 시스템

### CSS Variables

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

### Tailwind Classes

```jsx
<div className="p-1">   {/* 4px */}
<div className="p-2">   {/* 8px */}
<div className="p-4">   {/* 16px */}
<div className="p-6">   {/* 24px */}
<div className="p-8">   {/* 32px */}
<div className="p-12">  {/* 48px */}
```

---

## 테두리 반경

### CSS Variables

```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

### Tailwind Classes

```jsx
<div className="rounded">     {/* 4px - sm */}
<div className="rounded-md">  {/* 6px */}
<div className="rounded-lg">  {/* 8px */}
```

---

## 전환 효과

### CSS Variable

```css
:root {
  --transition-base: 150ms ease-in-out;
}
```

### Tailwind Classes

```jsx
<button className="transition-colors">  {/* 색상만 전환 */}
<div className="transition-all">        {/* 모든 속성 전환 */}
```

---

## 컴포넌트 패턴

### 1. Buttons

```css
/* Base Button */
.btn {
  @apply px-4 py-2 rounded text-sm font-medium transition-colors inline-flex items-center gap-2;
}

/* Primary Button */
.btn-primary {
  @apply bg-primary text-primary-text hover:bg-primary-hover;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-transparent border border-surface-300 text-surface-600 hover:border-surface-500;
}
```

**사용 예시:**
```jsx
<button className="btn btn-primary">
  저장
</button>

<button className="btn btn-secondary">
  취소
</button>
```

---

### 2. Cards

```css
.card {
  @apply bg-surface-200 border border-surface-300 rounded-md p-6;
}
```

**사용 예시:**
```jsx
<div className="card">
  <h3 className="text-lg font-semibold mb-4">카드 제목</h3>
  <p className="text-surface-500">카드 내용</p>
</div>
```

---

### 3. Alerts

```css
/* Alert Base */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-left: 4px solid;
  border-radius: 0.375rem;
  margin-top: 1.5rem;
}

/* Alert Info */
.alert-info {
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: rgb(59, 130, 246);
  color: rgb(59, 130, 246);
}

/* Alert Success */
.alert-success {
  background-color: rgba(62, 207, 142, 0.1);
  border-left-color: #3ECF8E;
  color: #3ECF8E;
}
```

**사용 예시:**
```jsx
<div className="alert alert-info">
  <span>ℹ️</span>
  <div>정보 메시지입니다.</div>
</div>

<div className="alert alert-success">
  <span>✅</span>
  <div>성공적으로 완료되었습니다.</div>
</div>
```

---

### 4. Scrollbar (커스텀)

```css
/* Minimalist Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background-color: theme('colors.surface.100');
}

::-webkit-scrollbar-thumb {
  background-color: theme('colors.surface.400');
  border-radius: 0.25rem;
  transition: background-color 150ms;
}

::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.surface.500');
}
```

---

### 5. Tier S Glow Effect

```css
.tier-s-glow {
  box-shadow:
    0 0 12px rgba(255, 186, 22, 0.6),
    0 0 24px rgba(241, 196, 15, 0.3);
}
```

**사용 예시:**
```jsx
<div className="tier-s-glow bg-tier-s p-4 rounded">
  S등급 알림 - 글로우 효과
</div>
```

---

## Tailwind 설정

### 완전한 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand Color: Amber
        primary: {
          DEFAULT: '#ffba16', // Main (Amber)
          hover: '#e6a814',   // Hover
          text: '#1f1f1f',    // Text on primary button
        },
        // Base Grayscale (Supabase Surface)
        surface: {
          100: '#1C1C1C', // App Background
          200: '#232323', // Card/Panel Background
          300: '#2E2E2E', // Borders
          400: '#3E3E3E', // Input Background / Hover
          500: '#858585', // Muted Text
          600: '#EDEDED', // Main Text
        },
        // Semantic
        success: '#3ECF8E', // Supabase Green
        danger: '#FF4D4D',  // Red
        warning: '#F1C40F', // Yellow
        // Alert Tier Colors
        tier: {
          s: '#ffba16',  // Amber (최고 등급 - 글로우 효과와 함께 사용)
          a: '#F1C40F',  // Yellow (중요)
          b: '#EDEDED',  // White (주의)
          c: '#858585',  // Gray (일반)
        },
        // Legacy color names (for backward compatibility)
        mist: '#858585',  // Same as surface-500
        brand: {
          DEFAULT: '#ffba16',  // Same as primary
          hover: '#e6a814',    // Same as primary-hover
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

---

## CSS Variables (index.css)

### Global Design System Variables

```css
:root {
  /* Spacing System */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Transitions */
  --transition-base: 150ms ease-in-out;
}
```

### Base Layer

```css
@layer base {
  body {
    background-color: theme('colors.surface.100');
    color: theme('colors.surface.600');
    @apply font-sans antialiased;
  }
}
```

---

## 사용 가이드

### 1. 새 프로젝트에 적용하기

**Step 1**: Tailwind CSS 설치
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**Step 2**: tailwind.config.js 교체
- 위의 "Tailwind 설정" 섹션의 전체 코드 복사

**Step 3**: CSS 파일에 추가 (예: index.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 위의 CSS Variables 섹션 복사 */
/* 위의 컴포넌트 패턴 CSS 복사 */
```

**Step 4**: Inter 폰트 추가 (HTML)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

### 2. 자주 사용하는 패턴

**페이지 컨테이너**
```jsx
<div className="min-h-screen bg-surface-100 text-surface-600">
  <div className="max-w-[1280px] mx-auto relative p-6">
    {/* 콘텐츠 */}
  </div>
</div>
```

**섹션 헤더**
```jsx
<div className="mb-8">
  <h1 className="text-3xl font-bold mb-2">페이지 제목</h1>
  <p className="text-surface-500">부제목 또는 설명</p>
</div>
```

**통계 카드**
```jsx
<div className="card">
  <div className="flex items-center justify-between mb-2">
    <span className="text-surface-500 text-sm">레이블</span>
    <span className="text-success">+12.5%</span>
  </div>
  <div className="text-2xl font-bold">$1,234,567</div>
</div>
```

**입력 필드**
```jsx
<input
  type="text"
  className="w-full bg-surface-400 border border-surface-300
             rounded-md px-4 py-2 text-surface-600
             focus:outline-none focus:border-primary transition-colors"
  placeholder="입력하세요"
/>
```

---

## 색상 참조표

| 색상 이름 | Hex Code | 용도 |
|---------|----------|------|
| primary | #ffba16 | 메인 CTA, 강조, 브랜드 |
| primary-hover | #e6a814 | 버튼 호버 |
| surface-100 | #1C1C1C | 앱 배경 |
| surface-200 | #232323 | 카드/패널 |
| surface-300 | #2E2E2E | 테두리 |
| surface-400 | #3E3E3E | 인풋/호버 |
| surface-500 | #858585 | 보조 텍스트 |
| surface-600 | #EDEDED | 메인 텍스트 |
| success | #3ECF8E | 성공/상승/매수 |
| danger | #FF4D4D | 위험/하락/매도 |
| warning | #F1C40F | 경고 |
| tier-s | #ffba16 | 최고 등급 알림 |
| tier-a | #F1C40F | 중요 알림 |
| tier-b | #EDEDED | 주의 알림 |
| tier-c | #858585 | 일반 알림 |

---

## 디자인 원칙

1. **다크 우선 (Dark-First)**: 모든 UI는 다크 모드를 기본으로 디자인
2. **높은 대비 (High Contrast)**: 가독성을 위해 충분한 명도 차이 유지
3. **Amber 브랜드 컬러**: 주요 액션과 강조에만 사용하여 시선 집중
4. **미니멀리즘**: 불필요한 장식 최소화, 기능 중심 디자인
5. **일관성**: 같은 요소는 항상 같은 색상/스타일 사용
6. **반응형**: 모바일/태블릿/데스크톱 모두 고려

---

## 프로젝트 정보

- **디자인 시스템**: Supabase Amber Theme
- **프레임워크**: React + Vite
- **CSS**: TailwindCSS 3.x
- **타겟**: 암호화폐 트레이딩 대시보드

---

## 참고 링크

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Supabase 디자인 가이드](https://supabase.com/brand-assets)
- [Inter 폰트](https://fonts.google.com/specimen/Inter)

---

**마지막 업데이트**: 2025-11-21
**버전**: 1.0.0
