<template>
  <div class="student-management">
    <div class="page-header">
      <h2>学生管理</h2>
      <p>管理所辖校区的学生信息</p>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchParams.name"
          placeholder="请输入学生姓名"
          style="width: 200px"
          clearable
        ></el-input>
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
        :data="studentList"
        border
        stripe
        :loading="loading"
        style="width: 100%; margin-top: 15px"
      >
        <el-table-column prop="id" label="学生ID" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
        <!-- 性别列修正 -->
        <el-table-column prop="isMale" label="性别" width="80" align="center">
        <template #default="scope">{{ scope.row.isMale ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
        <!-- 所属校区列修正（通过schoolId获取名称） -->
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

    <!-- 编辑弹窗 -->
    <el-dialog
      title="编辑学生信息"
      :visible.sync="editDialogVisible"
      width="500px"
    >
      <el-form
        :model="formData"
        ref="form"
        label-width="100px"
        :rules="formRules"
      >
        <el-form-item label="姓名" prop="name" :rules="{ required: true, message: '请输入姓名', trigger: 'blur' }">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.isMale"> <!-- 绑定formData.male（boolean） -->
            <el-radio :label="true">男</el-radio>   <!-- label为true -->
            <el-radio :label="false">女</el-radio>  <!-- label为false -->
        </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
        <el-input v-model.number="formData.age" type="number" placeholder="请输入5-100之间的数字"></el-input>
      </el-form-item>

      <!-- 电话字段：新增格式验证，仅允许11位手机号 -->
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入11位手机号"></el-input>
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
import { getManagedStudents, updateStudent } from '@/api/admin'
import { getSchoolOptions } from '@/api/campus'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'AdminStudentManage',
  computed: {
    ...mapGetters(['token', 'schoolId'])
  },
  data() {
    const validateAge = (rule, value, callback) => {
      // 1. 校验是否为空/未定义
      if (value === null || value === undefined || value === '') {
        return callback(new Error('请输入年龄'));
      }
      // 2. 校验是否为有效数字（避免字符串如"18a"）
      if (isNaN(Number(value))) {
        return callback(new Error('年龄必须为数字'));
      }
      // 3. 校验范围（5-100，阻断负数、0、超100）
      const numValue = Number(value);
      if (numValue < 5 || numValue > 100) {
        return callback(new Error('年龄必须在5-100之间'));
      }
      // 验证通过
      callback();
    };

    // 新增：电话格式验证（正则匹配国内11位手机号）
    const validatePhone = (rule, value, callback) => {
      // 1. 校验是否为空
      if (!value) {
        return callback(new Error('请输入联系电话'));
      }
      // 2. 校验是否为11位手机号（正则：以1开头，后续10位为数字）
      const phoneReg = /^1[3-9]\d{9}$/;
      if (!phoneReg.test(value)) {
        return callback(new Error('请输入合法的11位手机号'));
      }
      // 验证通过
      callback();
    };
    return {
      studentList: [],
      schoolList: [],
      loading: false,
      searchParams: {
        name: '',
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
      formData: {},
      formRules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        age: [
          { required: true, message: '请输入年龄', trigger: 'blur' },
          { validator: validateAge, trigger: 'blur' } // 关联自定义年龄验证
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' } // 关联自定义电话验证
        ]
      }
    }
  },
  created() {
    this.fetchSchools()
    this.fetchStudents()
  },
  methods: {

    // 根据schoolId获取校区名称
    getSchoolName(schoolId) {
        const school = this.schoolList.find(item => item.id === schoolId)
        return school ? school.schoolname : '未知校区'
    },
    formatTime(time) {
      if (!time) return ''
      return new Date(time).toLocaleString()
    },
    async fetchSchools() {
      try {
        const res = await getSchoolOptions()
        this.schoolList = res.data || []
      } catch (err) {
        Message.error('获取校区列表失败')
      }
    },
    async fetchStudents() {
      this.loading = true
      try {
        const params = {
          ...this.searchParams,
          token: this.token,
          schoolId: this.searchParams.schoolId || this.schoolId
        }
        const res = await getManagedStudents(params)
        this.studentList = res.data.content || []
        this.pagination = {
          pageNum: res.data.pageable.pageNumber + 1,
          pageSize: res.data.pageable.pageSize,
          total: res.data.totalElements
        }
      } catch (err) {
        Message.error(err.message || '获取学生列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.searchParams.pageNum = 1
      this.fetchStudents()
    },
    resetSearch() {
      this.searchParams = {
        name: '',
        schoolId: '',
        pageNum: 1,
        pageSize: 10
      }
      this.fetchStudents()
    },
    handleSizeChange(size) {
      this.searchParams.pageSize = size
      this.fetchStudents()
    },
    handleCurrentChange(page) {
      this.searchParams.pageNum = page
      this.fetchStudents()
    },
    handleEdit(row) {
      this.formData = { ...row }
      this.editDialogVisible = true
    },
    async submitEdit() {
      // 关键：调用Element UI的表单验证，所有字段通过才进入提交逻辑
      this.$refs.form.validate(async (isValid) => {
        if (!isValid) {
          // 验证失败：提示用户并阻断提交
          Message.warning('请检查年龄或电话是否填写合法！');
          return; // 直接返回，不执行后续提交
        }

        // 验证通过：执行接口提交
        try {
          await updateStudent(this.token, this.formData);
          Message.success('更新成功');
          this.editDialogVisible = false;
          this.fetchStudents(); // 重新拉取列表
        } catch (err) {
          Message.error(err.message || '更新失败');
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