// index.js
Page({
  data: {
    greeting: '您好！',
    voiceText: '',
    
    // 测试数据
    medicationCount: 2,
    activityStatus: '未记录',
    emergencyContacts: 2
  },
  
  onLoad: function () {
    this.updateGreeting()
  },
  
  onShow: function() {
    this.updateGreeting()
  },
  
  // 根据时间更新问候语
  updateGreeting: function () {
    const hour = new Date().getHours()
    let greeting = '您好！'
    
    if (hour < 6) {
      greeting = '凌晨好！'
    } else if (hour < 9) {
      greeting = '早上好！'
    } else if (hour < 12) {
      greeting = '上午好！'
    } else if (hour < 14) {
      greeting = '中午好！'
    } else if (hour < 17) {
      greeting = '下午好！'
    } else if (hour < 19) {
      greeting = '傍晚好！'
    } else {
      greeting = '晚上好！'
    }
    
    console.log('当前小时:', hour, '问候语:', greeting)
    
    this.setData({
      greeting: greeting
    })
  },
  
  // 获取今天的日期字符串 YYYY-MM-DD
  getTodayString: function() {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 模拟语音按钮点击
  startVoiceRecord: function() {
    wx.showToast({
      title: '语音功能开发中',
      icon: 'none'
    })
  },
  
  endVoiceRecord: function() {
    // 空函数
  },
  
  // 跳转到服药提醒
  goToMedicine: function() {
    wx.switchTab({
      url: '/pages/health/medicine/medicine'
    })
  },
  
  // 跳转到紧急求助
  goToEmergency: function() {
    wx.switchTab({
      url: '/pages/safety/emergency/emergency'
    })
  },
  
  // 跳转到健康日记
  goToDiary: function() {
    wx.navigateTo({
      url: '/pages/health/diary/diary'
    })
  },
  
  // 跳转到视频
  goToCall: function() {
    wx.navigateTo({
      url: '/pages/social/call/call'
    })
  },
  
  // 跳转到健康日记历史
  goToDiaryHistory: function() {
    wx.navigateTo({
      url: '/pages/health/diary/history/history'
    })
  },

  // 跳转到健康趋势
  goToTrends: function() {
    wx.navigateTo({
      url: '/pages/health/trends/trends'
    })
  },

  // 跳转语音助手
  goToAssistant: function() {
    wx.navigateTo({
      url: '/pages/assistant/assistant'
    })
  }
})