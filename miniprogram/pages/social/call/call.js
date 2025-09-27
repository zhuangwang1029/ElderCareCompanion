// pages/social/call/call.js
Page({
  data: {
    contacts: [],
    callHistory: [],
    loading: {
      contacts: false,
      history: false
    },
    bgColors: ['#FF5722', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FFC107', '#795548']
  },

  onLoad: function () {
    // 加载联系人数据
    this.loadData()
  },
  
  onShow: function() {
    // 每次页面显示时刷新数据
    this.loadData()
  },
  
  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },
  
  // 加载数据
  loadData: function () {
    this.loadContacts();
    this.loadCallHistory();
  },
  
  // 加载联系人
  loadContacts: function() {
      this.setData({
      'loading.contacts': true
    });
    
    // 从云数据库获取联系人数据
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getCallContacts',
        openid: this.getOpenId()
      },
      success: (res) => {
        console.log('获取通话联系人成功', res);
        if (res.result && res.result.success) {
          let contacts = res.result.data || [];
          
          // 如果没有数据，使用本地存储中的数据并同步到云数据库
          if (contacts.length === 0) {
            const localContacts = wx.getStorageSync('videoContacts') || [];
            if (localContacts.length > 0) {
              // 将本地数据同步到云
              this.syncLocalContactsToCloud(localContacts);
              contacts = localContacts;
            }
          }
          
          // 处理每个联系人，确保有nameInitial属性
          contacts = contacts.map(contact => {
            return {
              ...contact,
              nameInitial: this.getNameInitial(contact.name),
              bgColor: this.getRandomColor(contact.name)
            };
          });
          
          this.setData({
            contacts: contacts,
            'loading.contacts': false
          });
        } else {
          // 云函数失败，从本地存储加载
          this.loadLocalContacts();
        }
      },
      fail: (err) => {
        console.error('获取通话联系人失败', err);
        // 云函数失败，从本地存储加载
        this.loadLocalContacts();
      }
    });
  },

  // 将本地联系人同步到云数据库
  syncLocalContactsToCloud: function(contacts) {
    const openid = this.getOpenId();
    contacts.forEach(contact => {
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'addCallContact',
        contact: contact,
          openid: openid
        },
        success: (res) => {
          console.log(`联系人 ${contact.name} 已同步到云数据库`, res);
          // 如果成功，更新本地contact的_id
          if (res.result && res.result.success) {
            contact._id = res.result.data.id;
          }
        }
      });
    });
    
    // 更新本地存储，保存云ID
    wx.setStorageSync('videoContacts', contacts);
  },
  
  // 从本地加载联系人（备份方法）
  loadLocalContacts: function() {
    const localContacts = wx.getStorageSync('videoContacts') || [];
    this.setData({
      contacts: localContacts.map(contact => {
        return {
          ...contact,
          nameInitial: this.getNameInitial(contact.name),
          bgColor: this.getRandomColor(contact.name)
        };
      }),
      'loading.contacts': false
    });
  },

  // 加载通话记录
  loadCallHistory: function() {
    this.setData({
      'loading.history': true
    });
    
    // 从云数据库获取通话记录
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getCallHistory',
        openid: this.getOpenId()
      },
      success: (res) => {
        console.log('获取通话记录成功', res);
        if (res.result && res.result.success) {
          let history = res.result.data || [];
          
          // 如果没有数据，使用本地存储中的数据并同步到云数据库
          if (history.length === 0) {
            const localHistory = wx.getStorageSync('callHistory') || [];
            if (localHistory.length > 0) {
              // 将本地数据同步到云
              this.syncLocalHistoryToCloud(localHistory);
              history = localHistory;
            }
          }
          
    this.setData({
            callHistory: history,
            'loading.history': false
          });
        } else {
          // 云函数失败，从本地存储加载
          this.loadLocalHistory();
        }
      },
      fail: (err) => {
        console.error('获取通话记录失败', err);
        // 云函数失败，从本地存储加载
        this.loadLocalHistory();
      }
    });
  },

  // 将本地通话记录同步到云数据库
  syncLocalHistoryToCloud: function(history) {
    const openid = this.getOpenId();
    history.forEach(record => {
      // 确保有timestamp字段
      if (!record.timestamp) {
        record.timestamp = Date.now();
      }
      
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'addCallRecord',
          record: record,
          openid: openid
        },
        success: (res) => {
          console.log(`通话记录已同步到云数据库`, res);
          // 如果成功，更新本地record的_id
          if (res.result && res.result.success) {
            record._id = res.result.data.id;
          }
        }
      });
    });
    
    // 更新本地存储，保存云ID
    wx.setStorageSync('callHistory', history);
  },
  
  // 从本地加载通话记录（备份方法）
  loadLocalHistory: function() {
    const localHistory = wx.getStorageSync('callHistory') || [];
    this.setData({
      callHistory: localHistory,
      'loading.history': false
    });
  },

  // 获取姓名的第一个字（或首字母）作为头像显示
  getNameInitial: function(name) {
    if (!name) return '?';
    return name.charAt(0);
  },
  
  // 根据姓名生成固定的背景颜色
  getRandomColor: function(name) {
    if (!name) return '#cccccc';
    
    // 使用名字的字符编码之和对颜色数组长度取模，确保同一个名字总是得到相同的颜色
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    const index = sum % this.data.bgColors.length;
    return this.data.bgColors[index];
  },

  // 跳转到添加联系人页面
  showAddContact: function () {
    wx.navigateTo({
      url: './add_contact/add_contact'
    });
  },
  
  // 开始通话
  startCall: function (e) {
    const contactId = e.currentTarget.dataset.id;
    const contact = this.data.contacts.find(item => item.id === contactId || item._id === contactId);
    
    if (!contact) {
      wx.showToast({
        title: '找不到联系人',
        icon: 'none'
      });
      return;
    }
    
    // 如果没有电话号码，提示用户
    if (!contact.phone) {
      wx.showToast({
        title: '该联系人未设置电话号码',
        icon: 'none'
      });
      return;
    }
    
    // 使用微信API拨打电话
    wx.makePhoneCall({
      phoneNumber: contact.phone,
      success: () => {
        // 添加通话记录
        this.addCallRecord(contact);
      },
      fail: (err) => {
        console.log('通话取消或失败', err);
      }
    });
  },
  
  // 添加通话记录
  addCallRecord: function(contact) {
    // 创建新的通话记录
    const now = new Date();
    const newRecord = {
      id: Date.now(),
      name: contact.name,
      nameInitial: contact.nameInitial || contact.name.charAt(0),
      phone: contact.phone,
      bgColor: contact.bgColor,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      duration: '未接通', // 由于微信小程序无法获取实际通话时长，使用模拟值
      timestamp: now.getTime(),
      date: now.toISOString()
    };
    
    // 保存到云数据库
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'addCallRecord',
        record: newRecord,
        openid: this.getOpenId()
      },
      success: (res) => {
        if (res.result && res.result.success) {
          console.log('通话记录已保存到云数据库', res);
          // 成功时更新_id
          if (res.result.data && res.result.data.id) {
            newRecord._id = res.result.data.id;
          }
        }
        
        // 无论成功失败，都更新本地UI和存储
        this.updateLocalCallRecord(newRecord);
      },
      fail: (err) => {
        console.error('保存通话记录失败', err);
        // 失败时仍然更新本地
        this.updateLocalCallRecord(newRecord);
      }
    });
  },
  
  // 更新本地通话记录
  updateLocalCallRecord: function(newRecord) {
    // 从存储中获取现有历史记录
    let history = wx.getStorageSync('callHistory') || [];
    
    // 添加到历史记录开头
    history.unshift(newRecord);
    
    // 只保留最近20条记录
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    // 保存回本地存储
    wx.setStorageSync('callHistory', history);
    
    // 更新页面数据
    this.setData({
      callHistory: history
    });
  },
  
  // 再次拨号
  redial: function(e) {
    const historyId = e.currentTarget.dataset.id;
    const record = this.data.callHistory.find(item => item.id === historyId || item._id === historyId);
    
    if (!record || !record.phone) {
      wx.showToast({
        title: '无法拨打电话',
        icon: 'none'
      });
      return;
    }
    
    // 使用微信API拨打电话
    wx.makePhoneCall({
      phoneNumber: record.phone,
      success: () => {
        // 更新通话记录（简单更新时间）
        this.updateCallRecord(record);
      }
    });
  },
  
  // 更新通话记录
  updateCallRecord: function(record) {
    // 创建更新的记录
    const now = new Date();
    const updatedRecord = {
      ...record,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      timestamp: now.getTime(),
      date: now.toISOString()
    };
    
    // 保存到云数据库（作为新记录）
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'addCallRecord',
        record: updatedRecord,
        openid: this.getOpenId()
      },
      success: (res) => {
        if (res.result && res.result.success) {
          console.log('更新通话记录已保存到云数据库', res);
          // 成功时更新_id
          if (res.result.data && res.result.data.id) {
            updatedRecord._id = res.result.data.id;
          }
        }
        
        // 无论成功失败，都更新本地UI和存储
        this.updateLocalCallRecord(updatedRecord);
      },
      fail: (err) => {
        console.error('更新通话记录失败', err);
        // 失败时仍然更新本地
        this.updateLocalCallRecord(updatedRecord);
      }
    });
  },
  
  // 清空通话记录
  clearCallHistory: function() {
    wx.showModal({
      title: '清空通话记录',
      content: '确定要清空所有通话记录吗？此操作无法撤销。',
      confirmText: '清空',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数清空记录
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'clearCallHistory',
              openid: this.getOpenId()
            },
            success: (res) => {
              if (res.result && res.result.success) {
                console.log('通话记录已从云数据库清除', res);
              }
              
              // 无论成功失败，都清空本地存储和UI
              wx.setStorageSync('callHistory', []);
              this.setData({
                callHistory: []
              });
              
              wx.showToast({
                title: '已清空通话记录',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('清空通话记录失败', err);
              // 失败时仍然清空本地
              wx.setStorageSync('callHistory', []);
              this.setData({
                callHistory: []
              });
              
              wx.showToast({
                title: '已清空本地通话记录',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },
  
  // 编辑联系人
  editContact: function(e) {
    const contactId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `./add_contact/add_contact?id=${contactId}`
    });
  },
  
  // 删除联系人
  deleteContact: function(e) {
    const contactId = e.currentTarget.dataset.id;
    const contact = this.data.contacts.find(item => item.id === contactId || item._id === contactId);
    
    if (!contact) {
      wx.showToast({
        title: '找不到联系人',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '删除联系人',
      content: `确定要删除 ${contact.name} 吗？`,
      confirmText: '删除',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数删除联系人
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'deleteCallContact',
              contactId: contact._id || contactId
            },
            success: (res) => {
              if (res.result && res.result.success) {
                console.log('联系人已从云数据库删除', res);
              }
              
              // 无论成功失败，都更新本地存储和UI
              const contacts = this.data.contacts.filter(item => (item.id !== contactId && item._id !== contactId));
              wx.setStorageSync('videoContacts', contacts);
              this.setData({
                contacts: contacts
              });
              
              wx.showToast({
                title: '已删除联系人',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('删除联系人失败', err);
              // 失败时仍然更新本地
              const contacts = this.data.contacts.filter(item => (item.id !== contactId && item._id !== contactId));
              wx.setStorageSync('videoContacts', contacts);
              this.setData({
                contacts: contacts
              });
              
              wx.showToast({
                title: '已删除本地联系人',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  }
});