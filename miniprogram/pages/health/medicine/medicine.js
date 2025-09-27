// pages/health/medicine/medicine.js
Page({
  data: {
    medications: [] // 初始化为空数组，稍后从云数据库获取
  },
  
  onLoad: function () {
    this.loadMedications();

    // 注册全局回调，确保其他地方（如弹窗）标记服用后能刷新本页面
    const app = getApp();
    app.medicationCallback = () => {
      this.loadMedications();
    };
  },

  
  onUnload: function() {
    // 页面卸载时注销回调，防止内存泄漏
    const app = getApp();
    app.medicationCallback = null;
  },

  onShow: function() {
    // 每次页面显示时刷新数据
    this.loadMedications();
  },
  
  // 加载服药数据
  loadMedications: function () {
    wx.showLoading({
      title: '加载中',
    });

    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getMedicationList',
        openid: this.getOpenId()
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        this.setData({
          medications: res.result.data || []
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '获取药物列表失败',
        icon: 'none'
      });
    });
  },

  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },
  
  // 切换药物服用状态
  toggleMedicineStatus: function (e) {
    const medicationId = e.currentTarget.dataset.id
    // 查找当前药物状态
    const medication = this.data.medications.find(item => item.id === medicationId)
    const newStatus = !medication.status

    wx.showLoading({
      title: '保存中',
    })

    // 调用云函数更新药物状态
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'updateMedicationStatus',
        medicationId: medicationId,
        status: newStatus,
        openid: this.getOpenId()
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        // 更新本地数据
        const meds = this.data.medications.map(item => {
          if (item.id === medicationId) {
            return {
              ...item,
              status: newStatus
            }
          }
          return item
        })
        
        this.setData({
          medications: meds
        })
        
        // 提供反馈
        wx.showToast({
          title: newStatus ? '已标记为服用' : '已取消服用标记',
          icon: 'success'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('更新药物状态失败', err)
      wx.showToast({
        title: '更新状态失败',
        icon: 'none'
      })
    })
  },
  
  // 显示添加药物界面
  showAddMedicine: function () {
    wx.navigateTo({
      url: '/pages/health/medicine/add_medicine/add_medicine'
    })
  },

  // 编辑药物
  editMedicine: function (e) {
    const medicationId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/health/medicine/add_medicine/add_medicine?id=' + medicationId
    })
  },

  // 设置提醒
  setReminder: function(e) {
    const medicineId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/health/medicine/reminder/reminder?id=' + medicineId
    })
  },

  // 删除药物
  deleteMedicine: function(e) {
    const medicationId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除提醒',
      content: '确定要删除该提醒吗？删除后将无法恢复。',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          // 调用云函数删除药物
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'deleteMedication',
              medicationId: medicationId,
              openid: this.getOpenId()
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result && res.result.success) {
              // 从本地数据中移除
              const medications = this.data.medications.filter(item => item.id !== medicationId);
              
              this.setData({
                medications: medications
              });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除药物失败', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
})