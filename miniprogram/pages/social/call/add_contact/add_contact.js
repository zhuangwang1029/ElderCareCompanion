// pages/social/call/add_contact/add_contact.js
Page({
  data: {
    isEdit: false,
    contactId: null,
    contact: {
      name: '',
      relation: '',
      phone: ''
    },
    relationOptions: ['家人', '医生', '朋友', '邻居', '亲戚', '其他'],
    selectedRelation: '家人'
  },

  onLoad: function (options) {
    // 判断是编辑还是新增
    if (options.id) {
      // 编辑模式
      this.setData({
        isEdit: true,
        contactId: options.id
      });
      this.loadContactData(options.id);
    }

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.isEdit ? '编辑联系人' : '添加联系人'
    });
  },

  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },

  // 加载联系人数据
  loadContactData: function (id) {
    // 尝试从云数据库获取联系人
    const contacts = wx.getStorageSync('videoContacts') || [];
    
    // 先从本地缓存查找，避免重复网络请求
    const localContact = contacts.find(item => (item.id == id || item._id == id));
    
    if (localContact) {
      this.setData({
        contact: localContact,
        selectedRelation: localContact.relation
      });
    } else {
      // 如果本地没有找到，显示错误并返回
      wx.showToast({
        title: '找不到联系人',
        icon: 'none'
      });
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 输入姓名
  inputName: function (e) {
    this.setData({
      'contact.name': e.detail.value
    });
  },

  // 输入电话
  inputPhone: function (e) {
    this.setData({
      'contact.phone': e.detail.value
    });
  },

  // 选择关系
  changeRelation: function (e) {
    const relation = this.data.relationOptions[e.detail.value];
    this.setData({
      selectedRelation: relation,
      'contact.relation': relation
    });
  },

  // 表单验证函数
  validateForm: function() {
    // 验证姓名
    if (!this.data.contact.name) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return false;
    }

    // 验证关系
    if (!this.data.contact.relation) {
      wx.showToast({
        title: '请选择与联系人的关系',
        icon: 'none'
      });
      return false;
    }
    
    // 验证手机号
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(this.data.contact.phone)) {
      wx.showToast({
        title: '请输入有效的手机号码',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 保存联系人
  saveContact: function() {
    console.log('点击保存按钮');
    // 验证表单
    if (!this.validateForm()) {
      return;
    }
    
    // 获取当前用户的openid
    const openid = this.getOpenId();
    console.log('获取到的openid:', openid);
    
    if (this.data.isEdit) {
      // 更新现有联系人
      const updatedContact = {
        ...this.data.contact
      };
      
      console.log('正在更新联系人:', updatedContact);
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'updateCallContact',
          contact: updatedContact,
          openid: openid
        },
        success: (res) => {
          console.log('更新联系人云函数返回:', res);
          if (res.result && res.result.success) {
            this.updateLocalStorageAndReturn(updatedContact, '更新成功');
          } else {
            // 云函数失败，只更新本地存储
            this.updateLocalStorageAndReturn(updatedContact, '更新成功(本地)');
          }
        },
        fail: (err) => {
          console.error('更新联系人失败', err);
          // 云函数失败，只更新本地存储
          this.updateLocalStorageAndReturn(updatedContact, '更新成功(本地)');
        }
      });
    } else {
      // 添加新联系人
      const newContact = {
        id: Date.now(),
        name: this.data.contact.name,
        relation: this.data.contact.relation,
        phone: this.data.contact.phone
      };
      
      console.log('正在添加新联系人:', newContact);
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'addCallContact',
          contact: newContact,
          openid: openid
        },
        success: (res) => {
          console.log('添加联系人云函数返回:', res);
          if (res.result && res.result.success) {
            // 保存云数据库返回的ID
            if (res.result.data && res.result.data.id) {
              newContact._id = res.result.data.id;
            }
            this.updateLocalStorageAndReturn(newContact, '添加成功', true);
          } else {
            // 云函数失败，只更新本地存储
            this.updateLocalStorageAndReturn(newContact, '添加成功(本地)', true);
          }
        },
        fail: (err) => {
          console.error('添加联系人失败', err);
          // 云函数失败，只更新本地存储
          this.updateLocalStorageAndReturn(newContact, '添加成功(本地)', true);
        }
      });
    }
  },

  // 更新本地存储并返回
  updateLocalStorageAndReturn: function(contact, message, isNew = false) {
    let contacts = wx.getStorageSync('videoContacts') || [];
    
    if (isNew) {
      // 添加新联系人
      contacts.push(contact);
    } else {
      // 更新现有联系人
      const index = contacts.findIndex(item => (
        item.id == this.data.contactId || item._id == this.data.contactId
      ));
      
      if (index >= 0) {
        // 保留原始ID和可能的_id
        const originalId = contacts[index].id;
        const cloudId = contacts[index]._id || contact._id;
        
        contacts[index] = {
          ...contact,
          id: originalId
        };
        
        // 如果有云ID，也保留
        if (cloudId) {
          contacts[index]._id = cloudId;
        }
      } else {
        // 找不到要更新的联系人，添加为新联系人
        contacts.push(contact);
      }
    }
    
    // 更新本地存储
    wx.setStorageSync('videoContacts', contacts);
    
    // 显示成功提示并返回
    wx.showToast({
      title: message,
      icon: 'success'
    });
    
    // 延迟返回
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 取消按钮
  cancelEdit: function() {
    wx.navigateBack();
  }
});