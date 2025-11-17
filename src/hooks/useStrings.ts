import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { defaultStrings, getStrings, Lang } from '../config/strings'

export const useStrings = (namespace: 'operator', lang: Lang = 'en') => {
  const [strings, setStrings] = useState(defaultStrings[lang][namespace])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', `strings_${namespace}`).maybeSingle()
      if (data?.value) {
        setStrings({ ...getStrings(lang)[namespace], ...data.value })
      } else {
        setStrings(getStrings(lang)[namespace])
      }
    }
    load()
  }, [namespace, lang])

  return strings
}

