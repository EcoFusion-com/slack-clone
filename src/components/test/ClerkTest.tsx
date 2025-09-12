import React from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ClerkTest() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Clerk...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Not Signed In</CardTitle>
          <CardDescription>
            Please sign in to test Clerk integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sign-in button in the top navigation to authenticate.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Clerk Integration Test
          <Badge variant="secondary">Working</Badge>
        </CardTitle>
        <CardDescription>
          Successfully authenticated with Clerk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">User Information:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">ID:</span> {user?.id}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.primaryEmailAddress?.emailAddress}
            </div>
            <div>
              <span className="font-medium">Name:</span> {user?.fullName || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Created:</span> {user?.createdAt?.toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Authentication Status:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Signed In
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Email Verified
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => signOut()} 
          variant="outline" 
          className="w-full"
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
