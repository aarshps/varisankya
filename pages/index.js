import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Hello World App</title>
        <meta name="description" content="A simple mobile-first Next.js application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://your-vercel-deployment-url.vercel.app/" />
        <meta property="og:title" content="Hello World App" />
        <meta property="og:description" content="A simple mobile-first Next.js application" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://your-vercel-deployment-url.vercel.app/" />
        <meta property="twitter:title" content="Hello World App" />
        <meta property="twitter:description" content="A simple mobile-first Next.js application" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hello World!
        </h1>
        <p className={styles.description}>
          Welcome to your mobile-first Next.js application
        </p>
      </main>
    </div>
  );
}