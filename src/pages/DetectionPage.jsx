import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import DetectionTabs from '../components/detection/DetectionTabs';

const DetectionPage = () => {
  return (
    <PageContainer
      title="Deteksi & Analisis Kerusakan Jalan"
      subtitle="Klasifikasi kerusakan berbasis Computer Vision YOLOv8 dari citra, video, atau streaming kamera"
    >
      <DetectionTabs />
    </PageContainer>
  );
};

export default DetectionPage;
