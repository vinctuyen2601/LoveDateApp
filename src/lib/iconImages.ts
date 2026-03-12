import { ImageSourcePropType } from 'react-native';

// Tag icons — assets/icons/tags/
export const TAG_IMAGES: Record<string, ImageSourcePropType> = {
  birthday:    require('../../assets/icons/tags/cake.png'),
  anniversary: require('../../assets/icons/tags/hearts.png'),
  holiday:     require('../../assets/icons/tags/confetti.png'),
  memorial:    require('../../assets/icons/tags/candle.png'),
  wife:        require('../../assets/icons/tags/woman.png'),
  husband:     require('../../assets/icons/tags/man.png'),
  family:      require('../../assets/icons/tags/family.png'),
  other:       require('../../assets/icons/tags/star.png'),
};

// Special date icons — assets/icons/special/
export const SPECIAL_DATE_IMAGES: Record<string, ImageSourcePropType> = {
  sys_tet_duong:       require('../../assets/icons/special/new-year.png'),
  sys_valentine:       require('../../assets/icons/special/valentine.png'),
  sys_quocte_phunu:    require('../../assets/icons/special/womens-day.png'),
  sys_white_day:       require('../../assets/icons/special/white-day.png'),
  sys_giai_phong:      require('../../assets/icons/special/liberation-day.png'),
  sys_lao_dong:        require('../../assets/icons/special/labor-day.png'),
  sys_thieu_nhi:       require('../../assets/icons/special/childrens-day.png'),
  sys_quoc_khanh:      require('../../assets/icons/special/national-day.png'),
  sys_phunu_vn:        require('../../assets/icons/special/womens-day-vn.png'),
  sys_nha_giao:        require('../../assets/icons/special/teachers-day.png'),
  sys_giang_sinh:      require('../../assets/icons/special/christmas.png'),
  sys_ngay_me:         require('../../assets/icons/special/mothers-day.png'),
  sys_ngay_cha:        require('../../assets/icons/special/fathers-day.png'),
  sys_tet_nguyen_dan:  require('../../assets/icons/special/lunar-new-year.png'),
  sys_ram_thang_gieng: require('../../assets/icons/special/full-moon-jan.png'),
  sys_vu_lan:          require('../../assets/icons/special/vu-lan.png'),
  sys_trung_thu:       require('../../assets/icons/special/mid-autumn.png'),
  sys_ong_tao:         require('../../assets/icons/special/kitchen-god.png'),
};

// Activity icons — assets/icons/activities/
export const ACTIVITY_IMAGES: Record<string, ImageSourcePropType> = {
  restaurant: require('../../assets/icons/activities/restaurant.png'),
  cafe:       require('../../assets/icons/activities/cafe.png'),
  cinema:     require('../../assets/icons/activities/cinema.png'),
  spa:        require('../../assets/icons/activities/spa.png'),
  park:       require('../../assets/icons/activities/park.png'),
  picnic:     require('../../assets/icons/activities/picnic.png'),
  gaming:     require('../../assets/icons/activities/gaming.png'),
  sports:     require('../../assets/icons/activities/sports.png'),
  shopping:   require('../../assets/icons/activities/shopping.png'),
  travel:     require('../../assets/icons/activities/travel.png'),
  cooking:    require('../../assets/icons/activities/cooking.png'),
  sunset:     require('../../assets/icons/activities/sunset.png'),
  karaoke:    require('../../assets/icons/activities/karaoke.png'),
  hiking:     require('../../assets/icons/activities/hiking.png'),
  art:        require('../../assets/icons/activities/art.png'),
};

export const getTagImage = (tagValue: string): ImageSourcePropType =>
  TAG_IMAGES[tagValue] ?? TAG_IMAGES.other;

export const getSpecialDateImage = (id: string): ImageSourcePropType =>
  SPECIAL_DATE_IMAGES[id] ?? TAG_IMAGES.other;

export const getActivityImage = (activityType: string): ImageSourcePropType =>
  ACTIVITY_IMAGES[activityType] ?? TAG_IMAGES.other;
