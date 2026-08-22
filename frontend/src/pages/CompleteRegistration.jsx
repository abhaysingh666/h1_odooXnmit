import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2Off,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage, passwordStrength } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const HIGHLIGHTS = [
  {
    icon: UserCheck,
    title: 'Your account already exists',
    description: 'HR created it for you — you only need to choose a password you control.',
  },
  {
    icon: CalendarClock,
    title: 'The link expires in 7 days',
    description: 'If it has lapsed, ask HR to re-issue your invitation.',
  },
  {
    icon: ShieldCheck,
    title: 'One-time token',
    description: 'The invitation is consumed on completion and cannot be reused.',
  },
];

export default function CompleteRegistration() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';

  const [form, setForm] = useState({ password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { completeRegistration } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const mismatch =
    form.confirm_password.length > 0 && form.confirm_password !== form.password;
  const canSubmit = strength.valid && !mismatch && form.confirm_password.length > 0;

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      const data = await completeRegistration({
        token,
        password: form.password,
        confirm_password: form.confirm_password,
      });

      const home = data.user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(home, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not complete your registration.'));
    } finally {
      setLoading(false);
    }
  };

  // No token - link was mistyped or truncated
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-orange-100">
              <Link2Off className="w-8 h-8 text-orange-600" />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Missing Invitation Token</h1>
              <p className="text-gray-600">
                This invitation link looks incomplete. Registration links carry a one-time token.
              </p>
            </div>

            <Alert tone="warning" title="Nothing to activate">
              Copy the entire registration link from your email or message. If it has expired, ask HR to create a fresh invitation.
            </Alert>

            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Panel - Branding & Info */}
        <div className="hidden lg:block space-y-8 p-8">
          {/* Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dayflow <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">HRMS</span>
                </h1>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Set your password<br />and you're in.
            </h2>
            <p className="text-lg text-gray-600">
              This is the last step of onboarding. Choose a password only you know — the temporary one your administrator generated stops working immediately.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            {HIGHLIGHTS.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 p-5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <Card className="shadow-2xl bg-white">
          <CardContent className="p-8 md:p-10 space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Dayflow <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">HRMS</span>
              </h1>
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 mx-auto">
                <KeyRound className="w-7 h-7 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Registration</h2>
              <p className="text-gray-600">
                Pick a password to finish activating your Dayflow account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New password<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Choose a strong password"
                    autoFocus
                    value={form.password}
                    onChange={update('password')}
                    disabled={loading}
                    required
                    className="w-full px-4 pr-12 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {form.password && (
                  <div className="text-xs space-y-1 mt-2">
                    <div className={strength.hasMinLength ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least 8 characters
                    </div>
                    <div className={strength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One uppercase letter
                    </div>
                    <div className={strength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One lowercase letter
                    </div>
                    <div className={strength.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One number
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                  Confirm password<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirm_password}
                    onChange={update('confirm_password')}
                    disabled={loading}
                    required
                    className={`w-full px-4 pr-12 py-3 rounded-lg border ${
                      mismatch ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                    } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mismatch && (
                  <p className="text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <Alert tone="error" title="Registration failed">
                  {error}
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={!canSubmit || loading}
              >
                {loading ? 'Activating your account…' : 'Activate Account'}
                {!loading && <CheckCircle2 className="w-5 h-5" />}
              </Button>
            </form>

            {/* Footer */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-xs">
                <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-gray-600">
                  By activating you confirm this account belongs to you. If you did not expect this invitation, contact your HR administrator before continuing.
                </p>
              </div>
              
              <p className="text-center text-sm text-gray-600">
                Already activated?{' '}
                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-700 underline-offset-4 transition-colors hover:underline"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
