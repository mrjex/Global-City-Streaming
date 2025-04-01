'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/charts/view' && (pathname === '/charts' || pathname === '/charts/view')) {
      return styles.active;
    }
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
          <Link href="/charts/view" className={`${styles.navLink} ${isActive('/charts/view')}`}>
            Charts
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/logs" className={`${styles.navLink} ${isActive('/logs')}`}>
            Logs
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 