import {useState, type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import { useTyping } from '../hooks/useTyping';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [desc, setDesc] = useState('');

  const {typingContent: title, typingRef: titleRef}  = useTyping({enabled: true, content: siteConfig.title, interval: 150, step: 1, onTypingComplete: () => {
    setDesc(siteConfig.tagline);
  }})
  const {typingContent: tagline, typingRef: taglineRef }  = useTyping({enabled: true, content: desc, interval: 150, step: 1})

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title" onClick={() => titleRef.restart()}>
          {title as string}
        </Heading>
        <p className="hero__subtitle" onClick={() => taglineRef.restart()}>{tagline as string}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/frontend/intro">
            快速学习⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
