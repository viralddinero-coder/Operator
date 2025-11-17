import React, { useEffect, useState } from 'react'

const CookieBar: React.FC = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(localStorage.getItem('cookie_consent') !== 'accepted') }, [])
  if (!visible) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to enhance your experience. By using this site you agree to our{' '}
          <a href="/privacy" className="underline">Privacy Policy</a> and <a href="/terms" className="underline">Terms</a>. GDPR compliant.
        </p>
        <button onClick={() => { localStorage.setItem('cookie_consent','accepted'); setVisible(false) }} className="bg-white text-black px-4 py-2 rounded">
          Accept
        </button>
      </div>
    </div>
  )
}

export default CookieBar

