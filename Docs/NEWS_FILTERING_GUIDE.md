# 📰 뉴스 필터링 시스템 - 완벽 가이드

> **목적**: NewsAPI.org에서 가져온 뉴스 중 암호화폐 관련 뉴스만 정확하게 필터링
> **마지막 업데이트**: 2025-11-24
> **담당 파일**: `backend/src/services/newsapi.js`

---

## 📊 현재 시스템 개요

### 데이터 플로우
```
NewsAPI.org (최근 6시간 영어 뉴스, ~40개)
    ↓
5단계 필터링 (MUST_HAVE + EXCLUDE 키워드)
    ↓
Claude Haiku AI 한국어 번역
    ↓
Supabase translated_news 테이블 저장
    ↓
3시간마다 자동 업데이트
```

### 핵심 통계
- **필수 키워드**: 52개 (암호화폐 관련)
- **제외 키워드**: 115개 (엔터테인먼트, 스포츠, 정치 등)
- **필터링 강도**: 5단계 우선순위 시스템
- **키워드 밀도 요구사항**: 2% 이상
- **시간 가중치**: 6시간 이내 뉴스는 1개 키워드만, 이후는 2개 이상

---

## 🔍 5단계 필터링 로직 상세

### PRIORITY 1: 제목 제외 키워드 검사 (가장 강력)
```javascript
// 제목에 EXCLUDE_KEYWORDS 포함 → 즉시 제외
if (title.includes('movie') || title.includes('football')) {
  return REJECTED
}
```
**의도**: 제목에 엔터테인먼트/스포츠 키워드가 있으면 무조건 제외

---

### PRIORITY 2: 전체 텍스트 제외 키워드 검사
```javascript
// 제목 + 설명 + 본문에 EXCLUDE_KEYWORDS 포함 → 제외
const fullText = `${title} ${description} ${content}`
if (fullText.includes('netflix') || fullText.includes('olympics')) {
  return REJECTED
}
```
**의도**: 본문 어디든 비암호화폐 키워드가 있으면 제외

---

### PRIORITY 3: 필수 키워드 개수 검사 (시간 가중치)
```javascript
// MUST_HAVE_KEYWORDS 개수 카운트
const cryptoKeywordCount = MUST_HAVE_KEYWORDS.filter(k => fullText.includes(k)).length

// 🔥 신선한 뉴스 (6시간 이내): 1개 이상만 필요
if (ageHours <= 6 && cryptoKeywordCount >= 1) {
  return ACCEPTED
}

// 오래된 뉴스: 2개 이상 필요
if (cryptoKeywordCount < 2) {
  return REJECTED
}
```
**의도**: 속보성 뉴스는 관대하게, 오래된 뉴스는 엄격하게

---

### PRIORITY 4: 키워드 밀도 검사
```javascript
// 전체 단어 중 암호화폐 키워드 비율 계산
const wordCount = fullText.split(/\s+/).length
const keywordDensity = cryptoKeywordCount / wordCount

if (keywordDensity < 0.02) {  // 2% 미만 제외
  return REJECTED
}
```
**의도**: 암호화폐가 부차적으로만 언급된 뉴스 제외

---

### PRIORITY 5: 제목 필수 키워드 검사 (보너스)
```javascript
// 제목에 최소 1개의 MUST_HAVE_KEYWORDS 필요
const titleHasCrypto = MUST_HAVE_KEYWORDS.some(k => title.includes(k))
if (!titleHasCrypto) {
  return REJECTED
}
```
**의도**: 제목이 암호화폐와 무관하면 본문과 관계없이 제외

---

## 📋 키워드 목록 상세

### MUST_HAVE_KEYWORDS (52개)

#### 1️⃣ 핵심 암호화폐 용어 (12개)
```javascript
'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
'blockchain', 'defi', 'nft', 'altcoin', 'token', 'coin'
```
**역할**: 가장 기본적인 암호화폐 키워드
**추천**: 절대 제거하지 말 것

#### 2️⃣ 주요 코인 (12개)
```javascript
'xrp', 'ripple', 'bnb', 'binance', 'cardano', 'ada', 'solana', 'sol',
'polygon', 'matic', 'dogecoin', 'doge', 'shiba'
```
**역할**: 시가총액 상위 코인 및 인기 코인
**추천 조정**:
- ✅ 추가 고려: 'sui', 'avalanche', 'avax', 'chainlink', 'link', 'polkadot', 'dot', 'uniswap', 'toncoin', 'ton'
- ❌ 제거 고려: 'shiba' (과도한 밈코인 뉴스)

#### 3️⃣ 암호화폐 생태계 (13개)
```javascript
'coinbase', 'kraken', 'exchange', 'wallet', 'mining', 'miner',
'satoshi', 'halving', 'staking', 'yield', 'dex', 'dao',
'web3'
```
**역할**: 거래소, 지갑, 채굴 등 생태계 용어
**추천 조정**:
- ✅ 추가 고려: 'ledger', 'trezor', 'metamask', 'uniswap', 'pancakeswap', 'airdrop'
- ❌ 제거 고려: 'mining' (GPU 채굴 뉴스와 혼동 가능)

#### 4️⃣ 기술 용어 (4개)
```javascript
'metaverse', 'smart contract', 'gas fee', 'layer 2'
```
**역할**: 블록체인 기술 용어
**추천 조정**:
- ✅ 추가 고려: 'rollup', 'zk-proof', 'consensus', 'proof of stake', 'proof of work'

#### 5️⃣ 트레이딩 용어 (5개)
```javascript
'bull market', 'bear market', 'hodl', 'fud', 'fomo', 'whale alert'
```
**역할**: 암호화폐 시장 특유의 용어
**추천 조정**:
- ✅ 추가 고려: 'pump', 'dump', 'ath' (all-time high), 'rekt', 'diamond hands'
- ⚠️ 주의: 'whale alert' (본 앱 이름과 충돌 가능)

---

### EXCLUDE_KEYWORDS (115개)

#### 1️⃣ 엔터테인먼트 (40개) - **가장 중요한 제외 카테고리**
```javascript
// 영화/TV
'movie', 'film', 'cinema', 'documentary', 'docuseries',
'actor', 'actress', 'director', 'producer', 'screenplay', 'filmmaker',
'netflix', 'hulu', 'disney+', 'disney plus', 'amazon prime', 'hbo',
'tv show', 'television', 'series premiere', 'season finale', 'episode',

// 음악
'music', 'album', 'concert', 'tour', 'singer', 'band', 'musician', 'rapper',

// 시상식
'grammy', 'oscar', 'emmy', 'golden globe', 'award show', 'red carpet',

// 장르
'comedy', 'drama', 'thriller', 'horror', 'romance', 'animation',

// 기타
'box office', 'premiere', 'trailer', 'casting', 'audition'
```
**역할**: False Positive의 주요 원인 (예: "Bitcoin documentary", "NFT music album")
**추천 조정**:
- ✅ 현재 상태 유지 (매우 효과적)
- ✅ 추가 고려: 'podcast', 'spotify', 'youtube creator', 'influencer'
- ⚠️ 주의: 'doc' 제거됨 (과도하게 "crypto documentation" 차단)

#### 2️⃣ 스포츠 (24개)
```javascript
'football', 'soccer', 'nfl', 'nba', 'mlb', 'nhl', 'hockey', 'tennis',
'olympics', 'championship', 'tournament', 'league', 'playoffs', 'superbowl',
'world cup', 'uefa', 'premier league', 'la liga', 'serie a', 'bundesliga',
'formula 1', 'f1', 'nascar', 'racing', 'motorsport',
'boxing', 'mma', 'ufc', 'wrestling', 'wwe',
'golf', 'baseball', 'basketball', 'volleyball', 'badminton',
'athlete', 'coach', 'player', 'team roster', 'draft pick'
```
**역할**: 스포츠팀 NFT, 스포츠 베팅 암호화폐 뉴스 차단
**추천 조정**:
- ⚠️ 딜레마: 일부 NFT 프로젝트가 스포츠팀과 협업 (예: NBA Top Shot)
- ✅ 제거 고려: 'nft sports' 같은 예외 처리 로직 추가 가능

#### 3️⃣ 정치 (11개)
```javascript
'election', 'vote', 'voting', 'senate', 'congress', 'democrat', 'republican',
'white house', 'president biden', 'donald trump', 'kamala harris',
'campaign', 'primary', 'midterm', 'poll', 'ballot', 'governor'
```
**역할**: 암호화폐 규제 뉴스와 일반 정치 뉴스 분리
**추천 조정**:
- ⚠️ 위험: 'regulation', 'sec', 'cftc' 같은 규제 뉴스까지 차단 가능
- ✅ 제거 고려: 'election', 'vote' (과도하게 규제 뉴스 차단)
- ✅ 유지: 특정 인물명 (비암호화폐 정치 뉴스 효과적 차단)

#### 4️⃣ 날씨/재난 (11개)
```javascript
'weather', 'forecast', 'hurricane', 'typhoon', 'earthquake', 'tsunami',
'flood', 'flooding', 'landslide', 'wildfire', 'tornado', 'storm',
'climate change', 'global warming', 'drought'
```
**역할**: 자연재해 뉴스 차단
**추천 조정**:
- ⚠️ 주의: 'climate change' → 탄소 배출권 NFT, 그린 암호화폐 뉴스 차단 가능
- ✅ 제거 고려: 'climate change', 'global warming'

#### 5️⃣ 식품/라이프스타일 (14개)
```javascript
'recipe', 'cooking', 'restaurant', 'chef', 'food review', 'culinary',
'diet', 'nutrition', 'weight loss', 'fitness', 'workout', 'gym',
'fashion show', 'fashion designer', 'fashion runway', 'vogue',
'beauty', 'makeup', 'cosmetics', 'skincare'
```
**역할**: 라이프스타일 뉴스 차단
**추천 조정**:
- ✅ 현재 상태 유지 (효과적)
- ⚠️ 주의: 'fashion runway' → 패션 NFT 차단 가능하나, 원래 제거된 'runway' 복원 불필요

#### 6️⃣ 여행/부동산 (7개)
```javascript
'travel', 'vacation', 'hotel', 'airline', 'tourism', 'destination',
'real estate', 'property', 'mortgage', 'housing market', 'rent'
```
**역할**: 여행/부동산 뉴스 차단
**추천 조정**:
- ⚠️ 딜레마: 'real estate' → 부동산 토큰화 뉴스 차단 가능
- ✅ 제거 고려: 'real estate', 'property' (블록체인 부동산 프로젝트 뉴스 허용)

#### 7️⃣ 자동차 (3개)
```javascript
'car review', 'vehicle', 'automotive', 'test drive', 'auto show'
```
**역할**: 자동차 뉴스 차단
**추천 조정**:
- ✅ 현재 상태 유지 (효과적)

#### 8️⃣ 건강/의료 (10개)
```javascript
'health', 'medical', 'disease', 'vaccine', 'vaccination', 'doctor', 'hospital',
'surgery', 'treatment', 'diagnosis', 'patient', 'clinical trial'
```
**역할**: 의료 뉴스 차단
**추천 조정**:
- ⚠️ 주의: 'health' → 헬스케어 블록체인 뉴스 차단 가능
- ✅ 제거 고려: 'health' (과도하게 헬스케어 DApp 차단)

#### 9️⃣ 책/문학 (6개)
```javascript
'book review', 'novel', 'author', 'bestseller', 'publishing', 'writer',
'memoir', 'biography', 'literature'
```
**역할**: 문학 뉴스 차단
**추천 조정**:
- ✅ 현재 상태 유지 (효과적)

#### 🔟 기술 (비암호화폐) (5개)
```javascript
'gaming console', 'playstation', 'xbox', 'nintendo', 'ps5',
'smartphone review', 'iphone review', 'android review', 'gadget review'
```
**역할**: 일반 기술 뉴스 차단
**추천 조정**:
- ✅ 추가 고려: 'apple watch', 'samsung galaxy', 'laptop review'
- ⚠️ 딜레마: 게임 콘솔 → 블록체인 게임 뉴스 차단 가능

#### 1️⃣1️⃣ 역사/교육 (4개)
```javascript
'erased part of history', 'historical', 'sheds light on', 'documentary about',
'explores the history', 'tells the story'
```
**역할**: 다큐멘터리 뉴스 추가 차단
**추천 조정**:
- ✅ 현재 상태 유지 (효과적)

---

## 🎯 필터링 조정 가이드

### 1단계: 문제 파악

#### False Positive (잘못 포함된 뉴스) 예시
- **문제**: "Bitcoin documentary premieres on Netflix"
- **원인**: 제목에 'bitcoin' 포함 → PRIORITY 5 통과
- **해결**: 'documentary', 'netflix' 이미 EXCLUDE에 있으므로 PRIORITY 2에서 차단됨 ✅

#### False Negative (잘못 제외된 뉴스) 예시
- **문제**: "Sui blockchain launches new DApp for real estate tokenization"
- **원인**: 'sui' MUST_HAVE에 없음, 'real estate' EXCLUDE에 있음
- **해결**: 'sui' 추가, 'real estate tokenization' 예외 처리 로직 필요

---

### 2단계: 키워드 추가/제거 방법

#### MUST_HAVE_KEYWORDS 추가
```javascript
// 파일 위치: backend/src/services/newsapi.js (Lines 40-53)

// ✅ 권장: 신규 코인 추가 (시가총액 Top 20)
'sui', 'avalanche', 'avax', 'chainlink', 'link', 'polkadot', 'dot',

// ✅ 권장: DeFi/NFT 생태계 추가
'opensea', 'rarible', 'pancakeswap', 'sushiswap', 'aave', 'compound',

// ✅ 권장: Layer 2 솔루션 추가
'arbitrum', 'optimism', 'base', 'zksync'
```

#### MUST_HAVE_KEYWORDS 제거
```javascript
// ⚠️ 주의: 제거 시 신중하게

// 제거 고려:
- 'shiba' (과도한 밈코인 뉴스)
- 'metaverse' (게임 뉴스와 혼동)
```

#### EXCLUDE_KEYWORDS 추가
```javascript
// 파일 위치: backend/src/services/newsapi.js (Lines 55-116)

// ✅ 권장: 추가 엔터테인먼트 키워드
'podcast', 'spotify', 'tiktok', 'youtube creator', 'influencer',

// ✅ 권장: 추가 스포츠 키워드
'esports', 'gaming tournament' (단, 블록체인 게임 뉴스 차단 주의)
```

#### EXCLUDE_KEYWORDS 제거
```javascript
// ⚠️ 주의: False Negative 발생 시에만 제거

// 제거 고려:
- 'real estate' (부동산 토큰화 뉴스 허용)
- 'climate change' (탄소 배출권 NFT 뉴스 허용)
- 'election', 'vote' (규제 뉴스 허용)
- 'health' (헬스케어 블록체인 뉴스 허용)
```

---

### 3단계: 필터링 강도 조정

#### 현재 설정
```javascript
// Lines 150-162

// Fresh articles (within 6 hours): Only need 1+ keyword
if (ageHours <= 6 && cryptoKeywordCount >= 1) {
  return ACCEPTED
}

// Older articles: Need 2+ keywords
if (cryptoKeywordCount < 2) {
  return REJECTED
}

// Keyword density: 2% minimum
if (keywordDensity < 0.02) {
  return REJECTED
}
```

#### 조정 옵션

##### 옵션 1: 더 엄격하게 (노이즈 감소)
```javascript
// 신선한 뉴스도 2개 이상 키워드 요구
if (ageHours <= 6 && cryptoKeywordCount >= 2) {
  return ACCEPTED
}

// 키워드 밀도 3%로 상향
if (keywordDensity < 0.03) {
  return REJECTED
}
```
**효과**: False Positive 감소, 뉴스 개수 감소

##### 옵션 2: 더 관대하게 (뉴스 증가)
```javascript
// 신선한 뉴스 기간 12시간으로 연장
if (ageHours <= 12 && cryptoKeywordCount >= 1) {
  return ACCEPTED
}

// 키워드 밀도 1.5%로 하향
if (keywordDensity < 0.015) {
  return REJECTED
}
```
**효과**: False Negative 감소, 뉴스 개수 증가

##### 옵션 3: 제목 키워드 요구사항 제거 (PRIORITY 5)
```javascript
// Lines 171-175 주석 처리
// if (!titleHasCrypto) {
//   return { passed: false, reason: 'no crypto keyword in title' }
// }
```
**효과**: 본문 중심 암호화폐 뉴스 포함, False Negative 감소

---

### 4단계: 예외 처리 로직 추가 (고급)

#### 시나리오: "Real estate tokenization" 뉴스 허용
```javascript
// Lines 136-141 수정

// PRIORITY 2: Full text check for excluded keywords
const hasExcludedKeyword = EXCLUDE_KEYWORDS.some(keyword => fullText.includes(keyword))

// 🆕 예외 처리: 토큰화 관련 뉴스 허용
if (hasExcludedKeyword) {
  const matchedKeyword = EXCLUDE_KEYWORDS.find(keyword => fullText.includes(keyword))

  // 예외: "real estate" + "tokenization/blockchain/nft" 조합 허용
  if (matchedKeyword === 'real estate' &&
      (fullText.includes('tokenization') ||
       fullText.includes('blockchain') ||
       fullText.includes('nft'))) {
    // 예외 허용 - 다음 검사로 진행
  } else {
    return { passed: false, reason: `contains "${matchedKeyword}"` }
  }
}
```

#### 시나리오: "Climate change" NFT 뉴스 허용
```javascript
// 예외: "climate change" + "nft/carbon credit" 조합 허용
if ((matchedKeyword === 'climate change' || matchedKeyword === 'global warming') &&
    (fullText.includes('nft') ||
     fullText.includes('carbon credit') ||
     fullText.includes('carbon offset'))) {
  // 예외 허용
} else {
  return { passed: false, reason: `contains "${matchedKeyword}"` }
}
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트 (실시간 확인)
```bash
# Backend 서버 시작 (로그 확인 필수)
cd /Users/heojunseog/Desktop/real_whale/backend
npm start

# 다른 터미널에서 수동 갱신
curl -X POST http://localhost:3000/api/news/refresh \
  -H "x-admin-token: 94fc8ba915a301bc31acc1fda0e3b00be875c50744f7e4273885b828c3c0e56d"
```

### 2. 로그 분석
```bash
# Backend 콘솔 출력 예시:

✅ Included: "Bitcoin Hits New All-Time High" (3 keywords, 4.50% density)
✅ Included: "Ethereum ETF Approval Expected Soon" (🔥 fresh (2.3h) with 2 keyword(s))
⛔ Excluded: "Netflix Documentary on Bitcoin" (contains "documentary")
⛔ Excluded: "Crypto News Podcast Episode 42" (contains "podcast")

🔍 Filter Summary:
   Input: 40 articles
   Output: 18 crypto-related (45.0%)
   Rejected: 22
```

### 3. 품질 검증 체크리스트

#### ✅ 필수 확인 사항
- [ ] False Positive < 10% (잘못 포함된 뉴스 비율)
- [ ] False Negative < 5% (잘못 제외된 뉴스 비율)
- [ ] 최종 뉴스 개수: 15-25개 (40개 중)
- [ ] 번역 품질: 자연스러운 한국어
- [ ] 중복 제거: 동일 URL 없음

#### ✅ 카테고리별 검증
- [ ] **주요 코인**: BTC, ETH, BNB, SOL, XRP 뉴스 포함
- [ ] **DeFi**: Uniswap, Aave, Compound 관련 뉴스 포함
- [ ] **NFT**: OpenSea, Blur 관련 뉴스 포함
- [ ] **규제**: SEC, CFTC 관련 뉴스 포함 (정치 뉴스 제외)
- [ ] **엔터테인먼트 차단**: Netflix, 영화, 음악 뉴스 제외

---

## 🎛️ 필터링 프리셋 (빠른 적용)

### 프리셋 1: 보수적 (노이즈 최소화)
```javascript
// MUST_HAVE_KEYWORDS: 35개 (밈코인 제거)
// EXCLUDE_KEYWORDS: 140개 (podcast, tiktok 추가)
// Fresh window: 3시간
// Keyword count: 신규 2개, 기존 3개
// Density: 3%
```
**장점**: 매우 정확한 뉴스, 노이즈 최소
**단점**: 뉴스 개수 감소 (10-15개)

### 프리셋 2: 균형 (현재 설정)
```javascript
// MUST_HAVE_KEYWORDS: 52개
// EXCLUDE_KEYWORDS: 115개
// Fresh window: 6시간
// Keyword count: 신규 1개, 기존 2개
// Density: 2%
```
**장점**: 정확도와 뉴스 개수 균형
**단점**: 가끔 False Positive 발생

### 프리셋 3: 적극적 (뉴스 최대화)
```javascript
// MUST_HAVE_KEYWORDS: 70개 (신규 코인 18개 추가)
// EXCLUDE_KEYWORDS: 100개 (real estate, climate change 제거)
// Fresh window: 12시간
// Keyword count: 신규 1개, 기존 1개
// Density: 1.5%
// PRIORITY 5 제거 (제목 키워드 미필수)
```
**장점**: 뉴스 개수 최대 (25-30개)
**단점**: False Positive 증가 가능

---

## 📈 권장 개선 사항

### 우선순위 1: MUST_HAVE_KEYWORDS 확장 (신규 코인 18개)
```javascript
// 현재 누락된 Top 20 코인
'sui', 'ton', 'toncoin', 'avalanche', 'avax', 'chainlink', 'link',
'polkadot', 'dot', 'uniswap', 'uni', 'tron', 'trx',
'stellar', 'xlm', 'cosmos', 'atom', 'near'
```
**효과**: 주요 코인 뉴스 커버리지 향상

### 우선순위 2: DeFi/NFT 생태계 확장
```javascript
// DeFi 프로토콜
'aave', 'compound', 'maker', 'curve', 'balancer',
'sushiswap', 'pancakeswap', 'gmx', 'lido',

// NFT 마켓플레이스
'opensea', 'blur', 'rarible', 'magic eden', 'x2y2',

// Layer 2
'arbitrum', 'optimism', 'base', 'zksync', 'starknet', 'polygon zkevm'
```
**효과**: DeFi/NFT 뉴스 커버리지 향상

### 우선순위 3: EXCLUDE_KEYWORDS 정제
```javascript
// 제거 권장 (과도한 차단)
'real estate', 'property', 'climate change', 'global warming',
'election', 'vote', 'health'

// 추가 권장 (노이즈 차단)
'podcast', 'spotify', 'tiktok', 'youtube creator', 'influencer',
'esports', 'gaming tournament' (단, 블록체인 게임 주의)
```
**효과**: False Negative 감소, 노이즈 차단 강화

### 우선순위 4: 예외 처리 로직 추가
```javascript
// "real estate tokenization", "climate nft" 같은 암호화폐 뉴스 허용
// 구현 방법: 위의 "4단계: 예외 처리 로직 추가" 참조
```
**효과**: False Negative 대폭 감소

---

## 🚨 주의사항

### ⚠️ 절대 제거하지 말 것
```javascript
// MUST_HAVE_KEYWORDS
'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'blockchain'

// EXCLUDE_KEYWORDS
'movie', 'film', 'netflix', 'music', 'football', 'olympics', 'nfl', 'nba'
```
**이유**: 핵심 필터링 키워드, 제거 시 심각한 품질 저하

### ⚠️ 조심스럽게 제거
```javascript
// EXCLUDE_KEYWORDS (블록체인 프로젝트와 겹침)
'real estate', 'climate change', 'health', 'gaming'
```
**이유**: 예외 처리 로직 없이 제거 시 노이즈 증가

### ⚠️ 추가 시 검증 필수
```javascript
// MUST_HAVE_KEYWORDS에 추가 전 확인
- 암호화폐 관련성 100% 확실한가?
- False Positive 유발 가능성은?
- 기존 키워드와 중복은 아닌가?
```

---

## 📊 변경 내역 추적

### 2025-11-24 (초기 가이드 작성)
- MUST_HAVE_KEYWORDS: 52개
- EXCLUDE_KEYWORDS: 115개
- 5단계 필터링 로직 분석 완료

### 향후 변경 시 이곳에 기록
```
날짜: YYYY-MM-DD
변경자: [이름]
변경 내용:
- MUST_HAVE 추가: [키워드 리스트]
- EXCLUDE 제거: [키워드 리스트]
- 로직 변경: [변경 사항]
성능 변화:
- Before: 40개 → 18개 (45%)
- After: 40개 → 22개 (55%)
```

---

## 🔗 관련 파일

| 파일 | 역할 |
|------|------|
| `backend/src/services/newsapi.js` | 필터링 로직 및 키워드 정의 (Lines 40-216) |
| `backend/src/services/scheduler.js` | 3시간마다 자동 갱신 (Lines 47-54) |
| `backend/scripts/translated_news.sql` | DB 스키마 정의 |
| `frontend/src/pages/NewsPage.jsx` | 뉴스 표시 UI |
| `frontend/src/hooks/useNews.js` | 뉴스 데이터 React Hook |
| `backend/.env` | `NEWSAPI_KEY`, `ANTHROPIC_API_KEY` 설정 |

---

## 📞 문제 해결

### Q1: 뉴스가 너무 적어요 (10개 미만)
**원인**: 필터링이 너무 엄격함
**해결**:
1. MUST_HAVE_KEYWORDS 추가 (신규 코인 18개)
2. EXCLUDE_KEYWORDS 정제 (real estate, climate change 제거)
3. Fresh window 연장 (6시간 → 12시간)
4. 키워드 밀도 하향 (2% → 1.5%)

### Q2: 엔터테인먼트 뉴스가 섞여요
**원인**: EXCLUDE_KEYWORDS 부족
**해결**:
1. 'podcast', 'spotify', 'tiktok' 추가
2. PRIORITY 1 (제목 제외 검사) 강화
3. 로그 확인 후 누락된 키워드 추가

### Q3: 규제 뉴스가 차단돼요
**원인**: 'election', 'vote' 같은 정치 키워드로 차단
**해결**:
1. 'election', 'vote' EXCLUDE에서 제거
2. 예외 처리 로직 추가 (crypto + regulation 조합 허용)

### Q4: 번역 품질이 낮아요
**원인**: Claude Haiku AI 성능 한계 (뉴스 필터링과 무관)
**해결**:
1. `backend/src/services/newsapi.js` Lines 300-400 번역 프롬프트 개선
2. Claude Sonnet 모델로 업그레이드 (비용 증가)

---

**마지막 업데이트**: 2025-11-24
**다음 검토 예정**: 1주일 후 (사용자 피드백 수집)
