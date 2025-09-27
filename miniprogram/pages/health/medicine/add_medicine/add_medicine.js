// pages/health/medicine/add_medicine/add_medicine.js
Page({
  data: {
    // 基本信息
    name: '',
    dosageValue: '',
    dosageUnitIndex: 0,
    dosageUnits: ['片', '粒', '毫克', '毫升', '克', '包'],
    frequencyIndex: 0,
    frequencies: ['每天一次', '每天两次', '每天三次', '每周一次', '需要时服用'],
    instructionIndex: 0,
    instructions: ['饭前服用', '饭后服用', '随餐服用', '空腹服用', '睡前服用'],
    description: '',
    
    // 服用时间
    timeSelected: {
      morning: false,
      noon: false,
      evening: false,
      bedtime: false
    },
    showCustomTime: false,
    customTimes: [],
    
    // 提醒方式
    reminderType: 'notification', // notification, voice, both
    
    // 库存管理
    stock: '',
    stockThreshold: '10',
    
    // 编辑模式
    isEdit: false,
    medicineId: null,
    
    // 加载状态
    loading: false
  },
  
  onLoad: function (options) {
    // 如果是编辑模式，加载药物数据
    if (options.id) {
      this.setData({
        isEdit: true,
        medicineId: options.id,
        loading: true
      })
      this.loadMedicineData(options.id)
    }
  },
  
  // 获取用户openid
  getOpenId: function(callback) {
    const app = getApp()
    
    if (app.globalData.openid) {
      // 如果已经有openid，直接返回
      if (callback) callback(app.globalData.openid)
      return app.globalData.openid
    } else {
      // 如果没有，重新获取
      app.getOpenid(openid => {
        if (callback) callback(openid)
      })
      return 'test_user_id' // 临时返回，实际会通过回调更新
    }
  },
  
  // 加载药物数据
  loadMedicineData: function (id) {
    // 显示加载提示
    wx.showLoading({
      title: '加载中',
    })
    
    // 确保获取到openid
    this.getOpenId(openid => {
      // 调用云函数获取药物详情
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getMedicationDetail',
          medicationId: id,
          openid: openid
        }
      }).then(res => {
        wx.hideLoading()
        console.log('获取药物详情成功', res)
        
        if (res.result && res.result.success && res.result.data) {
          const medicine = res.result.data
          
          // 设置表单数据
          this.setData({
            name: medicine.name,
            dosageValue: medicine.dosageValue || '',
            dosageUnitIndex: this.getDosageUnitIndex(medicine.dosageUnit),
            frequencyIndex: this.getFrequencyIndex(medicine.frequency),
            instructionIndex: this.getInstructionIndex(medicine.instruction),
            description: medicine.description || '',
            timeSelected: medicine.timeSelected || {
              morning: false,
              noon: false,
              evening: false,
              bedtime: false
            },
            customTimes: medicine.customTimes || [],
            showCustomTime: (medicine.customTimes && medicine.customTimes.length > 0),
            reminderType: medicine.reminderType || 'notification',
            stock: medicine.stock || '',
            stockThreshold: medicine.stockThreshold || '10',
            loading: false
          })
        } else {
          this.showErrorMessage('获取药物数据失败')
          this.setData({ loading: false })
        }
      }).catch(err => {
        wx.hideLoading()
        console.error('获取药物详情失败', err)
        this.showErrorMessage('获取药物数据失败')
        this.setData({ loading: false })
      })
    })
  },
  
  // 获取剂量单位索引
  getDosageUnitIndex: function (unit) {
    const index = this.data.dosageUnits.findIndex(item => item === unit)
    return index !== -1 ? index : 0
  },
  
  // 获取频率索引
  getFrequencyIndex: function (frequency) {
    const index = this.data.frequencies.findIndex(item => item === frequency)
    return index !== -1 ? index : 0
  },
  
  // 获取服用说明索引
  getInstructionIndex: function (instruction) {
    const index = this.data.instructions.findIndex(item => item === instruction)
    return index !== -1 ? index : 0
  },
  
  // 显示错误消息
  showErrorMessage: function(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  },
  
  // 输入药品名称
  inputName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  
  // 输入剂量数值
  inputDosageValue: function (e) {
    this.setData({
      dosageValue: e.detail.value
    })
  },
  
  // 选择剂量单位
  selectDosageUnit: function (e) {
    this.setData({
      dosageUnitIndex: e.detail.value
    })
  },
  
  // 选择服用频率
  selectFrequency: function (e) {
    this.setData({
      frequencyIndex: e.detail.value
    })
  },
  
  // 选择服用时间
  toggleTime: function (e) {
    const time = e.currentTarget.dataset.time
    const timeSelected = this.data.timeSelected
    timeSelected[time] = !timeSelected[time]
    
    this.setData({
      timeSelected: timeSelected
    })
  },
  
  // 切换自定义时间显示
  toggleCustomTime: function () {
    this.setData({
      showCustomTime: !this.data.showCustomTime
    })
  },
  
  // 添加自定义时间
  addCustomTime: function () {
    const customTimes = this.data.customTimes
    customTimes.push('08:00')
    
    this.setData({
      customTimes: customTimes
    })
  },
  
  // 修改自定义时间
  changeCustomTime: function (e) {
    const index = e.currentTarget.dataset.index
    const customTimes = this.data.customTimes
    customTimes[index] = e.detail.value
    
    this.setData({
      customTimes: customTimes
    })
  },
  
  // 删除自定义时间
  deleteCustomTime: function (e) {
    const index = e.currentTarget.dataset.index
    const customTimes = this.data.customTimes
    customTimes.splice(index, 1)
    
    this.setData({
      customTimes: customTimes
    })
  },
  
  // 选择服用说明
  selectInstruction: function (e) {
    this.setData({
      instructionIndex: e.detail.value
    })
  },
  
  // 输入药品描述
  inputDescription: function (e) {
    this.setData({
      description: e.detail.value
    })
  },
  
  // 选择提醒方式
  selectReminderType: function (e) {
    this.setData({
      reminderType: e.currentTarget.dataset.type
    })
  },
  
  // 输入库存量
  inputStock: function (e) {
    this.setData({
      stock: e.detail.value
    })
  },
  
  // 输入库存阈值
  inputStockThreshold: function (e) {
    this.setData({
      stockThreshold: e.detail.value
    })
  },
  
  // 取消
  cancel: function () {
    wx.navigateBack()
  },
  
  // 保存药物信息
  saveMedicine: function () {
    // 表单验证
    if (!this.data.name) {
      this.showErrorMessage('请输入药品名称')
      return
    }
    
    // 验证至少选择了一个服用时间
    const timeSelected = this.data.timeSelected
    const hasSelectedTime = timeSelected.morning || 
                           timeSelected.noon || 
                           timeSelected.evening || 
                           timeSelected.bedtime ||
                           (this.data.customTimes && this.data.customTimes.length > 0)
    
    if (!hasSelectedTime) {
      this.showErrorMessage('请至少选择一个服用时间')
      return
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
    })
    
    // 组装药物数据
    const medicine = {
      name: this.data.name,
      dosageValue: this.data.dosageValue,
      dosageUnit: this.data.dosageUnits[this.data.dosageUnitIndex],
      frequency: this.data.frequencies[this.data.frequencyIndex],
      timeSelected: this.data.timeSelected,
      customTimes: this.data.customTimes,
      instruction: this.data.instructions[this.data.instructionIndex],
      description: this.data.description,
      reminderType: this.data.reminderType,
      stock: this.data.stock,
      stockThreshold: this.data.stockThreshold,
      status: false // 未服用状态
    }
    
    // 确保获取到openid
    this.getOpenId(openid => {
      console.log('保存药物信息，使用openid:', openid);
      
      // 编辑模式
      if (this.data.isEdit && this.data.medicineId) {
        // 调用更新云函数
        wx.cloud.callFunction({
          name: 'quickstartFunctions',
          data: {
            type: 'updateMedication',
            medicationId: this.data.medicineId,
            medication: medicine,
            openid: openid
          }
        }).then(res => {
          wx.hideLoading()
          console.log('更新药物成功', res)
          
          if (res.result && res.result.success) {
            wx.showToast({
              title: '修改成功',
              icon: 'success',
              duration: 2000
            })
            
            // 设置提醒
            this.setMedicineReminders(medicine)
            
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack()
            }, 2000)
          } else {
            this.showErrorMessage('更新失败，请重试')
          }
        }).catch(err => {
          wx.hideLoading()
          console.error('更新药物失败', err)
          this.showErrorMessage('更新失败，请重试')
        })
      } else {
        // 新增模式
        wx.cloud.callFunction({
          name: 'quickstartFunctions',
          data: {
            type: 'addMedication',
            medication: medicine,
            openid: openid
          }
        }).then(res => {
          wx.hideLoading()
          console.log('添加药物成功', res)
          
          if (res.result && res.result.success) {
            wx.showToast({
              title: '添加成功',
              icon: 'success',
              duration: 2000
            })
            
            // 设置提醒
            this.setMedicineReminders(medicine)
            
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack()
            }, 2000)
          } else {
            this.showErrorMessage('添加失败，请重试')
          }
        }).catch(err => {
          wx.hideLoading()
          console.error('添加药物失败', err)
          this.showErrorMessage('添加失败，请重试')
        })
      }
    })
  },
  
  // 设置药物提醒
  setMedicineReminders: function (medicine) {
    // 这里应该实现药物提醒的定时任务
    // 由于微信小程序限制，后台定时任务需要通过服务器端实现
    // 这里可以调用云函数来设置提醒
    console.log('设置药物提醒:', medicine)
    
    // 实际开发中，应该调用微信的订阅消息API
    // 例如：
    /*
    wx.requestSubscribeMessage({
      tmplIds: ['your_template_id'], // 订阅消息模板ID
      success: (res) => {
        console.log('订阅成功', res)
        // 调用云函数设置服务端提醒
      },
      fail: (err) => {
        console.error('订阅失败', err)
      }
    })
    */
  }
})