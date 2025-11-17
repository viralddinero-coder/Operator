import { createClient } from '@supabase/supabase-js';
import { coinService } from '../src/services/api.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function createPaygateSession(req, res) {
  try {
    const { packageId, promoCode, userId } = req.body;
    
    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', packageId)
      .single();
    
    if (pkgError || !pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Validate promotional code if provided
    let finalPrice = pkg.price;
    let appliedCode = null;
    
    if (promoCode) {
      const { data: code, error: codeError } = await supabase
        .from('promotional_codes')
        .select(`
          *,
          promotional_campaigns!inner(*)
        `)
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();
      
      if (!codeError && code) {
        // Check usage limits
        const { count } = await supabase
          .from('user_code_usage')
          .select('*', { count: 'exact', head: true })
          .eq('code_id', code.id)
          .eq('user_id', userId);
        
        if (count < code.max_uses) {
          appliedCode = code;
          
          // Calculate discounted price
          if (code.discount_type === 'percentage') {
            finalPrice = pkg.price * (1 - code.discount_value / 100);
          } else if (code.discount_type === 'fixed_amount') {
            finalPrice = Math.max(0, pkg.price - code.discount_value);
          }
          // bonus_coins doesn't affect price
        }
      }
    }

    // Create payment session with Paygate
    const paygateData = {
      merchantId: process.env.PAYGATE_MERCHANT_ID,
      amount: Math.round(finalPrice * 100), // Convert to cents
      currency: 'SEK',
      orderId: `coin_${Date.now()}_${userId}`,
      description: `${pkg.name} - ${pkg.coins} coins`,
      returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      callbackUrl: `${process.env.API_URL}/api/payment/callback`
    };

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        package_id: packageId,
        amount: finalPrice,
        currency: 'SEK',
        status: 'pending',
        promo_code_id: appliedCode?.id,
        original_amount: pkg.price,
        coins_amount: pkg.coins + (appliedCode?.discount_type === 'bonus_coins' ? appliedCode.discount_value : 0),
        payment_provider: 'paygate',
        provider_order_id: paygateData.orderId
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Here you would make the actual API call to Paygate
    // For now, we'll simulate a successful session creation
    const sessionUrl = `${process.env.PAYGATE_API_URL}/payment/${payment.id}`;

    res.json({
      success: true,
      sessionUrl,
      paymentId: payment.id,
      amount: finalPrice,
      coins: payment.coins_amount
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
}

export async function handlePaygateCallback(req, res) {
  try {
    const { orderId, status, transactionId } = req.body;
    
    // Find payment by order ID
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_order_id', orderId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'completed') {
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          provider_transaction_id: transactionId,
          completed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Add coins to user
      await coinService.addCoins(
        payment.user_id,
        payment.coins_amount,
        `Coin purchase - ${payment.package_id}`,
        payment.id
      );

      // Track promotional code usage if applicable
      if (payment.promo_code_id) {
        await supabase
          .from('user_code_usage')
          .insert({
            user_id: payment.user_id,
            code_id: payment.promo_code_id,
            used_at: new Date().toISOString()
          });
      }

      res.json({ success: true });
    } else if (status === 'failed') {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          provider_transaction_id: transactionId,
          failed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid status' });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Payment callback failed' });
  }
}