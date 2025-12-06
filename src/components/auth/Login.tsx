import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { hasSupabase } from '@/lib/supabaseClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    setSupabaseConfigured(hasSupabase);
    if (!hasSupabase) {
      toast({
        title: 'Configuration Error',
        description: 'Supabase is not configured. Please check your .env file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      // Don't set loading to false here - the auth state change will handle navigation
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || 'Failed to sign in. Please check your credentials.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="card-elevated p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">RealCRM</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          {!supabaseConfigured && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Supabase Not Configured</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading || !supabaseConfigured}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading || !supabaseConfigured}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary border-0"
              disabled={isLoading || !supabaseConfigured}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Don't have an account? Contact your manager to get access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

