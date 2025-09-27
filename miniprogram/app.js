// app.js
App({
  onLaunch: function () {
    // 初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-2g2fsyun06d333f7',
        traceUser: true,
      });
      
      // 获取用户openid，并在获取后检查提醒
      this.getOpenId(() => {
        // 初次检查服药提醒
        this.checkMedicationReminders();
        
        // 设置定时检查服药提醒（每10分钟检查一次）
        this.setMedicationCheckTimer();
      });
    }

    // 应用用户设置
    this.applyUserSettings();

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
              
              // 由于getUserInfo是网络请求，可能会在Page.onLoad之后才返回
              // 所以此处加入callack以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            }
          });
        }
      }
    });
    
    // 初始化云数据库集合
    this.initCloudCollections();

    // 初次检查服药提醒
    this.checkMedicationReminders();
  
    // 设置定时检查服药提醒（每10分钟检查一次）
    this.setMedicationCheckTimer();
  },
  
  onShow: function() {
    // 每次进入前台时检查服药提醒
    this.checkMedicationReminders();
    // 每次进入前台时重新应用用户设置
    this.applyUserSettings();
  },
  
  // 应用用户设置
  applyUserSettings: function() {
    const settings = wx.getStorageSync('userSettings') || {
      notificationEnabled: true,
      soundEnabled: true
    };
      
    this.globalData.userSettings = settings;

    // 向所有页面广播设置变更
    if (typeof this.pageSettingsCallback === 'function') {
      this.pageSettingsCallback(settings);
    }
  },

  // 设置定时检查服药提醒
  setMedicationCheckTimer: function() {
    // 清除现有定时器
    if (this.medicationTimer) {
      clearInterval(this.medicationTimer);
    }
    
    // 设置新定时器，每10分钟检查一次
    this.medicationTimer = setInterval(() => {
      this.checkMedicationReminders();
    }, 10 * 1000);
  },

  // 获取用户openid
  getOpenId: function() {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getOpenId'
      },
      success: res => {
        this.globalData.openid = res.result.openid;
        console.log('获取openid成功：', res.result.openid);
      },
      fail: err => {
        console.error('获取openid失败：', err);
      }
    });
  },
  
  // 检查服药提醒
  checkMedicationReminders: function() {
    console.log('检查服药提醒');
    
    // 获取当前用户openid
    const openid = this.globalData.openid;
    if (!openid) {
      console.log('未获取到openid，延迟检查');
      // 延迟1秒后再次尝试
      setTimeout(() => {
        this.checkMedicationReminders();
      }, 1000);
      return;
    }
    
    // 获取当前时间
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // 调用云函数获取所有药物
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getMedicationList',
        openid: openid
      }
    }).then(res => {
      if (!res.result || !res.result.success) {
        console.log('获取药物列表失败');
        return;
      }
      
      const medications = res.result.data || [];
      
      // 检查每个药物是否需要提醒
      medications.forEach(med => {
        // 如果已服用，跳过
        if (med.status) return;
        
        // 检查是否在提醒时间范围内（当前时间的前后10分钟）
        let shouldRemind = false;
        let reminderTime = '';
        
        // 检查预设时间点
        if (med.timeSelected) {
          const timeMap = {
            'morning': med.morningTime || '08:00',
            'noon': med.noonTime || '12:00',
            'evening': med.eveningTime || '18:00',
            'bedtime': med.bedtimeTime || '21:00'
          };
          
          for (const [key, value] of Object.entries(med.timeSelected)) {
            if (value && this.isTimeNearby(currentTimeStr, timeMap[key])) {
              shouldRemind = true;
              reminderTime = timeMap[key];
              break;
            }
          }
        }
        
        // 检查自定义时间点
        if (!shouldRemind && med.customTimes && med.customTimes.length > 0) {
          for (const time of med.customTimes) {
            if (this.isTimeNearby(currentTimeStr, time)) {
              shouldRemind = true;
              reminderTime = time;
              break;
            }
          }
        }
        
        // 如果需要提醒，显示弹窗并播放提示音
        if (shouldRemind) {
          this.showMedicationReminder(med, reminderTime);
        }
      });
    }).catch(err => {
      console.error('检查服药提醒失败', err);
    });
  },

  // 判断当前时间是否接近指定时间（前后10分钟内）
  isTimeNearby: function(currentTime, targetTime) {
    // 解析时间字符串为分钟数
    const parseTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const currentMinutes = parseTimeToMinutes(currentTime);
    const targetMinutes = parseTimeToMinutes(targetTime);
    
    // 判断是否在前后10分钟范围内
    return Math.abs(currentMinutes - targetMinutes) <= 10;
  },

  // 显示服药提醒弹窗
  showMedicationReminder: function(medication, time) {
    // 如果通知提醒已关闭，直接返回
    if (!this.globalData.userSettings.notificationEnabled) {
      console.log('通知提醒已关闭，不显示提醒');
      return;
    }

    // 获取提醒唯一标识，避免重复提醒
    const reminderId = `${medication.id}_${time.replace(':', '')}`;
    const reminderKey = `medication_reminded_${reminderId}`;

    // 检查今天是否已经提醒过
    const today = new Date().toISOString().split('T')[0];
    const reminded = wx.getStorageSync(reminderKey);

    if (reminded === today) {
      console.log('今天已经提醒过此药物', medication.name);
      return;
    }

    // 如果声音提醒已开启，播放提示音
    if (this.globalData.userSettings.soundEnabled) {
      // 停止并销毁之前的音频对象（如果有）
      if (this.globalData.reminderAudio) {
        this.globalData.reminderAudio.stop();
        this.globalData.reminderAudio.destroy();
        this.globalData.reminderAudio = null;
      }
      // 创建新的音频对象
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = '/images/reminder.mp3'; // 确保路径正确
      innerAudioContext.loop = true; // 如需循环播放
      innerAudioContext.play();
      this.globalData.reminderAudio = innerAudioContext;
    }

    // 显示弹窗
    wx.showModal({
      title: '服药提醒',
      content: `快到 ${time}了，该服用 ${medication.name} 了，剂量: ${medication.dosageValue || ''} ${medication.dosageUnit || ''}`,
      confirmText: '已服用',
      cancelText: '稍后提醒',
      success: (res) => {
        // 停止并销毁音频
        if (this.globalData.userSettings.soundEnabled && this.globalData.reminderAudio) {
          this.globalData.reminderAudio.stop();
          this.globalData.reminderAudio.destroy();
          this.globalData.reminderAudio = null;
        }

        if (res.confirm) {
          // 标记为已服用
          this.markMedicationAsTaken(medication.id);
          // 记录已提醒
          wx.setStorageSync(reminderKey, today);
        } else {
          // 10分钟后再次提醒
          setTimeout(() => {
            this.showMedicationReminder(medication, time);
          }, 10 * 60 * 1000);
        }
      }
    });
  },

  // 标记药物为已服用
  markMedicationAsTaken: function(medicationId) {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'updateMedicationStatus',
        medicationId: medicationId,
        status: true,
        openid: this.globalData.openid
      }
    }).then(res => {
      if (res.result && res.result.success) {
        console.log('已标记药物为已服用', medicationId);
        // 通知页面刷新数据
        if (this.medicationCallback) {
          this.medicationCallback();
        }
      }
    }).catch(err => {
      console.error('标记药物状态失败', err);
    });
  },

  // 初始化云数据库集合
  initCloudCollections: function() {
    console.log('开始初始化云数据库集合');
    
    // 创建紧急联系人集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createEmergencyContactsCollection'
      },
      success: res => {
        console.log('紧急联系人集合创建成功:', res);
      },
      fail: err => {
        console.error('紧急联系人集合创建失败:', err);
      }
    });
    
    // 创建药物集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createMedicineCollection'
      },
      success: res => {
        console.log('药物集合创建成功:', res);
      },
      fail: err => {
        console.error('药物集合创建失败:', err);
      }
    });
    
    // 创建健康日记集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createDiaryCollection'
      },
      success: res => {
        console.log('健康日记集合创建成功:', res);
      },
      fail: err => {
        console.error('健康日记集合创建失败:', err);
      }
    });

    // 创建通话联系人集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createCallContactsCollection'
      },
      success: res => {
        console.log('通话联系人集合创建成功:', res);
      },
      fail: err => {
        console.error('通话联系人集合创建失败:', err);
      }
    });

    // 创建通话记录集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createCallHistoryCollection'
      },
      success: res => {
        console.log('通话记录集合创建成功:', res);
      },
      fail: err => {
        console.error('通话记录集合创建失败:', err);
      }
    });

    // 创建紧急位置信息集合
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'createEmergencyLocationCollection'
      },
      success: res => {
        console.log('紧急位置信息集合创建成功:', res);
      },
      fail: err => {
        console.error('紧急位置信息集合创建失败:', err);
      }
    });
  },

  globalData: {
    userInfo: null,
    openid: null,
    userSettings: null,
    medicineParams: null,
    reminderAudio: null
  }
});