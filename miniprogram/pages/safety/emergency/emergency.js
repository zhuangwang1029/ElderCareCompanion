// pages/safety/emergency/emergency.js
Page({
  data: {
    contacts: [],
    loading: false,
    bgColors: ['#FF5722', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FFC107', '#795548'],
    shareData: {
      title: '紧急求助',
      desc: '我需要帮助！',
      location: null
    }
  },
  
  onLoad: function () {
    // 加载联系人数据
    this.loadContacts()
  },
  
  onShow: function() {
    // 每次页面显示时重新加载联系人数据
    this.loadContacts()
  },
  
  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },
  
  // 加载联系人
  loadContacts: function () {
    this.setData({
      loading: true
    });
    
    console.log('开始加载联系人...');
    
    // 从云数据库获取联系人数据
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getEmergencyContacts',
        openid: this.getOpenId()
      },
      success: (res) => {
        console.log('云函数调用成功:', res);
        
        if (res.result && res.result.success) {
          let contacts = res.result.data || [];
          
          // 如果没有数据，使用默认联系人
          if (contacts.length === 0) {
            console.log('云数据库中没有联系人，使用默认联系人');
            contacts = [];
            
            // 保存默认联系人到云数据库
            this.saveDefaultContacts(contacts);
          }
          
          // 处理每个联系人，确保有nameInitial属性用于头像显示
          contacts = contacts.map(contact => {
            return {
              ...contact,
              nameInitial: this.getNameInitial(contact.name),
              bgColor: this.getRandomColor(contact.name)
            };
          });
          
          console.log('处理后的联系人数据:', contacts);
          
          this.setData({
            contacts: contacts,
            loading: false
          });
        } else {
          console.log('云函数返回错误，使用本地存储');
          // 如果云函数失败，尝试使用本地存储
          this.loadLocalContacts();
        }
      },
      fail: (err) => {
        console.error('加载联系人失败', err);
        // 云函数失败，使用本地存储
        this.loadLocalContacts();
      }
    });
  },
  
  // 保存默认联系人到云数据库
  saveDefaultContacts: function(contacts) {
    contacts.forEach(contact => {
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'addEmergencyContact',
          contact: contact,
          openid: this.getOpenId()
        }
      });
    });
  },
  
  // 从本地存储加载联系人（备用方法）
  loadLocalContacts: function() {
    const storedContacts = wx.getStorageSync('emergencyContacts');
    if (storedContacts && storedContacts.length > 0) {
      const contacts = storedContacts.map(contact => {
        return {
          ...contact,
          nameInitial: this.getNameInitial(contact.name),
          bgColor: this.getRandomColor(contact.name)
        };
      });
      
      this.setData({
        contacts: contacts,
        loading: false
      });
    } else {
      // 本地也没有数据
      const defaultContacts = [];
    
      defaultContacts.forEach(contact => {
        contact.nameInitial = this.getNameInitial(contact.name);
        contact.bgColor = this.getRandomColor(contact.name);
      });
      
      wx.setStorageSync('emergencyContacts', defaultContacts);
      
      this.setData({
        contacts: defaultContacts,
        loading: false
      });
    }
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
  
  // 自定义分享功能
  onShareAppMessage: function(res) {
    // 如果有位置信息，则在分享中包含位置
    const shareData = this.data.shareData;
    let shareTitle = "【紧急求助】我需要帮助！";
    let sharePath = "/pages/safety/emergency/emergency";
    
    if (shareData.location) {
      shareTitle = `【紧急求助】${shareData.location.address || '未知位置'}`;
      sharePath = `/pages/safety/emergency/location/location?lat=${shareData.location.latitude}&lng=${shareData.location.longitude}&address=${encodeURIComponent(shareData.location.address || '未知位置')}`;
    }
    
    return {
      title: shareTitle,
      path: sharePath,
      imageUrl: '/images/emergency_share.png' // 如果有合适的图片可以设置
    };
  },

  // 修改后的紧急呼叫函数
  callEmergency: function() {
    const that = this;
    
    // 先显示确认对话框
    wx.showModal({
      title: '紧急求助',
      content: '确定要发起紧急求助吗？',
      confirmColor: '#E53935',
      success(res) {
        if (res.confirm) {
          // 立即显示模拟拨打120的界面，确保在任何情况下都会显示
          wx.showModal({
            title: '模拟拨打120',
            content: '在实际应用中将拨打急救电话。是否继续？',
            confirmText: '拨打',
            confirmColor: '#E53935',
            cancelText: '取消',
            success: (result) => {
              if (result.confirm) {
                wx.showToast({
                  title: '已模拟拨打120',
                  icon: 'success'
                });
              }
            }
          });
          
          // 然后再获取位置用于分享
          wx.getLocation({
            type: 'gcj02',
            success: function(res) {
              const latitude = res.latitude;
              const longitude = res.longitude;
              
              // 获取位置名称 - 多种方法尝试
              wx.reverseGeocoder({
                location: {
                  latitude: latitude,
                  longitude: longitude
                },
                success: (geoRes) => {
                  const address = geoRes.address;
                  
                  // 更新分享数据
                  that.setData({
                    'shareData.location': {
                      latitude: latitude,
                      longitude: longitude,
                      address: address
                    }
                  });
                  
                  // 保存位置信息到云数据库（保留原有功能）
                  const contacts = wx.getStorageSync('emergencyContacts') || [];
                  const contactIds = contacts.map(contact => contact.id);
                  wx.cloud.callFunction({
                    name: 'quickstartFunctions',
                    data: {
                      type: 'saveEmergencyLocation',
                      latitude: latitude,
                      longitude: longitude,
                      address: address,
                      openid: that.getOpenId(),
                      contacts: contactIds,
                      timestamp: Date.now()
                    },
                    success: (res) => {
                      console.log('位置信息已保存到云数据库', res.result);
                    },
                    fail: (err) => {
                      console.error('保存位置信息失败', err);
                    }
                  });
                  
                  // 显示分享菜单
                  wx.showShareMenu({
                    withShareTicket: true,
                    menus: ['shareAppMessage', 'shareTimeline']
                  });
                  
                  // 提示用户分享
                  wx.showModal({
                    title: '紧急求助',
                    content: '位置信息已准备好，请点击右上角"···"将位置分享给紧急联系人',
                    showCancel: false,
                    confirmText: '我知道了',
                    success: () => {
                      // 同时给出其他选项
                      that.showEmergencyOptions(latitude, longitude, address);
                    }
                  });
                },
                fail: () => {
                  // 如果反向地理编码失败，尝试获取周边POI
                  try {
                    wx.chooseLocation({
                      latitude: latitude,
                      longitude: longitude,
                      success: (locationRes) => {
                        const address = locationRes.address || locationRes.name || '未知位置';
                        // 更新位置信息
                        that.setData({
                          'shareData.location': {
                            latitude: latitude,
                            longitude: longitude,
                            address: address
                          }
                        });
                        
                        // 显示分享菜单
                        wx.showShareMenu({
                          withShareTicket: true,
                          menus: ['shareAppMessage', 'shareTimeline']
                        });
                        
                        wx.showModal({
                          title: '紧急求助',
                          content: '位置信息已准备好，请点击右上角"···"将位置分享给紧急联系人',
                          showCancel: false,
                          confirmText: '我知道了',
                          success: () => {
                            that.showEmergencyOptions(latitude, longitude, address);
                          }
                        });
                      },
                      fail: () => {
                        // 两种方式都失败，使用坐标作为地址
                        const address = `位置(${latitude.toFixed(4)},${longitude.toFixed(4)})`;
                        that.setData({
                          'shareData.location': {
                            latitude: latitude,
                            longitude: longitude,
                            address: address
                          }
                        });
                        
                        wx.showShareMenu({
                          withShareTicket: true,
                          menus: ['shareAppMessage', 'shareTimeline']
                        });
                        
                        wx.showModal({
                          title: '紧急求助',
                          content: '位置信息已准备好，请点击右上角"···"将位置分享给紧急联系人',
                          showCancel: false,
                          confirmText: '我知道了',
                          success: () => {
                            that.showEmergencyOptions(latitude, longitude, address);
                          }
                        });
                      }
                    });
                  } catch (e) {
                    // 如果chooseLocation不可用，直接使用坐标
                    console.error('尝试使用chooseLocation失败', e);
                    const address = `位置(${latitude.toFixed(4)},${longitude.toFixed(4)})`;
                    that.setData({
                      'shareData.location': {
                        latitude: latitude,
                        longitude: longitude,
                        address: address
                      }
                    });
                    
                    wx.showShareMenu({
                      withShareTicket: true,
                      menus: ['shareAppMessage', 'shareTimeline']
                    });
                    
                    wx.showModal({
                      title: '紧急求助',
                      content: '位置信息已准备好，请点击右上角"···"将位置分享给紧急联系人',
                      showCancel: false,
                      confirmText: '我知道了',
                      success: () => {
                        that.showEmergencyOptions(latitude, longitude, address);
                      }
                    });
                  }
                }
              });
            },
            fail: function(err) {
              console.error('获取位置失败', err);
              // 未能获取定位，仍可分享求助信息
              that.setData({
                'shareData.location': null
              });
              
              wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
              });
              
              wx.showModal({
                title: '紧急求助',
                content: '未能获取位置，但您仍可以分享紧急求助信息，请点击右上角"···"按钮',
                showCancel: false,
                confirmText: '我知道了',
                success: () => {
                  that.showEmergencyOptions(null, null, null);
                }
              });
            }
          });
        }
      }
    });
  },
  
   // 新增函数：显示紧急选项
   showEmergencyOptions: function(latitude, longitude, address) {
    const contacts = wx.getStorageSync('emergencyContacts') || [];
    
    // 如果有联系人，给出拨打电话选项
    if (contacts.length > 0) {
      const options = ['拨打紧急电话120'];
      contacts.forEach(contact => {
        options.push(`拨打${contact.name}: ${contact.phone}`);
      });
      
      wx.showActionSheet({
        itemList: options,
        success: (res) => {
          if (res.tapIndex === 0) {
            // 模拟拨打120
            wx.showModal({
              title: '模拟拨打120',
              content: '在实际应用中将拨打急救电话。是否继续？',
              confirmText: '拨打',
              confirmColor: '#E53935',
              cancelText: '取消',
              success: (result) => {
                if (result.confirm) {
                  wx.showToast({
                    title: '已模拟拨打120',
                    icon: 'success'
                  });
                }
              }
            });
          } else if (res.tapIndex > 0 && res.tapIndex <= contacts.length) {
            // 拨打联系人电话
            const contactIndex = res.tapIndex - 1;
            wx.makePhoneCall({
              phoneNumber: contacts[contactIndex].phone,
              success: () => {
                wx.showToast({
                  title: '正在拨打联系人电话',
                  icon: 'none'
                });
              }
            });
          }
        }
      });
    } else {
      // 没有联系人，只给出拨打120选项
      wx.showModal({
        title: '模拟拨打120',
        content: '在实际应用中将拨打急救电话。是否继续？',
        confirmText: '拨打',
        confirmColor: '#E53935',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            wx.showToast({
              title: '已模拟拨打120',
              icon: 'success'
            });
          }
        }
      });
    }
    
    // 如果有位置信息，也提供查看位置的选项
    if (latitude && longitude) {
      setTimeout(() => {
        wx.showModal({
          title: '查看位置',
          content: '是否在地图中查看您的位置？',
          success: (res) => {
            if (res.confirm) {
              wx.openLocation({
                latitude: latitude,
                longitude: longitude,
                name: '紧急位置',
                address: address || '未知位置'
              });
            }
          }
        });
      }, 1500); // 延迟显示，避免与前面的对话框冲突
    }
  },

  // 向联系人发送位置信息
  sendLocationToContacts: function(latitude, longitude) {
    // 从本地存储获取联系人信息
    const contacts = wx.getStorageSync('emergencyContacts') || [];
    
    if (contacts.length > 0) {
      // 获取位置名称
      wx.reverseGeocoder({
        location: {
          latitude: latitude,
          longitude: longitude
        },
        success: (res) => {
          const address = res.address;
          const contactIds = contacts.map(contact => contact.id);
          
          // 保存位置信息到云数据库
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'saveEmergencyLocation',
              latitude: latitude,
              longitude: longitude,
              address: address,
              openid: this.getOpenId(),
              contacts: contactIds,
              timestamp: Date.now()
            },
            success: (res) => {
              if (res.result && res.result.success) {
                console.log('位置信息已保存到云数据库', res.result);
                
                // 准备发送短信
                const phoneNumbers = contacts.map(contact => contact.phone).filter(phone => phone && phone.trim() !== '');
                
                if (phoneNumbers.length > 0) {
                  wx.showLoading({
                    title: '正在发送位置信息',
                  });
                  
                  // 调用短信云函数
                  wx.cloud.callFunction({
                    name: 'sendLocationSMS',
                    data: {
                      phoneNumbers: phoneNumbers,
                      location: {
                        latitude: latitude,
                        longitude: longitude,
                        address: address
                      }
                    },
                    success: (res) => {
                      if (res.result && res.result.success) {
                        wx.showToast({
                          title: '位置已发送给联系人',
                          icon: 'success'
                        });
                      } else {
                        console.error('发送短信失败', res);
                        wx.showToast({
                          title: '发送位置信息失败',
                          icon: 'none'
                        });
                      }
                    },
                    fail: (err) => {
                      console.error('调用短信云函数失败', err);
                    },
                    complete: () => {
                      wx.hideLoading();
                    }
                  });
                }
                
                // 保存成功后向联系人发送位置
                this.shareLocationWithContacts(latitude, longitude, address, contacts);
              } else {
                console.error('保存位置信息失败', res);
                // 即使云存储失败，也尝试分享位置
                this.shareLocationWithContacts(latitude, longitude, address, contacts);
              }
            },
            fail: (err) => {
              console.error('调用保存位置云函数失败', err);
              // 云函数失败，仍然尝试分享位置
              this.shareLocationWithContacts(latitude, longitude, address, contacts);
            }
          });
        },
        fail: (err) => {
          console.error('获取位置名称失败', err);
          // 即使获取位置名称失败，仍然可以分享坐标
          this.shareLocationWithContacts(latitude, longitude, '未知位置', contacts);
        }
      });
    } else {
      wx.showToast({
        title: '未设置紧急联系人',
        icon: 'none'
      });
    }
  },

  // 与联系人分享位置
  shareLocationWithContacts: function(latitude, longitude, address, contacts) {
    const locationName = '紧急位置分享';
    
    // 生成用于分享的位置数据
    const locationData = {
      latitude: latitude,
      longitude: longitude,
      name: locationName,
      address: address
    };
    
    // 收集联系人手机号码
    const phoneNumbers = contacts.map(contact => contact.phone).filter(Boolean);
    
    // 如果有联系人电话号码，发送短信
    if (phoneNumbers.length > 0) {
      wx.showLoading({
        title: '正在发送位置信息',
      });
      
      // 调用云函数发送短信
      wx.cloud.callFunction({
        name: 'sendLocationSMS',
        data: {
          phoneNumbers: phoneNumbers,
          location: {
            latitude: latitude,
            longitude: longitude,
            address: address
          }
        },
        success: (res) => {
          if (res.result && res.result.success) {
            wx.showToast({
              title: '位置信息已发送',
              icon: 'success'
            });
          } else {
            console.error('发送短信失败', res);
            wx.showToast({
              title: '发送位置信息失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('调用短信云函数失败', err);
          wx.showToast({
            title: '发送位置信息失败',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
    
    // 显示选项：1. 自动拨打电话 2. 打开位置
    wx.showActionSheet({
      itemList: ['自动拨打联系人电话', '在地图中查看位置'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 自动拨打第一个联系人电话
          if (contacts.length > 0 && contacts[0].phone) {
            wx.makePhoneCall({
              phoneNumber: contacts[0].phone,
              success: () => {
                wx.showToast({
                  title: '正在拨打联系人电话',
                  icon: 'none'
                });
              }
            });
          }
        } else if (res.tapIndex === 1) {
          // 使用微信内置的位置查看功能
          wx.openLocation({
            latitude: latitude,
            longitude: longitude,
            name: locationName,
            address: address
          });
        }
      }
    });
    
    // 记录发送位置的操作
    contacts.forEach(contact => {
      console.log(`已向${contact.name}发送位置信息：${address}`);
    });
  },
  
  // 查看位置历史
  viewLocationHistory: function() {
    wx.navigateTo({
      url: '/pages/safety/emergency/location_history/location_history'
    });
  },

  // 呼叫联系人
  callContact: function(e) {
    const phoneNumber = e.currentTarget.dataset.phone
    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      success: function() {
        console.log('拨打联系人电话成功')
      },
      fail: function() {
        console.log('拨打联系人电话失败')
      }
    })
  },
  
  // 显示添加联系人界面
  showAddContact: function() {
    wx.navigateTo({
      url: '/pages/safety/emergency/add_contact/add_contact'
    })
  },
  
  // 编辑联系人
  editContact: function(e) {
    const contactId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/safety/emergency/add_contact/add_contact?id=${contactId}`
    })
  },
  
  // 删除联系人 - 需要修改为使用云函数
  deleteContact: function(e) {
    const contactId = e.currentTarget.dataset.id;
    const contact = this.data.contacts.find(item => item.id === contactId);
    
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
          // 使用云函数删除联系人
          wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: {
              type: 'deleteEmergencyContact',
              contactId: contact._id || contactId
            },
            success: (res) => {
              if (res.result && res.result.success) {
                // 更新本地数据
                const contacts = this.data.contacts.filter(item => item.id !== contactId);
                this.setData({ contacts });
                
                // 同时更新本地存储（备份）
                wx.setStorageSync('emergencyContacts', contacts);
                
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                // 云函数失败，尝试仅更新本地数据
                this.deleteLocalContact(contactId);
              }
            },
            fail: (err) => {
              console.error('删除联系人失败', err);
              // 云函数失败，尝试仅更新本地数据
              this.deleteLocalContact(contactId);
            }
          });
        }
      }
    });
  },
  
  // 删除本地联系人（备用方法）
  deleteLocalContact: function(contactId) {
    // 获取当前联系人列表
    let contacts = wx.getStorageSync('emergencyContacts') || [];
    
    // 过滤掉要删除的联系人
    contacts = contacts.filter(item => item.id !== contactId);
    
    // 更新存储和页面数据
    wx.setStorageSync('emergencyContacts', contacts);
    this.setData({ contacts });
    
    wx.showToast({
      title: '删除成功(本地)',
      icon: 'success'
    });
  }
});