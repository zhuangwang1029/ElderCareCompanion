// pages/safety/emergency/location/location.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    latitude: 0,
    longitude: 0,
    address: '未知位置',
    markers: [],
    scale: 16,
    receivedTime: '',
    isEmergency: true,
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取当前时间
    const now = new Date();
    const timeString = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    
    // 模拟地址数据（北京天安门广场）
    const demoLatitude = 39.908823;
    const demoLongitude = 116.397470;
    const demoAddress = '北京市东城区天安门广场';
    
    // 从options中获取位置信息，如果没有则使用示例数据
    const latitude = options.lat ? parseFloat(options.lat) : demoLatitude;
    const longitude = options.lng ? parseFloat(options.lng) : demoLongitude;
    const address = options.address ? decodeURIComponent(options.address) : demoAddress;
    
    // 设置数据
    this.setData({
      latitude: latitude,
      longitude: longitude,
      address: address,
      markers: [{
        id: 0,
        latitude: latitude,
        longitude: longitude,
        callout: {
          content: '紧急位置',
          color: '#ffffff',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#E53935',
          padding: 5,
          display: 'ALWAYS'
        },
        iconPath: '/images/emergency.png', // 确保有这个图片，或者使用系统默认图标
        width: 30,
        height: 30
      }],
      receivedTime: timeString,
      loading: false
    });
    
    // 显示提示信息
    if (!options.lat || !options.lng) {
      wx.showToast({
        title: '这是模拟的位置分享界面',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 在地图中查看详细位置
   */
  openLocation() {
    wx.openLocation({
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      name: '紧急位置',
      address: this.data.address
    });
  },

  /**
   * 拨打紧急电话120
   */
  callEmergency() {
    wx.showModal({
      title: '拨打急救电话',
      content: '确定要拨打120急救电话吗？',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '120',
            success: () => {
              console.log('拨打120成功');
            },
            fail: (err) => {
              console.error('拨打电话失败', err);
              wx.showToast({
                title: '拨打失败，请手动拨打120',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `【紧急求助】${this.data.address}`,
      path: `/pages/safety/emergency/location/location?lat=${this.data.latitude}&lng=${this.data.longitude}&address=${encodeURIComponent(this.data.address)}`,
      imageUrl: '/images/emergency.png' // 使用现有的emergency图标
    };
  }
});