<template>
  <div class="student-audit-container">
    <div class="page-header">
      <h2>学员申请管理</h2>
      <p>查看并处理学员的教练申请请求</p>
    </div>

    <!-- 申请列表（适配新数据结构） -->
    <el-table
      v-if="!loading && applicationList.length > 0"
      :data="applicationList"
      border
      stripe
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="student.name" label="学员姓名" align="center"></el-table-column>
      <el-table-column label="学员性别" align="center">
        <template #default="scope">{{ scope.row.student.isMale ? '男' : '女' }}</template>
      </el-table-column>
      <el-table-column prop="student.age" label="学员年龄" align="center"></el-table-column>
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button size="mini" type="primary" @click="handleViewStudent(scope.row.student.id)">查看学员</el-button>
          <el-button size="mini" type="success" @click="handleReview(scope.row.relation.id, true)">通过</el-button>
          <el-button size="mini" type="danger" @click="handleReview(scope.row.relation.id, false)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else-if="!loading && applicationList.length === 0" class="empty">
      <el-empty description="暂无待处理的学员申请"></el-empty>
      <p class="empty-text">目前没有学员申请成为您的学员，耐心等待一下吧~</p>
    </div>

    <!-- 加载状态 -->
    <el-loading v-if="loading" target=".student-audit-container" text="加载中..."></el-loading>

    <!-- 学员详情弹窗（无需修改，已适配student对象结构） -->
    <el-dialog
      :visible.sync="showStudentDetail"
      title="学员详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-container">
        <div v-if="currentStudent" class="detail-info">
          <el-row :gutter="20">
            <el-col :span="6">
              <img 
                :src="currentStudent.avatar ? `http://localhost:8080/student-avatars/${currentStudent.avatar}` : '/default-avatar.gif'" 
                alt="学员头像" 
                class="student-avatar"
                @error="handleImgError"
              >
            </el-col>
            <el-col :span="18">
              <div class="detail-items">
                <div class="detail-item">
                  <span class="item-label">用户名</span>
                  <span class="item-value">{{ currentStudent.username }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">姓名</span>
                  <span class="item-value">{{ currentStudent.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">性别</span>
                  <span class="item-value">{{ currentStudent.isMale ? '男' : '女' }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">年龄</span>
                  <span class="item-value">{{ currentStudent.age }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">联系电话</span>
                  <span class="item-value">{{ currentStudent.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">邮箱</span>
                  <span class="item-value">{{ currentStudent.email }}</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <div v-else class="error">未获取到学员详情</div>
      </div>

      <div slot="footer">
        <el-button @click="showStudentDetail = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getStudentApplications, getStudentDetail, reviewStudentApplication } from '@/api/coach';
import { Message } from 'element-ui';
import { getToken } from '@/utils/auth';
import { mapGetters } from 'vuex';

export default {
  name: 'StudentApplicationAudit',
  computed: {
    ...mapGetters(['userId', 'role'])
  },
  data() {
    return {
      applicationList: [], // 现在每个元素包含relation和student对象
      loading: false,
      showStudentDetail: false,
      currentStudent: null,
      currentStudentId: null,
      detailLoading: false,
      token: ''
    };
  },
  created() {
    this.token = getToken();
    if (this.token && this.userId && this.role === 'coach') {
      this.fetchApplications();
    } else {
      Message.error('未获取到登录状态或权限不足，请重新登录');
    }
  },
  methods: {
    // 获取学员申请列表（适配新数据结构）
    async fetchApplications() {
      this.loading = true;
      try {
        const res = await getStudentApplications(this.userId);
        // 直接使用后端返回的结构，无需额外映射
        this.applicationList = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取申请列表失败');
        console.error('获取申请列表错误:', err);
      } finally {
        this.loading = false;
      }
    },

    // 查看学员详情（直接使用嵌套的student对象）
    handleViewStudent(studentId) {
      // 从列表中直接获取学员信息，减少一次接口请求
      const currentItem = this.applicationList.find(
        item => item.student.id === studentId
      );
      
      if (currentItem) {
        this.currentStudent = currentItem.student;
        this.showStudentDetail = true;
        this.detailLoading = false;
      } else {
        //  fallback：如果本地没找到则调用接口获取
        this.currentStudentId = studentId;
        this.detailLoading = true;
        this.currentStudent = null;
        this.showStudentDetail = true;

        getStudentDetail(studentId).then(res => {
          this.currentStudent = res.data;
        }).catch(err => {
          Message.error(err.message || '获取学员详情失败');
        }).finally(() => {
          this.detailLoading = false;
        });
      }
    },

    // 处理申请（使用relation中的id）
    async handleReview(applicationId, isAccepted) {
      this.$confirm(
        `确定要${isAccepted ? '通过' : '拒绝'}该学员的申请吗？`, 
        '操作确认', 
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: isAccepted ? 'success' : 'warning'
        }
      ).then(async () => {
        try {
          await reviewStudentApplication(applicationId, isAccepted);
          Message.success(`已${isAccepted ? '通过' : '拒绝'}该申请`);
          
          // 从列表中移除已处理的申请
          this.applicationList = this.applicationList.filter(
            item => item.relation.id !== applicationId
          );
        } catch (err) {
          Message.error(err.message || '处理申请失败');
          console.error('处理申请错误:', err);
        }
      }).catch(() => {
        Message.info('已取消操作');
      });
    },

    handleImgError(e) {
      e.target.src = '/default-avatar.png';
    },

    formatDate(timeStamp) {
      if (!timeStamp) return '';
      const date = new Date(timeStamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style lang="scss" scoped>
/* 样式部分无需修改 */
.student-audit-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
  }
}

.empty {
  margin-top: 40px;
  text-align: center;

  .empty-text {
    margin-top: 15px;
    color: #666;
    font-size: 14px;
  }
}

.detail-container {
  padding: 10px 0;
}

.detail-info {
  margin-top: 10px;
}

.student-avatar {
  width: 100%;
  height: 200px;
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
  display: flex;
  align-items: center;
}

.item-label {
  flex-shrink: 0;
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
  flex-grow: 1;
}

.error {
  text-align: center;
  padding: 40px;
  color: #f5222d;
}
</style>