import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function NicknameModal({ isOpen, onClose }) {
  const { profile, updateNickname } = useAuth()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname)
    }
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 닉네임 유효성 검사
    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2-20자 사이여야 합니다')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      setError('닉네임은 영문, 숫자, 한글, _ 만 사용 가능합니다')
      setLoading(false)
      return
    }

    const { error } = await updateNickname(nickname)
    setLoading(false)

    if (error) {
      if (error.code === '23505') { // UNIQUE constraint violation
        setError('이미 사용 중인 닉네임입니다')
      } else {
        setError('닉네임 업데이트 실패: ' + error.message)
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-100 border border-surface-300 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-surface-600 mb-4">닉네임 설정</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-500 mb-2">
              닉네임 (2-20자)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-md text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="닉네임을 입력하세요"
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface-200 hover:bg-surface-300 border border-surface-300 text-surface-600 font-medium rounded-md transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-all disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NicknameModal
