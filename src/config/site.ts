export const siteConfig = {
  name: 'Dejtlycka',
  description: 'Hitta din perfekta match',
  primaryColor: '#DC143C',
  secondaryColor: '#FFB6C1',
  backgroundImage: 'https://images.unsplash.com/photo-1516908205727-40afad9449dd?q=80&w=1600&auto=format&fit=crop',
  logo: '/logo.png',
  features: {
    enableCoins: true,
    enableChat: true,
    enablePhotos: true,
    enableSearch: true
  },
  coinPackages: [
    { id: '50-coins', name: '50 mynt', price: 49, coins: 50 },
    { id: '100-coins', name: '100 mynt', price: 89, coins: 100 },
    { id: '250-coins', name: '250 mynt', price: 199, coins: 250 },
    { id: '500-coins', name: '500 mynt', price: 349, coins: 500 }
  ]
} as const
