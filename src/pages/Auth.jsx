import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Rocket, Eye, EyeOff, Github, Chrome } from 'lucide-react';
const Auth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw error;
            toast.success('Welcome back!');
            navigate('/dashboard', { state: { justSignedIn: true } });
        }
        catch (error) {
            toast.error(error.message || 'Error signing in');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error)
                throw error;
            toast.success('Account created! Redirecting...');
            navigate('/dashboard', { state: { justSignedIn: true } });
        }
        catch (error) {
            toast.error(error.message || 'Error creating account');
        }
        finally {
            setLoading(false);
        }
    };
    const handleResetPassword = async () => {
        if (!email) {
            toast.error('Enter your email to reset password');
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth`,
            });
            if (error)
                throw error;
            toast.success('Password reset email sent');
        }
        catch (error) {
            toast.error(error.message || 'Failed to send reset email');
        }
    };
    const handleOAuth = async (provider) => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {},
                },
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            toast.error(error.message || 'OAuth sign-in failed');
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4 gradient-subtle", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-4", children: _jsx(Rocket, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-4xl font-bold mb-2", children: "TeamSync" }), _jsx("p", { className: "text-muted-foreground", children: "Collaborate, manage, and succeed together" })] }), _jsxs(Card, { className: "shadow-lg border-border/50", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Welcome" }), _jsx(CardDescription, { children: "Sign in to your account or create a new one" })] }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: "signin", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "signin", children: "Sign In" }), _jsx(TabsTrigger, { value: "signup", children: "Sign Up" })] }), _jsx(TabsContent, { value: "signin", children: _jsxs("form", { onSubmit: handleSignIn, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signin-email", children: "Email" }), _jsx(Input, { id: "signin-email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signin-password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "signin-password", type: showPassword ? 'text' : 'password', placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx("button", { type: "button", "aria-label": showPassword ? 'Hide password' : 'Show password', className: "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", onClick: () => setShowPassword((s) => !s), children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Forgot your password?" }), _jsx("button", { type: "button", onClick: handleResetPassword, className: "text-primary hover:underline", children: "Reset" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Signing in..."] })) : ('Sign In') }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: () => handleOAuth('google'), children: [_jsx(Chrome, { className: "mr-2 h-4 w-4" }), " Google"] }), _jsxs(Button, { type: "button", variant: "outline", onClick: () => handleOAuth('github'), children: [_jsx(Github, { className: "mr-2 h-4 w-4" }), " GitHub"] })] })] }) }), _jsx(TabsContent, { value: "signup", children: _jsxs("form", { onSubmit: handleSignUp, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-name", children: "Full Name" }), _jsx(Input, { id: "signup-name", type: "text", placeholder: "John Doe", value: fullName, onChange: (e) => setFullName(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-email", children: "Email" }), _jsx(Input, { id: "signup-email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-password", children: "Password" }), _jsx(Input, { id: "signup-password", type: showPassword ? 'text' : 'password', placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6 })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating account..."] })) : ('Create Account') }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: () => handleOAuth('google'), children: [_jsx(Chrome, { className: "mr-2 h-4 w-4" }), " Google"] }), _jsxs(Button, { type: "button", variant: "outline", onClick: () => handleOAuth('github'), children: [_jsx(Github, { className: "mr-2 h-4 w-4" }), " GitHub"] })] })] }) })] }) })] })] }) }));
};
export default Auth;
