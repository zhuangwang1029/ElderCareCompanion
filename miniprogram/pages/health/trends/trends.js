// pages/health/trends/trends.js
Page({
  data: {
    dataType: 'bloodPressure', // bloodPressure, heartRate, bloodGlucose
    dataTypeLabel: '血压',
    dateRange: '7', // 7, 30, 90 天
    chartData: [],
    hasData: false,
    selectedIndex: null,
    startDate: '',
    endDate: '',
    chartWidth: 800,
    chartHeight: 460,
    pointSpacing: 100, // 点之间的间距
    minValue: 0,
    maxValue: 100,
    yAxisLabels: [],
    loading: false, // 添加加载状态
    healthInsights: null // 添加健康洞察
  },

  onLoad: function (options) {
    if (options.type) {
      this.setData({
        dataType: options.type
      })
    }

    // 获取屏幕宽度
    const systemInfo = wx.getSystemInfoSync()
    const chartHeight = systemInfo.windowWidth * 0.8 // 保持合适的宽高比
    
    this.setData({
      chartHeight: chartHeight
    })
    
    // 设置数据类型标签
    this.updateDataTypeLabel()
    
    // 加载数据
    this.loadData()
  },
  
  onShow: function() {
    // 重新加载数据，以防数据被更新
    this.loadData()
  },

  // 获取用户openid
  getOpenId: function() {
    const app = getApp()
    return app.globalData.openid || 'test_user_id'
  },
  
  // 更新数据类型标签
  updateDataTypeLabel: function() {
    let label = '血压'
    if (this.data.dataType === 'heartRate') {
      label = '心率'
    } else if (this.data.dataType === 'bloodGlucose') {
      label = '血糖'
    }
    
    this.setData({
      dataTypeLabel: label
    })
  },

  // 切换数据类型
  switchType: function(e) {
    const type = e.currentTarget.dataset.type
    
    this.setData({
      dataType: type,
      selectedIndex: null,
      healthInsights: null // 清空健康洞察
    })
    
    this.updateDataTypeLabel()
    this.loadData()
  },

  // 切换日期范围
  switchRange: function(e) {
    const range = e.currentTarget.dataset.range
    
    this.setData({
      dateRange: range,
      selectedIndex: null,
      healthInsights: null // 清空健康洞察
    })
    
    this.loadData()
  },

  // 加载数据
  loadData: function() {
    // 显示加载状态
    this.setData({
      loading: true
    })
    
    // 计算日期范围
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(this.data.dateRange))
    
    const startDateStr = this.formatDate(startDate)
    const endDateStr = this.formatDate(endDate)
    
    this.setData({
      startDate: startDateStr,
      endDate: endDateStr
    })
    
    // 调用云函数获取健康趋势数据
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getHealthTrends',
        openid: this.getOpenId(),
        days: parseInt(this.data.dateRange)
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const diaryData = res.result.data || []
        this.processChartData(diaryData)
      } else {
        this.setData({
          chartData: [],
          hasData: false,
          loading: false
        })
      }
    }).catch(err => {
      console.error('获取健康趋势数据失败', err)
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      })
      this.setData({
        loading: false
      })
    })
  },
  
  // 处理图表数据
  processChartData: function(diaryData) {
    const filteredData = []
    
    // 根据选择的数据类型过滤数据
    diaryData.forEach(item => {
      if (this.data.dataType === 'bloodPressure' && 
          item.bloodPressureHigh && 
          item.bloodPressureLow) {
        filteredData.push({
          date: item.date,
          shortDate: this.formatShortDate(new Date(item.date)),
          high: parseInt(item.bloodPressureHigh) || 0,
          low: parseInt(item.bloodPressureLow) || 0,
          highAbnormal: this.isAbnormalValue('bloodPressure', parseInt(item.bloodPressureHigh), true),
          lowAbnormal: this.isAbnormalValue('bloodPressure', parseInt(item.bloodPressureLow), false),
          note: item.note
        })
      } else if (this.data.dataType === 'heartRate' && item.heartRate) {
        filteredData.push({
          date: item.date,
          shortDate: this.formatShortDate(new Date(item.date)),
          value: parseInt(item.heartRate) || 0,
          abnormal: this.isAbnormalValue('heartRate', parseInt(item.heartRate)),
          note: item.note
        })
      } else if (this.data.dataType === 'bloodGlucose' && item.bloodGlucose) {
        filteredData.push({
          date: item.date,
          shortDate: this.formatShortDate(new Date(item.date)),
          value: parseFloat(item.bloodGlucose) || 0,
          abnormal: this.isAbnormalValue('bloodGlucose', parseFloat(item.bloodGlucose)),
          note: item.note
        })
      }
    })
    
    // 按日期排序
    filteredData.sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    })
    
    // 调整点间距和图表宽度
    const pointSpacing = Math.max(100, 700 / Math.max(1, filteredData.length));
    let chartWidth = filteredData.length * pointSpacing + 60; // 额外留出右侧空间
    chartWidth = Math.max(chartWidth, 700); // 确保最小宽度
    
    // 计算Y轴范围
    let minValue = 0
    let maxValue = 100
    let yAxisLabels = []
    
    if (filteredData.length > 0) {
      if (this.data.dataType === 'bloodPressure') {
        // 找出最高和最低的值
        let minHigh = Math.min(...filteredData.map(item => item.high))
        let maxHigh = Math.max(...filteredData.map(item => item.high))
        let minLow = Math.min(...filteredData.map(item => item.low))
        let maxLow = Math.max(...filteredData.map(item => item.low))
        
        // 增加上下边距，确保数据点不会太靠近边缘
        minValue = Math.max(0, Math.floor(minLow / 10) * 10 - 10)
        maxValue = Math.ceil(maxHigh / 10) * 10 + 10
        
        // 生成Y轴标签 - 限制标签数量为6个，增加可读性
        const step = Math.ceil((maxValue - minValue) / 6 / 10) * 10;
        for (let i = minValue; i <= maxValue; i += step) {
          yAxisLabels.unshift(i)
        }
      } else if (this.data.dataType === 'heartRate') {
        let min = Math.min(...filteredData.map(item => item.value))
        let max = Math.max(...filteredData.map(item => item.value))
        
        minValue = Math.max(0, Math.floor(min / 10) * 10 - 10)
        maxValue = Math.ceil(max / 10) * 10 + 10
        
        const step = Math.ceil((maxValue - minValue) / 6 / 10) * 10;
        for (let i = minValue; i <= maxValue; i += step) {
          yAxisLabels.unshift(i)
        }
      } else if (this.data.dataType === 'bloodGlucose') {
        let min = Math.min(...filteredData.map(item => item.value))
        let max = Math.max(...filteredData.map(item => item.value))
        
        minValue = Math.max(0, Math.floor(min) - 1)
        maxValue = Math.ceil(max) + 1
        
        // 血糖值需要更精细的刻度
        const step = Math.ceil((maxValue - minValue) / 6 * 10) / 10;
        for (let i = minValue; i <= maxValue; i += step) {
          yAxisLabels.unshift(parseFloat(i.toFixed(1)))
        }
      }
    } else {
      // 默认Y轴标签
      if (this.data.dataType === 'bloodPressure') {
        yAxisLabels = [60, 80, 100, 120, 140, 160]
        minValue = 60
        maxValue = 160
      } else if (this.data.dataType === 'heartRate') {
        yAxisLabels = [40, 60, 80, 100, 120]
        minValue = 40
        maxValue = 120
      } else {
        yAxisLabels = [3, 4, 5, 6, 7, 8]
        minValue = 3
        maxValue = 8
      }
    }
    
    this.setData({
      chartData: filteredData,
      hasData: filteredData.length > 0,
      chartWidth: chartWidth,
      pointSpacing: pointSpacing,
      minValue: minValue,
      maxValue: maxValue,
      yAxisLabels: yAxisLabels,
      loading: false
    })
    
    // 如果有数据，生成健康洞察
    if (filteredData.length > 0) {
      this.generateHealthInsights(filteredData)
    }
  },
  
  // 生成健康洞察
  generateHealthInsights: function(data) {
    let insights = {
      trend: '',
      average: '',
      abnormal: '',
      advice: ''
    }
    
    if (this.data.dataType === 'bloodPressure') {
      // 收缩压趋势
      const highValues = data.map(item => item.high)
      const highTrend = this.calculateTrend(highValues)
      
      // 舒张压趋势
      const lowValues = data.map(item => item.low)
      const lowTrend = this.calculateTrend(lowValues)
      
      // 计算平均值
      const avgHigh = Math.round(highValues.reduce((sum, val) => sum + val, 0) / highValues.length)
      const avgLow = Math.round(lowValues.reduce((sum, val) => sum + val, 0) / lowValues.length)
      
      // 检查是否有异常值
      let abnormalDays = []
      data.forEach(item => {
        if (item.high > 140 || item.low > 90 || item.high < 90 || item.low < 60) {
          abnormalDays.push(item.date)
        }
      })
      
      // 生成洞察
      insights.trend = `收缩压${this.getTrendText(highTrend)}，舒张压${this.getTrendText(lowTrend)}。`
      insights.average = `平均血压为 ${avgHigh}/${avgLow} mmHg。`
      
      if (abnormalDays.length > 0) {
        insights.abnormal = `在 ${abnormalDays.length} 天中检测到异常血压值。`
        
        if (avgHigh > 140 || avgLow > 90) {
          insights.advice = '您的血压偏高，建议减少盐分摄入，适当运动，必要时咨询医生。'
        } else if (avgHigh < 90 || avgLow < 60) {
          insights.advice = '您的血压偏低，建议适当增加盐分摄入，避免长时间站立，必要时咨询医生。'
        } else {
          insights.advice = '您的血压总体正常，但有波动，建议保持规律作息和健康饮食。'
        }
      } else {
        insights.abnormal = '未检测到异常血压值。'
        insights.advice = '您的血压状况良好，请继续保持健康的生活方式。'
      }
      
    } else if (this.data.dataType === 'heartRate') {
      const values = data.map(item => item.value)
      const trend = this.calculateTrend(values)
      const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
      
      let abnormalDays = []
      data.forEach(item => {
        if (item.value > 100 || item.value < 60) {
          abnormalDays.push(item.date)
        }
      })
      
      insights.trend = `心率${this.getTrendText(trend)}。`
      insights.average = `平均心率为 ${avg} 次/分钟。`
      
      if (abnormalDays.length > 0) {
        insights.abnormal = `在 ${abnormalDays.length} 天中检测到异常心率值。`
        
        if (avg > 100) {
          insights.advice = '您的心率偏快，建议减少咖啡因摄入，保持充分休息，必要时咨询医生。'
        } else if (avg < 60) {
          insights.advice = '您的心率偏慢，如有头晕或疲劳症状，建议咨询医生。'
        } else {
          insights.advice = '您的心率总体正常，但有波动，建议保持规律作息和适当运动。'
        }
      } else {
        insights.abnormal = '未检测到异常心率值。'
        insights.advice = '您的心率状况良好，请继续保持健康的生活方式。'
      }
      
    } else if (this.data.dataType === 'bloodGlucose') {
      const values = data.map(item => item.value)
      const trend = this.calculateTrend(values)
      const avg = (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)
      
      let abnormalDays = []
      data.forEach(item => {
        if (item.value > 6.1 || item.value < 3.9) {
          abnormalDays.push(item.date)
        }
      })
      
      insights.trend = `血糖${this.getTrendText(trend)}。`
      insights.average = `平均血糖为 ${avg} mmol/L。`
      
      if (abnormalDays.length > 0) {
        insights.abnormal = `在 ${abnormalDays.length} 天中检测到异常血糖值。`
        
        if (avg > 6.1) {
          insights.advice = '您的血糖偏高，建议控制糖分和碳水化合物摄入，增加运动，必要时咨询医生。'
        } else if (avg < 3.9) {
          insights.advice = '您的血糖偏低，建议定时进食，适当增加碳水化合物摄入，必要时咨询医生。'
        } else {
          insights.advice = '您的血糖总体正常，但有波动，建议保持规律饮食和适当运动。'
        }
      } else {
        insights.abnormal = '未检测到异常血糖值。'
        insights.advice = '您的血糖状况良好，请继续保持健康的生活方式。'
      }
    }
    
    this.setData({
      healthInsights: insights
    })
  },
  
  // 计算趋势
  calculateTrend: function(values) {
    if (values.length < 3) return 'stable'; // 数据点太少，无法判断趋势
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) {
        increases++;
      } else if (values[i] < values[i-1]) {
        decreases++;
      }
    }
    
    const increaseRatio = increases / (values.length - 1);
    const decreaseRatio = decreases / (values.length - 1);
    
    if (increaseRatio > 0.6) return 'rising';
    if (decreaseRatio > 0.6) return 'falling';
    return 'stable';
  },
  
  // 获取趋势文本描述
  getTrendText: function(trend) {
    switch(trend) {
      case 'rising': return '呈上升趋势';
      case 'falling': return '呈下降趋势';
      default: return '趋势稳定';
    }
  },
  
  // 显示详情
  showDetail: function(e) {
    const index = e.currentTarget.dataset.index
    
    // 如果点击的是当前选中的点，则取消选中
    if (this.data.selectedIndex === index) {
      this.setData({
        selectedIndex: null
      })
    } else {
      // 否则选中点击的点
      this.setData({
        selectedIndex: index
      })
    }
  },
  
  // 添加新记录
  addNewRecord: function() {
    wx.navigateTo({
      url: '/pages/health/diary/diary'
    })
  },
  
  // 导出数据
  exportData: function() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  },
  
  // 格式化日期 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 格式化短日期 MM/DD
  formatShortDate: function(date) {
    const month = (date.getMonth() + 1).toString()
    const day = date.getDate().toString()
    return `${month}/${day}`
  },

  // 判断数值是否异常
  isAbnormalValue: function(type, value, isHigh = false) {
    if (type === 'bloodPressure') {
      if (isHigh) { // 收缩压
        return value > 140 || value < 90;
      } else { // 舒张压
        return value > 90 || value < 60;
      }
    } else if (type === 'heartRate') {
      return value > 100 || value < 60;
    } else if (type === 'bloodGlucose') {
      return value > 6.1 || value < 3.9;
    }
    return false;
  }
})