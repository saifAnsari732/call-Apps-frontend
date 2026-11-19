import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const exitFadeAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance Sequence
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();

    // Pulse Logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Exit Animation after 2 seconds (giving time for entrance)
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1.5, duration: 400, useNativeDriver: true }),
        Animated.timing(exitFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start();
    }, 2000); // 2000ms delay to exit

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View 
      style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        opacity: exitFadeAnim
      }}
    >
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Animated.View style={{ 
        alignItems: 'center', 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
      }}>
        
        <Animated.View style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 12,
          transform: [{ scale: pulseAnim }]
        }}>
          <Image 
            source={require('../../assets/images/logo-3d.png')} 
            style={{ width: 112, height: 112, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 24 }}
            resizeMode="cover"
          />
        </Animated.View>

        <Text style={{ fontSize: 30, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, letterSpacing: 0.5 }}>
          KisanConnect
        </Text>
        
        <View style={{ height: 2, width: 48, backgroundColor: '#334155', marginVertical: 12, borderRadius: 2 }} />

        <Text style={{ color: '#94A3B8', fontSize: 12, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase', marginBottom: 40 }}>
          Enterprise Lead Manager
        </Text>
        
        <ActivityIndicator size="large" color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}
