import '../global.css';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, Text, Animated, Image } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceReminderService from '../components/VoiceReminderService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user, initAuth } = useAuthStore();
  const { theme, initTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [appReady, setAppReady] = React.useState(false);

  // Initialize stores on startup
  useEffect(() => {
    initAuth();
    initTheme();
    // Force splash screen (index.js) to stay visible for at least 2.4 seconds
    setTimeout(() => {
      setAppReady(true);
    }, 2400);
  }, []);

  // Handle routing based on authentication and role
  useEffect(() => {
    // Wait until app is ready (min 1.5s), auth is loaded, and router is ready
    if (isLoading || !navigationState?.key || !appReady) return;

    const inLogin = segments[0] === 'login';

    const handleRoute = () => {
      if (!isAuthenticated) {
        if (!inLogin) router.replace('/login');
      } else {
        if (inLogin || segments.length === 0 || segments[0] === undefined) {
          if (user?.role === 'admin' || user?.role === 'team_leader' || user?.role === 'manager') {
            router.replace('/(admin)/dashboard');
          } else {
            router.replace('/(telecaller)/dashboard');
          }
        } else if (user?.role === 'telecaller' && segments[0] === '(admin)') {
          router.replace('/(telecaller)/dashboard');
        }
      }
    };

    // Defer routing to avoid "Attempted to navigate before mounting" error
    const timeout = setTimeout(handleRoute, 0);
    return () => clearTimeout(timeout);
  }, [isLoading, isAuthenticated, user, segments, navigationState?.key, appReady]);

  const isDark = theme === 'dark';

  return (
    <View className={`flex-1 ${isDark ? 'bg-indigo-950' : 'bg-slate-50'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
      {isAuthenticated && user?.role === 'telecaller' && <VoiceReminderService />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
