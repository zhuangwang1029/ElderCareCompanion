// pages/health/diary/history/history.js
Page({
  data: {
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    days: [],
    firstDayOfWeek: 0,
    selectedDate: '',
    selectedDiaryData: null,
    hasSymptoms: false,
    loading: false
  },

  onLoad: function (options) {
    // 初始化当前日期为今天
    const today = this.getDateString(new Date())
    this.setData({
      selectedDate: today,
      loading: true
    })
    
    // 生成日历数据
    this.generateCalendar()
    
    // 加载选中日期的数据
    this.loadDiaryData(today)
  },

  // 获取用户openid
  getOpenId: function() {
    const app = getApp()
    return app.globalData.openid || 'test_user_id'
  },
  
  // 生成日历数据
  generateCalendar: function() {
    const year = this.data.currentYear
    const month = this.data.currentMonth
    
    this.setData({ loading: true })
    
    // 获取这个月的第一天是星期几
    const firstDay = new Date(year, month - 1, 1)
    const firstDayOfWeek = firstDay.getDay()
    
    // 获取这个月的总天数
    const daysInMonth = new Date(year, month, 0).getDate()
    
    // 生成日期数组的骨架
    const days = []
    const today = this.getDateString(new Date())
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = this.getDateString(new Date(year, month - 1, i))
      days.push({
        day: i,
        fullDate: fullDate,
        isToday: fullDate === today,
        hasRecord: false,
        feeling: ''
      })
    }
    
    this.setData({
      days: days,
      firstDayOfWeek: firstDayOfWeek
    })
    
    // 从云数据库获取当月的所有日记记录
    this.loadMonthDiaries(year, month, days)
  },
  
  // 从云数据库加载当月所有日记
  loadMonthDiaries: function(year, month, days) {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getHealthDiaryList',
        openid: this.getOpenId(),
        year: year,
        month: month
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const diaries = res.result.data || []
        
        // 更新日历上的记录标记
        const updatedDays = days.map(day => {
          const diary = diaries.find(d => d.date === day.fullDate)
          if (diary) {
            return {
              ...day,
              hasRecord: true,
              feeling: diary.feeling
            }
          }
          return day
        })
        
        this.setData({
          days: updatedDays,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('获取月度记录失败', err)
      this.setData({ loading: false })
    })
  },

  // 上个月
  prevMonth: function() {
    let year = this.data.currentYear
    let month = this.data.currentMonth - 1
    
    if (month < 1) {
      month = 12
      year--
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    })
    
    this.generateCalendar()
  },

  // 下个月
  nextMonth: function() {
    let year = this.data.currentYear
    let month = this.data.currentMonth + 1
    
    if (month > 12) {
      month = 1
      year++
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month
    })
    
    this.generateCalendar()
  },

  // 选择某一天
  selectDay: function(e) {
    const date = e.currentTarget.dataset.date
    
    this.setData({
      selectedDate: date
    })
    
    // 加载选中日期的数据
    this.loadDiaryData(date)
  },

  // 加载日记数据
  loadDiaryData: function(date) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getHealthDiary',
        date: date,
        openid: this.getOpenId()
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const diaryData = res.result.data
        
        // 检查是否有症状
        let hasSymptoms = false
        if (diaryData && diaryData.symptoms) {
          const symptoms = diaryData.symptoms
          hasSymptoms = symptoms.headache || symptoms.dizziness || symptoms.chest_pain || 
                        symptoms.nausea || symptoms.fatigue || symptoms.insomnia || 
                        symptoms.cough || symptoms.fever
        }
        
        this.setData({
          selectedDiaryData: diaryData,
          hasSymptoms: hasSymptoms,
          loading: false
        })
      } else {
        this.setData({
          selectedDiaryData: null,
          hasSymptoms: false,
          loading: false
        })
      }
    }).catch(err => {
      console.error('获取健康日记详情失败', err)
      this.setData({
        selectedDiaryData: null,
        hasSymptoms: false,
        loading: false
      })
    })
  },

  // 修改deleteDiary函数
  deleteDiary: function() {
    const that = this;
    console.log('点击删除按钮，日期:', that.data.selectedDate);
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这天的健康记录吗？删除后无法恢复。',
      confirmColor: '#E53935',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          console.log('开始调用云函数删除健康日记，参数:', {
            date: that.data.selectedDate,
            openid: that.getOpenId()
          });
          
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'deleteHealthDiary',
              date: that.data.selectedDate,
              openid: that.getOpenId()
            }
          }).then(res => {
            wx.hideLoading();
            console.log('云函数返回结果:', res);
            
            if (res.result && res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 重新加载日历数据
              that.generateCalendar();
              // 清空选中的日记数据
              that.setData({
                selectedDiaryData: null,
                hasSymptoms: false
              });
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
              console.error('删除失败，详细信息:', res.result ? res.result.errMsg : '未知错误');
            }
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
            console.error('调用云函数失败:', err);
          });
        }
      }
    });
  },

  // 添加新记录
  addNewRecord: function() {
    const date = this.data.selectedDate
    
    // 跳转到添加记录页面，带上日期参数
    wx.navigateTo({
      url: '/pages/health/diary/diary?date=' + date
    })
  },

  // 格式化日期为 YYYY-MM-DD
  getDateString: function(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 监听页面显示
  onShow: function() {
    // 重新生成日历和加载数据，以防数据被更新
    this.generateCalendar()
    this.loadDiaryData(this.data.selectedDate)
  }
})