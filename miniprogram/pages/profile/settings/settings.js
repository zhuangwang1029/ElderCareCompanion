// pages/profile/settings/settings.js
const app = getApp();

Page({
  data: {
    settings: {
      notificationEnabled: true,
      soundEnabled: true
    }
  },
  
  onLoad: function() {
    // 从全局获取设置
    const savedSettings = app.globalData.userSettings || wx.getStorageSync('userSettings');
    if (savedSettings) {
      this.setData({
        settings: {
          notificationEnabled: savedSettings.notificationEnabled !== undefined ? savedSettings.notificationEnabled : true,
          soundEnabled: savedSettings.soundEnabled !== undefined ? savedSettings.soundEnabled : true
        }
      });
    }
  },
  
  // 切换通知开关
  toggleNotification: function() {
    const enabled = !this.data.settings.notificationEnabled;
    this.setData({
      'settings.notificationEnabled': enabled
    });
    this.saveSettings();
    
    wx.showToast({
      title: enabled ? '已开启通知提醒' : '已关闭通知提醒',
      icon: 'none'
    });
  },
  
  // 切换声音开关
  toggleSound: function() {
    const enabled = !this.data.settings.soundEnabled;
    this.setData({
      'settings.soundEnabled': enabled
    });
    this.saveSettings();
    
    wx.showToast({
      title: enabled ? '已开启声音提醒' : '已关闭声音提醒',
      icon: 'none'
    });
  },
  
  // 保存设置到本地存储
  saveSettings: function() {
    wx.setStorageSync('userSettings', this.data.settings);
    // 更新全局变量
    app.globalData.userSettings = this.data.settings;
    // 应用所有设置
    app.applyUserSettings();
  },
  
  // 清除所有缓存
  clearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这不会删除您的个人信息。',
      confirmText: '确定清除',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          try {
            // 保留用户基本信息和设置
            const userInfo = wx.getStorageSync('userInfo');
            const userSettings = wx.getStorageSync('userSettings');
            const openid = wx.getStorageSync('openid');
            
            // 清除所有存储
            wx.clearStorageSync();
            
            // 恢复用户基本信息和设置
            if (userInfo) wx.setStorageSync('userInfo', userInfo);
            if (userSettings) wx.setStorageSync('userSettings', userSettings);
            if (openid) wx.setStorageSync('openid', openid);
            
            console.log('缓存已清除');
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
          } catch (e) {
            console.error('清除缓存失败', e);
            wx.showToast({
              title: '清除缓存失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});