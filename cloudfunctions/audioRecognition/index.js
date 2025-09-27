// 云函数入口文件
const cloud = require('wx-server-sdk');
const tencentcloud = require("tencentcloud-sdk-nodejs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 初始化腾讯云ASR客户端
const AsrClient = tencentcloud.asr.v20190614.Client;
const clientConfig = {
  credential: {
    secretId: "AKIDMirrg0DE4kIvSnJhJhz52uhV0SsfKrKu",
    secretKey: "ZBeFfsreGeolYAh2A4kFZgZFiu1493lI"
  },
  region: "ap-guangzhou",
  profile: {
    httpProfile: {
      endpoint: "asr.tencentcloudapi.com",
    },
  },
};

// 云函数入口函数
exports.main = async (event, context) => {
  const { url, engineType } = event;
  
  // 创建ASR客户端实例
  const client = new AsrClient(clientConfig);
  
  try {
    // 简化参数，只保留必要的参数
    const params = {
      EngSerViceType: "16k_zh",
      SourceType: 0,
      Url: url,
      VoiceFormat: "mp3"
    };
    
    // 调用腾讯云语音识别API
    const result = await client.SentenceRecognition(params);
    console.log("腾讯云语音识别结果:", result);
    
    return {
      RecognitionResult: result.Result
    };
  } catch (error) {
    console.error('语音识别失败', error);
    return {
      error: error.message
    };
  }
};