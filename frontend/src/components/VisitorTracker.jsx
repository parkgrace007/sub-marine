/**
 * VisitorTracker - 방문자 추적 컴포넌트
 * BrowserRouter 내부에서 useVisitorTracking 훅을 사용
 * 렌더링 없이 백그라운드에서 동작
 */

import { useVisitorTracking } from '../hooks/useVisitorTracking'

function VisitorTracker() {
  // 훅만 호출하고 아무것도 렌더링하지 않음
  useVisitorTracking()
  return null
}

export default VisitorTracker
