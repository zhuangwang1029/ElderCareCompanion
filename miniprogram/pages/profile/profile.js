Page({
  data: {
    userInfo: {},
    userAge: 68, // 默认年龄
    hasUserInfo: false
  },
  
  onLoad: function() {
    // 尝试获取用户信息
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      // 如果还没有获取，设置回调函数
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    }
    
    // 获取用户年龄数据（模拟）
    const age = wx.getStorageSync('userAge') || 68
    this.setData({
      userAge: age
    })
  },
  
  // 各菜单项的点击处理函数
  goToHealthData: function() {
    wx.navigateTo({
      url: '/pages/health/trends/trends'
    })
  },
  
  // goToMedicineReminder 函数已删除
  
  goToEmergencyContacts: function() {
    console.log('点击了紧急联系人按钮');
    wx.switchTab({
      url: '/pages/safety/emergency/emergency',
      fail: function(err) {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败: ' + err.errMsg,
          icon: 'none',
          duration: 3000
        });
      }
    });
  },
  
  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/profile/settings/settings'
    })
  },
  
  goToAbout: function() {
    wx.navigateTo({
      url: '/pages/profile/about/about'
    })
  },

  // 编辑个人信息
  editUserInfo: function() {
    wx.showActionSheet({
      itemList: ['修改姓名', '修改年龄', '修改头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 修改姓名
          this.editName()
        } else if (res.tapIndex === 1) {
          // 修改年龄
          this.editAge()
        } else if (res.tapIndex === 2) {
          // 修改头像
          this.editAvatar()
        }
      }
    })
  },

  // 修改姓名
  editName: function() {
    wx.showModal({
      title: '修改姓名',
      editable: true,
      placeholderText: '请输入姓名',
      success: (res) => {
        if (res.confirm && res.content) {
          // 更新用户名称
          const userInfo = this.data.userInfo || {}
          userInfo.nickName = res.content
          
          this.setData({
            userInfo: userInfo,
            hasUserInfo: true
          })
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', userInfo)
        }
      }
    })
  },

  // 修改年龄
  editAge: function() {
    wx.showModal({
      title: '修改年龄',
      editable: true,
      placeholderText: '请输入年龄',
      success: (res) => {
        if (res.confirm && res.content) {
          const age = parseInt(res.content)
          if (!isNaN(age)) {
            this.setData({
              userAge: age
            })
            
            // 保存到本地存储
            wx.setStorageSync('userAge', age)
          } else {
            wx.showToast({
              title: '请输入有效年龄',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 修改头像
  editAvatar: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 更新用户头像
        const userInfo = this.data.userInfo || {};
        userInfo.avatarUrl = tempFilePath;
        
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        wx.showToast({
          title: '头像修改成功',
          icon: 'success'
        });
      }
    });
  }
})