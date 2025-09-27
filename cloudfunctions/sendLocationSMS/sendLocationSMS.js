const cloud = require('wx-server-sdk');
const tencentcloud = require('tencentcloud-sdk-nodejs');
const SmsClient = tencentcloud.sms.v20210111.Client;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    // 使用与语音识别相同的密钥配置
    const secretId = process.env.TENCENT_SECRET_ID || "您的腾讯云SecretId";  
    const secretKey = process.env.TENCENT_SECRET_KEY || "您的腾讯云SecretKey";
    const sdkAppId = process.env.SMS_SDK_APP_ID || "您需要填写的短信应用ID";
    const signName = "老年健康伴侣"; // 您申请的短信签名
    const templateId = "您需要填写的短信模板ID"; // 您申请的短信模板ID
    
    const { phoneNumbers, location } = event;
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      return {
        success: false,
        errMsg: "没有提供有效的手机号码"
      };
    }
    
    // 构造短信客户端
    const client = new SmsClient({
      credential: {
        secretId,
        secretKey,
      },
      region: "ap-guangzhou",
      profile: {
        httpProfile: {
          endpoint: "sms.tencentcloudapi.com",
        },
      },
    });
    
    // 准备地址信息和链接
    const address = location.address || "未知地址";
    const mapLink = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${location.latitude},${location.longitude};title:紧急位置;addr:${encodeURIComponent(address)}`;
    
    // 短信参数
    const params = {
      SmsSdkAppId: sdkAppId,
      SignName: signName,
      TemplateId: templateId,
      PhoneNumberSet: phoneNumbers,
      TemplateParamSet: [
        address, // 位置地址
        mapLink  // 地图链接
      ],
    };
    
    // 发送短信
    const result = await client.SendSms(params);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error("发送短信失败：", error);
    return {
      success: false,
      errMsg: error.message
    };
  }
};