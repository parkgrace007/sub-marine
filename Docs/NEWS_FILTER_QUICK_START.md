# 🚀 뉴스 필터링 조정 - 빠른 시작 가이드

> **목표**: 뉴스 품질 개선을 위한 키워드 필터링 조정
> **소요 시간**: 30분 ~ 1시간
> **난이도**: 쉬움 (코드 복사/붙여넣기)

---

## 📍 현재 상황 요약

### 기본 정보
- **뉴스 소스**: NewsAPI.org (최근 6시간 영어 뉴스)
- **갱신 주기**: 3시간마다 자동
- **현재 필터링 성능**: 40개 → 15-20개 (약 45% 통과)
- **주요 문제**: 일부 중요 코인 뉴스 누락, 가끔 엔터테인먼트 뉴스 혼입

### 필터 구조
```
52개 필수 키워드 (MUST_HAVE_KEYWORDS)
   +
115개 제외 키워드 (EXCLUDE_KEYWORDS)
   =
5단계 우선순위 필터링 시스템
```

---

## 🎯 권장 개선 안 (3가지 옵션)

### 옵션 1: 빠른 개선 (10분)
**목표**: 주요 코인 커버리지 향상
**작업**: MUST_HAVE_KEYWORDS에 18개 추가

```javascript
// 파일: backend/src/services/newsapi.js
// 위치: Lines 40-53

// 기존 코드 뒤에 추가:
'sui', 'ton', 'toncoin', 'avalanche', 'avax', 'chainlink', 'link',
'polkadot', 'dot', 'uniswap', 'uni', 'tron', 'trx',
'stellar', 'xlm', 'cosmos', 'atom', 'near',
```

**예상 효과**:
- ✅ Top 20 코인 뉴스 커버리지 100%
- ✅ 뉴스 개수 +20% (20-25개)
- ⚠️ 노이즈 증가 가능성 낮음

---

### 옵션 2: 균형 개선 (30분)
**목표**: 주요 코인 + DeFi/NFT 생태계 커버리지 향상
**작업**: MUST_HAVE 18개 + 생태계 15개 추가

```javascript
// 1. 주요 코인 추가 (위와 동일)
'sui', 'ton', 'toncoin', 'avalanche', 'avax', 'chainlink', 'link',
'polkadot', 'dot', 'uniswap', 'uni', 'tron', 'trx',
'stellar', 'xlm', 'cosmos', 'atom', 'near',

// 2. DeFi 프로토콜 추가
'aave', 'compound', 'maker', 'curve', 'sushiswap', 'pancakeswap',

// 3. NFT 마켓플레이스 추가
'opensea', 'blur', 'rarible', 'magic eden',

// 4. Layer 2 추가
'arbitrum', 'optimism', 'base', 'zksync', 'starknet'
```

**예상 효과**:
- ✅ DeFi/NFT 뉴스 커버리지 대폭 향상
- ✅ 뉴스 개수 +30% (22-28개)
- ⚠️ 약간의 노이즈 증가 가능

---

### 옵션 3: 전면 개선 (1시간)
**목표**: 최고 품질 + 최대 커버리지 + 노이즈 최소화
**작업**: MUST_HAVE 33개 추가 + EXCLUDE 정제 + 예외 처리

#### Step 1: MUST_HAVE 확장 (옵션 2와 동일)

#### Step 2: EXCLUDE 정제
```javascript
// 파일: backend/src/services/newsapi.js
// 위치: Lines 55-116

// 제거할 키워드 (블록체인 프로젝트와 겹침)
제거: 'real estate', 'property' (부동산 토큰화 뉴스 허용)
제거: 'climate change', 'global warming' (탄소 배출권 NFT 허용)
제거: 'election', 'vote' (규제 뉴스 허용)

// 추가할 키워드 (노이즈 차단 강화)
추가: 'podcast', 'spotify', 'tiktok', 'youtube creator', 'influencer'
```

#### Step 3: 예외 처리 로직 추가
```javascript
// 파일: backend/src/services/newsapi.js
// 위치: Lines 136-141 수정

// PRIORITY 2: Full text check for excluded keywords
const hasExcludedKeyword = EXCLUDE_KEYWORDS.some(keyword => fullText.includes(keyword))
if (hasExcludedKeyword) {
  const matchedKeyword = EXCLUDE_KEYWORDS.find(keyword => fullText.includes(keyword))

  // 🆕 예외 처리: 토큰화 관련 뉴스 허용
  const isBlockchainException = (
    (matchedKeyword === 'real estate' || matchedKeyword === 'property') &&
    (fullText.includes('tokenization') || fullText.includes('blockchain') || fullText.includes('nft'))
  )

  const isClimateException = (
    (matchedKeyword === 'climate change' || matchedKeyword === 'global warming') &&
    (fullText.includes('nft') || fullText.includes('carbon credit'))
  )

  if (!isBlockchainException && !isClimateException) {
    return { passed: false, reason: `contains "${matchedKeyword}"` }
  }
}
```

**예상 효과**:
- ✅ 뉴스 품질 최고 수준
- ✅ 뉴스 개수 +40% (25-30개)
- ✅ False Positive < 5%
- ✅ False Negative < 3%

---

## 🛠️ 실행 방법

### 1단계: 파일 열기
```bash
# VSCode에서 열기
code /Users/heojunseog/Desktop/real_whale/backend/src/services/newsapi.js
```

### 2단계: 키워드 수정
- **MUST_HAVE_KEYWORDS**: Lines 40-53
- **EXCLUDE_KEYWORDS**: Lines 55-116
- **필터링 로직**: Lines 118-182

### 3단계: 테스트
```bash
# 터미널 1: Backend 재시작
cd /Users/heojunseog/Desktop/real_whale/backend
npm start

# 터미널 2: 수동 갱신
curl -X POST http://localhost:3000/api/news/refresh \
  -H "x-admin-token: 94fc8ba915a301bc31acc1fda0e3b00be875c50744f7e4273885b828c3c0e56d"

# Backend 콘솔에서 필터링 로그 확인
```

### 4단계: 로그 분석
```
# Backend 콘솔 출력 예시:

✅ Included: "Bitcoin Hits New All-Time High" (3 keywords, 4.50% density)
✅ Included: "Sui Network Launches DeFi Protocol" (🔥 fresh (1.2h) with 2 keyword(s))
⛔ Excluded: "Bitcoin Documentary on Netflix" (contains "documentary")

🔍 Filter Summary:
   Input: 40 articles
   Output: 22 crypto-related (55.0%)  👈 증가!
   Rejected: 18
```

### 5단계: 프론트엔드 확인
```bash
# http://localhost:5173 접속
# 뉴스 · 리포트 페이지에서 뉴스 품질 확인
```

---

## ✅ 품질 체크리스트

### 필터링 성공 기준
- [ ] **뉴스 개수**: 20-28개 (40개 중 50-70%)
- [ ] **주요 코인**: BTC, ETH, SOL, XRP 뉴스 포함
- [ ] **DeFi/NFT**: Uniswap, OpenSea 관련 뉴스 포함
- [ ] **엔터테인먼트 차단**: Netflix, 영화, 음악 뉴스 없음
- [ ] **번역 품질**: 자연스러운 한국어
- [ ] **중복 없음**: 동일 뉴스 여러 번 표시되지 않음

### 문제 발생 시 확인 사항
```bash
# Q1: 뉴스가 표시되지 않아요
→ Backend 콘솔에서 에러 메시지 확인
→ NEWSAPI_KEY, ANTHROPIC_API_KEY 설정 확인

# Q2: 엔터테인먼트 뉴스가 섞여요
→ Backend 콘솔에서 ⛔ Excluded 로그 확인
→ EXCLUDE_KEYWORDS에 해당 키워드 추가

# Q3: 중요한 코인 뉴스가 빠져요
→ Backend 콘솔에서 Rejected 로그 확인
→ MUST_HAVE_KEYWORDS에 코인 심볼 추가
```

---

## 📊 변경 전후 비교 (예상)

### 현재 (변경 전)
```
필수 키워드: 52개
제외 키워드: 115개
뉴스 통과율: 45% (18/40)
주요 코인 커버리지: 70%
DeFi/NFT 커버리지: 40%
False Positive: 10%
```

### 옵션 1 적용 후
```
필수 키워드: 70개 (+18)
제외 키워드: 115개
뉴스 통과율: 55% (22/40)
주요 코인 커버리지: 100% ✅
DeFi/NFT 커버리지: 40%
False Positive: 10%
```

### 옵션 2 적용 후
```
필수 키워드: 85개 (+33)
제외 키워드: 115개
뉴스 통과율: 65% (26/40)
주요 코인 커버리지: 100% ✅
DeFi/NFT 커버리지: 80% ✅
False Positive: 12%
```

### 옵션 3 적용 후
```
필수 키워드: 85개 (+33)
제외 키워드: 118개 (+3, -3 정제)
예외 처리: 2개 추가
뉴스 통과율: 70% (28/40)
주요 코인 커버리지: 100% ✅
DeFi/NFT 커버리지: 90% ✅
False Positive: 5% ✅
```

---

## 🎯 개인 맞춤 조정 팁

### 뉴스가 너무 적을 때
```javascript
// 방법 1: 시간 가중치 연장
if (ageHours <= 12 && cryptoKeywordCount >= 1) {  // 6 → 12

// 방법 2: 키워드 밀도 완화
if (keywordDensity < 0.015) {  // 0.02 → 0.015

// 방법 3: 제목 키워드 요구사항 제거 (Lines 171-175 주석 처리)
```

### 뉴스가 너무 많을 때
```javascript
// 방법 1: 시간 가중치 단축
if (ageHours <= 3 && cryptoKeywordCount >= 1) {  // 6 → 3

// 방법 2: 키워드 밀도 강화
if (keywordDensity < 0.03) {  // 0.02 → 0.03

// 방법 3: 필수 키워드 개수 증가
if (cryptoKeywordCount < 3) {  // 2 → 3
```

### 엔터테인먼트 뉴스가 섞일 때
```javascript
// EXCLUDE_KEYWORDS에 추가
'podcast', 'spotify', 'tiktok', 'youtube creator', 'influencer',
'celebrity news', 'entertainment news', 'pop culture'
```

---

## 📝 변경 내역 기록 템플릿

```markdown
### 변경일: 2025-11-24
**변경자**: [본인 이름]
**적용 옵션**: 옵션 2 (균형 개선)

**변경 내용**:
- MUST_HAVE 추가: sui, ton, avalanche, ... (18개)
- MUST_HAVE 추가: aave, opensea, arbitrum, ... (15개)

**성능 변화**:
- Before: 40개 → 18개 (45%)
- After: 40개 → 26개 (65%)

**품질 평가**:
- 주요 코인 커버리지: 70% → 100% ✅
- DeFi/NFT 커버리지: 40% → 80% ✅
- False Positive: 10% → 12% (허용 범위)

**발견한 문제**:
- [문제 1: 설명]
- [문제 2: 설명]

**다음 계획**:
- [개선 계획]
```

---

## 🔗 추가 자료

- **전체 가이드**: [NEWS_FILTERING_GUIDE.md](NEWS_FILTERING_GUIDE.md)
- **코드 파일**: `backend/src/services/newsapi.js`
- **스케줄러**: `backend/src/services/scheduler.js`
- **DB 스키마**: `backend/scripts/translated_news.sql`

---

**마지막 업데이트**: 2025-11-24
**다음 검토**: 변경 후 24시간 이내
