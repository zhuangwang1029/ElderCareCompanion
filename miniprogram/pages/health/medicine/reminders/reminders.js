// pages/health/medicine/reminders/reminders.js
Page({
  data: {
    reminders: []
  },

  onLoad: function (options) {
    this.loadAllReminders()
  },

  onShow: function () {
    // 重新加载数据，以防有修改
    this.loadAllReminders()
  },

  // 加载所有提醒
  loadAllReminders: function() {
    const medications = wx.getStorageSync('medications') || []
    const reminders = []

    // 遍历所有药物，整合其提醒信息
    medications.forEach(med => {
      if (!med) return

      const reminderSettings = wx.getStorageSync(`medicine_reminder_${med.id}`)
      if (!reminderSettings) return

      // 处理固定时间点
      if (med.timeSelected) {
        if (med.timeSelected.morning) {
          reminders.push({
            id: `${med.id}_morning`,
            medicineId: med.id,
            medicineName: med.name,
            timeDisplay: `早餐 ${reminderSettings.morningTime || '08:00'}`,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            instruction: med.instruction,
            active: true // 默认启用
          })
        }
        
        if (med.timeSelected.noon) {
          reminders.push({
            id: `${med.id}_noon`,
            medicineId: med.id,
            medicineName: med.name,
            timeDisplay: `午餐 ${reminderSettings.noonTime || '12:00'}`,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            instruction: med.instruction,
            active: true
          })
        }
        
        if (med.timeSelected.evening) {
          reminders.push({
            id: `${med.id}_evening`,
            medicineId: med.id,
            medicineName: med.name,
            timeDisplay: `晚餐 ${reminderSettings.eveningTime || '18:00'}`,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            instruction: med.instruction,
            active: true
          })
        }
        
        if (med.timeSelected.bedtime) {
          reminders.push({
            id: `${med.id}_bedtime`,
            medicineId: med.id,
            medicineName: med.name,
            timeDisplay: `睡前 ${reminderSettings.bedtimeTime || '21:00'}`,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            instruction: med.instruction,
            active: true
          })
        }
      }

      // 处理自定义时间点
      if (med.customTimes && med.customTimes.length > 0) {
        med.customTimes.forEach((time, index) => {
          reminders.push({
            id: `${med.id}_custom_${index}`,
            medicineId: med.id,
            medicineName: med.name,
            timeDisplay: `${time}`,
            dosageValue: med.dosageValue,
            dosageUnit: med.dosageUnit,
            instruction: med.instruction,
            active: true
          })
        })
      }
    })

    // 按时间排序
    reminders.sort((a, b) => {
      // 提取时间部分进行比较
      const timeA = a.timeDisplay.split(' ').pop()
      const timeB = b.timeDisplay.split(' ').pop()
      return timeA.localeCompare(timeB)
    })

    this.setData({
      reminders: reminders
    })
  },

  // 编辑提醒
  editReminder: function(e) {
    const id = e.currentTarget.dataset.id
    const reminder = this.data.reminders.find(item => item.id === id)
    
    if (reminder) {
      wx.navigateTo({
        url: `/pages/health/medicine/reminder/reminder?id=${reminder.medicineId}`
      })
    }
  },

  // 切换提醒状态
  toggleReminderStatus: function(e) {
    const id = e.currentTarget.dataset.id
    const reminders = this.data.reminders
    const index = reminders.findIndex(item => item.id === id)
    
    if (index !== -1) {
      reminders[index].active = !reminders[index].active
      
      this.setData({
        reminders: reminders
      })
      
      // 实际应用中，这里应该更新提醒的启用状态
      // 由于微信小程序限制，这里只是更新UI状态
      wx.showToast({
        title: reminders[index].active ? '已启用提醒' : '已禁用提醒',
        icon: 'success'
      })
    }
  }
})