import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import classNames from 'classnames';
import styles from './PostMediaCarousel.module.css';

const PostMediaCarousel = ({ media, onOpen, variant }) => {
  const items = useMemo(
    () => (Array.isArray(media) ? media.filter((item) => item?.url) : []),
    [media],
  );
  const [index, setIndex] = useState(0);

  if (!items.length) {
    return null;
  }

  const currentIndex = Math.min(index, items.length - 1);
  const currentItem = items[currentIndex];

  const goPrev = (event) => {
    event.stopPropagation();
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = (event) => {
    event.stopPropagation();
    setIndex((prev) => (prev + 1) % items.length);
  };

  const handleOpen = () => {
    onOpen?.();
  };

  return (
    <div
      className={classNames(styles.wrapper)}
      onClick={handleOpen}
      role="presentation"
      data-variant={variant}
    >
      <img
        src={currentItem.url}
        alt={currentItem.alt ?? 'Post media'}
        className={styles.image}
        loading="lazy"
      />
      {items.length > 1 && (
        <>
          <button
            type="button"
            className={classNames(styles.navButton, styles.prev)}
            onClick={goPrev}
            aria-label="Previous image"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            className={classNames(styles.navButton, styles.next)}
            onClick={goNext}
            aria-label="Next image"
          >
            <FiChevronRight />
          </button>
          <div className={styles.dots}>
            {items.map((item, dotIndex) => (
              <span
                key={item.id ?? item.key ?? `${item.url}-${dotIndex}`}
                className={classNames(styles.dot, {
                  [styles.dotActive]: dotIndex === currentIndex,
                })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

PostMediaCarousel.propTypes = {
  media: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
      mimeType: PropTypes.string,
    }),
  ),
  onOpen: PropTypes.func,
  variant: PropTypes.oneOf(['card', 'modal']),
};

PostMediaCarousel.defaultProps = {
  media: [],
  onOpen: undefined,
  variant: 'card',
};

export default PostMediaCarousel;
