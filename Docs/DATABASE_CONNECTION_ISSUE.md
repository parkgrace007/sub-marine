# Database Connection Issue - RLS Policy Cascade Problem

**Date**: 2025-11-24
**Severity**: Critical (Blocked all data loading)
**Duration**: ~2 hours
**Status**: ✅ RESOLVED

---

## 📋 요약 (Executive Summary)

**증상**: 프론트엔드에서 고래 데이터가 표시되지 않음
**원인**: `user_activity_logs` 테이블의 RLS 정책 순환 참조로 인한 Connection Pool 고갈
**해결**: 문제가 되는 테이블 완전 삭제 (Commit 886444c)

---

## 🔍 상세 분석

### 증상

```
✅ Backend: 백엔드 스크립트로 42개 inflow/outflow 고래 확인됨
✅ Database: Supabase에 2,820개 whale_events 존재
❌ Frontend: 프론트엔드에서 고래 0개 표시
❌ Loading: 데이터 fetch는 성공하지만 화면에 렌더링 안 됨
```

### 근본 원인: RLS Policy Cascade

#### 문제가 된 코드

**1. RLS 정책** (Commit 536688b에서 추가됨):
```sql
-- user_activity_logs 테이블
CREATE POLICY "Admins can read all activities"
  ON user_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

**2. Activity Tracker Hook** (매 페이지 로드마다 실행):
```javascript
// useActivityTracker.js (삭제됨)
export function useActivityTracker() {
  useEffect(() => {
    const initActivity = async () => {
      // 이 쿼리가 Connection Pool 점유
      const { data } = await supabase
        .from('user_activity_logs')
        .select('id')
        .eq('session_id', sessionIdRef.current)
        .single()
      // ...
    }
    initActivity()
  }, [user, profile, location.pathname])
}
```

**3. App 래퍼** (모든 페이지에 적용):
```javascript
// App.jsx
function App() {
  return (
    <AuthProvider>
      <ActivityTrackerWrapper>  {/* ← 모든 페이지에서 실행 */}
        <BrowserRouter>
          <Routes>...</Routes>
        </BrowserRouter>
      </ActivityTrackerWrapper>
    </AuthProvider>
  )
}
```

### 문제 발생 메커니즘

```
1. 페이지 로드
   ↓
2. ActivityTrackerWrapper 렌더링
   ↓
3. useActivityTracker hook 실행
   ↓
4. user_activity_logs 테이블 쿼리 시도
   ↓
5. RLS 정책 체크 시작
   ↓
6. profiles 테이블 조회 (EXISTS 서브쿼리)
   ↓
7. Connection Pool에서 연결 2개 점유 (메인 쿼리 + 서브쿼리)
   ↓
8. 익명 사용자는 profiles 테이블 접근 불가 → 쿼리 대기
   ↓
9. 다른 쿼리들(whale_events, indicator_alerts 등) 대기
   ↓
10. Connection Pool 고갈
    ↓
11. 모든 데이터 로딩 실패
```

**핵심 문제**:
- Supabase 무료 플랜은 제한된 Connection Pool 제공
- RLS 정책의 `EXISTS` 서브쿼리가 추가 연결 점유
- 익명 사용자는 profiles 접근 불가 → 쿼리 타임아웃
- 이 과정에서 Connection Pool이 고갈됨

---

## 🛠️ 해결 과정

### Timeline

| 시각 | Commit | 조치 | 효과 |
|------|--------|------|------|
| 17:27 | `536688b` | user_activity_logs 테이블 추가 | 문제 시작 |
| 17:54 | `babaa36` | ActivityTracker 비활성화 | 부분 해결 |
| 18:18 | `30e2a4a` | ActivityTracker 컴포넌트 제거 | 개선 |
| 18:45 | `886444c` | **user_activity_logs 테이블 삭제** | **✅ 완전 해결** |
| 18:55 | `901b3b2` | Connection test 추가 | 검증 |

### Commit 886444c 메시지

```
fix: Remove user activity tracking feature completely

Root cause: RLS policy on user_activity_logs created circular dependency
with profiles table, causing connection failures and slowdowns on every
page load.
```

---

## ⚠️ 잘못된 진단

### "로깅을 추가했더니 고쳐졌다"는 착각

**타임라인**:
```
18:45 → Commit 886444c (테이블 삭제) ← 실제 수정
18:55 → Commit 901b3b2 (connection test)
19:30 → 진단 로깅 추가 (관찰만, 수정 아님)
19:35 → 사용자 테스트: "작동한다!" ← 착각 발생
```

**진단 로깅은 순수 관찰 코드**:
```javascript
// 이런 코드들은 로직에 영향 없음
console.log('📊 Flow type distribution:', flowDistribution)
console.log('⏳ Setting loading=true')
console.warn('⚠️ Spawn BLOCKED!', { reason, loading })
```

**결론**:
- 로깅은 `console.log()` 문만 추가 → **로직 변화 없음**
- 실제로는 이미 Commit 886444c에서 고쳐졌음
- **Post hoc ergo propter hoc** 오류 (인과관계 착각)

---

## 🎓 교훈 및 재발 방지

### 1. RLS 정책에서 다른 테이블 참조 금지

#### ❌ 나쁜 예 (Cascade 발생)
```sql
CREATE POLICY "Check permission"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM other_table  -- ← 추가 연결 점유
      WHERE other_table.user_id = auth.uid()
    )
  );
```

#### ✅ 좋은 예 (캐시된 값 사용)
```sql
CREATE POLICY "Check permission"
  ON table_name
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'  -- ← 테이블 조회 없음
  );
```

### 2. Activity Tracking은 메인 플로우에서 분리

#### ❌ 나쁜 예 (메인 렌더 경로 블로킹)
```javascript
function App() {
  useActivityTracker()  // ← 모든 쿼리 블로킹 가능
  return <Routes>...</Routes>
}
```

#### ✅ 좋은 예 (Deferred + Circuit Breaker)
```javascript
function App() {
  useEffect(() => {
    // 5초 후 실행 (초기 로드 블로킹 안 함)
    const timer = setTimeout(async () => {
      try {
        await Promise.race([
          trackActivity(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
        ])
      } catch (err) {
        // Silent fail - 메인 기능에 영향 없음
        console.debug('Activity tracking failed:', err)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return <Routes>...</Routes>
}
```

### 3. Connection Pool 모니터링

```javascript
// utils/monitoring.js
export const monitorConnectionPool = async () => {
  try {
    const { data } = await supabase.rpc('pg_stat_activity_count')

    if (data > 80) {
      console.warn('⚠️ Connection pool nearing limit:', data)
      // Alert 발송 또는 메트릭 기록
    }

    return data
  } catch (err) {
    console.error('Failed to monitor connection pool:', err)
  }
}

// 주기적으로 실행
setInterval(monitorConnectionPool, 60000) // 1분마다
```

### 4. RLS 정책 테스트 프로토콜

```sql
-- 1. 익명 사용자로 테스트
SET ROLE anon;
SELECT * FROM user_activity_logs; -- 블로킹 없이 작동해야 함
RESET ROLE;

-- 2. 인증된 사용자로 테스트
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'test-user-id';
SELECT * FROM user_activity_logs;
RESET ROLE;

-- 3. 관리자로 테스트
SET ROLE authenticated;
SET request.jwt.claims.role TO 'admin';
SELECT * FROM user_activity_logs;
RESET ROLE;
```

### 5. Circuit Breaker 패턴

```javascript
// utils/circuitBreaker.js
export const withCircuitBreaker = async (fn, options = {}) => {
  const {
    timeout = 2000,
    fallback = null,
    onError = console.error
  } = options

  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
      )
    ])
    return result
  } catch (err) {
    onError(err)
    return fallback
  }
}

// 사용 예
const trackActivity = async (data) => {
  await withCircuitBreaker(
    () => supabase.from('activity').insert(data),
    {
      timeout: 2000,
      fallback: null,
      onError: (err) => console.debug('Activity tracking failed:', err)
    }
  )
}
```

---

## 📊 핵심 통계

| 지표 | 값 |
|------|-----|
| Supabase whale_events | 2,820개 |
| 8시간 inflow/outflow 고래 | 42개 |
| 문제 지속 시간 | ~2시간 |
| 영향받은 쿼리 | 모든 Supabase 쿼리 |
| 근본 원인 | RLS Policy Cascade |
| 실제 수정 커밋 | 886444c (18:45) |

---

## 🔍 진단 체크리스트

다음에 이런 문제가 발생하면 이 순서로 확인:

### 1단계: 데이터베이스 확인
```bash
# Backend 스크립트로 데이터 존재 여부 확인
node backend/scripts/testFrontendQuery.js
```

**기대 결과**: 데이터가 존재해야 함

### 2단계: Supabase 연결 테스트
```javascript
// Browser console에서 실행
const { data, error } = await supabase.from('whale_events').select('count', { count: 'exact', head: true })
console.log('Count:', data, 'Error:', error)
```

**기대 결과**: count가 반환되어야 함, error는 null

### 3단계: RLS 정책 확인
```sql
-- Supabase Dashboard → SQL Editor
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('whale_events', 'user_activity_logs', 'profiles');
```

**확인 사항**:
- `EXISTS` 서브쿼리 사용 여부
- 다른 테이블 참조 여부
- 익명 사용자 접근 가능 여부

### 4단계: Connection Pool 상태
```sql
-- Supabase Dashboard → SQL Editor
SELECT
  count(*) as active_connections,
  max_conn - count(*) as available_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') s;
```

**경고 기준**: available_connections < 20%

### 5단계: 느린 쿼리 확인
```sql
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

**조치**: 5초 이상 걸리는 쿼리 최적화 또는 kill

---

## 🚀 재발 방지 체크리스트

### 새로운 테이블 추가 시

- [ ] RLS 정책에 `EXISTS` 서브쿼리 사용 안 함
- [ ] `auth.jwt()` 또는 `auth.uid()` 직접 사용
- [ ] 익명 사용자로 쿼리 테스트 완료
- [ ] Connection pool 영향도 평가 완료

### Activity Tracking 추가 시

- [ ] 메인 렌더 경로와 분리
- [ ] Deferred 실행 (최소 5초 지연)
- [ ] Timeout 설정 (최대 2초)
- [ ] Circuit breaker 패턴 적용
- [ ] Silent fail 구현 (메인 기능 블로킹 안 함)

### 배포 전

- [ ] Supabase connection test 통과
- [ ] RLS 정책 검토 완료
- [ ] Connection pool 모니터링 설정
- [ ] 에러 로깅 및 알림 설정
- [ ] 롤백 계획 수립

---

## 📚 관련 문서

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## 📝 변경 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-11-24 | Claude Code | 초안 작성 |

---

**작성**: Claude Code Diagnostic Agent
**최종 업데이트**: 2025-11-24 19:45 KST
