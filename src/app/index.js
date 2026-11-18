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
        colors={['#4C0519', '#881337']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Animated.View style={{ 
        alignItems: 'center', 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
      }}>
        
        <Animated.View style={{
          shadowColor: '#E11D48',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 15,
          transform: [{ scale: pulseAnim }]
        }}>
          <Image 
            source={require('../../assets/brand-logo.jpg')} 
            style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#E11D48', marginBottom: 24 }}
            resizeMode="cover"
          />
        </Animated.View>

        <Text style={{ fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, letterSpacing: 2 }}>
          KISAN<Text style={{ color: '#E11D48' }}>CONNECT</Text>
        </Text>
        
        <View style={{ height: 2, width: 60, backgroundColor: '#E11D48', marginVertical: 12, borderRadius: 2 }} />

        <Text style={{ color: '#FDA4AF', fontSize: 13, letterSpacing: 5, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 40, opacity: 0.8 }}>
          Premium Lead Manager
        </Text>
        
        <ActivityIndicator size="large" color="#E11D48" />
      </Animated.View>
    </Animated.View>
  );
}
