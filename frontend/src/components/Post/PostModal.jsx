import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  FiHeart,
  FiMessageCircle,
  FiSmile,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';
import EmojiPicker from 'emoji-picker-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Loader } from '@/components';
import CreatePostModal from '@/components/CreatePost/CreatePostModal.jsx';
import Modal from '@/components/Modal/Modal.jsx';
import PostMediaCarousel from './PostMediaCarousel.jsx';
import formatShortTimeAgo from '@/utils/time.js';
import apiClient from '@/services/apiClient.js';
import { getSocket } from '@/services/socketClient.js';
import { applyPostCommentUpdate, updatePost, deletePost } from '@/store/slices/postSlice.js';
import styles from './PostModal.module.css';

const COMMENTS_LIMIT = 20;

const formatCount = (value) =>
  new Intl.NumberFormat('en-US').format(Math.max(0, value ?? 0));

const PostModal = ({
  isOpen,
  onClose,
  post,
  onToggleLike,
  onFollow,
  isFollowPending,
  autoFocusComment,
  onPostDeleted,
  onPostUpdated,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentValue, setCommentValue] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isOptionsOpen, setOptionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isEditSubmitting, setEditSubmitting] = useState(false);
  const commentInputRef = useRef(null);

  const postId = post?.id;

  const shouldShowFollow = useMemo(
    () => Boolean(post) && !post.isMine && !post.isFollowed,
    [post],
  );

  const goToProfile = (username) => {
    if (!username) return;
    onClose();
    navigate(`/profile/${username}`);
  };

  const createdLabel = useMemo(
    () => (post?.createdAt ? formatShortTimeAgo(post.createdAt) : ''),
    [post?.createdAt],
  );

  const resetState = useCallback(() => {
    setComments([]);
    setStatus('idle');
    setError(null);
    setPage(1);
    setHasMore(true);
    setCommentValue('');
    setEmojiOpen(false);
  }, []);

  const fetchComments = useCallback(
    async (nextPage = 1, append = false) => {
      if (!postId) return;
      const targetPage = Math.max(1, nextPage);
      setStatus(targetPage === 1 ? 'loading' : 'loadingMore');
      setError(null);
      try {
        const response = await apiClient.get(`/comments/post/${postId}`, {
          params: { page: targetPage, limit: COMMENTS_LIMIT },
        });
        const data = response.data?.data ?? {};
        const items = data.items ?? [];
        setComments((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === COMMENTS_LIMIT);
        setPage(targetPage);
        setStatus('succeeded');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load comments');
        setStatus('failed');
      }
    },
    [postId],
  );

  useEffect(() => {
    if (!isOpen || !postId) {
      resetState();
      return;
    }
    fetchComments(1, false);
  }, [fetchComments, isOpen, postId, resetState]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const socket = getSocket();
    if (!socket || !postId) {
      return undefined;
    }

    const handleCommentNew = ({ postId: incomingId, comment }) => {
      if (incomingId !== postId || !comment) return;
      setComments((prev) => {
        if (prev.some((item) => item.id === comment.id)) {
          return prev;
        }
        return [comment, ...prev];
      });
      dispatch(applyPostCommentUpdate({
        postId,
        commentsCount: (post?.commentsCount ?? 0) + 1,
        lastComment: comment,
      }));
    };

    const handleCommentDeleted = ({ postId: incomingId, commentId, lastComment, commentsCount }) => {
      if (incomingId !== postId || !commentId) return;
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      dispatch(applyPostCommentUpdate({ postId, commentsCount, lastComment }));
    };

    const handleCommentLike = ({ postId: incomingId, commentId, likesCount, liked }) => {
      if (incomingId !== postId || !commentId) return;
      setComments((prev) =>
        prev.map((comment) => (
          comment.id === commentId
            ? { ...comment, likesCount, isLiked: liked }
            : comment
        )),
      );
    };

    socket.on('comment:new', handleCommentNew);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('comment:like', handleCommentLike);

    return () => {
      socket.off('comment:new', handleCommentNew);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('comment:like', handleCommentLike);
    };
  }, [dispatch, isOpen, post?.commentsCount, postId]);

  useEffect(() => {
    if (isOpen && autoFocusComment) {
      commentInputRef.current?.focus();
    }
  }, [autoFocusComment, isOpen]);

  const handleFocusComment = () => {
    commentInputRef.current?.focus();
  };

  const handleCommentValueChange = (event) => {
    const textarea = commentInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
    setCommentValue(event.target.value);
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    const trimmed = commentValue.trim();
    if (!trimmed || !postId) {
      return;
    }
    setIsSubmittingComment(true);
    try {
      const response = await apiClient.post(`/comments/post/${postId}`, { content: trimmed });
      const payload = response.data?.data ?? {};
      const newComment = payload.comment;
      if (newComment) {
        setComments((prev) => {
          if (prev.some((item) => item.id === newComment.id)) {
            return prev;
          }
          return [newComment, ...prev];
        });
        dispatch(
          applyPostCommentUpdate({
            postId,
            commentsCount: payload.postStats?.commentsCount,
            lastComment: newComment,
          }),
        );
      }
      setCommentValue('');
      setEmojiOpen(false);
      if (commentInputRef.current) {
        commentInputRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    try {
      const response = await apiClient.post(`/likes/comments/${commentId}`);
      const payload = response.data?.data;
      if (!payload) return;
      setComments((prev) =>
        prev.map((comment) => (
          comment.id === commentId
            ? { ...comment, likesCount: payload.likesCount, isLiked: payload.liked }
            : comment
        )),
      );
    } catch (err) {
      
    }
  };

  const handleFollowClick = () => {
    if (!post?.author?.id) return;
    onFollow?.(post.author.id, post.id);
  };

  const handleDeletePost = async () => {
    if (!postId || isDeleting) return;
    setIsDeleting(true);
    try {
      await dispatch(deletePost({ postId })).unwrap();
      handleCloseOptions();
      if (onPostDeleted) {
        onPostDeleted(postId);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditOpen = () => {
    if (!post) return;
    setOptionsOpen(false);
    setIsDeleting(false);
    setEditOpen(true);
  };

  const handleEditSubmit = async ({ caption, keepMediaIds, images }) => {
    if (!postId) return;
    setEditSubmitting(true);
    try {
      const updatedPost = await dispatch(
        updatePost({ postId, caption, keepMediaIds, images }),
      ).unwrap();
      setEditOpen(false);
      if (updatedPost) {
        setComments([]);
        fetchComments(1, false);
        onPostUpdated?.(updatedPost);
      }
    } catch (err) {
      const message = err?.message ?? 'Failed to update post';
      throw new Error(message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCloseOptions = () => {
    setOptionsOpen(false);
    setIsDeleting(false);
  };

  const handleCancelAll = () => {
    handleCloseOptions();
    onClose();
  };

  const handleGoToPost = () => {
    handleCloseOptions();
  };

  if (!post) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className={styles.emptyState}>
          <p>Post not found.</p>
        </div>
      </Modal>
    );
  }

  const initials = (post.author?.fullName || post.author?.username || 'IG').slice(0, 2).toUpperCase();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" className={styles.modal}>
        <div className={styles.container}>
          <div className={styles.mediaSection}>
            <div className={styles.mediaWrapper}>
              <PostMediaCarousel media={post.media} variant="modal" />
            </div>
          </div>
          <div className={styles.infoSection}>
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                <Avatar
                  src={post.author?.avatarUrl || null}
                  fallback={initials}
                  size="sm"
                  onClick={() => goToProfile(post.author?.username)}
                  className={styles.clickableAvatar}
                />
                <div className={styles.headerMeta}>
                  <button
                    type="button"
                    className={styles.username}
                    onClick={() => goToProfile(post.author?.username)}
                  >
                    {post.author?.username}
                  </button>
                  <span className={styles.timestamp}>{createdLabel}</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                {shouldShowFollow && (
                  <button
                    type="button"
                    className={styles.followLink}
                    onClick={handleFollowClick}
                    disabled={isFollowPending}
                  >
                    follow
                  </button>
                )}
                {post.isMine && (
                  <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() => setOptionsOpen(true)}
                    aria-label="Post actions"
                  >
                    <FiMoreHorizontal />
                  </button>
                )}
              </div>
            </header>

            {post.caption && (
              <div className={styles.captionBlock}>
                <button
                  type="button"
                  className={styles.captionAuthor}
                  onClick={() => goToProfile(post.author?.username)}
                >
                  {post.author?.username}
                </button>
                <p className={styles.captionText}>{post.caption}</p>
              </div>
            )}

            <div className={styles.commentsContainer}>
              {status === 'loading' ? (
                <div className={styles.commentsLoader}>
                  <Loader />
                </div>
              ) : status === 'failed' ? (
                <div className={styles.commentsError}>{error}</div>
              ) : (
                <ul className={styles.commentList}>
                  {comments.map((comment) => (
                    <li key={comment.id} className={styles.commentItem}>
                      <Avatar
                        src={comment.author?.avatarUrl || null}
                        fallback={(comment.author?.username ?? 'IG').slice(0, 2).toUpperCase()}
                        size="sm"
                        className={`${styles.commentAvatar} ${styles.clickableAvatar}`}
                        onClick={() => goToProfile(comment.author?.username)}
                      />
                      <div className={styles.commentBody}>
                        <div className={styles.commentHeader}>
                          <div className={styles.commentInfo}>
                            <button
                              type="button"
                              className={styles.commentAuthor}
                              onClick={() => goToProfile(comment.author?.username)}
                            >
                              {comment.author?.username}
                            </button>
                          </div>
                          <button
                            type="button"
                            className={classNames(styles.commentLikeButton, {
                              [styles.commentLiked]: comment.isLiked,
                            })}
                            onClick={() => handleToggleCommentLike(comment.id)}
                            aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                          >
                            {comment.isLiked ? <AiFillHeart /> : <FiHeart />}
                          </button>
                        </div>
                        <p className={styles.commentContent}>{comment.content}</p>
                        <div className={styles.commentMeta}>
                          <span>{formatShortTimeAgo(comment.createdAt)}</span>
                          <span>{formatCount(comment.likesCount)} likes</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {hasMore && status === 'succeeded' && (
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.loadMore}
                  onClick={() => fetchComments(page + 1, true)}
                >
                  Load older comments
                </Button>
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={classNames(styles.actionButton, {
                    [styles.liked]: post.isLiked,
                  })}
                  onClick={() => onToggleLike?.(post.id)}
                  aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
                >
                  {post.isLiked ? <AiFillHeart /> : <FiHeart />}
                </button>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={handleFocusComment}
                  aria-label="Add a comment"
                >
                  <FiMessageCircle />
                </button>
              </div>
              <div className={styles.likesCount}>{formatCount(post.likesCount)} likes</div>
              <form className={styles.commentForm} onSubmit={handleSubmitComment}>
                <div className={styles.commentInputWrapper}>
                  <button
                    type="button"
                    className={styles.emojiButton}
                    onClick={() => setEmojiOpen((prev) => !prev)}
                  >
                    <FiSmile />
                  </button>
                  <textarea
                    ref={commentInputRef}
                    className={styles.commentInput}
                    value={commentValue}
                    onChange={handleCommentValueChange}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        handleSubmitComment(event);
                      }
                    }}
                    placeholder="Add a comment..."
                    rows={1}
                  />
                  <button
                    type="submit"
                    className={classNames(styles.sendButton, {
                      [styles.sendButtonActive]: commentValue.trim() && !isSubmittingComment,
                    })}
                    disabled={!commentValue.trim() || isSubmittingComment}
                  >
                    Send
                  </button>
                </div>
                {emojiOpen && (
                  <div className={styles.emojiPicker}>
                    <EmojiPicker onEmojiClick={handleEmojiSelect} width="100%" height={320} />
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {post.isMine && (
        <Modal isOpen={isOptionsOpen} onClose={handleCloseOptions} size="sm">
          <div className={styles.options}>
            <button type="button" onClick={handleEditOpen} className={styles.optionButton}>
              Edit post
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              className={classNames(styles.optionButton, styles.danger)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete post'}
            </button>
            <button type="button" onClick={handleGoToPost} className={styles.optionButton}>
              View post
            </button>
            <span className={classNames(styles.optionButton, styles.optionDisabled)}>Copy link</span>
            <button type="button" onClick={handleCancelAll} className={styles.optionButton}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {post.isMine && (
        <CreatePostModal
          key={post.id}
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          user={post.author}
          mode="edit"
          initialCaption={post.caption ?? ''}
          initialMedia={post.media ?? []}
          onSubmit={handleEditSubmit}
          isSubmitting={isEditSubmitting}
          title="Edit post"
        />
      )}
    </>
  );
};

PostModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  post: PropTypes.shape({
    id: PropTypes.string,
    caption: PropTypes.string,
    createdAt: PropTypes.string,
    author: PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
      avatarUrl: PropTypes.string,
      fullName: PropTypes.string,
    }),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        url: PropTypes.string,
      }),
    ),
    likesCount: PropTypes.number,
    commentsCount: PropTypes.number,
    isLiked: PropTypes.bool,
    isMine: PropTypes.bool,
    isFollowed: PropTypes.bool,
  }),
  onToggleLike: PropTypes.func,
  onPostUpdated: PropTypes.func,
  onFollow: PropTypes.func,
  isFollowPending: PropTypes.bool,
  autoFocusComment: PropTypes.bool,
  onPostDeleted: PropTypes.func,
};

PostModal.defaultProps = {
  isOpen: false,
  post: null,
  onToggleLike: undefined,
  onPostUpdated: undefined,
  onFollow: undefined,
  isFollowPending: false,
  autoFocusComment: false,
  onPostDeleted: undefined,
};

export default PostModal;
