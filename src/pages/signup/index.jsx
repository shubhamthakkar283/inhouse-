import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, user, signOut, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/event-planning-dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (error) {
        setErrorMessage(error.message || 'Failed to create account. Please try again.');
      } else if (data?.user) {
        setSuccessMessage('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/event-planning-dashboard', { replace: true });
        }, 1500);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-8 group">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Icon name="Sparkles" size={26} color="white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Smart Event</span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">Planner</span>
            </div>
          </Link>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Create Account
            </h1>
            <p className="text-muted-foreground text-base">
              Start planning extraordinary events with AI
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
          {errorMessage && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl flex items-start space-x-3 animate-slide-in backdrop-blur-sm">
              <div className="flex items-center justify-center w-5 h-5 bg-error/20 rounded-full flex-shrink-0 mt-0.5">
                <Icon name="AlertCircle" size={14} className="text-error" />
              </div>
              <p className="text-sm text-error font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start space-x-3 animate-slide-in backdrop-blur-sm">
              <div className="flex items-center justify-center w-5 h-5 bg-success/20 rounded-full flex-shrink-0 mt-0.5">
                <Icon name="CheckCircle" size={14} className="text-success" />
              </div>
              <p className="text-sm text-success font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group">
              <label htmlFor="fullName" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                  <Icon name="User" size={14} className="text-primary" />
                </div>
                Full Name
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-input border-2 border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/30"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1 animate-slide-in">
                  <Icon name="AlertCircle" size={12} />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2 group">
              <label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                  <Icon name="Mail" size={14} className="text-primary" />
                </div>
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-input border-2 border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/30"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1 animate-slide-in">
                  <Icon name="AlertCircle" size={12} />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2 group">
              <label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                  <Icon name="Lock" size={14} className="text-primary" />
                </div>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 bg-input border-2 border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Icon name="Info" size={12} />
                Must be at least 6 characters
              </p>
              {errors.password && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1 animate-slide-in">
                  <Icon name="AlertCircle" size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2 group">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                  <Icon name="Lock" size={14} className="text-primary" />
                </div>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 bg-input border-2 border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-error mt-1.5 flex items-center gap-1 animate-slide-in">
                  <Icon name="AlertCircle" size={12} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                size="lg"
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-lg py-3.5"
                iconName="Sparkles"
                iconPosition="right"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-secondary font-semibold transition-colors inline-flex items-center gap-1 group"
                >
                  Sign in
                  <Icon name="ArrowRight" size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our{' '}
            <a href="#" className="text-primary hover:text-secondary transition-colors font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:text-secondary transition-colors font-medium">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
