<template>
  <div class="coach-management">
    <div class="page-header">
      <h2>教练管理</h2>
      <p>管理所有校区的已认证教练信息</p>
    </div>

    <el-card>
      <div class="search-bar">
        <!-- 搜索区域保持不变 -->
        <el-input
          v-model="searchParams.name"
          placeholder="请输入教练姓名"
          style="width: 200px"
          clearable
        ></el-input>
        <el-select
          v-model="searchParams.level"
          placeholder="选择教练等级"
          style="width: 150px; margin-left: 10px"
          clearable
        >
          <el-option label="初级教练" value="10"></el-option>
          <el-option label="中级教练" value="100"></el-option>
          <el-option label="高级教练" value="1000"></el-option>
        </el-select>
        <el-select
          v-model="searchParams.schoolId"
          placeholder="选择校区"
          style="width: 200px; margin-left: 10px"
          clearable
        >
          <el-option
            v-for="school in schoolList"
            :key="school.id"
            :label="school.schoolname"
            :value="school.id"
          ></el-option>
        </el-select>
        <el-button
          type="primary"
          @click="handleSearch"
          style="margin-left: 10px"
        >
          搜索
        </el-button>
        <el-button
          @click="resetSearch"
          style="margin-left: 10px"
        >
          重置
        </el-button>
      </div>

      <el-table
        :data="coachList"
        border
        stripe
        :loading="loading"
        style="width: 100%; margin-top: 15px"
      >
        <!-- 表格列保持不变 -->
        <el-table-column prop="id" label="教练ID" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
        <el-table-column prop="isMale" label="性别" width="80" align="center">
          <template #default="scope">{{ scope.row.isMale ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center"></el-table-column>
        <el-table-column prop="level" label="等级" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ getLevelText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
        <el-table-column label="所属校区" min-width="150">
          <template #default="scope">{{ getSchoolName(scope.row.schoolId) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" style="margin-top: 15px; text-align: right">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.pageNum"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 编辑弹窗：关键修复区域 -->
    <el-dialog
      title="编辑教练信息"
      :visible.sync="editDialogVisible"
      width="500px"
    >
      <!-- 1. 添加表单规则绑定 :rules="formRules" -->
      <el-form
        :model="formData"
        ref="form"
        label-width="100px"
        :rules="formRules"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.isMale">
            <el-radio :label="true">男</el-radio>
            <el-radio :label="false">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 2. 年龄字段：绑定prop并使用验证规则 -->
        <el-form-item label="年龄" prop="age">
          <el-input v-model.number="formData.age" type="number" placeholder="请输入18-60之间的数字"></el-input>
        </el-form-item>
        <!-- 3. 电话字段：绑定prop并使用验证规则 -->
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入11位手机号"></el-input>
        </el-form-item>
        <!-- 4. 教练等级：确保绑定正确 -->
        <el-form-item label="教练等级" prop="level">
          <el-select v-model="formData.level" placeholder="选择等级">
            <el-option label="初级教练" :value="10"></el-option>
            <el-option label="中级教练" :value="100"></el-option>
            <el-option label="高级教练" :value="1000"></el-option>
          </el-select>
        </el-form-item>
        <!-- 5. 所属校区：修复绑定，确保选择后更新formData.schoolId -->
        <el-form-item label="所属校区" prop="schoolId">
          <el-select v-model="formData.schoolId" placeholder="选择校区" @change="handleSchoolChange">
            <el-option
              v-for="school in schoolList"
              :key="school.id"
              :label="school.schoolname"
              :value="school.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getAllCertifiedCoaches, updateCertifiedCoach, getSchools } from '@/api/super_admin'
import { Message } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'SuperAdminCoachManage',
  computed: {
    ...mapGetters(['token'])
  },
  data() {
    // 1. 年龄验证函数（18-60岁）
    const validateAge = (rule, value, callback) => {
      if (value === null || value === undefined || value === '') {
        return callback(new Error('请输入年龄'));
      }
      if (isNaN(Number(value))) {
        return callback(new Error('年龄必须为数字'));
      }
      const numValue = Number(value);
      if (numValue < 18 || numValue > 60) {
        return callback(new Error('年龄必须在18-60之间'));
      }
      callback();
    };

    // 2. 电话验证函数（11位手机号）
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入联系电话'));
      }
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(value)) {
        return callback(new Error('请输入合法的11位手机号'));
      }
      callback();
    };

    // 3. 校区选择验证（必填）
    const validateSchool = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请选择所属校区'));
      }
      callback();
    };

    // 4. 教练等级验证（必填）
    const validateLevel = (rule, value, callback) => {
      if (value === undefined || value === null) {
        return callback(new Error('请选择教练等级'));
      }
      callback();
    };

    return {
      coachList: [],
      schoolList: [],
      loading: false,
      searchParams: {
        name: '',
        level: '',
        schoolId: '',
        pageNum: 1,
        pageSize: 10
      },
      pagination: {
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      editDialogVisible: false,
      formData: {
        isMale: true,
        schoolId: null, // 初始化校区ID为null，避免未选择时的默认值问题
        level: null     // 初始化等级为null
      },
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        age: [
          { required: true, message: '请输入年龄', trigger: 'blur' },
          { validator: validateAge, trigger: ['blur', 'change'] }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { validator: validatePhone, trigger: ['blur', 'change'] }
        ],
        level: [
          { validator: validateLevel, trigger: 'change' }
        ],
        schoolId: [
          { validator: validateSchool, trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.fetchSchools()
    this.fetchCoaches()
  },
  methods: {
    // 辅助方法：获取校区名称、等级文本和样式（保持不变）
    getSchoolName(schoolId) {
      const school = this.schoolList.find(item => item.id === schoolId)
      return school ? school.schoolname : '未知校区'
    },
    getLevelText(level) {
      switch(Number(level)) {
        case 10: return '初级教练'
        case 100: return '中级教练'
        case 1000: return '高级教练'
        default: return '未评级'
      }
    },
    getLevelType(level) {
      switch(Number(level)) {
        case 10: return 'info'
        case 100: return 'success'
        case 1000: return 'warning'
        default: return 'default'
      }
    },

    // 校区变更时的回调（可选，用于调试或额外逻辑）
    handleSchoolChange(schoolId) {
      // 确认校区ID已更新（可删除，仅用于验证）
      this.formData.schoolId = schoolId;
      console.log('当前选择的校区ID：', this.formData.schoolId);
    },

    // 数据获取方法（保持不变）
    async fetchSchools() {
      try {
        const res = await getSchools()
        this.schoolList = res.data || []
      } catch (err) {
        Message.error('获取校区列表失败')
      }
    },
    async fetchCoaches() {
      this.loading = true
      try {
        const params = {
          ...this.searchParams,
          token: this.token
        }
        const res = await getAllCertifiedCoaches(params)
        this.coachList = res.data.content || []
        this.pagination = {
          pageNum: res.data.pageable.pageNumber + 1,
          pageSize: res.data.pageable.pageSize,
          total: res.data.totalElements
        }
      } catch (err) {
        Message.error(err.message || '获取教练列表失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索和分页方法（保持不变）
    handleSearch() {
      this.searchParams.pageNum = 1
      this.fetchCoaches()
    },
    resetSearch() {
      this.searchParams = {
        name: '',
        level: '',
        schoolId: '',
        pageNum: 1,
        pageSize: 10
      }
      this.fetchCoaches()
    },
    handleSizeChange(size) {
      this.searchParams.pageSize = size
      this.fetchCoaches()
    },
    handleCurrentChange(page) {
      this.searchParams.pageNum = page
      this.fetchCoaches()
    },

    // 编辑方法：确保初始化正确的校区ID
    handleEdit(row) {
      // 深拷贝避免引用问题，确保校区ID正确初始化
      this.formData = { ...row };
      // 处理可能的空值问题
      if (this.formData.schoolId === undefined) {
        this.formData.schoolId = null;
      }
      this.editDialogVisible = true
    },

    // 提交方法：添加表单验证
    async submitEdit() {
      // 触发表单验证
      this.$refs.form.validate(async (isValid) => {
        if (!isValid) {
          Message.warning('请检查输入的信息是否合法！');
          return; // 验证失败，阻断提交
        }

        // 验证通过，提交数据
        try {
          // 确认提交的schoolId是最新值（可删除，仅用于调试）
          // console.log('提交的校区ID：', this.formData.schoolId);
          
          await updateCertifiedCoach(this.token, this.formData)
          Message.success('更新成功')
          this.editDialogVisible = false
          this.fetchCoaches()
        } catch (err) {
          Message.error(err.message || '更新失败')
        }
      });
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
</style>
    