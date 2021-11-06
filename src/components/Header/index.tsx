import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  // TODO

  return (
    <header className={styles.header}>
      <Link href="/">
        <div className={styles.container}>
          <img src="/Logo.svg" alt="logo" />
        </div>
      </Link>
    </header>
  );
}
