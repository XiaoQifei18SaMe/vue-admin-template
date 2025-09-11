<template>
  <div class="audit-container">
    <div class="page-header">
      <h2>教练审核管理</h2>
    </div>

    <!-- 加载状态 -->
    <el-table
      v-if="!loading && coachList.length > 0"
      :data="coachList"
      border
      stripe
      style="width: 100%; margin-top: 20px;"
      >
    
      <el-table-column
        prop="id"
        label="ID"
        width="80"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="name"
        label="姓名"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="gender"
        label="性别"
        align="center"
      >
        <template slot-scope="scope">{{ scope.row.male ? '男' : '女' }}</template>
      </el-table-column>
      <el-table-column
        prop="age"
        label="年龄"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="schoolId"
        label="所属校区ID"
        align="center"
      ></el-table-column>
      <el-table-column
        label="操作"
        align="center"
        width="120"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            @click="handleViewDetail(scope.row.id)"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else-if="!loading && coachList.length === 0" class="empty">暂无待审核教练</div>

    <!-- 详情弹窗 -->
    <el-dialog
      :visible.sync="showDetail"
      title="教练详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-container">
        <div v-if="currentCoach" class="detail-info">
          <el-row :gutter="20">
            <el-col :span="6">
              <img 
                :src="currentCoach ? `http://localhost:8080/coach-photos/${currentCoach.photoPath}` : '/default-coach.png'" 
                alt="教练照片" 
                class="coach-photo"
                @error="handleImgError"
              >
            </el-col>
            <el-col :span="18">
              <div class="detail-items">
                <div class="detail-item">
                  <span class="item-label">姓名</span>
                  <span class="item-value">{{ currentCoach.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">性别</span>
                  <span class="item-value">{{ currentCoach.male ? '男' : '女' }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">年龄</span>
                  <span class="item-value">{{ currentCoach.age }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">联系电话</span>
                  <span class="item-value">{{ currentCoach.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">邮箱</span>
                  <span class="item-value">{{ currentCoach.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">所属校区</span>
                  <span class="item-value">{{ currentCoach.schoolId }}</span>
                </div>
                <div class="detail-item description-item">
                  <span class="item-label">个人描述</span>
                  <div class="description-content">
                    {{ currentCoach.description || '无' }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <div v-else class="error">未获取到教练详情</div>
      </div>

      <div slot="footer">
        <el-button @click="showDetail = false">取消</el-button>
        <el-button type="danger" @click="handleAudit(false)">不通过</el-button>
        <el-button type="primary" @click="handleAudit(true)">通过</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUncertifiedCoaches, getCoachDetail, certifyCoach } from '@/api/admin';
import { Message } from 'element-ui';
import { getToken } from '@/utils/auth'

export default {
  name: 'AdminCoachAudit',
  data() {
    return {
      coachList: [],
      loading: false,
      errorMsg: '',
      showDetail: false,
      currentCoachId: null,
      currentCoach: null,
      detailLoading: false,
      token: '' // 保存token的变量
    };
  },
  created() {
    console.log('页面已创建，开始获取教练列表')
    this.token = getToken(); // 保存token到实例变量
    if (this.token) {
      this.fetchCoachList(); // 不需要重复传递token
    } else {
      Message.error('未获取到登录状态，请重新登录');
    }
  },
  methods: {
    async fetchCoachList() {
      this.loading = true;
      try {
        // 确保请求时正确传递token
        const res = await getUncertifiedCoaches(this.token);
        this.coachList = res.data || [];
      } catch (err) {
        this.errorMsg = err.message || '获取教练列表失败';
        Message.error(this.errorMsg);
        // 打印详细错误信息以便调试
        console.error('获取教练列表错误:', err);
      } finally {
        this.loading = false;
      }
    },

    async handleViewDetail(coachId) {
      this.currentCoachId = coachId;
      this.detailLoading = true;
      this.currentCoach = null;
      this.showDetail = true;

      try {
        const res = await getCoachDetail(coachId);
        this.currentCoach = res.data;
      } catch (err) {
        Message.error(err.message || '获取教练详情失败');
      } finally {
        this.detailLoading = false;
      }
    },

    async handleAudit(isAccepted) {
      if (!this.currentCoachId) {
        Message.warning('未获取到教练ID');
        return;
      }

      try {
        // 审核操作
        await certifyCoach(this.currentCoachId, isAccepted);
        Message.success(isAccepted ? '审核通过' : '已拒绝');
        
        // 关闭弹窗
        this.showDetail = false;
        
        // 刷新列表前先从本地列表中移除已审核的教练，提升用户体验
        this.coachList = this.coachList.filter(item => item.id !== this.currentCoachId);
        
        // 重新获取最新列表，确保数据准确性
        setTimeout(() => {
          this.fetchCoachList();
        }, 300);
        
      } catch (err) {
        Message.error(err.message || '审核操作失败');
        console.error('审核操作错误:', err);
      }
    },

    handleImgError(e) {
      e.target.src = '/default-coach.png';
    }
  }
};
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.audit-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.detail-container {
  padding: 10px 0;
}

.detail-info {
  margin-top: 10px;
}

.coach-photo {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  background-color: rgba(240, 247, 255, 0.8);
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start; /* 确保内容顶部对齐 */
  
  &:hover {
    background-color: rgba(224, 236, 255, 0.9);
    transform: translateX(4px);
  }
}

.item-label {
  flex-shrink: 0; /* 防止标签被压缩 */
  width: 90px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid rgba(24, 144, 255, 0.2);
}

.item-value {
  color: #333;
  line-height: 1.5;
}

// 个人描述特殊样式
.description-item {
  align-items: flex-start; /* 顶部对齐 */
  padding-bottom: 16px; /* 增加底部内边距 */
}

.description-content {
  color: #333;
  line-height: 1.6;
  flex-grow: 1; /* 占据剩余空间 */
  word-break: break-word; /* 自动换行 */
  padding-top: 2px; /* 微调对齐 */
}

.error {
  text-align: center;
  padding: 40px;
  color: #f5222d;
}
</style>
    