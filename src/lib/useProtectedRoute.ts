'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
}

/**
 * Hook to protect dashboard routes from unauthenticated access
 */
export function useProtectedRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session?.user) {
        router.push('/auth/signin');
        return;
      }

      setUser(data.session.user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/auth/signin');
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return { isLoading, user };
}
