import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { siteService } from '../services/api';
import CookieBar from '../components/CookieBar';
import { User, Mail, Lock, Camera, MapPin, Calendar, User as UserIcon } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  gender: string;
  location: string;
}

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  const password = watch('password');

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { user, error } = await authService.signUp(data.email, data.password, {
        name: data.name,
        age: data.age,
        gender: data.gender as 'male' | 'female' | 'other',
        location: data.location,
        site_id: 'default-site-id' // This should come from current site context
      });
      
      if (error) {
        toast.error('Registrering misslyckades: ' + error.message);
        return;
      }
      
      if (user) {
        const { profile } = await authService.getUserProfile(user.id);
        setUser(user);
        setProfile(profile);

        if (file && profile?.id) {
          const { photo, error: uploadError } = await (await import('../services/api')).photoService.uploadPhoto(file, user.id, profile.id);
          if (uploadError) {
            toast.error('Kunde inte ladda upp profilbild');
          } else if (photo) {
            toast.success('Profilbild uppladdad');
          }
        }

        // Capture affiliate referral if present
        const ref = searchParams.get('ref') || localStorage.getItem('ref');
        if (ref) {
          const { data: link } = await supabase.from('affiliate_links').select('id').eq('code', ref).single();
          if (link?.id) {
            await supabase.from('affiliate_referrals').insert({ affiliate_link_id: link.id, user_id: user.id, profile_name: profile?.name || null });
          }
          localStorage.removeItem('ref');
        }

        toast.success('Välkommen! Ditt konto har skapats.');
        navigate('/');
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid registrering');
    } finally {
      setIsLoading(false);
    }
  };

  const [bgUrl, setBgUrl] = useState<string | null>(null)
  useEffect(() => { (async () => { 
    const domain = window.location.hostname
    const { site } = await siteService.getSiteByDomain(domain)
    if (site?.id) {
      const { data } = await supabase.from('system_settings').select('value').eq('key',`site:${site.id}:registration_bg_url`).maybeSingle();
      if (data?.value) { setBgUrl(data.value); return }
    }
    const { data } = await supabase.from('system_settings').select('value').eq('key','registration_bg_url').maybeSingle();
    setBgUrl(data?.value || null)
  })() }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={bgUrl?{backgroundImage:`linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${bgUrl})`}:{}}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-pink-500" />
              <span className="text-2xl font-bold text-gray-900">Register</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of 2</span>
              <span className="text-sm text-gray-500">{step === 1 ? 'Basics' : 'Profile'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                {/* Step 1: Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your name"
                      {...register('name', { required: 'Namn är obligatoriskt' })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('email', { 
                        required: 'E-post är obligatoriskt',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Ogiltig e-postadress'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      {...register('password', { 
                        required: 'Lösenord är obligatoriskt',
                        minLength: {
                          value: 6,
                          message: 'Lösenordet måste vara minst 6 tecken'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Upprepa lösenordet"
                      {...register('confirmPassword', { 
                        required: 'Confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Step 2: Profile Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="18-100"
                      {...register('age', { 
                        required: 'Ålder är obligatoriskt',
                        min: {
                          value: 18,
                          message: 'Du måste vara minst 18 år'
                        },
                        max: {
                          value: 100,
                          message: 'Ogiltig ålder'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    {...register('gender', { required: 'Kön är obligatoriskt' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Choose gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City or area"
                      {...register('location', { required: 'Plats är obligatoriskt' })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile photo</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors cursor-pointer block">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload a photo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        if (f) {
                          const url = URL.createObjectURL(f);
                          setPreviewUrl(url);
                        } else {
                          setPreviewUrl(null);
                        }
                      }}
                    />
                  </label>
                  {file && <p className="mt-2 text-xs text-gray-500">Vald fil: {file.name}</p>}
                  {previewUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                      <div className="px-3 py-2 text-xs text-gray-500">Preview (not uploaded yet)</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ml-auto px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
                >
                  Next step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              )}
            </div>
          </form>

          <CookieBar />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
