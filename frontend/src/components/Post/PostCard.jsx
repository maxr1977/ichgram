import { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';
import Avatar from '@/components/Avatar/Avatar.jsx';
import PostMediaCarousel from './PostMediaCarousel.jsx';
import formatShortTimeAgo from '@/utils/time.js';
import styles from './PostCard.module.css';

const CAPTION_CHAR_LIMIT = 30;
const COMMENT_CHAR_LIMIT = 30;

const formatCounter = (value) =>
  new Intl.NumberFormat('en-US').format(Math.max(0, value ?? 0));

const truncate = (value, limit) => {
  if (!value) {
    return { text: '', truncated: false };
  }
  const clean = value.trim();
  if (clean.length <= limit) {
    return { text: clean, truncated: false };
  }
  return { text: `${clean.slice(0, limit).trim()}`, truncated: true };
};

const PostCard = ({
  post,
  onToggleLike,
  onOpenPost,
  onFollow,
  isFollowPending,
}) => {
  const createdLabel = formatShortTimeAgo(post.createdAt);
  const shouldShowFollow = !post.isMine && !post.isFollowed;

  const { text: captionPreview, truncated: captionTruncated } = truncate(
    post.caption,
    CAPTION_CHAR_LIMIT,
  );
  const lastComment = post.lastComment ?? null;
  const { text: commentPreview, truncated: commentTruncated } = truncate(
    lastComment?.content,
    COMMENT_CHAR_LIMIT,
  );

  const handleLikeClick = () => {
    onToggleLike?.(post.id);
  };

  const handleOpenPost = (options = {}) => {
    onOpenPost?.(post.id, options);
  };

  const handleFollowClick = () => {
    if (post.author?.id) {
      onFollow?.(post.author.id, post.id);
    }
  };

  const [isCaptionExpanded, setCaptionExpanded] = useState(false);
  const [isCommentExpanded, setCommentExpanded] = useState(false);

  return (
    <article className={styles.card} data-recommended={post.isRecommended}>
      <header className={styles.header}>
        <div className={styles.authorBlock}>
          <Avatar
            src={post.author?.avatarUrl || null}
            fallback={(post.author?.username ?? 'IG').slice(0, 2).toUpperCase()}
            size="md"
          />
          <div className={styles.authorMeta}>
            <Link
              to={`/profile/${post.author?.username ?? 'me'}`}
              className={styles.username}
            >
              {post.author?.username}
            </Link>
            <span className={styles.separator}>•</span>
            <span className={styles.timestamp}>{createdLabel}</span>
            {shouldShowFollow && (
              <>
                <span className={styles.separator}>•</span>
                <button
                  type="button"
                  className={styles.followButton}
                  onClick={handleFollowClick}
                  disabled={isFollowPending}
                >
                  follow
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <PostMediaCarousel media={post.media} onOpen={() => handleOpenPost()} />

      <div className={styles.actions}>
        <button
          type="button"
          className={classNames(styles.actionButton, {
            [styles.liked]: post.isLiked,
          })}
          onClick={handleLikeClick}
          aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
        >
          {post.isLiked ? <AiFillHeart /> : <FiHeart />}
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => handleOpenPost({ focusComments: true })}
          aria-label="Open comments"
        >
          <FiMessageCircle />
        </button>
      </div>

      <div className={styles.likes}>
        <span>{formatCounter(post.likesCount)} likes</span>
      </div>

      {captionPreview && (
        <div className={styles.caption}>
          <Link
            to={`/profile/${post.author?.username ?? 'me'}`}
            className={styles.captionAuthor}
          >
            {post.author?.username}
          </Link>
          {' '}
          <span className={styles.captionText}>
            {isCaptionExpanded ? post.caption : captionPreview}
            {captionTruncated && !isCaptionExpanded && (
                <button
                type="button"
                className={styles.moreButton}
                onClick={() => setCaptionExpanded(true)}
                >
                ...more
                </button>
            )}
          </span>
        </div>
      )}

      {lastComment && (
        <div className={styles.comment}>
          <Link
            to={`/profile/${lastComment.author?.username ?? 'me'}`}
            className={styles.commentAuthor}
          >
            {lastComment.author?.username}
          </Link>
          {' '}
          <span className={styles.commentText}>
            {isCommentExpanded ? lastComment.content : commentPreview}
            {commentTruncated && !isCommentExpanded && (
                <button
                type="button"
                className={styles.moreButton}
                onClick={() => setCommentExpanded(true)}
                >
                ...more
                </button>
            )}
          </span>
        </div>
      )}

      <button
        type="button"
        className={styles.viewAllButton}
        onClick={() => handleOpenPost({ focusComments: true })}
      >
        View all comments ({post.commentsCount ?? 0})
      </button>
    </article>
  );
};

PostCard.propTypes = {
};

export default PostCard;