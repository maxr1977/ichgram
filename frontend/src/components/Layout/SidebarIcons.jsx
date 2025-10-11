import {
  FiHome,
  FiSearch,
  FiCompass,
  FiMessageCircle,
  FiHeart,
  FiPlusSquare,
} from 'react-icons/fi';
import {
  AiFillHome,
  AiFillCompass,
  AiFillMessage,
  AiFillHeart,
  AiFillPlusSquare,
} from 'react-icons/ai';
import { BiSearchAlt } from 'react-icons/bi';

export const HomeIcon = ({ active, className }) =>
  active ? <AiFillHome className={className} /> : <FiHome className={className} />;

export const SearchIcon = ({ active, className }) =>
  active ? <BiSearchAlt className={className} /> : <FiSearch className={className} />;

export const ExploreIcon = ({ active, className }) =>
  active ? <AiFillCompass className={className} /> : <FiCompass className={className} />;

export const MessageIcon = ({ active, className }) =>
  active ? <AiFillMessage className={className} /> : <FiMessageCircle className={className} />;

export const NotificationIcon = ({ active, className }) =>
  active ? <AiFillHeart className={className} /> : <FiHeart className={className} />;

export const CreateIcon = ({ active, className }) =>
  active ? <AiFillPlusSquare className={className} /> : <FiPlusSquare className={className} />;

const IconPropTypes = { active: false };

HomeIcon.defaultProps = IconPropTypes;
SearchIcon.defaultProps = IconPropTypes;
ExploreIcon.defaultProps = IconPropTypes;
MessageIcon.defaultProps = IconPropTypes;
NotificationIcon.defaultProps = IconPropTypes;
CreateIcon.defaultProps = IconPropTypes;
