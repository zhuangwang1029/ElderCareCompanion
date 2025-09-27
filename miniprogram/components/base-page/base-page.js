Component({
  options: {
    addGlobalClass: true
  },
  
  properties: {
    // 页面标题
    pageTitle: String,
  },
  
  data: {
    darkMode: false,
    fontSize: '16px'
  },
  
  lifetimes: {
    attached: function() {
      // 获取全局设置
      const app = getApp();
      this.applySettings(app.globalData.userSettings);
      
      // 注册回调，以接收设置变化
      app.pageSettingsCallback = this.applySettings.bind(this);
    },
    
    detached: function() {
      const app = getApp();
      if (app.pageSettingsCallback === this.applySettings.bind(this)) {
        app.pageSettingsCallback = null;
      }
    }
  },
  
  methods: {
    applySettings: function(settings) {
      if (!settings) return;
      
      this.setData({
        darkMode: settings.darkMode || false,
        fontSize: settings.fontSize || 'medium'
      });
    }
  }
});