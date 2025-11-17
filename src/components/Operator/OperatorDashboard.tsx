import React, { useEffect, useMemo, useState } from 'react'
import { Clock, MessageCircle, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store'
import { operatorService } from '../../services/api'

const fmt = (n: number) => new Intl.NumberFormat('sv-SE').format(n)

const OperatorDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [todaySent, setTodaySent] = useState(0)
  const [todayReceived, setTodayReceived] = useState(0)
  const [monthSent, setMonthSent] = useState(0)
  const [monthReceived, setMonthReceived] = useState(0)
  const [prevMonths, setPrevMonths] = useState<Array<{ label: string; sent: number; received: number }>>([])
  const [activeChats, setActiveChats] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [avgReplySec, setAvgReplySec] = useState(0)
  const [throughput, setThroughput] = useState(0)

  const startOfDay = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d.toISOString()
  }, [])
  const startOfMonth = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString()
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const uid = user.id

      const { data: msgsTodaySent } = await supabase.from('messages').select('id').eq('sender_id', uid).gte('created_at', startOfDay)
      const { data: msgsTodayRecv } = await supabase.from('messages').select('id').eq('recipient_id', uid).gte('created_at', startOfDay)
      setTodaySent((msgsTodaySent || []).length)
      setTodayReceived((msgsTodayRecv || []).length)

      const { data: msgsMonthSent } = await supabase.from('messages').select('id').eq('sender_id', uid).gte('created_at', startOfMonth)
      const { data: msgsMonthRecv } = await supabase.from('messages').select('id').eq('recipient_id', uid).gte('created_at', startOfMonth)
      setMonthSent((msgsMonthSent || []).length)
      setMonthReceived((msgsMonthRecv || []).length)

      const months: Array<{ label: string; start: string; end: string }> = []
      const now = new Date()
      for (let i=1;i<=6;i++) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
        const start = new Date(d); start.setHours(0,0,0,0)
        const end = new Date(d.getFullYear(), d.getMonth()+1, 1); end.setHours(0,0,0,0)
        months.push({ label: d.toLocaleString('sv-SE', { month: 'short', year: 'numeric' }), start: start.toISOString(), end: end.toISOString() })
      }
      const hist: Array<{ label: string; sent: number; received: number }> = []
      for (const m of months) {
        const { data: s } = await supabase.from('messages').select('id').eq('sender_id', uid).gte('created_at', m.start).lt('created_at', m.end)
        const { data: r } = await supabase.from('messages').select('id').eq('recipient_id', uid).gte('created_at', m.start).lt('created_at', m.end)
        hist.push({ label: m.label, sent: (s||[]).length, received: (r||[]).length })
      }
      setPrevMonths(hist)

      const { data: locks } = await supabase.from('operator_locks').select('id').eq('operator_id', uid).eq('is_active', true)
      setActiveChats((locks || []).length)

      const { profiles } = await operatorService.getTargetsOnlineForOperator()
      setOnlineUsers((profiles || []).length)

      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, sender_id, recipient_id, created_at')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .gte('created_at', new Date(Date.now() - 7*24*3600*1000).toISOString())
        .order('created_at', { ascending: true })

      let totalDiff = 0; let count = 0
      const byConv: Record<string, Array<any>> = {}
      for (const m of (lastMsgs || [])) {
        if (!byConv[m.conversation_id]) byConv[m.conversation_id] = []
        byConv[m.conversation_id].push(m)
      }
      for (const conv of Object.values(byConv)) {
        for (let i=1;i<conv.length;i++) {
          const prev = conv[i-1], cur = conv[i]
          if (cur.sender_id === uid && prev.sender_id !== uid) {
            const diff = (new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime())/1000
            totalDiff += diff; count++
          }
        }
      }
      setAvgReplySec(count ? totalDiff / count : 0)

      const hoursPassed = Math.max(1, (Date.now() - new Date().setHours(0,0,0,0)) / 3600000)
      setThroughput(todaySent / hoursPassed)
    }
    load()
  }, [user?.id, startOfDay, startOfMonth])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operatör Dashboard</h1>
          <p className="text-gray-600">Affilyx Operators · Översikt</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Skickade denna månad</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(monthSent)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Mottagna denna månad</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(monthReceived)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Dagens skickade / mottagna</p>
            <p className="text-xl font-semibold text-gray-900">{fmt(todaySent)} / {fmt(todayReceived)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktiva chattar</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(activeChats)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online användare</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(onlineUsers)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Svarstid & Prestanda</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="h-5 w-5" />
                  <span>Genomsnittlig svarstid</span>
                </div>
                <span className="font-semibold">{Math.round(avgReplySec)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Dagens throughput (meddelanden/timme)</span>
                <span className="font-semibold">{throughput.toFixed(1)}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Tidigare månader</p>
                <div className="grid grid-cols-2 gap-2">
                  {prevMonths.map((m) => (
                    <div key={m.label} className="border rounded p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">{m.label}</span>
                      <span className="text-sm font-semibold">{fmt(m.sent)} / {fmt(m.received)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Kommentarer</h2>
            </div>
            <div className="p-6 text-sm text-gray-700">
              <p>Fokusera på snabb respons och håll samtal varma. Prestandakort visar din nuvarande takt och historik per månad.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperatorDashboard
