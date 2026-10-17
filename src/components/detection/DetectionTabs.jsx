import React, { useState } from 'react';
import { Camera, Video, Radio } from 'lucide-react';
import TabSwitcher from '../common/TabSwitcher';
import RealTimeMode from './RealTimeMode';
import VideoUploadMode from './VideoUploadMode';
import ImageUploadMode from './ImageUploadMode';

const TABS = [
  { key: 'realtime', label: 'Kamera Real-time', icon: Radio },
  { key: 'video', label: 'Unggah Video', icon: Video },
  { key: 'image', label: 'Foto Tunggal & EXIF', icon: Camera },
];

const DetectionTabs = () => {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Segmented Control Pill Tabs for Mobile & Desktop */}
      <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <TabSwitcher
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pill"
        />
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {activeTab === 'realtime' && <RealTimeMode />}
        {activeTab === 'video' && <VideoUploadMode />}
        {activeTab === 'image' && <ImageUploadMode />}
      </div>
    </div>
  );
};

export default DetectionTabs;
