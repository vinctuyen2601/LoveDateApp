import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

// MBTI dimensions
type MBTIDimension = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

interface MBTIQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  dimensionA: MBTIDimension; // E, S, T, J
  dimensionB: MBTIDimension; // I, N, F, P
  category: 'EI' | 'SN' | 'TF' | 'JP';
}

interface MBTIResult {
  type: string; // INTJ, ENFP, etc.
  description: string;
  strengths: string[];
  weaknesses: string[];
  loveStyle: string;
  giftIdeas: string[];
  compatibility: {
    best: string[];
    good: string[];
    challenging: string[];
  };
}

const MBTISurveyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MBTIDimension>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [surveyFor, setSurveyFor] = useState<'self' | 'partner' | null>(null);

  // 40 câu hỏi MBTI chuẩn - 10 câu mỗi chiều
  const mbtiQuestions: MBTIQuestion[] = [
    // E-I (Extroversion vs Introversion) - 10 questions
    {
      id: 1,
      question: 'Sau một ngày dài, bạn cảm thấy như thế nào?',
      optionA: 'Tràn đầy năng lượng sau khi gặp gỡ nhiều người',
      optionB: 'Cần thời gian một mình để nạp lại năng lượng',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 2,
      question: 'Khi tham gia một bữa tiệc, bạn thường:',
      optionA: 'Chủ động trò chuyện với nhiều người',
      optionB: 'Chỉ nói chuyện với vài người quen',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 3,
      question: 'Bạn thích làm việc:',
      optionA: 'Trong nhóm, có nhiều người xung quanh',
      optionB: 'Một mình, tập trung vào công việc',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 4,
      question: 'Khi gặp vấn đề, bạn:',
      optionA: 'Chia sẻ với nhiều người để lấy ý kiến',
      optionB: 'Suy nghĩ kỹ trong đầu trước khi nói ra',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 5,
      question: 'Bạn cảm thấy thoải mái hơn khi:',
      optionA: 'Nói trước, nghĩ sau',
      optionB: 'Nghĩ kỹ trước khi nói',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 6,
      question: 'Vào cuối tuần, bạn muốn:',
      optionA: 'Ra ngoài gặp gỡ bạn bè, tham gia hoạt động',
      optionB: 'Ở nhà nghỉ ngơi, làm việc riêng tư',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 7,
      question: 'Bạn có xu hướng:',
      optionA: 'Có nhiều bạn bè, quen biết rộng',
      optionB: 'Có ít bạn thân, quan hệ sâu sắc',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 8,
      question: 'Khi học bài mới, bạn thích:',
      optionA: 'Thảo luận nhóm, trao đổi với người khác',
      optionB: 'Tự học, đọc sách một mình',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 9,
      question: 'Trong giao tiếp, bạn:',
      optionA: 'Dễ dàng bắt chuyện với người lạ',
      optionB: 'Cần thời gian để làm quen',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },
    {
      id: 10,
      question: 'Bạn được coi là người:',
      optionA: 'Hoạt bát, nhiệt tình, dễ gần',
      optionB: 'Trầm tĩnh, kín đáo, sâu sắc',
      dimensionA: 'E',
      dimensionB: 'I',
      category: 'EI',
    },

    // S-N (Sensing vs Intuition) - 10 questions
    {
      id: 11,
      question: 'Khi tiếp nhận thông tin, bạn chú ý:',
      optionA: 'Chi tiết cụ thể, sự thật rõ ràng',
      optionB: 'Ý nghĩa sâu xa, khả năng tiềm ẩn',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 12,
      question: 'Bạn tin tưởng vào:',
      optionA: 'Kinh nghiệm thực tế đã trải qua',
      optionB: 'Trực giác và cảm nhận bên trong',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 13,
      question: 'Khi làm việc, bạn thích:',
      optionA: 'Làm theo hướng dẫn cụ thể, từng bước',
      optionB: 'Tự do sáng tạo, thử nghiệm cách mới',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 14,
      question: 'Bạn tập trung vào:',
      optionA: 'Hiện tại, những gì đang xảy ra',
      optionB: 'Tương lai, khả năng sẽ xảy ra',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 15,
      question: 'Trong trò chuyện, bạn thường:',
      optionA: 'Nói về sự kiện cụ thể, chi tiết',
      optionB: 'Nói về ý tưởng, khái niệm trừu tượng',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 16,
      question: 'Bạn thích đọc:',
      optionA: 'Sách hướng dẫn thực hành, sách chuyên môn',
      optionB: 'Sách triết lý, khoa học viễn tưởng',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 17,
      question: 'Khi mô tả một người, bạn nói về:',
      optionA: 'Ngoại hình, trang phục, hành động cụ thể',
      optionB: 'Tính cách, ấn tượng tổng thể, cảm giác',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 18,
      question: 'Bạn thường:',
      optionA: 'Quan sát kỹ những gì xung quanh',
      optionB: 'Suy nghĩ về ý nghĩa đằng sau',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 19,
      question: 'Trong học tập, bạn thích:',
      optionA: 'Ví dụ thực tế, ứng dụng cụ thể',
      optionB: 'Lý thuyết chung, nguyên lý tổng quát',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },
    {
      id: 20,
      question: 'Bạn được mô tả là người:',
      optionA: 'Thực tế, tỉ mỉ, chú ý chi tiết',
      optionB: 'Tưởng tượng phong phú, đầu óc sáng tạo',
      dimensionA: 'S',
      dimensionB: 'N',
      category: 'SN',
    },

    // T-F (Thinking vs Feeling) - 10 questions
    {
      id: 21,
      question: 'Khi ra quyết định, bạn dựa vào:',
      optionA: 'Logic, phân tích khách quan',
      optionB: 'Cảm xúc, giá trị cá nhân',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 22,
      question: 'Trong tranh luận, bạn coi trọng:',
      optionA: 'Sự thật, đúng hay sai',
      optionB: 'Cảm nhận của mọi người',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 23,
      question: 'Khi ai đó kể chuyện buồn, bạn:',
      optionA: 'Đưa ra lời khuyên, giải pháp cụ thể',
      optionB: 'Lắng nghe, chia sẻ cảm xúc',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 24,
      question: 'Bạn thích được khen:',
      optionA: 'Thông minh, có năng lực',
      optionB: 'Tốt bụng, chu đáo',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 25,
      question: 'Trong công việc nhóm, bạn:',
      optionA: 'Tập trung vào hiệu quả, kết quả',
      optionB: 'Quan tâm đến sự hòa hợp, tinh thần',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 26,
      question: 'Khi đánh giá người khác, bạn xem xét:',
      optionA: 'Năng lực, thành tích',
      optionB: 'Tính cách, thái độ',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 27,
      question: 'Bạn thường:',
      optionA: 'Nói thẳng, trực tiếp',
      optionB: 'Nói khéo, tế nhị để tránh làm tổn thương',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 28,
      question: 'Trong xung đột, bạn ưu tiên:',
      optionA: 'Tìm ra ai đúng ai sai',
      optionB: 'Giữ mối quan hệ hòa thuận',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 29,
      question: 'Bạn cảm thấy thoải mái với:',
      optionA: 'Phê bình xây dựng, đánh giá khách quan',
      optionB: 'Lời khen ngợi, động viên',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },
    {
      id: 30,
      question: 'Người khác thấy bạn là người:',
      optionA: 'Công bằng, nguyên tắc, lý trí',
      optionB: 'Ấm áp, đồng cảm, quan tâm',
      dimensionA: 'T',
      dimensionB: 'F',
      category: 'TF',
    },

    // J-P (Judging vs Perceiving) - 10 questions
    {
      id: 31,
      question: 'Trong cuộc sống, bạn thích:',
      optionA: 'Lên kế hoạch, sắp xếp rõ ràng',
      optionB: 'Linh hoạt, tùy cơ ứng biến',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 32,
      question: 'Khi làm việc, bạn:',
      optionA: 'Làm trước hạn, không để việc tồn đọng',
      optionB: 'Làm gần deadline, tốt nhất dưới áp lực',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 33,
      question: 'Phòng của bạn thường:',
      optionA: 'Gọn gàng, mọi thứ đúng vị trí',
      optionB: 'Hơi lộn xộn nhưng biết đồ ở đâu',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 34,
      question: 'Khi đi du lịch, bạn:',
      optionA: 'Lên kế hoạch chi tiết từ trước',
      optionB: 'Đi rồi tính, khám phá tự do',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 35,
      question: 'Bạn cảm thấy thoải mái khi:',
      optionA: 'Mọi thứ đã quyết định, chắc chắn',
      optionB: 'Còn nhiều lựa chọn mở',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 36,
      question: 'Trong làm việc nhóm, bạn thích:',
      optionA: 'Phân công rõ ràng, đúng tiến độ',
      optionB: 'Linh hoạt, điều chỉnh theo tình hình',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 37,
      question: 'Bạn thường:',
      optionA: 'Làm danh sách việc cần làm',
      optionB: 'Làm việc nào nhớ ra việc đó',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 38,
      question: 'Khi có kế hoạch bị thay đổi, bạn:',
      optionA: 'Khó chịu, cảm thấy mất kiểm soát',
      optionB: 'Không sao, thích sự bất ngờ',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 39,
      question: 'Bạn thích làm việc:',
      optionA: 'Theo lịch trình cố định',
      optionB: 'Theo cảm hứng, không gò bó',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
    {
      id: 40,
      question: 'Người khác mô tả bạn là:',
      optionA: 'Có tổ chức, kỷ luật, đáng tin cậy',
      optionB: 'Thoải mái, tự nhiên, linh hoạt',
      dimensionA: 'J',
      dimensionB: 'P',
      category: 'JP',
    },
  ];

  const calculateMBTI = (): string => {
    const scores: Record<MBTIDimension, number> = {
      E: 0, I: 0,
      S: 0, N: 0,
      T: 0, F: 0,
      J: 0, P: 0,
    };

    Object.values(answers).forEach((answer) => {
      scores[answer]++;
    });

    const type = [
      scores.E >= scores.I ? 'E' : 'I',
      scores.S >= scores.N ? 'S' : 'N',
      scores.T >= scores.F ? 'T' : 'F',
      scores.J >= scores.P ? 'J' : 'P',
    ].join('');

    return type;
  };

  const getMBTIResult = (type: string): MBTIResult => {
    const results: Record<string, MBTIResult> = {
      // Analyst (NT)
      INTJ: {
        type: 'INTJ',
        description: 'Kiến trúc sư - Tư duy chiến lược, độc lập, sáng tạo. Luôn tìm cách cải thiện hệ thống.',
        strengths: ['Tư duy logic mạnh mẽ', 'Độc lập, tự chủ', 'Có tầm nhìn xa', 'Quyết đoán'],
        weaknesses: ['Khó bộc lộ cảm xúc', 'Hay phê phán', 'Có thể xa cách'],
        loveStyle: 'Yêu bằng lý trí, thích sự chân thành và trung thực. Cần không gian riêng tư.',
        giftIdeas: ['Sách chuyên môn, tri thức', 'Đồ công nghệ cao cấp', 'Khóa học online', 'Trò chơi trí tuệ'],
        compatibility: {
          best: ['ENFP', 'ENTP', 'INFJ'],
          good: ['INTJ', 'ENTJ', 'INTP'],
          challenging: ['ESFP', 'ESTP', 'ISFJ'],
        },
      },
      INTP: {
        type: 'INTP',
        description: 'Nhà logic học - Tò mò, thích phân tích, tìm kiếm sự thật.',
        strengths: ['Tư duy phân tích sắc bén', 'Sáng tạo', 'Trung thực', 'Thích học hỏi'],
        weaknesses: ['Hay mơ mộng', 'Khó ra quyết định', 'Không thích giao tiếp xã hội'],
        loveStyle: 'Yêu bằng trí tuệ, thích thảo luận sâu. Cần người hiểu và tôn trọng không gian.',
        giftIdeas: ['Đồ chơi logic puzzle', 'Sách khoa học, triết học', 'Công cụ phân tích', 'Gadget công nghệ'],
        compatibility: {
          best: ['ENTJ', 'ESTJ', 'INFJ'],
          good: ['INTP', 'INTJ', 'ENTP'],
          challenging: ['ESFJ', 'ISFJ', 'ESFP'],
        },
      },
      ENTJ: {
        type: 'ENTJ',
        description: 'Tư lệnh - Lãnh đạo bẩm sinh, quyết đoán, tham vọng.',
        strengths: ['Lãnh đạo tự nhiên', 'Tự tin, quyết đoán', 'Tầm nhìn chiến lược', 'Hiệu quả cao'],
        weaknesses: ['Hay áp đặt', 'Thiếu kiên nhẫn', 'Khó thể hiện cảm xúc'],
        loveStyle: 'Yêu mạnh mẽ, trung thành. Thích người có tư duy và tham vọng.',
        giftIdeas: ['Sách kinh doanh, lãnh đạo', 'Phụ kiện sang trọng', 'Khóa học MBA', 'Đồ công sở cao cấp'],
        compatibility: {
          best: ['INTP', 'INFP', 'ENFP'],
          good: ['ENTJ', 'INTJ', 'ENTP'],
          challenging: ['ISFP', 'ESFP', 'ISFJ'],
        },
      },
      ENTP: {
        type: 'ENTP',
        description: 'Nhà tranh luận - Thông minh, nhanh nhạy, thích tranh luận.',
        strengths: ['Sáng tạo', 'Tư duy nhanh', 'Linh hoạt', 'Hài hước'],
        weaknesses: ['Thiếu kiên nhẫn', 'Hay tranh luận', 'Khó tập trung dài hạn'],
        loveStyle: 'Yêu sôi nổi, thích kích thích trí tuệ. Cần tự do và không gian sáng tạo.',
        giftIdeas: ['Trò chơi chiến thuật', 'Sách phi hư cấu', 'Vé sự kiện networking', 'Gadget độc đáo'],
        compatibility: {
          best: ['INFJ', 'INTJ', 'ENFJ'],
          good: ['ENTP', 'ENTJ', 'INTP'],
          challenging: ['ISFJ', 'ISTJ', 'ESFJ'],
        },
      },

      // Diplomat (NF)
      INFJ: {
        type: 'INFJ',
        description: 'Người bảo vệ - Hiếm có, sâu sắc, giàu lòng trắc ẩn.',
        strengths: ['Đồng cảm sâu sắc', 'Tầm nhìn xa', 'Quyết tâm', 'Sáng tạo'],
        weaknesses: ['Quá nhạy cảm', 'Dễ kiệt sức', 'Hoàn hảo chủ nghĩa'],
        loveStyle: 'Yêu sâu đậm, chân thành. Tìm kiếm mối quan hệ ý nghĩa và sâu sắc.',
        giftIdeas: ['Nhật ký handmade', 'Sách tâm lý', 'Trải nghiệm ý nghĩa', 'Quà handmade có tâm'],
        compatibility: {
          best: ['ENTP', 'ENFP', 'INTJ'],
          good: ['INFJ', 'ENFJ', 'INFP'],
          challenging: ['ESTP', 'ISTP', 'ESFP'],
        },
      },
      INFP: {
        type: 'INFP',
        description: 'Người hòa giải - Lý tưởng hóa, nhạy cảm, sáng tạo.',
        strengths: ['Giàu trí tưởng tượng', 'Đồng cảm cao', 'Trung thành', 'Linh hoạt'],
        weaknesses: ['Quá lý tưởng', 'Dễ bị tổn thương', 'Khó đưa ra quyết định'],
        loveStyle: 'Yêu lãng mạn, chân thành. Cần người hiểu và tôn trọng giá trị nội tâm.',
        giftIdeas: ['Sách thơ, văn học', 'Dụng cụ nghệ thuật', 'Âm nhạc indie', 'Quà có ý nghĩa sâu xa'],
        compatibility: {
          best: ['ENFJ', 'ENTJ', 'INFJ'],
          good: ['INFP', 'ENFP', 'INTP'],
          challenging: ['ESTJ', 'ISTJ', 'ESTP'],
        },
      },
      ENFJ: {
        type: 'ENFJ',
        description: 'Người đào tạo - Truyền cảm hứng, lãnh đạo bằng trái tim.',
        strengths: ['Giao tiếp xuất sắc', 'Truyền cảm hứng', 'Đồng cảm', 'Có tổ chức'],
        weaknesses: ['Quá quan tâm người khác', 'Dễ kiệt sức', 'Nhạy cảm với phê bình'],
        loveStyle: 'Yêu nhiệt thành, quan tâm sâu sắc. Thích chăm sóc và hỗ trợ đối phương.',
        giftIdeas: ['Khóa học phát triển bản thân', 'Sách tâm lý', 'Trải nghiệm nhóm', 'Quà cho cộng đồng'],
        compatibility: {
          best: ['INFP', 'ISFP', 'INTP'],
          good: ['ENFJ', 'INFJ', 'ENFP'],
          challenging: ['ISTP', 'ESTP', 'ISTJ'],
        },
      },
      ENFP: {
        type: 'ENFP',
        description: 'Người truyền cảm hứng - Nhiệt tình, sáng tạo, tự do.',
        strengths: ['Nhiệt tình', 'Sáng tạo', 'Giao tiếp tốt', 'Linh hoạt'],
        weaknesses: ['Thiếu tập trung', 'Quá lạc quan', 'Khó tuân theo kế hoạch'],
        loveStyle: 'Yêu nồng nhiệt, lãng mạn. Thích khám phá và trải nghiệm mới.',
        giftIdeas: ['Vé du lịch', 'Workshop sáng tạo', 'Nhật ký du lịch', 'Trải nghiệm mới lạ'],
        compatibility: {
          best: ['INTJ', 'INFJ', 'ENTJ'],
          good: ['ENFP', 'ENFJ', 'INFP'],
          challenging: ['ISTJ', 'ESTJ', 'ISTP'],
        },
      },

      // Sentinel (SJ)
      ISTJ: {
        type: 'ISTJ',
        description: 'Người trách nhiệm - Đáng tin cậy, thực tế, có tổ chức.',
        strengths: ['Trách nhiệm cao', 'Thực tế', 'Đáng tin cậy', 'Có tổ chức'],
        weaknesses: ['Cứng nhắc', 'Khó thay đổi', 'Ít bộc lộ cảm xúc'],
        loveStyle: 'Yêu bằng hành động, trung thành. Thể hiện tình yêu qua việc chăm sóc thực tế.',
        giftIdeas: ['Đồ dùng chất lượng cao', 'Sách hướng dẫn', 'Công cụ làm việc', 'Quà thực tế'],
        compatibility: {
          best: ['ESFP', 'ESTP', 'ISFP'],
          good: ['ISTJ', 'ESTJ', 'ISFJ'],
          challenging: ['ENFP', 'INFP', 'ENTP'],
        },
      },
      ISFJ: {
        type: 'ISFJ',
        description: 'Người bảo vệ - Chu đáo, tận tâm, chăm sóc.',
        strengths: ['Chu đáo', 'Trách nhiệm', 'Đáng tin cậy', 'Kiên nhẫn'],
        weaknesses: ['Khó từ chối', 'Quá khiêm tốn', 'Sợ thay đổi'],
        loveStyle: 'Yêu chân thành, chăm sóc tỉ mỉ. Thể hiện tình yêu qua việc quan tâm từng chi tiết.',
        giftIdeas: ['Đồ handmade', 'Album ảnh kỷ niệm', 'Đồ gia dụng', 'Quà tự làm có tâm'],
        compatibility: {
          best: ['ESFP', 'ESTP', 'ISFP'],
          good: ['ISFJ', 'ISTJ', 'ESFJ'],
          challenging: ['ENTP', 'INTP', 'ENFP'],
        },
      },
      ESTJ: {
        type: 'ESTJ',
        description: 'Người quản lý - Thực tế, có tổ chức, quyết đoán.',
        strengths: ['Lãnh đạo tốt', 'Có tổ chức', 'Trách nhiệm', 'Quyết đoán'],
        weaknesses: ['Cứng nhắc', 'Hay áp đặt', 'Khó thấu hiểu cảm xúc'],
        loveStyle: 'Yêu truyền thống, ổn định. Thể hiện tình yêu qua trách nhiệm và bảo vệ.',
        giftIdeas: ['Đồ công sở cao cấp', 'Sách quản lý', 'Phụ kiện sang trọng', 'Quà thực dụng'],
        compatibility: {
          best: ['ISFP', 'ISTP', 'INTP'],
          good: ['ESTJ', 'ISTJ', 'ESFJ'],
          challenging: ['INFP', 'ENFP', 'INFJ'],
        },
      },
      ESFJ: {
        type: 'ESFJ',
        description: 'Người chu cấp - Ấm áp, tận tâm, quan tâm người khác.',
        strengths: ['Giao tiếp tốt', 'Chu đáo', 'Có tổ chức', 'Trách nhiệm'],
        weaknesses: ['Cần được công nhận', 'Nhạy cảm với phê bình', 'Khó thay đổi'],
        loveStyle: 'Yêu ấm áp, quan tâm sâu sắc. Thích chăm sóc và tạo không gian ấm cúng.',
        giftIdeas: ['Đồ gia đình', 'Trải nghiệm nhóm', 'Quà handmade', 'Đồ trang trí nhà cửa'],
        compatibility: {
          best: ['ISFP', 'ISTP', 'ISFJ'],
          good: ['ESFJ', 'ESTJ', 'ISFJ'],
          challenging: ['INTP', 'ENTP', 'INTJ'],
        },
      },

      // Explorer (SP)
      ISTP: {
        type: 'ISTP',
        description: 'Thợ máy - Thực tế, linh hoạt, thích khám phá.',
        strengths: ['Thực hành tốt', 'Linh hoạt', 'Bình tĩnh', 'Sáng tạo'],
        weaknesses: ['Khó cam kết', 'Ít bộc lộ cảm xúc', 'Hay mạo hiểm'],
        loveStyle: 'Yêu tự do, thích hành động hơn lời nói. Cần không gian riêng.',
        giftIdeas: ['Dụng cụ DIY', 'Đồ thể thao mạo hiểm', 'Công cụ kỹ thuật', 'Trải nghiệm thực tế'],
        compatibility: {
          best: ['ESFJ', 'ESTJ', 'ISFJ'],
          good: ['ISTP', 'ESTP', 'ISTJ'],
          challenging: ['ENFJ', 'INFJ', 'ENFP'],
        },
      },
      ISFP: {
        type: 'ISFP',
        description: 'Nghệ sĩ - Nhạy cảm, sáng tạo, tự do.',
        strengths: ['Nghệ thuật', 'Linh hoạt', 'Nhạy cảm', 'Quan sát tốt'],
        weaknesses: ['Dễ căng thẳng', 'Khó lập kế hoạch', 'Tránh xung đột'],
        loveStyle: 'Yêu nhẹ nhàng, lãng mạn. Thể hiện tình yêu qua hành động nghệ thuật.',
        giftIdeas: ['Dụng cụ vẽ', 'Nhạc cụ', 'Quà handmade', 'Trải nghiệm nghệ thuật'],
        compatibility: {
          best: ['ENFJ', 'ESFJ', 'ESTJ'],
          good: ['ISFP', 'ISTP', 'ESFP'],
          challenging: ['ENTJ', 'INTJ', 'ENTP'],
        },
      },
      ESTP: {
        type: 'ESTP',
        description: 'Doanh nhân - Năng động, thực tế, mạo hiểm.',
        strengths: ['Năng động', 'Thực tế', 'Linh hoạt', 'Giao tiếp tốt'],
        weaknesses: ['Thiếu kiên nhẫn', 'Hay mạo hiểm', 'Khó tập trung'],
        loveStyle: 'Yêu sôi nổi, thích phiêu lưu. Thể hiện tình yêu qua hành động và trải nghiệm.',
        giftIdeas: ['Vé sự kiện thể thao', 'Trải nghiệm mạo hiểm', 'Gadget hiện đại', 'Quà bất ngờ'],
        compatibility: {
          best: ['ISFJ', 'ISTJ', 'ESFJ'],
          good: ['ESTP', 'ISTP', 'ESFP'],
          challenging: ['INFJ', 'INFP', 'INTJ'],
        },
      },
      ESFP: {
        type: 'ESFP',
        description: 'Người trình diễn - Vui vẻ, nhiệt tình, sống trong hiện tại.',
        strengths: ['Vui vẻ', 'Thân thiện', 'Thực tế', 'Linh hoạt'],
        weaknesses: ['Thiếu kế hoạch', 'Dễ bị phân tâm', 'Tránh xung đột'],
        loveStyle: 'Yêu vui vẻ, tự nhiên. Thích tạo kỷ niệm và trải nghiệm vui vẻ.',
        giftIdeas: ['Vé concert', 'Trải nghiệm giải trí', 'Quà tặng bất ngờ', 'Đồ thời trang trendy'],
        compatibility: {
          best: ['ISFJ', 'ISTJ', 'ESFJ'],
          good: ['ESFP', 'ESTP', 'ISFP'],
          challenging: ['INTJ', 'INFJ', 'INTP'],
        },
      },
    };

    return results[type] || results.INFP;
  };

  const handleAnswer = (dimension: MBTIDimension) => {
    const newAnswers = { ...answers, [currentStep]: dimension };
    setAnswers(newAnswers);

    if (currentStep < mbtiQuestions.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 200);
    } else {
      // Survey completed
      const mbtiType = calculateMBTI();
      const mbtiResult = getMBTIResult(mbtiType);
      setResult(mbtiResult);
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
  };

  const progress = ((currentStep + 1) / mbtiQuestions.length) * 100;
  const currentQuestion = mbtiQuestions[currentStep];

  if (!surveyFor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.introContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.introContent}>
            <Text style={styles.introEmoji}>🧠</Text>
            <Text style={styles.introTitle}>Khám phá tính cách MBTI</Text>
            <Text style={styles.introDescription}>
              Trả lời 40 câu hỏi để hiểu rõ hơn về bản thân hoặc người thương của bạn
            </Text>

            <View style={styles.introCards}>
              <TouchableOpacity
                style={styles.introCard}
                onPress={() => setSurveyFor('self')}
              >
                <View style={[styles.introCardIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name="person" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.introCardTitle}>Cho bản thân</Text>
                <Text style={styles.introCardDesc}>Tìm hiểu về tính cách của bạn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.introCard}
                onPress={() => setSurveyFor('partner')}
              >
                <View style={[styles.introCardIcon, { backgroundColor: `${COLORS.categoryAnniversary}15` }]}>
                  <Ionicons name="heart" size={40} color={COLORS.categoryAnniversary} />
                </View>
                <Text style={styles.introCardTitle}>Cho người thương</Text>
                <Text style={styles.introCardDesc}>Hiểu rõ hơn về người ấy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                Bài test dựa trên 16 nhóm tính cách MBTI chuẩn quốc tế
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showResult && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultType}>{result.type}</Text>
            <Text style={styles.resultDescription}>{result.description}</Text>
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>💪 Điểm mạnh</Text>
            {result.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>🎯 Điểm cần phát triển</Text>
            {result.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                <Text style={styles.listText}>{weakness}</Text>
              </View>
            ))}
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>❤️ Phong cách yêu</Text>
            <Text style={styles.loveStyleText}>{result.loveStyle}</Text>
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>🎁 Gợi ý quà tặng</Text>
            {result.giftIdeas.map((gift, index) => (
              <View key={index} style={styles.giftItem}>
                <Ionicons name="gift" size={18} color={COLORS.primary} />
                <Text style={styles.giftText}>{gift}</Text>
              </View>
            ))}
          </View>

          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>💑 Độ tương thích</Text>

            <View style={styles.compatibilityCard}>
              <Text style={styles.compatibilityTitle}>Tuyệt vời ✨</Text>
              <Text style={styles.compatibilityTypes}>{result.compatibility.best.join(', ')}</Text>
            </View>

            <View style={styles.compatibilityCard}>
              <Text style={styles.compatibilityTitle}>Tốt 👍</Text>
              <Text style={styles.compatibilityTypes}>{result.compatibility.good.join(', ')}</Text>
            </View>

            <View style={styles.compatibilityCard}>
              <Text style={styles.compatibilityTitle}>Cần nỗ lực 💪</Text>
              <Text style={styles.compatibilityTypes}>{result.compatibility.challenging.join(', ')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.restartButtonText}>Làm lại bài test</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Câu {currentStep + 1}/{mbtiQuestions.length}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.categoryBadge}>
          {currentQuestion.category === 'EI' && '💬 Năng lượng'}
          {currentQuestion.category === 'SN' && '🧠 Thu nhận thông tin'}
          {currentQuestion.category === 'TF' && '❤️ Ra quyết định'}
          {currentQuestion.category === 'JP' && '📅 Lối sống'}
        </Text>

        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              answers[currentStep] === currentQuestion.dimensionA && styles.optionButtonSelected,
            ]}
            onPress={() => handleAnswer(currentQuestion.dimensionA)}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.optionRadio,
                answers[currentStep] === currentQuestion.dimensionA && styles.optionRadioSelected
              ]}>
                {answers[currentStep] === currentQuestion.dimensionA && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                answers[currentStep] === currentQuestion.dimensionA && styles.optionTextSelected
              ]}>
                {currentQuestion.optionA}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              answers[currentStep] === currentQuestion.dimensionB && styles.optionButtonSelected,
            ]}
            onPress={() => handleAnswer(currentQuestion.dimensionB)}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.optionRadio,
                answers[currentStep] === currentQuestion.dimensionB && styles.optionRadioSelected
              ]}>
                {answers[currentStep] === currentQuestion.dimensionB && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                answers[currentStep] === currentQuestion.dimensionB && styles.optionTextSelected
              ]}>
                {currentQuestion.optionB}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  introContainer: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  introEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  introCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  introCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  introCardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  introCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}15`,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  questionContainer: {
    padding: 20,
  },
  categoryBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 32,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: COLORS.primary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultType: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  resultSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  loveStyleText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  giftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 8,
  },
  giftText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  compatibilityCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  compatibilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  compatibilityTypes: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default MBTISurveyScreen;
