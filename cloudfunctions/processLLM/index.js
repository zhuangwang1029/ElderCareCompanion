/**
 * @timeout=20
 * @memorySize=256
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  const { query } = event;
  
  if (!query) {
    return {
      success: false,
      error: '请提供查询内容'
    };
  }
  
  try {
    // 调用大模型API
    const llmResponse = await callLLMApi(query);
    return llmResponse;
  } catch (error) {
    console.error('处理请求失败', error);
    return {
      success: false,
      error: '服务异常，请稍后再试'
    };
  }
};

// 调用大模型API
async function callLLMApi(query) {
  // Deepseek API参数
  const apiKey = 'sk-275f4b38950c4c71be2a1d2cd27f69d2';
  const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  
  // 系统提示，引导大模型理解应用场景和返回格式
  const systemPrompt = `
你是老年健康伴侣应用中的智能语音助手，主要功能包括提醒服药、记录健康数据和紧急求助。
请以简单、清晰的语言回答老年人的问题。
如果用户询问的内容涉及应用功能操作，请按以下格式返回：

1. 如果涉及添加药物提醒，返回：
{
  "response": "您想添加药物提醒，我已经理解了您的需求。",
  "action": {
    "type": "addMedicineReminder",
    "params": {
      "medicine": "药物名称",
      "time": "服药时间",
      "dosage": "剂量",
      "frequency": "频率"
    }
  }
}

2. 如果涉及查看健康记录，返回：
{
  "response": "我将为您打开健康记录页面。",
  "action": {
    "type": "checkHealthRecord"
  }
}

3. 如果涉及紧急求助，返回：
{
  "response": "正在为您打开紧急求助功能。",
  "action": {
    "type": "emergency"
  }
}

4. 如果只是普通问题，只返回：
{
  "response": "您的回答内容"
}
`;

  try {
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7
      }
    });
    
    // 解析大模型返回的内容
    const content = response.data.choices[0].message.content;
    
    try {
      // 尝试解析JSON格式响应
      const parsedResponse = JSON.parse(content);
      return {
        success: true,
        ...parsedResponse
      };
    } catch (e) {
      // 如果不是JSON格式，则作为普通文本返回
      return {
        success: true,
        response: content
      };
    }
  } catch (error) {
    console.error('调用大模型API失败', error);
    return {
      success: false,
      error: '无法连接到AI服务'
    };
  }
}