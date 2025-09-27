Page({
  data: {
    medicineId: null,
    medicineName: '',
    // 预设时间点
    timeSelected: {
      morning: false,
      noon: false,
      evening: false,
      bedtime: false
    },
    morningTime: '08:00',
    noonTime: '12:00',
    eveningTime: '18:00',
    bedtimeTime: '21:00',
    // 自定义时间点
    customTimes: [],
    // 提醒方式
    reminderType: 'notification',
    // 提醒提前时间
    advanceMinutes: 5,
    // 重复提醒
    allowRepeat: false,
    repeatIntervalIndex: 2,
    repeatIntervals: ['5', '10', '15', '20', '30', '60']
  },

  onLoad: function (options) {
    if (!options.id) {
      wx.navigateBack()
      return
    }

    this.setData({
      medicineId: options.id
    })

    // 加载药物数据
    this.loadMedicineData(options.id)
    // 加载提醒设置
    this.loadReminderSettings(options.id)
  },

  // 加载药物数据
  loadMedicineData: function(id) {
    const medications = wx.getStorageSync('medications') || []
    const medicine = medications.find(item => item.id === parseInt(id))
    
    if (!medicine) {
      wx.showToast({
        title: '无法找到药物信息',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({
      medicineName: medicine.name,
      timeSelected: medicine.timeSelected || {
        morning: false,
        noon: false,
        evening: false,
        bedtime: false
      },
      customTimes: medicine.customTimes || []
    })
  },

  // 加载提醒设置
  loadReminderSettings: function(id) {
    const key = `medicine_reminder_${id}`
    const settings = wx.getStorageSync(key)
    
    if (settings) {
      this.setData({
        morningTime: settings.morningTime || '08:00',
        noonTime: settings.noonTime || '12:00',
        eveningTime: settings.eveningTime || '18:00',
        bedtimeTime: settings.bedtimeTime || '21:00',
        reminderType: settings.reminderType || 'notification',
        advanceMinutes: settings.advanceMinutes || 5,
        allowRepeat: settings.allowRepeat || false,
        repeatIntervalIndex: settings.repeatIntervalIndex || 2
      })
    }
  },

  // 切换固定时间点
  toggleTime: function(e) {
    const time = e.currentTarget.dataset.time
    const timeSelected = this.data.timeSelected
    
    timeSelected[time] = !timeSelected[time]
    
    this.setData({
      timeSelected: timeSelected
    })
  },

  // 改变固定时间点的时间
  changeTime: function(e) {
    const time = e.currentTarget.dataset.time
    const value = e.detail.value
    
    const updateData = {}
    updateData[`${time}Time`] = value
    
    this.setData(updateData)
  },

  // 改变自定义时间
  changeCustomTime: function(e) {
    const index = e.currentTarget.dataset.index
    const customTimes = this.data.customTimes
    
    customTimes[index] = e.detail.value
    
    this.setData({
      customTimes: customTimes
    })
  },

  // 删除自定义时间
  deleteCustomTime: function(e) {
    const index = e.currentTarget.dataset.index
    const customTimes = this.data.customTimes
    
    customTimes.splice(index, 1)
    
    this.setData({
      customTimes: customTimes
    })
  },

  // 设置提醒方式
  setReminderType: function(e) {
    this.setData({
      reminderType: e.currentTarget.dataset.type
    })
  },

  // 设置提前提醒时间
  setAdvanceMinutes: function(e) {
    this.setData({
      advanceMinutes: e.detail.value
    })
  },

  // 切换重复提醒
  toggleRepeat: function(e) {
    this.setData({
      allowRepeat: e.detail.value
    })
  },

  // 设置重复间隔
  setRepeatInterval: function(e) {
    this.setData({
      repeatIntervalIndex: e.detail.value
    })
  },

  // 取消
  cancel: function() {
    wx.navigateBack()
  },

  // 保存设置
  saveSettings: function() {
    // 验证设置
    const timeSelected = this.data.timeSelected
    const customTimes = this.data.customTimes
    
    if (!timeSelected.morning && 
        !timeSelected.noon && 
        !timeSelected.evening && 
        !timeSelected.bedtime && 
        customTimes.length === 0) {
      wx.showToast({
        title: '请至少选择一个提醒时间',
        icon: 'none'
      })
      return
    }
    
    // 组装设置数据
    const settings = {
      morningTime: this.data.morningTime,
      noonTime: this.data.noonTime,
      eveningTime: this.data.eveningTime,
      bedtimeTime: this.data.bedtimeTime,
      reminderType: this.data.reminderType,
      advanceMinutes: this.data.advanceMinutes,
      allowRepeat: this.data.allowRepeat,
      repeatIntervalIndex: this.data.repeatIntervalIndex
    }
    
    // 保存时间设置到药物记录中
    const medications = wx.getStorageSync('medications') || []
    const index = medications.findIndex(item => item.id === parseInt(this.data.medicineId))
    
    if (index !== -1) {
      medications[index].timeSelected = this.data.timeSelected
      medications[index].customTimes = this.data.customTimes
      wx.setStorageSync('medications', medications)
    }
    
    // 保存提醒设置
    const key = `medicine_reminder_${this.data.medicineId}`
    wx.setStorageSync(key, settings)
    
    // 设置实际的提醒（使用微信小程序的API)
    this.scheduleReminders()
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 设置提醒
  scheduleReminders: function() {
    const medicineId = this.data.medicineId
    const medicineName = this.data.medicineName
    const timeSelected = this.data.timeSelected
    const customTimes = this.data.customTimes
    const advanceMinutes = this.data.advanceMinutes
    
    // 清除现有提醒
    const existingReminders = wx.getStorageSync(`medicine_notifications_${medicineId}`) || []
    existingReminders.forEach(reminderId => {
      wx.cancelSchedule({
        scheduleId: reminderId.toString(),
        success: () => {
          console.log('取消提醒成功:', reminderId)
        },
        fail: (error) => {
          console.log('取消提醒失败:', error)
        }
      })
    })
    
    // 设置新提醒
    const newReminders = []
    
    // 注: 由于微信小程序对定时通知有限制，这里仅作为示例
    // 实际应用中需要使用微信云开发或服务器来支持定时通知
    
    // 使用微信订阅消息作为替代方案
    wx.requestSubscribeMessage({
      tmplIds: ['your_template_id'],
      success: (res) => {
        wx.showToast({
          title: '提醒设置成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '提醒设置失败',
          icon: 'none'
        })
      }
    })
  }
})