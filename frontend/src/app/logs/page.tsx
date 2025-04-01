'use client';

import React from 'react';
import styles from './Logs.module.css';
import FlinkLogViewer from '../components/FlinkLogViewer';

export default function LogsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Logs</h1>
      
      <div className={styles.logSection}>
        <h2 className={styles.sectionTitle}>Kafka Producer Logs</h2>
        <div className={styles.logViewers}>
          <iframe 
            src="/kafka-logs" 
            className={styles.logFrame}
            title="Kafka Producer Logs"
          />
        </div>
      </div>

      <div className={styles.logSection}>
        <h2 className={styles.sectionTitle}>Flink Processor Logs</h2>
        <div className={styles.logViewers}>
          <FlinkLogViewer logType="raw" />
          <FlinkLogViewer logType="db" />
        </div>
      </div>
    </div>
  );
} 