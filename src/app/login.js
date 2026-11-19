import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Smartphone, Lock, Eye, EyeOff, CheckSquare, Square, LogIn, Factory, Settings } from 'lucide-react-native';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { mobile: '', password: '' }
  });

  const onSubmit = async (data) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        mobile: data.mobile,
        password: data.password
      });

      const { token, user } = response.data;
      await login(token, user, rememberMe);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('Network error. Check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#FFF1F2]">
      
      {/* Top Watermark Graphic */}
      <View className="absolute top-0 right-0 left-0 h-64 items-center justify-end pb-8 opacity-5">
        <Factory size={160} color="#E11D48" strokeWidth={1} />
      </View>
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-12">
          
          {/* Header Branding */}
          <View className="items-center mb-8 pt-10">
            <Image 
              source={require('../../assets/images/logo-glow.png')} 
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 24, borderWidth: 3, borderColor: '#E11D48' }}
              resizeMode="cover"
            />
            <Text className="text-[28px] font-black text-[#881337] tracking-tight">KISAN<Text style={{ color: '#E11D48' }}>CONNECT</Text></Text>
            <Text className="text-rose-500 text-[13px] mt-1 tracking-widest font-bold">PREMIUM LEAD MANAGER</Text>
          </View>

          {/* Form Container */}
          <View className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xl shadow-rose-200/50">
            <Text className="text-[28px] font-black text-[#881337] mb-1 tracking-tight">
              Welcome back
            </Text>
            <Text className="text-slate-600 text-sm mb-6">
              Sign in to your account to continue
            </Text>

            {errorMsg && (
              <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-6">
                <Text className="text-red-600 text-sm font-semibold">{errorMsg}</Text>
              </View>
            )}

            {/* Mobile Number Field */}
            <View className="mb-5">
              <Text className="text-xs font-bold mb-2 text-slate-700">Mobile Number</Text>
              <Controller
                control={control}
                name="mobile"
                rules={{ 
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border ${errors.mobile ? 'border-red-400 bg-red-50' : 'border-rose-100 bg-rose-50/30'} rounded-xl px-4 h-12`}>
                    <Smartphone size={18} color={errors.mobile ? '#EF4444' : '#E11D48'} className="mr-3" />
                    <TextInput
                      className="flex-1 text-sm text-slate-800 font-medium h-full"
                      placeholder="Enter mobile number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={10}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isSubmitting}
                    />
                  </View>
                )}
              />
              {errors.mobile && <Text className="text-red-500 text-xs mt-1.5 font-medium ml-1">{errors.mobile.message}</Text>}
            </View>

            {/* Password Field */}
            <View className="mb-5">
              <Text className="text-xs font-bold mb-2 text-slate-700">Password</Text>
              <Controller
                control={control}
                name="password"
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border ${errors.password ? 'border-red-400 bg-red-50' : 'border-rose-100 bg-rose-50/30'} rounded-xl px-4 h-12`}>
                    <Lock size={18} color={errors.password ? '#EF4444' : '#E11D48'} className="mr-3" />
                    <TextInput
                      className="flex-1 text-sm text-slate-800 font-medium h-full"
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isSubmitting}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                      {showPassword ? (
                        <EyeOff size={18} color="#E11D48" />
                      ) : (
                        <Eye size={18} color="#E11D48" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text className="text-red-500 text-xs mt-1.5 font-medium ml-1">{errors.password.message}</Text>}
            </View>

            {/* Remember Me & Forgot Password */}
            <View className="flex-row justify-between items-center mb-8">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isSubmitting}
              >
                {rememberMe ? (
                  <CheckSquare size={18} color="#E11D48" />
                ) : (
                  <Square size={18} color="#94A3B8" />
                )}
                <Text className="ml-2 text-sm text-slate-700 font-medium">Remember Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text className="text-sm font-bold text-[#BE123C]">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`h-14 rounded-xl justify-center items-center flex-row ${isSubmitting ? 'bg-rose-300' : 'bg-[#E11D48]'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white text-base font-bold mr-2">Login</Text>
                  <LogIn size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Demo Credentials */}
            <View className="mt-6 border border-slate-200 bg-slate-50 p-4 rounded-xl">
              <Text className="text-xs font-bold text-slate-700 mb-2">Demo Accounts (Tap to fill):</Text>
              
              <TouchableOpacity 
                className="flex-row justify-between items-center bg-white p-2.5 border border-slate-200 rounded-xl mb-2 active:bg-slate-100"
                onPress={() => {
                  setValue('mobile', '9999999999', { shouldValidate: true });
                  setValue('password', 'admin123', { shouldValidate: true });
                }}
              >
                <View>
                  <Text className="text-xs font-bold text-slate-800">Admin Account</Text>
                  <Text className="text-[10px] text-slate-500">ID: 9999999999 | Pass: admin123</Text>
                </View>
                <View className="bg-indigo-100 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-indigo-700 font-bold">Admin</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row justify-between items-center bg-white p-2.5 border border-slate-200 rounded-xl active:bg-slate-100"
                onPress={() => {
                  setValue('mobile', '8888888888', { shouldValidate: true });
                  setValue('password', 'caller123', { shouldValidate: true });
                }}
              >
                <View>
                  <Text className="text-xs font-bold text-slate-800">Telecaller Account</Text>
                  <Text className="text-[10px] text-slate-500">ID: 8888888888 | Pass: caller123</Text>
                </View>
                <View className="bg-emerald-100 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-emerald-700 font-bold">Caller</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
          
        </View>
        
        {/* Footer */}
        <View className="items-center pb-8 z-10 relative">
          <Text className="text-slate-500 text-xs mb-1">Need help accessing the panel?</Text>
          <Text className="text-[#0B192C] text-xs font-bold">Contact System Administrator</Text>
          
          <View className="flex-row items-center mt-4 opacity-30">
            <View className="h-px w-12 bg-slate-400" />
            <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mx-2">Global Ops</Text>
            <View className="h-px w-12 bg-slate-400" />
          </View>
        </View>

        {/* Bottom Left Gear Watermark */}
        <View className="absolute -bottom-10 -left-10 opacity-5 pointer-events-none">
          <Settings size={200} color="#0B192C" strokeWidth={1} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
