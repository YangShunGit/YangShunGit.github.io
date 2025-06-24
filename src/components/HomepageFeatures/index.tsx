import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '知识图谱',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        将前端知识点分类整理归纳，包含基础核心、框架使用、源码分析等，由浅入深学习前端知识
      </>
    ),
  },
  {
    title: '代码示例',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        整理一些实用组件的示例代码，包含<a href="/waterfall">支持虚拟列表且高度自适应的瀑布流组件</a>、打字效果hook等，在线查看效果
      </>
    ),
  },
  {
    title: '技能扩展',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        扩展自身技术栈，rust、java、android、harmony
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
