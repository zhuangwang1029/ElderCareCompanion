// pages/assistant/assistant.js
Page({
  data: {
    chatList: [],
    recording: false,
    scrollToView: '',
    recognizedText: '',
    showText: false,
    showHelp: false, 
    inputText: ''
  },

  // 添加切换帮助面板显示的方法
  toggleHelp: function() {
    this.setData({
      showHelp: !this.data.showHelp
    });
  },

   // 输入框内容变化处理
   onInputChange: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  
  // 发送文字消息
  sendTextMessage: function() {
    const text = this.data.inputText.trim();
    if (!text) return;
    
    // 添加用户消息到对话
    this.addMessage('user', text);
    
    // 清空输入框
    this.setData({
      inputText: ''
    });
    
    // 调用大模型处理
    this.callLLMFunction(text);
  },

  onLoad: function() {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager();
    
    // 配置录音参数
    this.recorderManager.onStart(() => {
      console.log('录音开始');
      this.setData({ recording: true });
    });
    
    this.recorderManager.onStop((res) => {
      console.log('录音结束', res);
      this.setData({ recording: false });
      
      if (res.duration < 1000) {
        wx.showToast({
          title: '说话时间太短',
          icon: 'none'
        });
        return;
      }
      
      // 上传音频文件到云存储并进行识别
      this.processAudio(res.tempFilePath);
    });
    
    this.recorderManager.onError((res) => {
      console.error('录音错误', res);
      wx.showToast({
        title: '录音出错，请重试',
        icon: 'none'
      });
      this.setData({ recording: false });
    });
    
    this.addMessage('assistant', '您好！我是您的AI语音助手，由DeepSeek R1大模型提供支持。我可以帮您完成各种功能操作，也可以聊天解闷、回答问题。点击下方"使用帮助"了解更多。');

     // 稍后自动显示帮助，避免与欢迎消息重叠
    setTimeout(() => {
      this.setData({
        showHelp: true
      });
    
      // 6秒后自动隐藏帮助面板
      setTimeout(() => {
        this.setData({
          showHelp: false
        });
      }, 6000);
    }, 2000);
  },
  
  // 开始录音
  startRecord: function() {
    if (this.data.recording) return;
    
    // 请求录音权限
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorderManager.start({
          format: 'mp3',
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000
        });
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '需要您的录音权限才能使用语音助手功能',
          showCancel: false
        });
      }
    });
  },
  
  // 结束录音
  endRecord: function() {
    if (!this.data.recording) return;
    this.recorderManager.stop();
  },
  
  // 处理音频文件 - 上传到云存储并进行识别
  processAudio: function(tempFilePath) {
    wx.showLoading({ title: '识别中...' });
    
    // 1. 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: `audio/${Date.now()}.mp3`,
      filePath: tempFilePath,
      success: uploadRes => {
        console.log('音频上传成功', uploadRes);
        const fileID = uploadRes.fileID;
        
        // 2. 获取临时访问URL
        wx.cloud.getTempFileURL({
          fileList: [fileID],
          success: urlRes => {
            console.log('获取临时URL成功', urlRes);
            const fileUrl = urlRes.fileList[0].tempFileURL;
            
            // 3. 调用云函数进行语音识别
            wx.cloud.callFunction({
              name: 'audioRecognition',
              data: {
                url: fileUrl,
                format: 'mp3',
                engineType: '16k_zh'
              },
              success: recognizeRes => {
                console.log('识别结果', recognizeRes);
                wx.hideLoading();
                
                // 检查是否有结果
                if (recognizeRes.result && recognizeRes.result.RecognitionResult) {
                  const text = recognizeRes.result.RecognitionResult;
                  
                  if (text && text.trim() !== '') {
                    this.setData({
                      recognizedText: text,
                      showText: true
                    });
                    
                    // 将用户语音识别结果添加到对话
                    this.addMessage('user', text);
                    
                    // 调用大模型处理
                    this.callLLMFunction(text);
                  } else {
                    wx.showToast({
                      title: '未能识别您的语音，请重试',
                      icon: 'none'
                    });
                  }
                } else if (recognizeRes.result && recognizeRes.result.error) {
                  console.error('识别错误:', recognizeRes.result.error);
                  wx.showToast({
                    title: '识别出错: ' + recognizeRes.result.error,
                    icon: 'none'
                  });
                } else {
                  wx.showToast({
                    title: '识别失败，请重试',
                    icon: 'none'
                  });
                }
              },
              fail: err => {
                console.error('调用识别云函数失败', err);
                wx.hideLoading();
                wx.showToast({
                  title: '识别服务异常',
                  icon: 'none'
                });
              }
            });
          },
          fail: err => {
            console.error('获取临时URL失败', err);
            wx.hideLoading();
            wx.showToast({
              title: '处理音频失败',
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        console.error('上传音频失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '上传音频失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 调用云函数处理大模型请求
  callLLMFunction: function(text) {
    wx.showLoading({ title: '思考中...' });
    
    wx.cloud.callFunction({
      name: 'processLLM',
      data: {
        query: text
      },
      success: (res) => {
        console.log('大模型返回结果', res);
        
        if (res.result && res.result.response) {
          // 添加助手回复到对话
          this.addMessage('assistant', res.result.response);
          
          // 如果有功能调用指令，执行相应操作
          if (res.result.action) {
            this.executeAction(res.result.action);
          }
        } else {
          this.addMessage('assistant', '抱歉，我暂时无法理解您的请求，请重试。');
        }
      },
      fail: (err) => {
        console.error('调用大模型失败', err);
        this.addMessage('assistant', '抱歉，服务暂时不可用，请稍后再试。');
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  // 执行功能动作
  executeAction: function(action) {
    console.log('执行功能', action);
    
    // 根据action.type调用不同的功能
    switch (action.type) {
      case 'addMedicineReminder':
        this.navigateToAddMedicine(action.params);
        break;
      case 'checkHealthRecord':
        this.navigateToHealthRecord();
        break;
      case 'emergency':
        this.navigateToEmergency();
        break;
      default:
        console.log('未知功能类型', action.type);
    }
  },
  
  // 导航到添加药物提醒
  navigateToAddMedicine: function(params) {
    // 将参数保存到全局数据
    getApp().globalData.medicineParams = params;
    
    // 导航到添加药物页面
    wx.navigateTo({
      url: '/pages/health/medicine/add_medicine/add_medicine',
    });
  },
  
  // 导航到健康记录
  navigateToHealthRecord: function() {
    wx.navigateTo({
      url: '/pages/health/diary/diary',
    });
  },
  
  // 导航到紧急求助
  navigateToEmergency: function() {
    wx.switchTab({
      url: '/pages/safety/emergency/emergency',
    });
  },
  
  // 添加消息到聊天列表
  addMessage: function(type, content) {
    const chatList = this.data.chatList.concat([{
      type: type,
      content: content
    }]);
    
    const scrollToView = `msg-${chatList.length - 1}`;
    
    this.setData({
      chatList: chatList,
      scrollToView: scrollToView
    });
  }
});