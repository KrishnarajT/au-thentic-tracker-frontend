import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignup: boolean;
}

const LoginForm = ({ onToggleMode, isSignup }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const success = isSignup ? await signup(username, password) : await login(username, password);
      
      if (success) {
        toast({
          title: isSignup ? "Account Created" : "Login Successful",
          description: `Welcome${isSignup ? ' to Authentic Tracker' : ' back'}, ${username}!`,
        });
      } else {
        toast({
          title: isSignup ? "Signup Failed" : "Login Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-muted to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {isSignup ? 'Sign up to start tracking your gold investments' : 'Sign in to your gold portfolio'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;