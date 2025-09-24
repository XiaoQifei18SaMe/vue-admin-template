// @/utils/device.js
/**
 * 生成UUID v4（通用唯一识别码，确保全球唯一性）
 * 无需依赖第三方库，原生JS实现
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * 获取设备唯一标识deviceId
   * 逻辑：优先读localStorage，无则生成新UUID并存储
   */
  export function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId'); // 从本地存储读取
    
    // 若本地无deviceId，生成新的并存储
    if (!deviceId) {
      deviceId = generateUUID();
      // 存入localStorage，持久化（清除浏览器数据才会丢失）
      localStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  }