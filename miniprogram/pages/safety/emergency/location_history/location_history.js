// pages/safety/emergency/location_history/location_history.js
Page({
  data: {
    locations: [],
    loading: true
  },
  
  onLoad: function () {
    this.loadLocationHistory();
  },
  
  onShow: function() {
    // 每次显示页面时重新加载
    this.loadLocationHistory();
  },
  
  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },
  
  // 加载位置历史
  loadLocationHistory: function() {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getEmergencyLocations',
        openid: this.getOpenId(),
        limit: 20
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const locations = res.result.data || [];
          
          // 格式化时间
          locations.forEach(location => {
            const date = new Date(location.timestamp);
            location.formattedTime = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          });
          
          this.setData({
            locations: locations,
            loading: false
          });
        } else {
          this.setData({
            locations: [],
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error('获取位置历史失败', err);
        this.setData({
          locations: [],
          loading: false
        });
      }
    });
  },
  
  // 查看位置
  viewLocation: function(e) {
    const index = e.currentTarget.dataset.index;
    const location = this.data.locations[index];
    
    if (!location) return;
    
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: '历史紧急位置',
      address: location.address || '位置详情不可用'
    });
  }
});