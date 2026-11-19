import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Smartphone, Lock, Eye, EyeOff, CheckSquare, Square, LogIn } from 'lucide-react-native';

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#F8FAFC]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center w-full max-w-[440px] self-center px-5 py-10">
          
          {/* Header Branding */}
          <View className="items-center mb-7 pt-4">
            <View className="bg-slate-900 p-1 rounded-[22px] shadow-md mb-4">
              <Image 
                source={require('../../assets/images/logo-3d.png')} 
                style={{ width: 76, height: 76, borderRadius: 20 }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">KisanConnect</Text>
            <Text className="text-slate-500 text-xs mt-1 tracking-wider font-medium uppercase">Enterprise Calling &amp; Lead CRM</Text>
          </View>

          {/* Form Container */}
          <View className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <Text className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
              Welcome back
            </Text>
            <Text className="text-slate-500 text-sm mb-6">
              Sign in to your account to continue
            </Text>

            {errorMsg && (
              <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-5">
                <Text className="text-red-600 text-xs font-semibold">{errorMsg}</Text>
              </View>
            )}

            {/* Mobile Number Field */}
            <View className="mb-4">
              <Text className="text-xs font-semibold mb-2 text-slate-700">Mobile Number</Text>
              <Controller
                control={control}
                name="mobile"
                rules={{ 
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border ${errors.mobile ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50'} rounded-xl px-4 h-12`}>
                    <Smartphone size={18} color={errors.mobile ? '#EF4444' : '#64748B'} className="mr-3" />
                    <TextInput
                      className="flex-1 text-sm text-slate-900 font-medium h-full"
                      placeholder="Enter 10-digit mobile number"
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
            <View className="mb-4">
              <Text className="text-xs font-semibold mb-2 text-slate-700">Password</Text>
              <Controller
                control={control}
                name="password"
                rules={{ required: 'Password is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`flex-row items-center border ${errors.password ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50'} rounded-xl px-4 h-12`}>
                    <Lock size={18} color={errors.password ? '#EF4444' : '#64748B'} className="mr-3" />
                    <TextInput
                      className="flex-1 text-sm text-slate-900 font-medium h-full"
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
                        <EyeOff size={18} color="#64748B" />
                      ) : (
                        <Eye size={18} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text className="text-red-500 text-xs mt-1.5 font-medium ml-1">{errors.password.message}</Text>}
            </View>

            {/* Remember Me & Forgot Password */}
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isSubmitting}
              >
                {rememberMe ? (
                  <CheckSquare size={18} color="#0F172A" />
                ) : (
                  <Square size={18} color="#94A3B8" />
                )}
                <Text className="ml-2 text-xs text-slate-700 font-medium">Remember Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text className="text-xs font-semibold text-slate-600">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`h-12 rounded-xl justify-center items-center flex-row ${isSubmitting ? 'bg-slate-400' : 'bg-[#0F172A] active:bg-slate-800'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white text-sm font-semibold mr-2">Sign In</Text>
                  <LogIn size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Quick Role Access Section */}
            <View className="mt-6 border border-slate-200 bg-slate-50/70 p-4 rounded-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Quick Role Access</Text>
                <View className="bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-semibold text-slate-700">3-Tier RBAC</Text>
                </View>
              </View>
              
              {/* Admin Card */}
              <TouchableOpacity 
                className="flex-row items-center bg-white p-3 border border-slate-200/80 rounded-xl mb-2 active:bg-slate-50"
                onPress={() => {
                  setValue('mobile', '9876543210', { shouldValidate: true });
                  setValue('password', 'admin123', { shouldValidate: true });
                }}
              >
                <Image 
                  source={require('../../assets/images/avatar-admin.png')} 
                  style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">Sanjay Gupta</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Managing Director • 9876543210</Text>
                </View>
                <View className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-slate-700 font-semibold">ADMIN</Text>
                </View>
              </TouchableOpacity>

              {/* Team Leader NCR Card */}
              <TouchableOpacity 
                className="flex-row items-center bg-white p-3 border border-slate-200/80 rounded-xl mb-2 active:bg-slate-50"
                onPress={() => {
                  setValue('mobile', '9876543212', { shouldValidate: true });
                  setValue('password', 'admin123', { shouldValidate: true });
                }}
              >
                <Image 
                  source={require('../../assets/images/avatar-teamleader.png')} 
                  style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">Vikram Malhotra</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Team Leader • Delhi NCR (9876543212)</Text>
                </View>
                <View className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-slate-700 font-semibold">TL NCR</Text>
                </View>
              </TouchableOpacity>

              {/* Team Leader Mumbai Card */}
              <TouchableOpacity 
                className="flex-row items-center bg-white p-3 border border-slate-200/80 rounded-xl mb-2 active:bg-slate-50"
                onPress={() => {
                  setValue('mobile', '9876543215', { shouldValidate: true });
                  setValue('password', 'admin123', { shouldValidate: true });
                }}
              >
                <Image 
                  source={require('../../assets/images/avatar-teamleader.png')} 
                  style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">Neha Kapoor</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Team Leader • West (9876543215)</Text>
                </View>
                <View className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-slate-700 font-semibold">TL WEST</Text>
                </View>
              </TouchableOpacity>

              {/* Telecaller Card */}
              <TouchableOpacity 
                className="flex-row items-center bg-white p-3 border border-slate-200/80 rounded-xl active:bg-slate-50"
                onPress={() => {
                  setValue('mobile', '9876543211', { shouldValidate: true });
                  setValue('password', 'admin123', { shouldValidate: true });
                }}
              >
                <Image 
                  source={require('../../assets/images/avatar-telecaller.png')} 
                  style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">Amit Sharma</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Telecaller • NCR Team (9876543211)</Text>
                </View>
                <View className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  <Text className="text-[10px] text-slate-700 font-semibold">CALLER</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
          
        </View>
        
        {/* Footer */}
        <View className="items-center pb-8">
          <Text className="text-slate-500 text-xs mb-1">Need help accessing the panel?</Text>
          <Text className="text-slate-800 text-xs font-semibold">Contact System Administrator</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
