import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const formatPost = (postsToFormat: Post[]) => {
    return postsToFormat.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const getMorePosts = async () => {
    try {
      const response = await (await fetch(posts.next_page)).json();

      const formattedPosts = formatPost(response.results);

      const totalPosts = posts.results;

      totalPosts.push(...formattedPosts);
      setPosts({
        next_page: response.next_page,
        results: totalPosts,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function handleLoadMorePosts() {
    getMorePosts();
  }

  return (
    <main className={styles.container}>
      {posts.results.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <div className={styles.postContent}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
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
            </div>
          </div>
        </Link>
      ))}

      {posts.next_page ? (
        <button type="button" onClick={handleLoadMorePosts}>
          Carregar mais posts
        </button>
      ) : (
        ''
      )}

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'pos'),
    {
      fetch: ['pos.title', 'pos.subtitle', 'pos.author'],
      orderings: '[document.first_publication_date desc, my.pos.title]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60 * 30,
  };
};
