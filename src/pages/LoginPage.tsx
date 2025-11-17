import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../config/site';
import { authService } from '../services/api';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

interface LoginForm {
  identifier: string; // email or username
  password: string;
}

interface Props {
  requiredRole?: 'user' | 'operator' | 'admin';
}

const LoginPage: React.FC<Props> = ({ requiredRole = 'user' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();
  const [brandTitle, setBrandTitle] = useState(requiredRole==='admin'?'Affilyx Marketing Admin': requiredRole==='operator'?'Affilyx Operators': siteConfig.name)
  const [brandQuote, setBrandQuote] = useState(requiredRole==='operator'?'WE MAKE IT TODAY AS WELL': requiredRole==='admin'?'Own the day. Own the outcome.':'Login to continue')
  const [logoUrl, setLogoUrl] = useState<string>(requiredRole==='admin'?'https://iili.io/f9q7aUv.png': requiredRole==='operator'?'https://iili.io/f9qV4wJ.png':'')

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      let email = data.identifier;
      if (!email.includes('@')) {
        const roleFilter = requiredRole !== 'user' ? requiredRole : undefined;
        const { email: mappedEmail } = await (await import('../services/api')).userService.getEmailByUsername(data.identifier, roleFilter as any);
        email = mappedEmail || `${data.identifier}@affilyx.local`;
      }
      const { user, session, error } = await authService.signIn(email, data.password);
      
      if (error) {
        toast.error('Inloggning misslyckades: ' + error.message);
        return;
      }
      
      if (user && session) {
        const { data: rows } = await supabase
          .from('users')
          .select('role,username')
          .eq('id', user.id)
          .limit(1);
        const role = rows && rows[0] ? (rows[0].role as ('user'|'operator'|'admin')) : 'user';
        setUser({ ...(user as any), role } as any);
        setProfile(rows && rows[0] ? { ...(rows[0] as any) } : undefined);
        
        // Enforce role when logging in via panel-specific login
        if (requiredRole && role !== requiredRole) {
          await authService.signOut();
          toast.error('Fel panel: ditt konto har rollen ' + role + ' och kan inte logga in här');
          return;
        }

        toast.success('Välkommen tillbaka!');
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'operator') {
          navigate('/operator');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid inloggning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { (async () => {
    const keys = requiredRole==='admin' 
      ? ['admin_brand_title','admin_brand_quote','admin_logo_url'] 
      : requiredRole==='operator' 
        ? ['operator_brand_quote','operator_logo_url']
        : []
    if (keys.length>0) {
      const { data } = await supabase.from('system_settings').select('key,value').in('key', keys)
      const map: Record<string, any> = {}
      for (const row of (data||[])) map[row.key] = row.value
      if (requiredRole==='admin') {
        if (map['admin_brand_title']) setBrandTitle(map['admin_brand_title'])
        if (map['admin_brand_quote']) setBrandQuote(map['admin_brand_quote'])
        if (map['admin_logo_url']) setLogoUrl(map['admin_logo_url'])
      } else if (requiredRole==='operator') {
        if (map['operator_brand_quote']) setBrandQuote(map['operator_brand_quote'])
        if (map['operator_logo_url']) setLogoUrl(map['operator_logo_url'])
      }
    }
  })() }, [requiredRole])

  const handleFacebookLogin = async () => {
    try {
      const { error } = await authService.signInWithOAuth('facebook');
      if (error) {
        toast.error('Facebook login failed');
      } else {
        toast.info('Redirecting to Facebook...');
      }
    } catch {
      toast.error('Could not initiate Facebook login');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={ requiredRole==='operator' 
        ? { backgroundImage: `linear-gradient(#1f1f1f, #2b2b2b)` }
        : { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${siteConfig.backgroundImage})` }
      }
    >
      <div className="w-full max-w-md mx-4">
        {/* Login Card */}
        <div className={`${requiredRole==='admin'?'bg-white rounded-none shadow-xl border': requiredRole==='operator'?'bg-transparent rounded-none shadow-none':'bg-white rounded-2xl shadow-2xl'} p-8`}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              {logoUrl ? (
                <img src={logoUrl} alt="brand" className={`${requiredRole==='admin'?'h-32': requiredRole==='operator'?'h-40':'h-10'} mx-auto`} />
              ) : (
                <Heart className="h-8 w-8 text-pink-500" />
              )}
              {requiredRole === 'user' && (
                <span className="text-2xl font-bold text-gray-900">{brandTitle}</span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${requiredRole==='operator'?'text-white':'text-gray-900'} mb-2`}>{requiredRole==='admin' ? 'Welcome back Admin!' : 'Welcome back!'}</h1>
            <p className={`${requiredRole==='operator'?'text-white':'text-gray-600'}`}>{brandQuote}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identifier Input (email or username) */}
            <div>
              <input
                type="text"
                placeholder="Email or Username"
                {...register('identifier', { required: 'Identifier is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${requiredRole==='admin'?'bg-black hover:bg-gray-900': requiredRole==='operator'?'bg-blue-600 hover:bg-blue-700':'bg-pink-600 hover:bg-pink-700'} text-white py-3 px-4 ${requiredRole==='admin' || requiredRole==='operator' ? 'rounded-none' : 'rounded-xl'} font-medium focus:outline-none focus:ring-2 ${requiredRole==='admin'?'focus:ring-black': requiredRole==='operator'?'focus:ring-blue-500':'focus:ring-pink-500'} focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Loggar in...' : 'Login'}
            </button>

            {/* Facebook Login (endast användare) */}
            {requiredRole === 'user' && (
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="w-full mt-3 border border-pink-600 text-pink-700 py-3 px-4 rounded-xl font-medium hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all"
              >
                Continue with Facebook
              </button>
            )}

            {/* Forgot Password Link */}
            {requiredRole === 'user' && (
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            {/* Register Link */}
            {requiredRole === 'user' && (
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
