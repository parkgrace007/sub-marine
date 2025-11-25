import { useTranslation } from 'react-i18next'

/**
 * LanguageToggle - 한글/영어 토글 버튼
 *
 * 심플한 토글 스위치 디자인
 * localStorage에 선택한 언어 저장
 */
function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation()
  const isKorean = i18n.language === 'ko' || i18n.language.startsWith('ko-')

  const toggleLanguage = () => {
    const newLang = isKorean ? 'en' : 'ko'
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`
        relative flex items-center gap-1 px-2 py-1 rounded-md
        bg-surface-200 hover:bg-surface-300
        border border-surface-300
        transition-all duration-200
        text-xs font-medium
        ${className}
      `}
      title={isKorean ? 'Switch to English' : '한국어로 변경'}
    >
      {/* Korean indicator */}
      <span className={`
        px-1.5 py-0.5 rounded transition-all duration-200
        ${isKorean
          ? 'bg-primary text-white'
          : 'text-surface-500 hover:text-surface-600'
        }
      `}>
        한
      </span>

      {/* Divider */}
      <span className="text-surface-400">/</span>

      {/* English indicator */}
      <span className={`
        px-1.5 py-0.5 rounded transition-all duration-200
        ${!isKorean
          ? 'bg-primary text-white'
          : 'text-surface-500 hover:text-surface-600'
        }
      `}>
        EN
      </span>
    </button>
  )
}

export default LanguageToggle
