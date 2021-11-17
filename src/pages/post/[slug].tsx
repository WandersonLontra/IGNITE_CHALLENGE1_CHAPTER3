import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Head from 'next/head';
import Link from 'next/link';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  prevPost: {
    title: string;
    slug: string;
  } | null;
  nextPost: {
    title: string;
    slug: string;
  } | null;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
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
            <p>
              {`* editado em ${format(
                new Date(post.last_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              )}, às ${format(new Date(post.last_publication_date), 'HH:mm', {
                locale: ptBR,
              })}`}
            </p>
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
          <section className={styles.blogFeatures}>
            <div className={styles.postNavigation}>
              {post.prevPost ? (
                <div className={styles.prevPost}>
                  <p>{post.prevPost?.title}</p>
                  <Link href={`/post/${post.prevPost?.slug}`}>
                    <a>Post anterior</a>
                  </Link>
                </div>
              ) : (
                ''
              )}
              {post.nextPost ? (
                <div className={styles.nextPost}>
                  <p>{post.nextPost?.title}</p>
                  <Link href={`/post/${post.nextPost?.slug}`}>
                    <a>Próximo post</a>
                  </Link>
                </div>
              ) : (
                ''
              )}
            </div>
            <Comments />
            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = await params;

  const prismic = getPrismicClient();

  const totalPosts = await prismic.query(
    Prismic.predicates.at('document.type', 'pos'),
    {
      fetch: ['pos.title'],
      orderings: '[document.first_publication_date desc, my.pos.title]',
      pageSize: 100,
      ref: previewData?.ref ?? null,
    }
  );

  const slugsList = totalPosts.results.map(post => ({
    title: post.data.title,
    slug: post.slugs[0],
  }));

  const indexFinded = slugsList.findIndex(element => {
    return element.slug === slug;
  });

  const response = await prismic.getByUID('pos', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    prevPost: slugsList[indexFinded - 1] || null,
    nextPost: slugsList[indexFinded + 1] || null,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      preview,
    },
    revalidate: 60 * 60 * 24,
  };
};
