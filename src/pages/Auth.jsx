import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useAuthActions } from "@/hooks/auth/useAuthActions";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const actions = useAuthActions({
    email,
    password,
    fullName,
    navigate,
    setLoading,
  });

  const formState = {
    loading,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    showPassword,
  };

  return (
    <div className="gradient-subtle flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthBrand />
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm
                  state={formState}
                  onSubmit={actions.signIn}
                  onOAuth={actions.oAuthSignIn}
                  onResetPassword={actions.resetPassword}
                  setShowPassword={setShowPassword}
                />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm
                  state={formState}
                  onSubmit={actions.signUp}
                  onOAuth={actions.oAuthSignIn}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Auth;
