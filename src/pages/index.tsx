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
  const [newPosts, setNewPosts] = useState(!!postsPagination.next_page);

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
    (async () => {
      const response = await (await fetch(nextUrl)).json();

      if (!response.next_page) {
        setNewPosts(false);
      }

      const formattedPosts = formatPost(response.results);

      const totalPosts = posts;

      totalPosts.push(...formattedPosts);

      setPosts(totalPosts);

      setNextUrl('');
    })();
  }, [nextUrl]);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function handleLoadMorePosts() {
    if (!postsPagination.next_page) {
      alert('There are no more posts!');
      return;
    }

    setNextUrl(postsPagination.next_page);
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
                <span>
                  <FiCalendar />
                </span>
                {post.first_publication_date}
              </p>
              <p>
                <span>
                  <FiUser />
                </span>
                {post.data.author}
              </p>
            </div>
          </div>
        </Link>
      ))}

      {newPosts ? (
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
