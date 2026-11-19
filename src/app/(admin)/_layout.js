import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, UserSquare2, FileSpreadsheet, Settings, Headset, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';

const TabIcon = ({ name, icon: Icon, focused }) => {
  if (focused) {
    return (
      <View className="items-center justify-center pt-2">
        <Icon size={22} color="#0F172A" strokeWidth={2.5} />
        <Text className="text-slate-900 font-semibold text-[11px] mt-1">{name}</Text>
      </View>
    );
  }
  return (
    <View className="items-center justify-center pt-2">
      <Icon size={20} color="#64748B" strokeWidth={2} />
      <Text className="text-slate-500 font-medium text-[10px] mt-1">{name}</Text>
    </View>
  );
};

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 100 : 90,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 30) : 30,
          paddingTop: 10,
          paddingHorizontal: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" icon={LayoutDashboard} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Leads" icon={Users} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Callers',
          tabBarIcon: ({ focused }) => <TabIcon name="Callers" icon={Headset} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Reports" icon={BarChart2} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Settings" icon={Settings} focused={focused} />
        }}
      />
    </Tabs>
  );
}