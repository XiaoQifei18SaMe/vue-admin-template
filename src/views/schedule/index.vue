<template>
  <div class="schedule-management">
    <div class="page-header">
      <h2>课表管理</h2>
      <el-button 
        type="primary" 
        @click="handleCreateDefault"
      >
        <i class="el-icon-plus"></i> 使用默认课表模板
      </el-button>
    </div>

    <!-- 课表编辑区域 -->
    <el-card v-if="scheduleVisible">
      <el-form ref="scheduleForm" :model="scheduleForm" label-width="100px">
        <el-form-item label="课表名称">
          <el-input v-model="scheduleForm.name"></el-input>
        </el-form-item>
        
        <!-- 课表内容 -->
        <el-table
          :data="scheduleForm.items"
          border
          style="width: 100%; margin: 20px 0;"
        >
          <el-table-column label="星期" width="100">
            <template slot-scope="scope">
              <el-select v-model="scope.row.dayOfWeek" placeholder="选择星期">
                <el-option label="周一" value="1"></el-option>
                <el-option label="周二" value="2"></el-option>
                <el-option label="周三" value="3"></el-option>
                <el-option label="周四" value="4"></el-option>
                <el-option label="周五" value="5"></el-option>
                <el-option label="周六" value="6"></el-option>
                <el-option label="周日" value="7"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="开始时间">
            <template slot-scope="scope">
              <el-time-picker
                v-model="scope.row.startTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择开始时间"
              ></el-time-picker>
            </template>
          </el-table-column>
          <el-table-column label="结束时间">
            <template slot-scope="scope">
              <el-time-picker
                v-model="scope.row.endTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择结束时间"
              ></el-time-picker>
            </template>
          </el-table-column>
          <el-table-column label="描述">
            <template slot-scope="scope">
              <el-input 
                v-model="scope.row.description" 
                placeholder="请输入描述"
                size="small"
              ></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template slot-scope="scope">
              <el-button
                type="danger"
                size="mini"
                @click="handleDeleteRow(scope.$index)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-button 
          type="primary" 
          size="mini" 
          @click="handleAddRow"
          style="margin-bottom: 20px;"
        >
          <i class="el-icon-plus"></i> 添加行
        </el-button>
        
        <!-- 应用校区选择 -->
        <el-form-item label="应用校区">
          <el-checkbox v-model="selectAllCampus" @change="handleSelectAll">
            全选
          </el-checkbox>
          <el-select
            v-model="selectedCampusIds"
            multiple
            placeholder="选择校区"
            style="width: 100%; margin-top: 10px;"
            :disabled="selectAllCampus"
          >
            <el-option
              v-for="campus in availableCampuses"
              :key="campus.id"
              :label="campus.schoolname"  
              :value="campus.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div style="text-align: right; margin-top: 20px;">
        <el-button @click="scheduleVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApplySchedule">应用课表</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { 
  getDefaultSchedule, 
  getAvailableSchools, 
  checkSchoolHasSchedule, 
  saveScheduleToSchool 
} from '@/api/schedule'
import { getToken } from '@/utils/auth'  // 从auth工具获取token

export default {
  name: 'ScheduleManagement',
  data() {
    return {
      scheduleVisible: false,
      scheduleForm: {
        name: '',
        items: []
      },
      availableCampuses: [],
      selectedCampusIds: [],
      selectAllCampus: false,
      role: '',
      isSuper: false,  // 是否为超级管理员
      // 星期映射表
      weekDays: {
        '1': '周一',
        '2': '周二',
        '3': '周三',
        '4': '周四',
        '5': '周五',
        '6': '周六',
        '7': '周日'
      }
    }
  },
  created() {
    this.role = this.$store.getters.role
    console.log("role " + this.role)
    this.isSuper = this.role === 'super_admin'  // 区分角色
    this.fetchCampuses()  // 加载可选校区
  },
  methods: {
    // 获取可选校区列表（区分超级管理员和普通管理员）
    async fetchCampuses() {
      try {
        const token = getToken()  // 获取登录token
        const response = await getAvailableSchools(this.isSuper, token)
        if (response.code === 20000) {
          this.availableCampuses = response.data
        }
      } catch (error) {
        this.$message.error('获取校区列表失败')
      }
    },
    
    // 创建默认课表（从后端获取模板）
    async handleCreateDefault() {
      try {
        const response = await getDefaultSchedule(this.isSuper)
        if (response.code === 20000) {
          // 处理后端返回的数据，确保description存在
          const formattedItems = response.data.map(item => ({
            ...item,
            // 确保dayOfWeek为字符串类型，与select组件值类型一致
            dayOfWeek: String(item.dayOfWeek),
            // 确保description有默认值
            description: item.description || '默认训练时间'
          }))
          
          this.scheduleForm = {
            name: '默认课表',
            items: formattedItems  // 使用处理后的默认模板
          }
          this.scheduleVisible = true
          this.selectedCampusIds = []
          this.selectAllCampus = false
        }
      } catch (error) {
        this.$message.error('获取默认课表失败')
      }
    },
    
    // 添加行
    handleAddRow() {
      this.scheduleForm.items.push({
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '10:00',
        description: '默认训练时间'  // 新增行默认描述
      })
    },
    
    // 删除行
    handleDeleteRow(index) {
      this.scheduleForm.items.splice(index, 1)
    },
    
    // 全选/取消全选
    handleSelectAll(val) {
      if (val) {
        this.selectedCampusIds = this.availableCampuses.map(campus => campus.id)
      } else {
        this.selectedCampusIds = []
      }
    },
    
    // 应用课表到校区（串行检查并询问）
    async handleApplySchedule() {
      if (!this.selectedCampusIds.length) {
        this.$message.warning('请选择要应用的校区')
        return
      }
      
      // 串行处理每个校区
      for (const schoolId of this.selectedCampusIds) {
        try {
          // 1. 检查校区是否已有课表
          const checkResult = await checkSchoolHasSchedule(schoolId, this.isSuper)
          if (checkResult.code !== 20000) {
            this.$message.error(`检查校区[${schoolId}]课表状态失败`)
            continue
          }
          
          // 2. 已有课表则询问是否覆盖
          if (checkResult.data) {
            const campus = this.availableCampuses.find(c => c.id === schoolId)
            const confirmResult = await this.$confirm(
              `校区【${campus.schoolname}】已有课表，是否覆盖？`,
              '确认覆盖',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            ).catch(() => false)
            
            if (!confirmResult) {
              continue  // 用户取消，跳过该校区
            }
          }
          
          // 3. 保存课表到该校区
          const saveResult = await saveScheduleToSchool(
            schoolId, 
            this.scheduleForm.items, 
            this.isSuper
          )
          
          if (saveResult.code === 20000) {
            this.$message.success(`校区【${this.getCampusName(schoolId)}】课表应用成功`)
          } else {
            this.$message.error(`校区【${this.getCampusName(schoolId)}】应用失败：${saveResult.message}`)
          }
        } catch (error) {
          this.$message.error(`处理校区[${schoolId}]失败：${error.message}`)
        }
      }
      
      this.scheduleVisible = false
    },
    
    // 辅助方法：通过ID获取校区名称
    getCampusName(schoolId) {
      const campus = this.availableCampuses.find(c => c.id === schoolId)
      return campus ? campus.schoolname : '未知校区'
    }
  }
}
</script>

<style scoped>
.schedule-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>