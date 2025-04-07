'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? styles.active : '';
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        Global City Streaming
      </div>
      <ul className={styles.navItems}>
        <li className={styles.navItem}>
          <Link href="/" className={`${styles.navLink} ${isActive('/')}`}>
            Dashboard
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/additional-charts" className={`${styles.navLink} ${isActive('/additional-charts')}`}>
            Additional Charts
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 