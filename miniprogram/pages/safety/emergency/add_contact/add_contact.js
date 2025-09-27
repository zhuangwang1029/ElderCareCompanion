// pages/safety/emergency/add_contact/add_contact.js
Page({
  data: {
    isEdit: false,
    contactId: null,
    contact: {
      name: '',
      relation: '',
      phone: ''
    },
    relationOptions: ['家人', '医生', '朋友', '邻居', '护工', '其他'],
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

  // 加载联系人数据
  loadContactData: function (id) {
    // 从本地存储获取联系人数据
    const contacts = wx.getStorageSync('emergencyContacts') || [];
    const contact = contacts.find(item => item.id == id);
    
    if (contact) {
      this.setData({
        contact: contact,
        selectedRelation: contact.relation
      });
    } else {
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

  // 表单验证函数 - 添加此函数
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

  // 取消按钮函数 - 添加此函数
  cancelEdit: function() {
    wx.navigateBack();
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
          type: 'updateEmergencyContact',
          contact: updatedContact,
          openid: openid
        },
        success: (res) => {
          console.log('更新联系人云函数返回:', res);
          if (res.result && res.result.success) {
            this.showSuccessAndNavigateBack('更新成功');
          } else {
            // 云函数失败，使用本地存储
            console.log('云函数失败，使用本地存储');
            this.updateLocalContact();
          }
        },
        fail: (err) => {
          console.error('更新联系人失败', err);
          // 云函数失败，使用本地存储
          this.updateLocalContact();
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
          type: 'addEmergencyContact',
          contact: newContact,
          openid: openid
        },
        success: (res) => {
          console.log('添加联系人云函数返回:', res);
          if (res.result && res.result.success) {
            this.showSuccessAndNavigateBack('添加成功');
          } else {
            // 云函数失败，使用本地存储
            console.log('云函数失败，使用本地存储');
            this.addLocalContact(newContact);
          }
        },
        fail: (err) => {
          console.error('添加联系人失败', err);
          // 云函数失败，使用本地存储
          this.addLocalContact(newContact);
        }
      });
    }
  },

  // 获取用户openid
  getOpenId: function() {
    const app = getApp();
    return app.globalData.openid || 'test_user_id';
  },

  // 更新本地联系人（备用方法）
  updateLocalContact: function() {
    let contacts = wx.getStorageSync('emergencyContacts') || [];
    const index = contacts.findIndex(item => item.id == this.data.contactId);
    
    if (index >= 0) {
      contacts[index] = {
        ...contacts[index],
        name: this.data.contact.name,
        relation: this.data.contact.relation,
        phone: this.data.contact.phone
      };
      
      wx.setStorageSync('emergencyContacts', contacts);
      this.showSuccessAndNavigateBack('更新成功(本地)');
    } else {
      wx.showToast({
        title: '更新失败，找不到联系人',
        icon: 'none'
      });
    }
  },

  // 添加本地联系人（备用方法）
  addLocalContact: function(newContact) {
    let contacts = wx.getStorageSync('emergencyContacts') || [];
    contacts.push(newContact);
    wx.setStorageSync('emergencyContacts', contacts);
    this.showSuccessAndNavigateBack('添加成功(本地)');
  },

  // 显示成功提示并返回
  showSuccessAndNavigateBack: function(message) {
    wx.showToast({
      title: message,
      icon: 'success'
    });
    
    // 延迟返回
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});