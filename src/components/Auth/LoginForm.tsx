import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Key } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignup: boolean;
}

const LoginForm = ({ onToggleMode, isSignup }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsGuest, loginWithAuthentik } = useAuth();
  const { toast } = useToast();

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginAsGuest();
      if (success) {
        toast({
          title: "Welcome!",
          description: "Logged in as guest user",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to login as guest",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthentikLogin = async () => {
    setIsLoading(true);
    try {
      // This will redirect to Authentik
      await loginWithAuthentik();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Authentik login",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-muted to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-serif">
            Welcome to
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-serif text-foreground">
              A<span className="text-gold-accent">u</span>thentic
            </span>
            <span className="text-lg text-muted-foreground ml-2">Tracker</span>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Choose your preferred way to access your gold portfolio
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGuestLogin} 
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-left justify-start"
          >
            <Users className="w-5 h-5 mr-3 text-muted-foreground" />
            <div>
              <div className="font-medium">Continue as Guest</div>
              <div className="text-xs text-muted-foreground">Quick access without account</div>
            </div>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button 
            onClick={handleAuthentikLogin} 
            disabled={isLoading}
            className="w-full h-12 text-left justify-start bg-primary hover:bg-primary/90"
          >
            <Key className="w-5 h-5 mr-3" />
            <div>
              <div className="font-medium">Login with Authentik</div>
              <div className="text-xs opacity-90">Secure OAuth authentication</div>
            </div>
          </Button>

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              {isLoading ? 'Connecting...' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;