import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CalendarCheck, History, User, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import GlobalReminderFAB from '../../components/GlobalReminderFAB';

const TabIcon = ({ name, icon: Icon, focused }) => {
  if (focused) {
    return (
      <View className="items-center justify-center pt-2">
        <Icon size={22} color="#4F46E5" strokeWidth={2.5} />
        <Text className="text-indigo-600 font-semibold text-[11px] mt-1">{name}</Text>
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

export default function TelecallerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 100 : 98,
    paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 30) : 30,
          paddingTop: 10,
          paddingHorizontal: 10,
          elevation: 10,
          shadowColor: '#6366F1',
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
          tabBarIcon: ({ focused }) => <TabIcon name="Home" icon={Home} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Leads" icon={Users} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="followups"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Follow" icon={CalendarCheck} focused={focused} />
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          href: null // Hide history from tabs
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null // Hide reports from tabs for telecaller
        }}
      />

      <Tabs.Screen
        name="lead-list"
        options={{
          href: null // Hide lead-list from tabs to remove the empty space
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" icon={User} focused={focused} />
        }}
      />
    </Tabs>
      <GlobalReminderFAB />
    </View>
  );
}
