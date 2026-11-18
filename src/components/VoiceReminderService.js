import React, { useEffect, useState, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function VoiceReminderService() {
  const [spokenReminders, setSpokenReminders] = useState(new Set());
  const timerRef = useRef(null);

  // Poll for follow-ups every 30 seconds
  const { data: dashboardData } = useQuery({
    queryKey: ['telecallerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/telecaller-dashboard');
      return response.data;
    },
    staleTime: 5 * 60 * 1000
  });

  const data = dashboardData?.todaysFollowups || [];

  useEffect(() => {
    if (!data) return;

    const checkReminders = () => {
      const now = new Date();
      
      data.forEach(followup => {
        if (!followup.time || !followup.date) return;
        
        // Parse time (e.g. "14:30")
        const [hours, minutes] = followup.time.split(':').map(Number);
        
        // Create date object for the followup
        const followupTime = new Date(followup.date);
        followupTime.setHours(hours, minutes, 0, 0);
        
        // Check if the current time is exactly matching the followup time or passed it within the last 5 minutes
        const diffMinutes = (now - followupTime) / (1000 * 60);
        
        if (diffMinutes >= 0 && diffMinutes <= 5) {
          // It's due! Check if already spoken
          if (!spokenReminders.has(followup.id || followup._id)) {
            // Speak it
            const leadName = followup.lead_name || 'Customer';
            try {
              Speech.speak(`Aapko follow up call karna hai. Lead ka naam hai ${leadName}.`, {
                language: 'hi-IN',
                rate: 0.95,
                pitch: 1.0,
                onError: () => {
                  Speech.speak(`Follow-up reminder for ${leadName}`, { language: 'en-IN' });
                }
              });
            } catch (speechErr) {
              console.log('Speech reminder warning:', speechErr.message);
            }
            
            setSpokenReminders(prev => {
              const newSet = new Set(prev);
              newSet.add(followup.id || followup._id);
              return newSet;
            });
          }
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every 10 seconds locally to ensure precision
    timerRef.current = setInterval(checkReminders, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, spokenReminders]);

  return null; // Headless component, no UI
}
