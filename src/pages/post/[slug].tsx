import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Head from 'next/head';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loading}>
        <p>Carregando...</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const calculateReading = () => {
    const result = post.data.content.reduce((acc, curr) => {
      const headingAmount = curr.heading.split(' ').length;
      const bodyAmount = RichText.asText(curr.body).split(' ').length;

      // eslint-disable-next-line no-param-reassign
      acc += headingAmount + bodyAmount;

      return acc;
    }, 0);

    return Math.ceil(result / 200);
  };

  return (
    <>
      <Head>
        <title>SpaceTravelling | {post.data.title} </title>
      </Head>
      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="Banner" />
        </div>
        <article className={styles.container}>
          <section className={styles.introduce}>
            <h1>{post.data.title}</h1>
            <div>
              <p>
                <FiCalendar className={commonStyles.icon} />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </p>
              <p>
                <FiUser className={commonStyles.icon} />
                {post.data.author}
              </p>
              <p>
                <FiClock className={commonStyles.icon} />
                {`${calculateReading()} min`}
              </p>
            </div>
          </section>
          <section className={styles.blogContent}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: content.body
                      .map(bodyChild => bodyChild.text)
                      .join(''),
                  }}
                />
              </div>
            ))}
          </section>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.any('document.type', ['pos']),
    {
      fetch: ['pos.uid'],
      pageSize: 2,
    }
  );
  const paths = posts.results.map(p => ({ params: { slug: p.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = await params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('pos', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body.map(bContent => bContent),
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
