import { useEffect, useState } from 'react';

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
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextUrl, setNextUrl] = useState('');
  const [checkUrl, setCheckUrl] = useState('');
  // eslint-disable-next-line prettier/prettier
  const [loadMorePosts, setLoadMorePosts] = useState(!!postsPagination.next_page);

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

  useEffect(() => {
    try {
      (async () => {
        const response = await (await fetch(nextUrl)).json();

        const formattedPosts = formatPost(response.results);

        const totalPosts = posts;

        totalPosts.push(...formattedPosts);

        setPosts(totalPosts);

        if (!response.next_page) {
          setLoadMorePosts(false);
        } else {
          setCheckUrl(response.next_page);
        }
      })();
    } catch (error) {
      console.log(error.message);
    }
  }, [nextUrl]);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function handleLoadMorePosts() {
    setNextUrl(checkUrl === '' ? postsPagination.next_page : checkUrl);
  }

  return (
    <main className={styles.container}>
      {posts.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <div className={styles.postContent}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div>
              <p>
                <FiCalendar className={commonStyles.icon} />
                {post.first_publication_date}
              </p>
              <p>
                <FiUser className={commonStyles.icon} />
                {post.data.author}
              </p>
            </div>
          </div>
        </Link>
      ))}

      {loadMorePosts ? (
        <button type="button" onClick={handleLoadMorePosts}>
          Carregar mais posts
        </button>
      ) : (
        ''
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'pos'),
    {
      fetch: ['pos.title', 'pos.subtitle', 'pos.author'],
      orderings: '[document.first_publication_date desc, my.pos.title]',
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
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

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 30,
  };
};
