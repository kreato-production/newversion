import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Zap, Sun, Moon } from 'lucide-react';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useTheme } from '@/hooks/use-theme';
import kreatoLogo from '@/assets/kreato-logo.png';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(usuario, senha);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || t('login.error'));
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-8 h-8 border-2 border-kreato-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="flex items-center bg-slate-800/50 rounded-md border border-slate-700/50 p-0.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              theme === 'light'
                ? 'bg-kreato-cyan/20 text-kreato-cyan shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun size={14} />
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-kreato-cyan/20 text-kreato-cyan shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon size={14} />
            Escuro
          </button>
        </div>
        <LanguageSelector 
          variant="ghost" 
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        />
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kreato-cyan/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kreato-orange/10 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-4000" />
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-kreato-cyan/60 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-kreato-cyan/50 to-transparent animate-scan-line" />
      </div>
      
      {/* Main Card */}
      <div className={`relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Glowing Border Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-kreato-cyan/50 via-primary/50 to-kreato-orange/50 rounded-xl blur-sm opacity-75 animate-border-glow" />
        
        <Card className="w-full max-w-md relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-kreato-cyan/10">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-kreato-cyan/70 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-kreato-cyan/70 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-kreato-orange/70 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-kreato-orange/70 rounded-br-xl" />
          
          <CardHeader className="text-center space-y-4 pt-8">
            {/* Logo with Glow */}
            <div className={`flex justify-center transition-all duration-700 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div className="relative group">
                <div className="absolute inset-0 bg-kreato-cyan/30 rounded-full blur-xl group-hover:bg-kreato-cyan/50 transition-all duration-500" />
                <img 
                  src={kreatoLogo} 
                  alt="Kreato" 
                  className="h-20 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all duration-500" 
                />
              </div>
            </div>
            
            <div className={`space-y-2 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-kreato-cyan to-white bg-clip-text text-transparent">
                {t('login.welcome')}
              </CardTitle>
              <CardDescription className="text-slate-400 flex items-center justify-center gap-2">
                <Zap size={14} className="text-kreato-cyan animate-pulse" />
                {t('login.subtitle')}
                <Zap size={14} className="text-kreato-orange animate-pulse" />
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className={`transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-slate-300 text-sm font-medium">
                  Usuário
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-kreato-cyan/0 via-kreato-cyan/50 to-kreato-cyan/0 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20 transition-all duration-300 relative"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-slate-300 text-sm font-medium">
                  {t('login.password')}
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-kreato-cyan/0 via-kreato-cyan/50 to-kreato-cyan/0 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.password.placeholder')}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20 pr-12 transition-all duration-300 relative"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-kreato-cyan transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="relative overflow-hidden rounded-md">
                  <div className="absolute inset-0 bg-destructive/20 animate-pulse" />
                  <p className="text-sm text-destructive text-center py-2 relative">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-kreato-cyan via-primary to-kreato-orange hover:opacity-90 transition-all duration-300 text-white font-semibold"
                disabled={isLoading}
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {isLoading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('login.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <LogIn size={18} />
                    {t('login.submit')}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-float-particle { animation: float-particle 8s ease-in-out infinite; }
        .animate-scan-line { animation: scan-line 3s ease-in-out infinite; }
        .animate-border-glow { animation: border-glow 2s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Login;
