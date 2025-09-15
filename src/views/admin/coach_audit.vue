<template>
  <div class="audit-container">
    <div class="page-header">
      <h2>教练审核管理</h2>
      <div class="role-indicator" v-if="role === 'super_admin'">
        <el-tag type="warning">超级管理员模式</el-tag>
      </div>
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
                  <span class="item-label">个人简介</span>
                  <div class="description-content">
                    {{ currentCoach.description || '无' }}
                  </div>
                </div>

                <div v-if="showDetail" class="detail-item">
                  <span class="item-label">教练等级</span>
                  <el-select 
                    v-model="selectedLevel" 
                    placeholder="请选择教练等级"
                    class="level-select"
                  >
                    <el-option label="初级教练员" value="10"></el-option>
                    <el-option label="中级教练员" value="100"></el-option>
                    <el-option label="高级教练员" value="1000"></el-option>
                  </el-select>
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
// 导入API，区分管理员和超级管理员接口
import { getUncertifiedCoaches, getCoachDetail, certifyCoach } from '@/api/admin';
import { getAllUncertifiedCoaches, getSuperCoachDetail, superCertifyCoach } from '@/api/super_admin';
import { Message } from 'element-ui';
import { getToken } from '@/utils/auth';
import { mapGetters } from 'vuex'; // 导入vuex的辅助函数

export default {
  name: 'CoachAudit', // 修改组件名称，使其更通用
  computed: {
    ...mapGetters(['role']) // 从vuex获取用户角色
  },
  data() {
    return {
      coachList: [],
      loading: false,
      errorMsg: '',
      showDetail: false,
      currentCoachId: null,
      currentCoach: null,
      detailLoading: false,
      token: '',
      selectedLevel: null
    };
  },
  created() {
    console.log('页面已创建，用户角色:', this.role);
    this.token = getToken();
    if (this.token) {
      this.fetchCoachList();
    } else {
      Message.error('未获取到登录状态，请重新登录');
    }
  },
  methods: {
    async fetchCoachList() {
      this.loading = true;
      try {
        let res;
        // 根据用户角色选择不同的API
        if (this.role === 'super_admin') {
          res = await getAllUncertifiedCoaches();
        } else {
          res = await getUncertifiedCoaches(this.token);
        }
        this.coachList = res.data || [];
      } catch (err) {
        this.errorMsg = err.message || '获取教练列表失败';
        Message.error(this.errorMsg);
        console.error('获取教练列表错误:', err);
      } finally {
        this.loading = false;
      }
    },

    async handleViewDetail(coachId) {
      this.currentCoachId = coachId;
      this.detailLoading = true;
      this.currentCoach = null;
      this.selectedLevel = null;
      this.showDetail = true;

      try {
        let res;
        // 根据用户角色选择不同的API
        if (this.role === 'super_admin') {
          res = await getSuperCoachDetail(coachId);
        } else {
          res = await getCoachDetail(coachId);
        }
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
      
      // 如果是通过审核但未选择等级，提示用户选择
      if (isAccepted && !this.selectedLevel) {
        Message.warning('请选择教练等级');
        return;
      }

      try {
        // 根据用户角色选择不同的API
        if (this.role === 'super_admin') {
          await superCertifyCoach(
            this.currentCoachId, 
            isAccepted, 
            isAccepted ? Number(this.selectedLevel) : 0
          );
        } else {
          await certifyCoach(
            this.currentCoachId, 
            isAccepted, 
            isAccepted ? Number(this.selectedLevel) : 0
          );
        }
        
        this.$message.success("审核操作成功");
        this.showDetail = false;
        
        // 本地移除已审核教练
        this.coachList = this.coachList.filter(item => item.id !== this.currentCoachId);
        
        // 刷新列表
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
/* 原有样式保持不变，新增角色标识样式 */
.audit-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.role-indicator {
  margin-top: 5px;
}

/* 其他样式保持不变 */
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
  align-items: flex-start;
  
  &:hover {
    background-color: rgba(224, 236, 255, 0.9);
    transform: translateX(4px);
  }
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
}

.description-item {
  align-items: flex-start;
  padding-bottom: 16px;
}

.description-content {
  color: #333;
  line-height: 1.6;
  flex-grow: 1;
  word-break: break-word;
  padding-top: 2px;
}

.error {
  text-align: center;
  padding: 40px;
  color: #f5222d;
}

.level-select {
  width: 200px;
  margin-top: 4px;
}
</style>
    