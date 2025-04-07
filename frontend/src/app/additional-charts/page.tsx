'use client';

import React from 'react';
import styles from './AdditionalCharts.module.css';

export default function AdditionalChartsPage() {
  // Images from the public directory
  const category1Images = [
    '/images/additional-charts/category1/4-coldest-now.png',
    '/images/additional-charts/category1/all-cities-aqua-theme.png',
    '/images/additional-charts/category1/all-cities-purple-theme.png',
  ];

  const category2Images = [
    '/images/additional-charts/category2/all-cities-aqua-theme.png',
    '/images/additional-charts/category2/all-cities-blue-theme.png',
    '/images/additional-charts/category2/all-cities-brown-theme.png',
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

      <div className={styles.galleryContainer}>
        {/* Left Section */}
        <section className={styles.gallerySection}>
          <h2 className={styles.sectionTitle}>Header 1</h2>
          <div className={styles.imageGrid}>
            {category1Images.map((src, index) => (
              <div key={index} className={styles.imageContainer}>
                <img
                  src={src}
                  alt={`Category 1 Image ${index + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Right Section */}
        <section className={styles.gallerySection}>
          <h2 className={styles.sectionTitle}>Header 2</h2>
          <div className={styles.imageGrid}>
            {category2Images.map((src, index) => (
              <div key={index} className={styles.imageContainer}>
                <img
                  src={src}
                  alt={`Category 2 Image ${index + 1}`}
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