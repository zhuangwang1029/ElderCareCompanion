// pages/health/diary/diary.js
Page({
  data: {
    currentFeeling: '',
    bloodPressureHigh: '',
    bloodPressureLow: '',
    heartRate: '',
    bloodGlucose: '',
    symptoms: {
      headache: false,
      dizziness: false,
      chest_pain: false,
      nausea: false,
      insomnia: false,
      cough: false,
      fever: false,
      other:false
    },
    note: '',
    currentDate: '',
    loading: false // 添加加载状态
  },
  
  onLoad: function (options) {
    // 如果有指定日期参数，使用该日期
    let date = options.date || this.getTodayString()
    
    this.setData({
      currentDate: date,
      loading: true
    })
    
    // 加载指定日期的日记数据
    this.loadDiaryData(date)
  },
  
  // 获取用户openid
  getOpenId: function() {
    const app = getApp()
    // 实际应用中，openid应该通过云函数获取并存储在全局数据中
    return app.globalData.openid || 'test_user_id'
  },
  
  // 加载指定日期的日记数据
  loadDiaryData: function (date) {
    wx.showLoading({
      title: '加载中',
    })
    
    // 调用云函数获取健康日记
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getHealthDiary',
        date: date,
        openid: this.getOpenId()
      }
    }).then(res => {
      wx.hideLoading()
      console.log('获取健康日记成功', res)
      
      if (res.result && res.result.success) {
        const diaryData = res.result.data
        this.setData({
          currentFeeling: diaryData.feeling || '',
          bloodPressureHigh: diaryData.bloodPressureHigh || '',
          bloodPressureLow: diaryData.bloodPressureLow || '',
          heartRate: diaryData.heartRate || '',
          bloodGlucose: diaryData.bloodGlucose || '',
          symptoms: diaryData.symptoms || {
            headache: false,
            dizziness: false,
            chest_pain: false,
            nausea: false,
            insomnia: false,
            cough: false,
            fever: false,
            other:false
          },
          note: diaryData.note || '',
          loading: false
        })
      } else {
        // 没有找到记录，使用默认值
        this.setData({
          currentFeeling: '',
          bloodPressureHigh: '',
          bloodPressureLow: '',
          heartRate: '',
          bloodGlucose: '',
          symptoms: {
            headache: false,
            dizziness: false,
            chest_pain: false,
            nausea: false,
            fatigue: false,
            insomnia: false,
            cough: false,
            fever: false
          },
          note: '',
          loading: false
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('获取健康日记失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '获取记录失败',
        icon: 'none'
      })
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
  
  // 选择感受
  selectFeeling: function (e) {
    this.setData({
      currentFeeling: e.currentTarget.dataset.feeling
    })
  },
  
  // 输入血压高压
  inputBloodPressureHigh: function (e) {
    this.setData({
      bloodPressureHigh: e.detail.value
    })
  },
  
  // 输入血压低压
  inputBloodPressureLow: function (e) {
    this.setData({
      bloodPressureLow: e.detail.value
    })
  },
  
  // 输入心率
  inputHeartRate: function (e) {
    this.setData({
      heartRate: e.detail.value
    })
  },
  
  // 输入血糖
  inputBloodGlucose: function (e) {
    this.setData({
      bloodGlucose: e.detail.value
    })
  },
  
  // 切换症状
  toggleSymptom: function (e) {
    const type = e.currentTarget.dataset.type
    const symptoms = this.data.symptoms
    symptoms[type] = !symptoms[type]
    
    this.setData({
      symptoms: symptoms
    })
  },
  
  // 输入备注
  inputNote: function (e) {
    this.setData({
      note: e.detail.value
    })
  },
  
  // 保存日记
  saveDiary: function () {
    // 数据验证
    if (!this.data.currentFeeling) {
      wx.showToast({
        title: '请选择今日感受',
        icon: 'none'
      })
      return
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中',
    })
    
    // 组装日记数据
    const diaryData = {
      date: this.data.currentDate,
      feeling: this.data.currentFeeling,
      bloodPressureHigh: this.data.bloodPressureHigh,
      bloodPressureLow: this.data.bloodPressureLow,
      heartRate: this.data.heartRate,
      bloodGlucose: this.data.bloodGlucose,
      symptoms: this.data.symptoms,
      note: this.data.note
    }
    
    // 修改为调用updateHealthDiary云函数而不是addHealthDiary
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'updateHealthDiary',
        diary: diaryData,
        openid: this.getOpenId()
      }
    }).then(res => {
      wx.hideLoading()
      console.log('保存健康日记成功', res)
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 延时返回
        setTimeout(function() {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('保存健康日记失败', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  }
})