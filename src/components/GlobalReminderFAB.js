import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { PhoneCall } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useRouter } from 'expo-router';

export default function GlobalReminderFAB() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['telecallerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/telecaller-dashboard');
      return response.data;
    },
    staleTime: 5 * 60 * 1000
  });

  const todaysFollowups = data?.todaysFollowups || [];

  const showReminder = () => {
    if (todaysFollowups.length > 0) {
      const activeFollowup = todaysFollowups[0]; // Show the next one
      Alert.alert(
        'Upcoming Follow-up Reminder',
        `Lead: ${activeFollowup.lead_name}\nMobile: ${activeFollowup.lead_mobile || 'N/A'}\nTime: ${activeFollowup.time}\nNotes: ${activeFollowup.notes || 'No notes'}`,
        [
          { text: 'View Lead', onPress: () => router.push(`/lead/${activeFollowup.lead._id || activeFollowup.lead}`) },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('No Reminders', 'You have no pending follow-ups for today.');
    }
  };

  return (
    <TouchableOpacity 
      onPress={showReminder}
      className={`absolute bottom-[110px] right-4 w-14 h-14 rounded-full justify-center items-center shadow-lg z-50 border-2 border-white bg-[#10B981] shadow-emerald-500/50`}
    >
      <PhoneCall size={24} color="#ffffff" />
      {todaysFollowups.length > 0 && (
        <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border border-white" />
      )}
    </TouchableOpacity>
  );
}
