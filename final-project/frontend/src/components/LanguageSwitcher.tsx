import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('zh-TW')}
        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition ${
          language === 'zh-TW'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span className="hidden sm:inline">繁體中文</span>
        <span className="sm:hidden">繁中</span>
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition ${
          language === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span className="hidden sm:inline">English</span>
        <span className="sm:hidden">Eng</span>
      </button>
    </div>
  )
}

