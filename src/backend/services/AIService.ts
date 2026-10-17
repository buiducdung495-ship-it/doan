import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('⚠️ GEMINI_API_KEY is missing or using default placeholder. Mocked AI services will be used.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export class AIService {
  static async analyzeRequestComplexity(formTitle: string, data: Record<string, any>): Promise<{
    complexity: 'Thấp' | 'Trung bình' | 'Nghiêm trọng';
    aiRecommendation: string;
    suggestedStagesCount: number;
    explanation: string;
  }> {
    const prompt = `Bạn là trợ lý AI chuyên viên quản lý nhân sự hành chính doanh nghiệp.
Hãy phân tích độ phức tạp, rủi ro hành chính và mức độ ảnh hưởng của đề xuất này:
Loại đơn: "${formTitle}"
Dữ liệu đơn: ${JSON.stringify(data, null, 2)}

Hãy trả về kết quả định dạng JSON thuần túy (không chứa markdown \`\`\`json) gồm các trường sau:
- complexity: Mức độ phức tạp ('Thấp' | 'Trung bình' | 'Nghiêm trọng')
- aiRecommendation: Nhận xét/Khuyến nghị của AI cho Quản lý phê duyệt (viết ngắn gọn, chuyên nghiệp, tiếng Việt)
- suggestedStagesCount: Số cấp duyệt khuyến nghị (1, 2 hoặc 3 cấp duyệt)
- explanation: Giải thích lý do vì sao đánh giá như vậy.`;

    const ai = getAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const text = response.text;
        if (text) {
          const cleanText = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
          return JSON.parse(cleanText);
        }
      } catch (err) {
        console.error('Gemini API Error, using fallback recommendation:', err);
      }
    }

    // High quality Vietnam-specific Fallback logic when Gemini key is missing or fails
    let complexity: 'Thấp' | 'Trung bình' | 'Nghiêm trọng' = 'Thấp';
    let aiRecommendation = 'Đơn hợp lệ, khuyến nghị Trưởng bộ phận duyệt nhanh chóng để bảo đảm tiến độ công việc.';
    let suggestedStagesCount = 1;
    let explanation = 'Dựa trên phân tích tham số chuẩn của công ty, đề xuất này nằm trong phạm vi xử lý của phòng ban.';

    if (formTitle.includes('nghỉ phép')) {
      const days = Number(data.num_days || 0);
      if (days > 7) {
        complexity = 'Nghiêm trọng';
        aiRecommendation = 'Nghỉ phép dài ngày (>7 ngày) có thể ảnh hưởng lớn đến tiến độ dự án hiện tại. Khuyến nghị Quản lý và HR kiểm tra kỹ phương án bàn giao công việc trước khi ký duyệt.';
        suggestedStagesCount = 3;
        explanation = `Thời gian nghỉ dài (${days} ngày) vượt hạn mức phê duyệt nhanh thông thường. Cần ký duyệt từ Quản lý trực tiếp, Trưởng phòng Nhân sự và Ban Giám Đốc.`;
      } else if (days >= 3) {
        complexity = 'Trung bình';
        aiRecommendation = 'Đề xuất nghỉ từ 3 đến 7 ngày. Khuyến nghị phê duyệt nếu nhân viên đã hoàn tất bàn giao công việc hàng ngày.';
        suggestedStagesCount = 2;
        explanation = `Số ngày nghỉ là ${days} ngày nằm ở mức vừa phải, cần duyệt qua 2 cấp: Trưởng phòng trực tiếp và Phòng nhân sự kiểm tra quỹ phép năm.`;
      } else {
        complexity = 'Thấp';
        aiRecommendation = 'Nghỉ phép ngắn ngày (<3 ngày). Phù hợp duyệt nhanh, không gây rủi ro gián đoạn công việc.';
        suggestedStagesCount = 1;
        explanation = 'Số ngày nghỉ ngắn ngày, không ảnh hưởng lớn đến vận hành phòng ban. Chỉ cần 1 cấp Quản lý trực tiếp phê duyệt.';
      }
    } else if (formTitle.includes('thiết bị')) {
      const urgency = data.urgency || '';
      const category = data.device_category || '';
      if (urgency.includes('Rất khẩn cấp') || category === 'Laptop' || category === 'Phone') {
        complexity = 'Trung bình';
        aiRecommendation = `Đăng ký thiết bị giá trị cao (${category}). Cần IT kiểm tra tình trạng kho sẵn có trước khi phê duyệt cấp mới để tối ưu chi phí.`;
        suggestedStagesCount = 2;
        explanation = `Yêu cầu thiết bị thuộc danh mục giá trị cao hoặc mức độ khẩn cấp cao. Cần thông qua Trưởng bộ phận và Quản trị viên quản lý tài sản để cấp phát.`;
      } else {
        complexity = 'Thấp';
        aiRecommendation = 'Yêu cầu cấp phát thiết bị thông thường văn phòng. Khuyến nghị duyệt cấp phát nếu có sẵn trong kho.';
        suggestedStagesCount = 1;
        explanation = 'Thiết bị văn phòng tiêu chuẩn có sẵn trong kho lưu trữ, quy trình cấp phát đơn giản.';
      }
    }

    return { complexity, aiRecommendation, suggestedStagesCount, explanation };
  }

  static async generateFormFields(prompt: string, user: any): Promise<{ title: string, fields: any[] }> {
    const systemInstruction = `Bạn là trợ lý AI chuyên tạo các biểu mẫu (form) hành chính. 
Người dùng sẽ đưa ra một yêu cầu tạo đơn (ví dụ: xin nghỉ phép, xin mua thiết bị...).
Hãy trả về JSON chứa:
- title: Tiêu đề của đơn (vd: "ĐƠN XIN NGHỈ PHÉP")
- fields: Mảng các trường trong đơn. Mỗi trường có:
  - id: chuỗi ngẫu nhiên (ví dụ "f1", "f2")
  - type: một trong ["text", "textarea", "number", "select", "checkbox", "date"]
  - label: Tên trường
  - value: Giá trị mặc định hoặc giá trị được tính toán từ nội dung yêu cầu của người dùng.

Yêu cầu chi tiết:
- Đối với Đơn xin nghỉ phép:
  + "Kính gửi": Ban Giám đốc & Trưởng phòng NS
  + "Tên tôi là": lấy từ user.name
  + "Bộ phận": lấy từ user.department
  + "Lý do xin nghỉ": phân tích từ yêu cầu.
  + "Ngày bắt đầu": mặc định là ngày hiện tại (định dạng YYYY-MM-DD), hoặc phân tích từ yêu cầu.
  + "Ngày kết thúc": định dạng YYYY-MM-DD, phân tích từ yêu cầu hoặc tính toán dựa trên ngày bắt đầu và số ngày.
  + "Số ngày nghỉ phép": trích xuất từ yêu cầu (vd: "nghỉ 2 ngày"), hoặc tự tính toán nếu người dùng cung cấp ngày bắt đầu và ngày kết thúc.
  + "Trường hợp bất khả kháng": kiểu checkbox (true/false). Bật true (checked) NẾU lý do là "tai nạn" hoặc "nhà có tang".

- Trả về đúng định dạng JSON, không kèm giải thích.`;

    const ai = getAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Thông tin user:\n${JSON.stringify(user, null, 2)}\n\nYêu cầu của người dùng:\n"${prompt}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const text = response.text;
        if (text) {
          const cleanText = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
          return JSON.parse(cleanText);
        }
      } catch (err) {
        console.warn('Gemini API Warning in generateFormFields - falling back to local heuristic', err);
      }
    }

    // Fallback logic
    const promptLower = prompt.toLowerCase();
    let newTitle = 'ĐƠN ĐỀ NGHỊ';
    let newFields: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (promptLower.includes('nghỉ') || promptLower.includes('ốm')) {
      newTitle = 'ĐƠN XIN NGHỈ PHÉP';
      const isForceMajeure = promptLower.includes('tai nạn') || promptLower.includes('tang');
      const numDaysMatch = promptLower.match(/(\d+)\s*(ngày|hôm)/);
      const numDays = numDaysMatch ? parseInt(numDaysMatch[1]) : 1;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (numDays - 1));
      const endDateStr = endDate.toISOString().split('T')[0];

      newFields = [
        { id: 'f1', type: 'text', label: 'Kính gửi', value: 'Ban Giám đốc & Trưởng phòng NS' },
        { id: 'f2', type: 'text', label: 'Tên tôi là', value: user?.name || '' },
        { id: 'f3', type: 'text', label: 'Bộ phận', value: user?.department || '' },
        { id: 'f4', type: 'textarea', label: 'Lý do xin nghỉ', value: prompt },
        { id: 'f5', type: 'date', label: 'Ngày bắt đầu', value: todayStr },
        { id: 'f5b', type: 'date', label: 'Ngày kết thúc', value: endDateStr },
        { id: 'f6', type: 'number', label: 'Số ngày nghỉ phép', value: numDays },
        { id: 'f7', type: 'checkbox', label: 'Trường hợp bất khả kháng', value: isForceMajeure },
      ];
    } else {
      newTitle = 'ĐƠN TRÌNH DUYỆT CHUNG';
      newFields = [
        { id: 'f1', type: 'text', label: 'Kính gửi', value: 'Ban Giám đốc' },
        { id: 'f2', type: 'text', label: 'Tên người viết', value: user?.name || '' },
        { id: 'f3', type: 'textarea', label: 'Nội dung trình bày', value: prompt },
      ];
    }

    return { title: newTitle, fields: newFields };
  }

  static async chatWithAI(userMessage: string, chatHistory: { role: 'user' | 'model'; text: string }[]): Promise<string> {
    const systemInstruction = `Bạn là Trợ lý AI Thông minh (AI HR Bot) đa năng tích hợp trong hệ thống quản lý công việc và hành chính nội bộ của công ty, đồng thời là một AI thông minh giống như ChatGPT hay Gemini, có khả năng trả lời bất cứ câu hỏi nào.
Nhiệm vụ của bạn là hỗ trợ trực tuyến, giải đáp và tư vấn trực tiếp cho nhân viên về mọi vấn đề: từ nghiệp vụ công ty, lập trình, kiến thức chung, đến các chủ đề khác trong cuộc sống.

YÊU CẦU & CHỨC NĂNG:
- Trả lời TẤT CẢ các loại câu hỏi, bất kể chủ đề gì, giống như một trợ lý AI thông thường.
- Đối với các câu hỏi liên quan đến nội bộ, ưu tiên trả lời dựa vào nghiệp vụ, quy định của hệ thống:
  + Quy trình nghỉ phép: nghỉ dưới 3 ngày do Trưởng phòng duyệt; từ 3 ngày trở lên cần thêm Trưởng phòng Nhân sự và Ban Giám đốc duyệt.
  + Quản lý tài sản: nhân viên có quyền đăng ký cấp phát thiết bị, mua thanh lý máy tính công ty với giá ưu đãi khấu trừ qua lương.
  + Tính lương và thuế: Lương được trả vào ngày 5 hàng tháng. Thuế TNCN tính theo biểu thuế lũy tiến từng phần.
- Khi người dùng gặp sự cố hệ thống: Đưa ra các hướng giải quyết tạm thời và hướng dẫn báo cáo qua bộ phận Dev.
- THÔNG TIN KHẨN CẤP: Nếu nhân viên cần liên hệ khẩn cấp (Bộ phận Chăm sóc Nhân viên), hãy cung cấp thông tin sau: 
  + Email: hr-support@company.com
  + Điện thoại: 0988-123-456
Luôn trả lời thân thiện, nhiệt tình và rõ ràng. Bạn có thể sử dụng nhiều ngôn ngữ nhưng mặc định ưu tiên giao tiếp bằng tiếng Việt.`;

    const ai = getAI();
    if (ai) {
      try {
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { systemInstruction },
          history: chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
        });

        const response = await chat.sendMessage({ message: userMessage });
        return response.text || 'Xin lỗi, tôi gặp chút gián đoạn khi xử lý câu hỏi này.';
      } catch (err) {
        console.error('Gemini Chat Error, using local responder:', err);
      }
    }

    // High quality Viet help responder when Gemini key is offline
    const text = userMessage.toLowerCase();
    if (text.includes('xin chào') || text.includes('hi') || text.includes('hello')) {
      return 'Xin chào! Tôi là Trợ lý AI Hành chính & Tài sản của bạn. Tôi có thể hỗ trợ gì cho bạn hôm nay? Bạn có thể hỏi về quy chế nghỉ phép, yêu cầu cấp thiết bị hoặc mua thanh lý tài sản nhé!';
    }
    if (text.includes('phép') || text.includes('nghỉ')) {
      return 'Theo quy định của công ty:\n- **Dưới 3 ngày**: Duyệt nhanh qua 1 cấp (Trưởng bộ phận trực tiếp duyệt).\n- **Từ 3 ngày trở lên**: Cần 2 cấp duyệt (Trưởng bộ phận duyệt lần 1, Trưởng phòng Nhân sự duyệt lần 2).\n- Vui lòng vào mục "Mẫu đơn" -> chọn "Đơn xin nghỉ phép" để tạo yêu cầu nhé!';
    }
    if (text.includes('thiết bị') || text.includes('máy tính') || text.includes('macbook') || text.includes('dell')) {
      return 'Để yêu cầu cấp phát hoặc đổi thiết bị mới:\n1. Vào mục "Thiết bị" để xem các máy sẵn có trong kho.\n2. Chọn "Yêu cầu cấp phát" hoặc "Yêu cầu đổi trả".\n3. Đơn của bạn sẽ tự động gửi tới Trưởng phòng và Quản trị kho phê duyệt.';
    }
    if (text.includes('thanh lý') || text.includes('mua lại') || text.includes('khấu trừ')) {
      return 'Nhân viên có thể mua thanh lý thiết bị công ty cấp phát sau thời gian khấu hao:\n- Giá thanh lý cực kỳ ưu đãi dựa trên mức hỏng hóc hiện tại.\n- Hỗ trợ thanh toán qua: **Thẻ tín dụng**, **Ví điện tử MoMo/ZaloPay** hoặc **Khấu trừ trực tiếp vào lương** kỳ tiếp theo.\n- Vui lòng chọn máy của bạn trong mục "Máy móc sở hữu" và click "Mua thanh lý".';
    }

    if (text.includes('lỗi') || text.includes('sự cố') || text.includes('không vào được') || text.includes('bug')) {
      return 'Nếu bạn gặp sự cố hệ thống, vui lòng thử tải lại trang (F5) hoặc xóa cache trình duyệt (Ctrl+F5). Nếu vấn đề vẫn tiếp diễn, hãy gửi báo cáo chi tiết cho bộ phận Dev để được hỗ trợ kịp thời.';
    }
    if (text.includes('khẩn cấp') || text.includes('liên hệ') || text.includes('số điện thoại') || text.includes('email') || text.includes('chăm sóc')) {
      return 'Trong trường hợp khẩn cấp, bạn có thể liên hệ với Bộ phận Chăm sóc Nhân viên qua:\n- Email: hr-support@company.com\n- Điện thoại: 0988-123-456';
    }
    return 'Cảm ơn bạn đã trò chuyện. (Lưu ý: API AI đang bị gián đoạn, nên tôi chỉ có thể trả lời các mẫu câu hỏi cơ bản nội bộ)';
  }
}
