'use client';

import React from 'react';
import styles from './AdditionalCharts.module.css';

export default function AdditionalChartsPage() {
  // Images from the public directory
  const category1Images = [
    '/images/additional-charts/category1/4-coldest-now.png',
    '/images/additional-charts/category1/all-cities [AQUA THEME].png',
    '/images/additional-charts/category1/all-cities [PURPLE THEME].png',
  ];

  const category2Images = [
    '/images/additional-charts/category2/all-cities [AQUA THEME].png',
    '/images/additional-charts/category2/all-cities [BLUE THEME].png',
    '/images/additional-charts/category2/all-cities [BROWN THEME].png',
  ];

  return (
    <div className={styles.container}>
      {/* Left Section */}
      <section className={styles.gallerySection}>
        <h1 className={styles.title}>Header 1</h1>
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
        <h1 className={styles.title}>Header 2</h1>
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
  );
} 