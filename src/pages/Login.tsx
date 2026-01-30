import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Zap, UserPlus } from 'lucide-react';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import kreatoLogo from '@/assets/kreato-logo.png';

const Login = () => {
  // Login form state
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Signup form state
  const [signupNome, setSignupNome] = useState('');
  const [signupUsuario, setSignupUsuario] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupSenha, setSignupSenha] = useState('');
  const [signupConfirmSenha, setSignupConfirmSenha] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
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

    const result = await login(email, senha);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || t('login.error'));
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signupSenha !== signupConfirmSenha) {
      setSignupError('As senhas não coincidem');
      return;
    }

    if (signupSenha.length < 6) {
      setSignupError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSigningUp(true);

    const result = await signup(signupEmail, signupSenha, signupNome, signupUsuario);
    
    if (result.success) {
      setSignupSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.');
      setSignupNome('');
      setSignupUsuario('');
      setSignupEmail('');
      setSignupSenha('');
      setSignupConfirmSenha('');
    } else {
      setSignupError(result.error || 'Erro ao criar conta');
    }
    setIsSigningUp(false);
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
      <div className="absolute top-4 right-4 z-50">
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
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-800/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-kreato-cyan/20">
                  <LogIn size={16} className="mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-kreato-cyan/20">
                  <UserPlus size={16} className="mr-2" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                      E-mail
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-kreato-cyan/0 via-kreato-cyan/50 to-kreato-cyan/0 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signupNome" className="text-slate-300 text-sm font-medium">
                      Nome Completo
                    </Label>
                    <Input
                      id="signupNome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      required
                      className="h-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupUsuario" className="text-slate-300 text-sm font-medium">
                      Nome de Usuário
                    </Label>
                    <Input
                      id="signupUsuario"
                      type="text"
                      placeholder="seu_usuario"
                      value={signupUsuario}
                      onChange={(e) => setSignupUsuario(e.target.value)}
                      required
                      className="h-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-slate-300 text-sm font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signupSenha" className="text-slate-300 text-sm font-medium">
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="signupSenha"
                          type={showSignupPassword ? 'text' : 'password'}
                          placeholder="••••••"
                          value={signupSenha}
                          onChange={(e) => setSignupSenha(e.target.value)}
                          required
                          minLength={6}
                          className="h-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-kreato-cyan"
                        >
                          {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupConfirmSenha" className="text-slate-300 text-sm font-medium">
                        Confirmar
                      </Label>
                      <Input
                        id="signupConfirmSenha"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={signupConfirmSenha}
                        onChange={(e) => setSignupConfirmSenha(e.target.value)}
                        required
                        minLength={6}
                        className="h-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-kreato-cyan/50 focus:ring-kreato-cyan/20"
                      />
                    </div>
                  </div>

                  {signupError && (
                    <div className="relative overflow-hidden rounded-md">
                      <div className="absolute inset-0 bg-destructive/20" />
                      <p className="text-sm text-destructive text-center py-2 relative">
                        {signupError}
                      </p>
                    </div>
                  )}

                  {signupSuccess && (
                    <div className="relative overflow-hidden rounded-md">
                      <div className="absolute inset-0 bg-green-500/20" />
                      <p className="text-sm text-green-400 text-center py-2 relative">
                        {signupSuccess}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-kreato-cyan via-primary to-kreato-orange hover:opacity-90 transition-all duration-300 text-white font-semibold"
                    disabled={isSigningUp}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {isSigningUp ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        <UserPlus size={18} />
                        Criar Conta
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Version Badge */}
      <div className={`absolute bottom-4 right-4 text-xs text-slate-600 flex items-center gap-2 transition-all duration-1000 delay-1200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <span className="w-2 h-2 rounded-full bg-kreato-cyan/50 animate-pulse" />
        v1.0.0
      </div>
    </div>
  );
};

export default Login;
