'use client';

import React from 'react';
import styles from './AdditionalCharts.module.css';
import EquatorChartQueryPanel from '@/components/EquatorChartQueryPanel';

export default function AdditionalChartsPage() {
  // Images from the public directory
  const temperatureRankings = [
    '/images/additional-charts/temperature-rankings/4-coldest-now.png',
    '/images/additional-charts/temperature-rankings/all-cities-aqua-theme.png',
    '/images/additional-charts/temperature-rankings/all-cities-purple-theme.png',
    '/images/additional-charts/temperature-rankings/two-cities-random-colors.png',
    '/images/additional-charts/temperature-rankings/all-cities-red-theme.png',
    '/images/additional-charts/temperature-rankings/all-cities-orange-theme.png'
  ];

  const cityComparisons = [
    '/images/additional-charts/city-comparisons/all-cities-aqua-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-random-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-brown-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-blue-theme-no-outline.png',
    '/images/additional-charts/city-comparisons/lisbon-yellow-theme.png',
    '/images/additional-charts/city-comparisons/all-cities-original.png'
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <h1 className={styles.mainTitle}>Production Charts Gallery</h1>
        <p className={styles.description}>
          <em>Explore the collection of real-time data visualizations, showcasing streaming analytics from the Kafka-Flink pipeline through various chart styles and themes.</em>
        </p>
      </header>

      {/* Equator Chart Section */}
      <section className={styles.equatorChartSection}>
        <EquatorChartQueryPanel />
      </section>

      <div className={styles.galleryContainer}>
        {/* Left Section */}
        <section className={styles.gallerySection}>
          <h2 className={styles.sectionTitle}>Temperature Rankings</h2>
          <div className={styles.imageGrid}>
            {temperatureRankings.map((src, index) => (
              <div key={index} className={styles.imageContainer}>
                <img
                  src={src}
                  alt={`Temperature Rankings Image ${index + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Right Section */}
        <section className={styles.gallerySection}>
          <h2 className={styles.sectionTitle}>City Comparisons</h2>
          <div className={styles.imageGrid}>
            {cityComparisons.map((src, index) => (
              <div key={index} className={styles.imageContainer}>
                <img
                  src={src}
                  alt={`City Comparisons Image ${index + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 