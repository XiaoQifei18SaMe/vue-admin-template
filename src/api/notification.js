// src/api/notification.js
import request from '@/utils/request'

/**
 * 获取未读通知
 * @param {number} userId - 用户ID
 * @param {string} userType - 用户类型(STUDENT/COACH)
 */
export function getUnreadNotifications(userId, userType) {
  return request({
    url: '/notifications/unread',
    method: 'get',
    params: { userId, userType }
  })
}

/**
 * 标记通知为已读
 * @param {number} notificationId - 通知ID
 */
export function markNotificationAsRead(notificationId) {
  return request({
    url: '/notifications/mark-read',
    method: 'post',
    params: { notificationId }
  })
}