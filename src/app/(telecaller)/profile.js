import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { User, Bell, Settings, LogOut, ChevronDown } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function TelecallerProfile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [callReminders, setCallReminders] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [themeMode, setThemeMode] = useState('Light');

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-[#F5F7FF]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Card */}
        <View className="bg-white rounded-[24px] p-6 items-center mb-6 border border-indigo-100 shadow-xs">
          <View className="relative mb-4">
            <Image 
              source={require('../../../assets/images/avatar-telecaller.png')}
              style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3.5, borderColor: '#4F46E5' }}
              resizeMode="cover"
            />
            <View className="absolute bottom-1 right-1 w-5 h-5 bg-[#22C55E] rounded-full border-2 border-white" />
          </View>
          
          <Text className="text-xl font-bold text-indigo-950 mb-1">{user?.name || 'Telecaller'}</Text>
          <Text className="text-xs text-indigo-600 font-semibold mb-3">{user?.team || 'Sales Team'}</Text>
          
          <View className="flex-row items-center gap-2">
            <View className="bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full">
              <Text className="text-indigo-700 text-xs font-bold uppercase">{user?.role || 'Telecaller'}</Text>
            </View>
            <View className="bg-[#DCFCE7] px-3 py-1 rounded-full">
              <Text className="text-[#15803D] text-xs font-bold">{user?.shift_status || 'Active'}</Text>
            </View>
          </View>
        </View>

        {/* Personal Details */}
        <View className="bg-white rounded-[24px] p-6 mb-6 border border-indigo-100 shadow-xs">
          <View className="flex-row items-center mb-6">
            <User size={20} color="#4F46E5" />
            <Text className="text-lg font-bold text-indigo-950 ml-3">Personal Details</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center border-b border-indigo-50 pb-4 mb-4">
              <Text className="text-sm text-slate-500">Mobile</Text>
              <Text className="text-sm font-bold text-indigo-950">{user?.mobile || '+91 98765 43210'}</Text>
            </View>
            
            <View className="flex-row justify-between items-center border-b border-indigo-50 pb-4 mb-4">
              <Text className="text-sm text-slate-500">Email</Text>
              <Text className="text-sm font-bold text-indigo-950">rupa.saini@kisanconnect.com</Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-slate-500">Employee ID</Text>
              <Text className="text-sm font-bold text-indigo-950">OF-TC-2024-089</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View className="bg-white rounded-[24px] p-6 mb-6 border border-indigo-100 shadow-xs">
          <View className="flex-row items-center mb-6">
            <Bell size={20} color="#4F46E5" />
            <Text className="text-lg font-bold text-indigo-950 ml-3">Notifications</Text>
          </View>

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-sm text-indigo-900">Call Reminders</Text>
            <Switch
              value={callReminders}
              onValueChange={setCallReminders}
              trackColor={{ false: '#E2E8F0', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-indigo-900">Email Alerts</Text>
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: '#E2E8F0', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* App Settings */}
        <View className="bg-white rounded-[24px] p-6 mb-8 border border-indigo-100 shadow-xs">
          <View className="flex-row items-center mb-6">
            <Settings size={20} color="#4F46E5" />
            <Text className="text-lg font-bold text-indigo-950 ml-3">App Settings</Text>
          </View>

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-sm text-indigo-900">Theme</Text>
            <View className="flex-row bg-indigo-50 rounded-xl p-1">
              {['Light', 'Dark'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  className={`px-4 py-1.5 rounded-lg ${themeMode === mode ? 'bg-white shadow-xs' : ''}`}
                >
                  <Text className={`text-xs font-bold ${themeMode === mode ? 'text-indigo-700' : 'text-slate-500'}`}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-indigo-900">Language</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-sm font-bold text-indigo-700 mr-2">English</Text>
              <ChevronDown size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="border-2 border-red-500 bg-red-50/40 rounded-2xl py-4 flex-row justify-center items-center"
        >
          <LogOut size={18} color="#DC2626" />
          <Text className="text-red-600 font-bold ml-2 text-base">Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
