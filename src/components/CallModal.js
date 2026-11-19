import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, Calendar, Clock, PhoneCall, Tag, Check, CircleCheck, TriangleAlert } from 'lucide-react-native';
import SimpleCalendarModal from './SimpleCalendarModal';

export const PRIMARY_STATUSES = [
  { label: 'New', value: 'New', color: 'bg-slate-600', activeBorder: 'border-slate-600' },
  { label: 'Contacted', value: 'Contacted', color: 'bg-sky-600', activeBorder: 'border-sky-600' },
  { label: 'Interested', value: 'Interested', color: 'bg-emerald-600', activeBorder: 'border-emerald-600' },
  { label: 'Follow-up Required', value: 'Follow-up Required', color: 'bg-amber-600', activeBorder: 'border-amber-600', triggersFollowup: true },
  { label: 'Qualified', value: 'Qualified', color: 'bg-indigo-600', activeBorder: 'border-indigo-600' },
  { label: 'Demo Scheduled', value: 'Demo Scheduled', color: 'bg-violet-600', activeBorder: 'border-violet-600', triggersFollowup: true },
  { label: 'Demo/Meeting Scheduled', value: 'Demo/Meeting Scheduled', color: 'bg-violet-600', activeBorder: 'border-violet-600', triggersFollowup: true },
  { label: 'Payment Pending', value: 'Payment Pending', color: 'bg-orange-600', activeBorder: 'border-orange-600' },
  { label: 'Converted', value: 'Converted', color: 'bg-green-600', activeBorder: 'border-green-600' },
  { label: 'Not Interested', value: 'Not Interested', color: 'bg-rose-600', activeBorder: 'border-rose-600' },
  { label: 'Wrong Number', value: 'Wrong Number', color: 'bg-red-600', activeBorder: 'border-red-600' },
  { label: 'Busy', value: 'Busy', color: 'bg-yellow-600', activeBorder: 'border-yellow-600' },
  { label: 'Call Not Connected', value: 'Call Not Connected', color: 'bg-purple-600', activeBorder: 'border-purple-600' },
  { label: 'No Response', value: 'No Response', color: 'bg-stone-600', activeBorder: 'border-stone-600' },
  { label: 'Duplicate Lead', value: 'Duplicate Lead', color: 'bg-zinc-600', activeBorder: 'border-zinc-600' },
  { label: 'Invalid Lead', value: 'Invalid Lead', color: 'bg-red-800', activeBorder: 'border-red-800' },
  { label: 'Lost', value: 'Lost', color: 'bg-slate-700', activeBorder: 'border-slate-700' },
];

export const CALL_DISPOSITIONS = [
  'Connected',
  'Callback requested',
  'No answer',
  'Switched off',
  'Busy',
  'Price issue',
  'Timing issue',
  'Family approval',
  'Already bought',
  'Not eligible',
  'Needs family approval',
  'Already purchased elsewhere',
  'Call connected',
  'Call back requested',
  'Number busy',
  'Interested',
  'Language issue'
];

export const QUICK_REMARK_TAGS = [
  'Interested - Send Details',
  'Call back after 5 PM',
  'Price high / Discount asked',
  'Will discuss with family',
  'Ready to purchase',
  'Wants demo / sample',
  'Decision maker busy',
  'Ringing / No answer',
  'Number switched off',
  'Location out of service'
];

const formatLocalDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function CallModal({ visible, onClose, lead, onSubmit, isDark, initialDuration = 0 }) {
  const [status, setStatus] = useState('');
  const [disposition, setDisposition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [durationSec, setDurationSec] = useState('0');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tags
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Follow-up scheduling
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupPriority, setFollowupPriority] = useState('Medium');
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setDurationSec(String(initialDuration || 0));
      setStatus(lead?.status || 'Contacted');
      setDisposition(lead?.call_disposition || '');
      setRemarks(lead?.remarks || '');
      setErrorMsg('');
      if (lead?.tags && Array.isArray(lead.tags)) {
        setSelectedTags(lead.tags);
      }
      if (lead?.status === 'Follow-up Required' || lead?.status === 'Demo Scheduled') {
        setScheduleFollowup(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowupDate(formatLocalDate(tomorrow));
        setFollowupTime('11:00');
      }
    }
  }, [visible, initialDuration, lead]);

  const handleStatusSelect = (statusObj) => {
    setStatus(statusObj.value);
    if (statusObj.triggersFollowup) {
      setScheduleFollowup(true);
      if (!followupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowupDate(formatLocalDate(tomorrow));
      }
      if (!followupTime) {
        setFollowupTime('11:00');
      }
    }
  };

  const handleDispositionSelect = (disp) => {
    setDisposition(disp);
    if (disp === 'Callback requested' || disp === 'Call back requested') {
      setScheduleFollowup(true);
      if (!followupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowupDate(formatLocalDate(tomorrow));
      }
      if (!followupTime) {
        setFollowupTime('11:00');
      }
    }
  };

  const handleQuickRemark = (chipText) => {
    if (!remarks.trim()) {
      setRemarks(chipText);
    } else if (!remarks.includes(chipText)) {
      setRemarks(`${remarks.trim()}, ${chipText}`);
    }
  };

  const handleQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowupDate(formatLocalDate(d));
  };

  const handleQuickTime = (minutesToAdd) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesToAdd);
    if (!followupDate) {
      setFollowupDate(formatLocalDate(d));
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setFollowupTime(`${hours}:${minutes}`);
  };

  const setSpecificTime = (timeStr) => {
    setFollowupTime(timeStr);
    if (!followupDate) {
      setFollowupDate(formatLocalDate(new Date()));
    }
  };

  const handleFormSubmit = async () => {
    setErrorMsg('');

    if (!status) {
      setErrorMsg('Please select a Primary Status.');
      return;
    }

    if (!remarks.trim()) {
      setErrorMsg('Mandatory Remarks required. Please enter a brief discussion note or tap a quick chip.');
      return;
    }

    if (scheduleFollowup && (!followupDate || !followupTime)) {
      setErrorMsg('Please provide Date & Time for the scheduled follow-up.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedDuration = Math.max(0, parseInt(durationSec, 10) || 0);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - parsedDuration * 1000);

      const payload = {
        lead_id: lead?.id || lead?._id,
        status,
        disposition,
        remarks: remarks.trim(),
        notes: remarks.trim(),
        duration: parsedDuration,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tags: selectedTags,
        followupDate: scheduleFollowup ? followupDate : null,
        followupTime: scheduleFollowup ? followupTime : null,
        followupReason: disposition || status || 'Scheduled follow-up',
        followupPriority,
        followupNotes: scheduleFollowup ? (remarks.trim() || `Follow-up on ${status}`) : null
      };

      if (onSubmit) {
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save call outcome');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className={`rounded-t-3xl p-5 h-[90%] ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-slate-100">
            <View className="flex-1 pr-2">
              <Text className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0B192C]'}`}>
                Log Call Outcome & Disposition
              </Text>
              <Text className={`text-xs mt-0.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lead?.name} {lead?.lead_id ? `(#${lead.lead_id})` : ''} • +91 {lead?.mobile}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <X size={18} color={isDark ? '#E2E8F0' : '#475569'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {errorMsg ? (
              <View className="bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-4 flex-row items-center">
                <TriangleAlert size={18} color="#DC2626" />
                <Text className="text-red-700 text-xs font-bold flex-1 ml-2.5">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Talk Time Bar */}
            <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <PhoneCall size={16} color="#475569" />
                <Text className="text-xs font-semibold text-slate-900 ml-2">Call Duration (Sec)</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {[0, 30, 60, 120].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setDurationSec(String(sec))}
                    className={`px-2.5 py-1 rounded-lg border ${Number(durationSec) === sec ? 'bg-[#0F172A] border-[#0F172A]' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-[11px] font-semibold ${Number(durationSec) === sec ? 'text-white' : 'text-slate-700'}`}>
                      {sec === 0 ? '0s' : sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  value={durationSec}
                  onChangeText={setDurationSec}
                  keyboardType="numeric"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 w-14 text-center"
                />
              </View>
            </View>

            {/* 1. Primary Status Selector */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                  1. Primary Lead Status *
                </Text>
                {status ? (
                  <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[11px] font-bold text-slate-700">{status}</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row flex-wrap gap-2">
                {PRIMARY_STATUSES.map((item) => {
                  const isSelected = status === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => handleStatusSelect(item)}
                      className={`px-3 py-2 rounded-xl border flex-row items-center ${
                        isSelected 
                          ? `${item.color} border-transparent shadow-sm` 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" className="mr-1" />}
                      <Text className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Call Disposition Selector */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                  2. Call Disposition
                </Text>
                {disposition ? (
                  <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[11px] font-bold text-slate-700">{disposition}</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {CALL_DISPOSITIONS.map((disp) => {
                  const isSelected = disposition === disp;
                  return (
                    <TouchableOpacity
                      key={disp}
                      onPress={() => handleDispositionSelect(disp)}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected 
                          ? 'bg-[#0B192C] border-[#0B192C]' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Text className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {disp}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Mandatory Remarks & Quick Tag Chips */}
            <View className="mb-4">
              <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                3. Mandatory Remarks / Discussion Summary *
              </Text>
              
              <Text className="text-[11px] font-medium text-slate-500 mb-2">
                Tap 1-click chip to insert discussion summary:
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2.5">
                {QUICK_REMARK_TAGS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => handleQuickRemark(chip)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 active:bg-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">+ {chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                multiline
                numberOfLines={3}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter client discussion summary (e.g. Rate high, requested bulk rate on WhatsApp)..."
                placeholderTextColor="#94A3B8"
                className={`border rounded-2xl p-3.5 text-[13px] h-20 text-slate-900 bg-slate-50 ${
                  !remarks.trim() && errorMsg ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
                textAlignVertical="top"
              />
            </View>

            {/* 4. Follow-up Scheduling Section */}
            <View className="mb-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Calendar size={16} color="#D97706" />
                  <Text className="text-[12px] font-bold text-slate-800 ml-2 uppercase tracking-wider">
                    Schedule Next Follow-up
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScheduleFollowup(!scheduleFollowup)}
                  className={`px-3 py-1 rounded-full border ${
                    scheduleFollowup ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-300'
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${scheduleFollowup ? 'text-white' : 'text-slate-600'}`}>
                    {scheduleFollowup ? 'Enabled' : 'Disabled'}
                  </Text>
                </TouchableOpacity>
              </View>

              {scheduleFollowup && (
                <View className="mt-1">
                  {/* Quick Date Chips */}
                  <Text className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Date:</Text>
                  <View className="flex-row flex-wrap gap-1.5 mb-3">
                    {[
                      { label: 'Today', days: 0 },
                      { label: 'Tomorrow', days: 1 },
                      { label: 'In 2 Days', days: 2 },
                      { label: 'In 3 Days', days: 3 },
                      { label: 'In 1 Week', days: 7 },
                    ].map((d) => (
                      <TouchableOpacity
                        key={d.label}
                        onPress={() => handleQuickDate(d.days)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <Text className="text-[11px] font-bold text-slate-700">{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setCalendarVisible(true)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100"
                    >
                      <Text className="text-[11px] font-semibold text-slate-800">Pick Date</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Time Chips */}
                  <Text className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Time:</Text>
                  <View className="flex-row flex-wrap gap-1.5 mb-3">
                    {[
                      { label: '+15 Min', min: 15 },
                      { label: '+30 Min', min: 30 },
                      { label: '+1 Hour', min: 60 }
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.label}
                        onPress={() => handleQuickTime(t.min)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <Text className="text-[11px] font-bold text-slate-700">{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                    {['11:00', '14:30', '17:30'].map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSpecificTime(slot)}
                        className={`px-2.5 py-1.5 rounded-lg border ${followupTime === slot ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-200'}`}
                      >
                        <Text className={`text-[11px] font-bold ${followupTime === slot ? 'text-white' : 'text-slate-700'}`}>
                          {slot === '11:00' ? '11:00 AM' : slot === '14:30' ? '02:30 PM' : '05:30 PM'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Date and Time Inputs */}
                  <View className="flex-row justify-between">
                    <View className="w-[48%]">
                      <Text className="text-[10px] font-bold uppercase mb-1 text-slate-500">Date (YYYY-MM-DD)</Text>
                      <View className="flex-row items-center border rounded-xl px-2.5 py-2 border-slate-200 bg-white">
                        <Calendar size={14} color="#64748B" />
                        <TextInput
                          className="flex-1 ml-2 text-xs font-bold text-slate-800 p-0"
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#94A3B8"
                          value={followupDate}
                          onChangeText={setFollowupDate}
                        />
                      </View>
                    </View>
                    <View className="w-[48%]">
                      <Text className="text-[10px] font-bold uppercase mb-1 text-slate-500">Time (HH:MM)</Text>
                      <View className="flex-row items-center border rounded-xl px-2.5 py-2 border-slate-200 bg-white">
                        <Clock size={14} color="#64748B" />
                        <TextInput
                          className="flex-1 ml-2 text-xs font-bold text-slate-800 p-0"
                          placeholder="11:30"
                          placeholderTextColor="#94A3B8"
                          value={followupTime}
                          onChangeText={setFollowupTime}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Followup Priority */}
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold text-slate-600">Priority:</Text>
                    <View className="flex-row gap-1.5">
                      {['High', 'Medium', 'Low'].map((p) => (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setFollowupPriority(p)}
                          className={`px-2.5 py-1 rounded-lg border ${
                            followupPriority === p 
                              ? p === 'High' ? 'bg-red-600 border-red-600' : 'bg-slate-800 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <Text className={`text-[10px] font-bold ${followupPriority === p ? 'text-white' : 'text-slate-600'}`}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 5. Custom Tags */}
            <View className="mb-6">
              <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tags (Optional)
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2.5">
                {['VIP', 'Urgent', 'WhatsApp Sent', 'Call Back Later', 'Ready Buyer'].map((presetTag) => {
                  const isSelected = selectedTags.includes(presetTag);
                  return (
                    <TouchableOpacity
                      key={presetTag}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter((t) => t !== presetTag));
                        } else {
                          setSelectedTags([...selectedTags, presetTag]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full border ${isSelected ? 'bg-rose-600 border-rose-600' : 'bg-slate-100 border-slate-200'} flex-row items-center`}
                    >
                      <Tag size={10} color={isSelected ? '#FFFFFF' : '#64748B'} className="mr-1" />
                      <Text className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>{presetTag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row items-center border rounded-xl px-3 h-10 border-slate-200 bg-white">
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Type custom tag..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-xs text-slate-800"
                  onSubmitEditing={() => {
                    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                      setSelectedTags([...selectedTags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  onPress={() => {
                    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
                      setSelectedTags([...selectedTags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  className="bg-slate-200 px-2.5 py-1 rounded-lg ml-2"
                >
                  <Text className="text-[11px] font-bold text-slate-700">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View className="pt-3 border-t border-slate-100 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              className="w-[28%] py-3.5 rounded-2xl border justify-center items-center border-slate-300 bg-white"
            >
              <Text className="text-xs font-bold text-slate-700">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFormSubmit}
              disabled={submitting}
              className="w-[68%] bg-[#0B192C] py-3.5 rounded-2xl flex-row justify-center items-center shadow-md active:bg-slate-800"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CircleCheck size={18} color="#FFB703" />
                  <Text className="text-white text-xs font-bold tracking-wide ml-2">SAVE CALL OUTCOME</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SimpleCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelect={(dateStr) => {
          setFollowupDate(dateStr);
          setCalendarVisible(false);
        }}
        isDark={isDark}
        title="Select Follow-up Date"
      />
    </Modal>
  );
}
