import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import styles from './PostMasonry.module.css';

const formatCounter = (value) =>
  new Intl.NumberFormat('en-US').format(Math.max(0, value ?? 0));

const defaultVariantResolver = (index) =>
  index % 10 === 2 || index % 10 === 5 ? 'large' : 'square';

const PostMasonry = ({
  posts,
  onSelect,
  className,
  getTileVariant = defaultVariantResolver,
}) => (
  <div className={classNames(styles.grid, className)}>
    {posts.map((post, index) => {
      if (!post?.id) {
        return null;
      }
      const variant = getTileVariant(index, post) ?? 'square';
      const isLarge = variant === 'large';
      const primaryMedia = post.media?.[0] ?? null;

      return (
        <button
          key={post.id}
          type="button"
          className={classNames(styles.tile, {
            [styles.large]: isLarge,
          })}
          onClick={() => onSelect?.(post.id)}
          aria-label={`Open post by ${post.author?.username ?? 'user'}`}
        >
          {primaryMedia ? (
            <img
              className={styles.image}
              src={primaryMedia.url}
              alt={post.caption ?? 'Post preview'}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              {post.caption?.slice(0, 1) ?? 'P'}
            </div>
          )}
          <div className={styles.overlay}>
            <span className={styles.stat}>
              <FiHeart />
              {formatCounter(post.likesCount)}
            </span>
            <span className={styles.stat}>
              <FiMessageCircle />
              {formatCounter(post.commentsCount)}
            </span>
          </div>
        </button>
      );
    })}
  </div>
);

PostMasonry.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      caption: PropTypes.string,
      media: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          url: PropTypes.string,
          mimeType: PropTypes.string,
        }),
      ),
      likesCount: PropTypes.number,
      commentsCount: PropTypes.number,
      author: PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
      }),
    }),
  ),
  onSelect: PropTypes.func,
  className: PropTypes.string,
  getTileVariant: PropTypes.func,
};

PostMasonry.defaultProps = {
  posts: [],
  onSelect: undefined,
  className: undefined,
  getTileVariant: undefined,
};

export default PostMasonry;
