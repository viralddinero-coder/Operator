import React, { useState, useEffect } from 'react';
import { CreditCard, Coins, Check, Gift } from 'lucide-react';
import { siteConfig } from '../config/site';
import { promotionalService, coinPackageService, coinService, siteService } from '../services/api';
import { CoinPackage } from '../types';
import { useAuthStore } from '../store';

const PurchaseCoinsPage: React.FC = () => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [currency, setCurrency] = useState<'EUR'|'SEK'>('EUR');
  const [siteId, setSiteId] = useState<string>('');
  const [packagesLoading, setPackagesLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    (async () => {
      // Identify current site
      const domain = window.location.host;
      const { site } = await siteService.getSiteByDomain(domain);
      if (site?.id) setSiteId(site.id);
      await loadPackages(site?.id);
    })();
  }, []);

  const loadPackages = async (sid?: string) => {
    try {
      const { packages: data, error } = sid
        ? await coinPackageService.getCoinPackagesForSite(sid, true)
        : await coinPackageService.getCoinPackages(true);
      if (!error && data) {
        setPackages(data);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      // Fallback to site config if API fails - convert to proper CoinPackage format
      const fallbackPackages: CoinPackage[] = [
        { id: '1', name: '1 Mynt', price: 1.5, coins: 1 },
        { id: '10', name: '10 Mynt', price: 15, coins: 10 },
        { id: '50', name: '50 Mynt', price: 70, coins: 50 },
        { id: '75', name: '75 Mynt', price: 97, coins: 75 },
        { id: '150', name: '150 Mynt', price: 180, coins: 150 },
        { id: '500', name: '500 Mynt', price: 550, coins: 500 },
        { id: '750', name: '750 Mynt', price: 750, coins: 750 },
      ].map(pkg => ({
        ...pkg,
        currency: 'EUR',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setPackages(fallbackPackages);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handlePurchase = async (pkg: CoinPackage) => {
    if (!user) {
      alert('Vänligen logga in för att köpa mynt');
      return;
    }

    try {
      setLoading(true);
      // Try to create payment session (production path)
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          promoCode: appliedCode?.code,
          userId: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.sessionUrl) {
          window.location.href = result.sessionUrl;
          return;
        }
        throw new Error('No payment session URL received');
      }

      // Fallback to development flow only
      if (import.meta.env.DEV) {
        const finalCoins = pkg.coins + (appliedCode?.discount_type === 'bonus_coins' ? appliedCode.discount_value : 0);
        const { error: coinError } = await coinService.addCoins(
          user.id,
          finalCoins,
          `Utvecklingsköp av mynt: ${pkg.name}`
        );
        if (coinError) throw coinError;

        if (appliedCode) {
          await promotionalService.usePromotionalCode(appliedCode.code, user.id);
        }

        alert(`Tack! ${finalCoins} mynt har lagts till på ditt konto.`);
        return;
      }

      throw new Error('Betalningsserver saknas. Kontakta support.');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Ett fel uppstod vid köpet. Vänligen försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      alert('Vänligen ange en kampanjkod');
      return;
    }

    setLoading(true);
    try {
      const { code, error } = await promotionalService.validatePromotionalCode(promoCode.trim().toUpperCase());
      
      if (error) {
        alert('Ogiltig kampanjkod: ' + error.message);
        setAppliedCode(null);
      } else if (code) {
        setAppliedCode(code);
        alert(`Kampanjkod tillämpad! Du får ${code.discount_value}${code.discount_type === 'percentage' ? '%' : code.discount_type === 'fixed_amount' ? ' kr rabatt' : ' bonusmynt'}`);
      }
    } catch (error) {
      alert('Fel vid validering av kampanjkod');
    } finally {
      setLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedCode(null);
    setPromoCode('');
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedCode) return originalPrice;
    
    switch (appliedCode.discount_type) {
      case 'percentage':
        return originalPrice * (1 - appliedCode.discount_value / 100);
      case 'fixed_amount':
        return Math.max(0, originalPrice - appliedCode.discount_value);
      case 'bonus_coins':
        return originalPrice; // Bonus coins don't affect price
      default:
        return originalPrice;
    }
  };

  const getDiscountText = (pkg: CoinPackage) => {
    if (!appliedCode) return null;
    
    const discountedPrice = calculateDiscountedPrice(pkg.price);
    
    if (appliedCode.discount_type === 'bonus_coins') {
      return `+${appliedCode.discount_value} bonusmynt!`;
    } else if (discountedPrice < pkg.price) {
      return `Du sparar ${pkg.price - discountedPrice} kr!`;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Köp mynt</h1>
          <p className="text-gray-600">Välj ett myntpaket för att fortsätta chatta</p>
        </div>

        {/* Promo Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Gift className="w-6 h-6 text-pink-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Har du en kampanjkod?</h2>
          </div>
          
          {!appliedCode ? (
            <div className="flex space-x-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Ange din kampanjkod"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                onClick={applyPromoCode}
                disabled={loading}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Validerar...' : 'Använd'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-800 font-medium">Kampanjkod tillämpad!</p>
                  <p className="text-green-600 text-sm">
                    Du får {appliedCode.discount_value}
                    {appliedCode.discount_type === 'percentage' ? '%' : 
                     appliedCode.discount_type === 'fixed_amount' ? ' kr rabatt' : ' bonusmynt'}
                  </p>
                </div>
                <button
                  onClick={removePromoCode}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Ta bort
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(packages.length > 0 ? packages : siteConfig.coinPackages).map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Coins className="h-8 w-8 text-yellow-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                
                <div className="mb-4">
                  {appliedCode && appliedCode.discount_type !== 'bonus_coins' && calculateDiscountedPrice(pkg.price) < pkg.price ? (
                    <div>
                      <p className="text-lg text-gray-500 line-through">€{pkg.price}</p>
                      <p className="text-3xl font-bold text-pink-500">€{calculateDiscountedPrice(pkg.price)}</p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-pink-500">€{pkg.price}</p>
                  )}
                  
                  {appliedCode && appliedCode.discount_type === 'bonus_coins' && (
                    <p className="text-sm text-green-600 font-medium">+{appliedCode.discount_value} bonusmynt!</p>
                  )}
                </div>
                
                <ul className="text-sm text-gray-600 mb-6 space-y-1">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {pkg.coins + (appliedCode?.discount_type === 'bonus_coins' ? appliedCode.discount_value : 0)} mynt
                    {appliedCode?.discount_type === 'bonus_coins' && (
                      <span className="ml-1 text-green-600 font-medium">(+{appliedCode.discount_value} bonus!)</span>
                    )}
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Ingen utgångstid
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Omedelbar leverans
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Köp nu</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Betalningsmetoder</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Kortbetalning</h3>
              <p className="text-sm text-gray-600">Visa, Mastercard, AMEX</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">PayPal</h3>
              <p className="text-sm text-gray-600">Snabb och säker</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Banköverföring</h3>
              <p className="text-sm text-gray-600">Direkt från din bank</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vanliga frågor</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Hur lång tid tar det att få mynten?</h3>
              <p className="text-gray-600">Mynten levereras omedelbart efter genomförd betalning.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Kan jag få tillbaka mina pengar?</h3>
              <p className="text-gray-600">Köpta mynt är inte återbetalningsbara enligt våra villkor.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Går mynten ut?</h3>
              <p className="text-gray-600">Nej, dina mynt har ingen utgångstid och gäller så länge ditt konto är aktivt.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCoinsPage;
