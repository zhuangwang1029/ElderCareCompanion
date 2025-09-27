const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 创建药物集合
const createMedicineCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("medications");
    return {
      success: true,
      data: "创建药物集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "药物集合已存在"
    };
  }
};

// 获取用户的药物列表
const getMedicationList = async (event) => {
  try {
    const { openid } = event;
    // 获取数据，按照用户ID过滤
    const medications = await db.collection("medications")
      .where({
        _openid: openid
      })
      .get();
    
    return {
      success: true,
      data: medications.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取药物详情
const getMedicationDetail = async (event) => {
  try {
    const { medicationId, openid } = event;
    
    // 根据ID查询药物 - 修改查询方式
    let medication;
    
    try {
      // 尝试使用_id查询
      medication = await db.collection("medications").doc(medicationId).get();
    } catch (err) {
      // 如果失败，尝试使用自定义id查询
      medication = await db.collection("medications")
        .where({
          id: medicationId,
          _openid: openid
        })
        .get();
    }
    
    // 如果是doc()方法，数据在data中
    // 如果是where()方法，数据在data.data数组中
    if (medication.data) {
      if (Array.isArray(medication.data.data)) {
        // where查询结果
        if (medication.data.data.length > 0) {
          return {
            success: true,
            data: medication.data.data[0]
          };
        }
      } else {
        // doc查询结果
        return {
          success: true,
          data: medication.data
        };
      }
    }
    
    // 没有找到数据
    return {
      success: false,
      errMsg: "找不到药物信息"
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 添加药物
const addMedication = async (event) => {
  try {
    const { medication, openid } = event;
    // 添加用户ID字段
    medication._openid = openid;
    // 生成唯一ID
    medication.id = `med_${Date.now()}_${openid}`;
    
    // 插入数据库
    const result = await db.collection("medications").add({
      data: medication
    });
    
    return {
      success: true,
      data: {
        id: medication.id,
        _id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 更新药物
const updateMedication = async (event) => {
  try {
    const { medication, openid } = event;
    
    // 更新数据库 - 根据id查询并更新
    let updateQuery;
    
    if (medication._id) {
      // 如果有_id，使用document id更新
      updateQuery = db.collection("medications").doc(medication._id);
    } else {
      // 否则使用自定义id更新
      updateQuery = db.collection("medications").where({
        id: medication.id,
        _openid: openid
      });
    }
    
    // 执行更新
    await updateQuery.update({
      data: {
        name: medication.name,
        dosageValue: medication.dosageValue,
        dosageUnit: medication.dosageUnit,
        instruction: medication.instruction,
        timeSelected: medication.timeSelected,
        customTimes: medication.customTimes
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 更新药物服用状态
const updateMedicationStatus = async (event) => {
  try {
    const { medicationId, status, openid } = event;
    
    // 更新数据库 - 根据id查询并更新
    let updateQuery;
    
    if (medicationId.startsWith('med_')) {
      // 使用自定义id更新
      updateQuery = db.collection("medications").where({
        id: medicationId,
        _openid: openid
      });
    } else {
      // 使用document id更新
      updateQuery = db.collection("medications").doc(medicationId);
    }
    
    // 执行更新
    await updateQuery.update({
      data: {
        status: status
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 删除药物
const deleteMedication = async (event) => {
  try {
    const { medicationId, openid } = event;
    
    // 根据ID删除药物
    await db.collection("medications")
      .where({
        id: medicationId,
        _openid: openid
      })
      .remove();
    
    return {
      success: true,
      data: "删除药物成功"
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 创建健康日记集合
const createDiaryCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("health_diaries");
    return {
      success: true,
      data: "创建健康日记集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "健康日记集合已存在"
    };
  }
};

// 添加健康日记
const addHealthDiary = async (event) => {
  try {
    const { diary, openid } = event;
    // 添加用户ID字段
    diary._openid = openid;
    // 生成唯一ID
    diary.id = `diary_${diary.date}_${openid}`;
    
    // 插入数据库
    const result = await db.collection("health_diaries").add({
      data: diary
    });
    
    return {
      success: true,
      data: {
        id: diary.id,
        _id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 更新健康日记
const updateHealthDiary = async (event) => {
  try {
    const { diary, openid } = event;
    
    // 生成日记ID
    const diaryId = `diary_${diary.date}_${openid}`;
    
    // 先查询是否存在该记录
    const existingDiary = await db.collection("health_diaries")
      .where({
        id: diaryId,
        _openid: openid
      })
      .get();
    
    if (existingDiary.data && existingDiary.data.length > 0) {
      // 更新已有记录
      await db.collection("health_diaries")
        .where({
          id: diaryId,
          _openid: openid
        })
        .update({
          data: diary
        });
    } else {
      // 添加新记录
      diary._openid = openid;
      diary.id = diaryId;
      await db.collection("health_diaries").add({
        data: diary
      });
    }
    
    return {
      success: true,
      data: "更新健康日记成功"
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取健康日记详情
const getHealthDiary = async (event) => {
  try {
    const { date, openid } = event;
    
    // 生成日记ID
    const diaryId = `diary_${date}_${openid}`;
    
    // 查询记录
    const diary = await db.collection("health_diaries")
      .where({
        id: diaryId,
        _openid: openid
      })
      .get();
    
    if (diary.data && diary.data.length > 0) {
      return {
        success: true,
        data: diary.data[0]
      };
    } else {
      return {
        success: false,
        errMsg: "找不到该日期的健康日记"
      };
    }
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取某月的健康日记列表
const getHealthDiaryList = async (event) => {
  try {
    const { openid, year, month } = event;
    
    // 构建月份的开始和结束日期
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    
    // 查询该月的所有记录
    const diaries = await db.collection("health_diaries")
      .where({
        _openid: openid,
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      })
      .get();
    
    return {
      success: true,
      data: diaries.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 删除健康日记
const deleteHealthDiary = async (event) => {
  try {
    const { date, openid } = event;
    
    if (!date || !openid) {
      console.error('缺少必要参数', event);
      return {
        success: false,
        errMsg: "缺少必要参数"
      };
    }
    
    console.log('开始删除健康日记，参数:', { date, openid });
    
    const diaryId = `diary_${date}_${openid}`;
    console.log('生成的diaryId:', diaryId);
    
    // 先查询是否存在该记录
    const diaryRecord = await db.collection("health_diaries")
      .where({
        id: diaryId,
        _openid: openid
      })
      .get();
    
    console.log('查询结果:', diaryRecord);
    
    if (!diaryRecord.data || diaryRecord.data.length === 0) {
      console.error('找不到要删除的记录');
      return {
        success: false,
        errMsg: "找不到要删除的记录"
      };
    }
    
    // 删除健康日记记录
    const deleteResult = await db.collection("health_diaries")
      .where({
        id: diaryId,
        _openid: openid
      })
      .remove();
    
    console.log('删除结果:', deleteResult);
    
    return {
      success: true,
      data: "删除健康日记成功"
    };
  } catch (e) {
    console.error('删除健康日记出错:', e);
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取健康趋势数据
const getHealthTrends = async (event) => {
  try {
    const { openid, days = 30 } = event;
    
    // 计算过去N天的日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
    const endDateStr = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
    
    // 查询过去N天的健康日记记录
    const diaries = await db.collection("health_diaries")
      .where({
        _openid: openid,
        date: db.command.gte(startDateStr).and(db.command.lte(endDateStr))
      })
      .orderBy('date', 'asc')
      .get();
    
    return {
      success: true,
      data: diaries.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 创建紧急联系人集合
const createEmergencyContactsCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("emergencyContacts");
    return {
      success: true,
      data: "创建紧急联系人集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "紧急联系人集合已存在"
    };
  }
};

// 获取紧急联系人列表
const getEmergencyContacts = async (event) => {
  try {
    const { openid } = event;
    // 获取数据，按照用户ID过滤
    const contacts = await db.collection("emergencyContacts")
      .where({
        _openid: openid
      })
      .get();
    
    return {
      success: true,
      data: contacts.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 添加紧急联系人
const addEmergencyContact = async (event) => {
  try {
    const { contact, openid } = event;
    // 添加用户ID字段
    contact._openid = openid;
    
    // 插入数据库
    const result = await db.collection("emergencyContacts").add({
      data: contact
    });
    
    return {
      success: true,
      data: {
        id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 更新紧急联系人
const updateEmergencyContact = async (event) => {
  try {
    const { contact, openid } = event;
    
    // 更新数据库
    await db.collection("emergencyContacts").doc(contact._id).update({
      data: {
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 删除紧急联系人
const deleteEmergencyContact = async (event) => {
  try {
    const { contactId } = event;
    
    await db.collection("emergencyContacts").doc(contactId).remove();
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 创建紧急位置集合
const createEmergencyLocationCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("emergencyLocations");
    return {
      success: true,
      data: "创建紧急位置集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "紧急位置集合已存在"
    };
  }
};

// 保存紧急位置
const saveEmergencyLocation = async (event) => {
  try {
    const { location, openid } = event;
    // 添加用户ID字段和时间戳
    location._openid = openid;
    location.timestamp = new Date().getTime();
    
    // 插入数据库
    const result = await db.collection("emergencyLocations").add({
      data: location
    });
    
    return {
      success: true,
      data: {
        id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取用户的紧急位置历史
const getEmergencyLocations = async (event) => {
  try {
    const { openid, limit = 10 } = event;
    // 获取数据，按照用户ID过滤
    const locations = await db.collection("emergencyLocations")
      .where({
        _openid: openid
      })
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: locations.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 创建通话联系人集合
const createCallContactsCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("callContacts");
    return {
      success: true,
      data: "创建通话联系人集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "通话联系人集合已存在"
    };
  }
};

// 获取通话联系人列表
const getCallContacts = async (event) => {
  try {
    const { openid } = event;
    // 获取数据，按照用户ID过滤
    const contacts = await db.collection("callContacts")
      .where({
        _openid: openid
      })
      .get();
    
    return {
      success: true,
      data: contacts.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 添加通话联系人
const addCallContact = async (event) => {
  try {
    const { contact, openid } = event;
    // 添加用户ID字段
    contact._openid = openid;
    
    // 插入数据库
    const result = await db.collection("callContacts").add({
      data: contact
    });
    
    return {
      success: true,
      data: {
        id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 更新通话联系人
const updateCallContact = async (event) => {
  try {
    const { contact, openid } = event;
    
    // 更新数据库
    await db.collection("callContacts").doc(contact._id).update({
      data: {
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 删除通话联系人
const deleteCallContact = async (event) => {
  try {
    const { contactId } = event;
    
    await db.collection("callContacts").doc(contactId).remove();
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 创建通话记录集合
const createCallHistoryCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("callHistory");
    return {
      success: true,
      data: "创建通话记录集合成功"
    };
  } catch (e) {
    // 集合可能已存在
    return {
      success: true,
      data: "通话记录集合已存在"
    };
  }
};

// 添加通话记录
const addCallRecord = async (event) => {
  try {
    const { record, openid } = event;
    // 添加用户ID字段
    record._openid = openid;
    
    // 插入数据库
    const result = await db.collection("callHistory").add({
      data: record
    });
    
    return {
      success: true,
      data: {
        id: result._id
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 获取通话记录列表
const getCallHistory = async (event) => {
  try {
    const { openid, limit = 20 } = event;
    // 获取数据，按照用户ID过滤
    const history = await db.collection("callHistory")
      .where({
        _openid: openid
      })
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: history.data
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 清空通话记录
const clearCallHistory = async (event) => {
  try {
    const { openid } = event;
    
    // 查询该用户的所有通话记录
    const records = await db.collection("callHistory")
      .where({
        _openid: openid
      })
      .get();
    
    // 批量删除记录
    for (let record of records.data) {
      await db.collection("callHistory").doc(record._id).remove();
    }
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e
    };
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("收到请求，类型:", event.type, "参数:", event);
  
  try {
    switch (event.type) {
      case "getOpenId":
        return await getOpenId();
      case "getMiniProgramCode":
        return await getMiniProgramCode();
      case "createCollection":
        return await createCollection();
      case "selectRecord":
        return await selectRecord();
      case "updateRecord":
        return await updateRecord(event);
      case "insertRecord":
        return await insertRecord(event);
      case "deleteRecord":
        return await deleteRecord(event);
      // 以下是药物相关功能
      case "createMedicineCollection":
        return await createMedicineCollection();
      case "getMedicationList":
        return await getMedicationList(event);
      case "getMedicationDetail":
        return await getMedicationDetail(event);
      case "addMedication":
        return await addMedication(event);
      case "updateMedication":
        return await updateMedication(event);
      case "updateMedicationStatus":
        return await updateMedicationStatus(event);
      case "deleteMedication":
        return await deleteMedication(event);
      // 以下是健康日记相关功能
      case "createDiaryCollection":
        return await createDiaryCollection();
      case "addHealthDiary":
        return await addHealthDiary(event);
      case "updateHealthDiary":
        return await updateHealthDiary(event);
      case "getHealthDiary":
        return await getHealthDiary(event);
      case "getHealthDiaryList":
        return await getHealthDiaryList(event);
      case "getHealthTrends":
        return await getHealthTrends(event);
      case "deleteHealthDiary":
        console.log("开始执行删除健康日记");
        return await deleteHealthDiary(event);
      // 以下是紧急联系人相关功能
      case "createEmergencyContactsCollection":
        return await createEmergencyContactsCollection();
      case "getEmergencyContacts":
        return await getEmergencyContacts(event);
      case "addEmergencyContact":
        return await addEmergencyContact(event);
      case "updateEmergencyContact":
        return await updateEmergencyContact(event);
      case "deleteEmergencyContact":
        return await deleteEmergencyContact(event);
      // 以下是紧急位置存储相关功能
      case "createEmergencyLocationCollection":
        return await createEmergencyLocationCollection();
      case "saveEmergencyLocation":
        return await saveEmergencyLocation(event);
      case "getEmergencyLocations":
        return await getEmergencyLocations(event);
      // 以下是通话联系人相关功能
      case "createCallContactsCollection":
        return await createCallContactsCollection();
      case "getCallContacts":
        return await getCallContacts(event);
      case "addCallContact":
        return await addCallContact(event);
      case "updateCallContact":
        return await updateCallContact(event);
      case "deleteCallContact":
        return await deleteCallContact(event);
      // 以下是通话记录相关功能
      case "createCallHistoryCollection":
        return await createCallHistoryCollection();
      case "addCallRecord":
        return await addCallRecord(event);
      case "getCallHistory":
        return await getCallHistory(event);
      case "clearCallHistory":
        return await clearCallHistory(event);
      default:
        console.error("未知的操作类型:", event.type);
        return {
          success: false,
          errMsg: "未知的操作类型"
        };
    }
  } catch (error) {
    console.error("云函数执行出错:", error);
    return {
      success: false,
      errMsg: error
    };
  }
};